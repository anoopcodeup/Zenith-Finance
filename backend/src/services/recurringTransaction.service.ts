import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import { RecurringFrequency, TransactionType } from "@prisma/client";
import {
  createRecurringTransactionRepo,
  findRecurringTransactionsRepo,
  findRecurringTransactionByIdRepo,
  updateRecurringTransactionRepo,
  deleteRecurringTransactionRepo,
  findDueRecurringTransactionsRepo,
} from "../repositories/recurringTransaction.repository";
import { findAccountById } from "../repositories/account.repository";
import { createTransaction } from "./transaction.service";

export const calculateNextRun = (
  currentRun: Date,
  frequency: RecurringFrequency
): Date => {
  const next = new Date(currentRun);
  const now = new Date();

  do {
    switch (frequency) {
      case "DAILY":
        next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
      case "YEARLY":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  } while (next <= now);

  return next;
};

export const createRecurringService = async (
  userId: string,
  data: {
    accountId: string;
    amount: number;
    type: TransactionType;
    categoryId?: string;
    description?: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
  }
) => {
  // Validate account
  const account = await findAccountById(prisma, data.accountId, userId);
  if (!account) {
    throw new HttpError("Account not found", 404);
  }

  // Validate category if provided
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null }],
      },
    });
    if (!category) {
      throw new HttpError("Category not found", 404);
    }
  }

  return createRecurringTransactionRepo(prisma, {
    ...data,
    userId,
    nextRunAt: data.startDate,
  });
};

export const listRecurringService = async (userId: string) => {
  return findRecurringTransactionsRepo(prisma, userId);
};

export const getRecurringByIdService = async (id: string, userId: string) => {
  const recurring = await findRecurringTransactionByIdRepo(prisma, id, userId);
  if (!recurring) {
    throw new HttpError("Recurring transaction not found", 404);
  }
  return recurring;
};

export const updateRecurringService = async (
  id: string,
  userId: string,
  data: {
    accountId?: string;
    amount?: number;
    type?: TransactionType;
    categoryId?: string;
    description?: string;
    frequency?: RecurringFrequency;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  // Validate existing template
  const existing = await findRecurringTransactionByIdRepo(prisma, id, userId);
  if (!existing) {
    throw new HttpError("Recurring transaction not found", 404);
  }

  // Validate new account if provided
  if (data.accountId) {
    const account = await findAccountById(prisma, data.accountId, userId);
    if (!account) {
      throw new HttpError("Account not found", 404);
    }
  }

  // Validate new category if provided
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null }],
      },
    });
    if (!category) {
      throw new HttpError("Category not found", 404);
    }
  }

  // If frequency, startDate or nextRunAt updates, recalculate nextRunAt
  const newStartDate = data.startDate || existing.startDate;
  const newFrequency = data.frequency || existing.frequency;
  
  let nextRunAt: Date | undefined;
  if (data.startDate || data.frequency) {
    nextRunAt = newStartDate;
  }

  return updateRecurringTransactionRepo(prisma, id, userId, {
    ...data,
    nextRunAt,
  });
};

export const pauseRecurringService = async (id: string, userId: string) => {
  const existing = await findRecurringTransactionByIdRepo(prisma, id, userId);
  if (!existing) {
    throw new HttpError("Recurring transaction not found", 404);
  }

  return updateRecurringTransactionRepo(prisma, id, userId, {
    active: false,
  });
};

export const resumeRecurringService = async (id: string, userId: string) => {
  const existing = await findRecurringTransactionByIdRepo(prisma, id, userId);
  if (!existing) {
    throw new HttpError("Recurring transaction not found", 404);
  }

  const now = new Date();
  let nextRunAt = existing.nextRunAt;

  // If next run is in the past, advance it to prevent instant execution storm
  if (nextRunAt < now) {
    nextRunAt = calculateNextRun(nextRunAt, existing.frequency);
  }

  return updateRecurringTransactionRepo(prisma, id, userId, {
    active: true,
    nextRunAt,
  });
};

export const deleteRecurringService = async (id: string, userId: string) => {
  const result = await deleteRecurringTransactionRepo(prisma, id, userId);
  if (result.count === 0) {
    throw new HttpError("Recurring transaction not found", 404);
  }
};

export const processDueRecurringTransactionsService = async (): Promise<number> => {
  const now = new Date();
  const due = await findDueRecurringTransactionsRepo(prisma, now);
  
  let processedCount = 0;

  for (const rec of due) {
    try {
      // Derived idempotency key
      const idempotencyKey = `rec_${rec.id}_${rec.nextRunAt.toISOString()}`;

      // Create standard transaction
      await createTransaction(
        rec.userId,
        {
          accountId: rec.accountId,
          amount: Number(rec.amount),
          type: rec.type,
          categoryId: rec.categoryId ?? undefined,
          description: rec.description ?? undefined,
        },
        idempotencyKey
      );

      // Calculate next run time
      const nextRunAt = calculateNextRun(rec.nextRunAt, rec.frequency);
      const isStillActive = rec.endDate ? nextRunAt <= rec.endDate : true;

      // Update pointers
      await updateRecurringTransactionRepo(prisma, rec.id, rec.userId, {
        lastRunAt: rec.nextRunAt,
        nextRunAt,
        active: isStillActive,
      });

      processedCount++;
    } catch (err) {
      console.error(`Error processing recurring transaction ${rec.id}:`, err);
    }
  }

  return processedCount;
};
