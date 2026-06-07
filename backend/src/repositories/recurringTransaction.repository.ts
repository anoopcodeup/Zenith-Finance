import { PrismaTx } from "../types/prisma";
import { RecurringFrequency, TransactionType } from "@prisma/client";

export const createRecurringTransactionRepo = (
  prisma: PrismaTx,
  data: {
    userId: string;
    accountId: string;
    amount: number;
    type: TransactionType;
    categoryId?: string;
    description?: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    nextRunAt: Date;
  }
) => {
  return prisma.recurringTransaction.create({
    data: {
      userId: data.userId,
      accountId: data.accountId,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
      nextRunAt: data.nextRunAt,
    },
  });
};

export const findRecurringTransactionsRepo = (
  prisma: PrismaTx,
  userId: string
) => {
  return prisma.recurringTransaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findRecurringTransactionByIdRepo = (
  prisma: PrismaTx,
  id: string,
  userId: string
) => {
  return prisma.recurringTransaction.findFirst({
    where: {
      id,
      userId,
    },
  });
};

export const updateRecurringTransactionRepo = (
  prisma: PrismaTx,
  id: string,
  userId: string,
  data: {
    accountId?: string;
    amount?: number;
    type?: TransactionType;
    categoryId?: string | null;
    description?: string | null;
    frequency?: RecurringFrequency;
    startDate?: Date;
    endDate?: Date | null;
    nextRunAt?: Date;
    active?: boolean;
    lastRunAt?: Date;
  }
) => {
  return prisma.recurringTransaction.update({
    where: {
      id,
      userId,
    },
    data,
  });
};

export const deleteRecurringTransactionRepo = (
  prisma: PrismaTx,
  id: string,
  userId: string
) => {
  return prisma.recurringTransaction.deleteMany({
    where: {
      id,
      userId,
    },
  });
};

export const findDueRecurringTransactionsRepo = (
  prisma: PrismaTx,
  now: Date
) => {
  return prisma.recurringTransaction.findMany({
    where: {
      active: true,
      nextRunAt: {
        lte: now,
      },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  });
};
