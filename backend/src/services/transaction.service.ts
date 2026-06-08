import { prisma } from "../config/prisma";
import { redis } from "../config/redis";

import { CreateTransactionInput, ListTransactionsQuery } from "../validators/transaction.schema";

import {
  createTransactionRepo,
  findTransactionById,
  softDeleteTransaction,
  restoreTransactionRepo,
  aggregateAccountBalance,
  findAccountTransactionsCursor,
} from "../repositories/transaction.repository";
import { findAccountById } from "../repositories/account.repository";
import { HttpError } from "../utils/httpError";
import { withIdempotency } from "./idempotency.service";
import { decodeFeedCursor } from "../utils/feedCursor";
import { evaluateBudgetAlertsService } from "./budgetAlert.service";
import { addBudgetAlertJob } from "../queues/budgetAlert.queue";
import { invalidateReportingCache } from "./cacheInvalidate.service";
import { TransactionType } from "@prisma/client";
import { recordAuditLog, AuditEvents, EntityTypes } from "./auditLog.service";


const triggerBudgetAlertIfNeeded = (
  userId: string,
  transaction: {
    type: TransactionType;
    createdAt: Date;
  }
) => {
  // Only expenses can breach budgets
  if (transaction.type !== TransactionType.EXPENSE) return;

  const month = transaction.createdAt.toISOString().slice(0, 7);
  // fire and forget
  try {
    addBudgetAlertJob({ userId, month });
  } catch (err) {
    console.error("Budget alert evaluation failed", err);
  }
};


export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
  idempotencyKey?: string
) {
  return withIdempotency({
    userId,
    idempotencyKey,
    operation: "CREATE_TX",
    payload: input,
    handler: async (tx) => {
      const account = await findAccountById(tx, input.accountId, userId);

      if (!account) {
        throw new HttpError("Account not found", 404);
      }

      const createdTx = await createTransactionRepo(tx, {
        userId,
        ...input,
      });

      // 🔥 invalidate reporting cache AFTER write
      await invalidateReportingCache(userId, createdTx.createdAt);

      // 🔔 trigger budget alerts
      triggerBudgetAlertIfNeeded(userId, {
        type: createdTx.type,
        createdAt: createdTx.createdAt,
      });

      // 📝 Audit Log
      await recordAuditLog(
        tx,
        {
          userId,
          event: AuditEvents.TRANSACTION_CREATED,
          entityType: EntityTypes.TRANSACTION,
          entityId: createdTx.id,
          idempotencyKey,
          metadata: {
            accountId: createdTx.accountId,
            amount: createdTx.amount.toString(),
            type: createdTx.type,
          },
        });

      return createdTx;
    },
  });
}



export const listAccountTransactions = async (
  userId: string,
  accountId: string,
  query: ListTransactionsQuery
) => {
  // Authorization: account ownership
  const account = await findAccountById(prisma, accountId, userId);

  if (!account) {
    throw new HttpError("Account not found", 404);
  }

  // Decode cursor (opaque to client)
  let cursor:
    | {
      createdAt: Date;
      id: string;
    }
    | undefined;

  if (query.cursor) {
    cursor = decodeFeedCursor(query.cursor);
  }

  // Fetch data
  const rows = await findAccountTransactionsCursor(prisma, {
    accountId,
    userId,
    limit: query.limit,
    cursor,
    filters: {
      type: query.type,
      from: query.from,
      to: query.to,
    },
  });

  // Cursor pagination math
  const hasNextPage = rows.length > query.limit;
  const data = hasNextPage ? rows.slice(0, query.limit) : rows;

  const nextCursor = hasNextPage
    ? Buffer.from(
      `${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id
      }`
    ).toString("base64")
    : null;

  return {
    data,
    pageInfo: {
      hasNextPage,
      nextCursor,
    },
  };
};



export const deleteTransaction = async (
  userId: string,
  transactionId: string
) => {
  return prisma.$transaction(async (tx) => {
    const transaction = await findTransactionById(tx, transactionId, userId);

    if (!transaction) {
      throw new HttpError("Transaction not found", 404);
    }

    await softDeleteTransaction(tx, transactionId);

    // 🔥 invalidate reporting cache
    await invalidateReportingCache(userId, transaction.createdAt);

    // 📝 Audit Log
    await recordAuditLog(
      tx,
      {
        userId,
        event: AuditEvents.TRANSACTION_DELETED,
        entityType: EntityTypes.TRANSACTION,
        entityId: transactionId,
        metadata: {
          accountId: transaction.accountId,
          amount: transaction.amount.toString(),
        },
      }
    );
  });
};



export const restoreTransaction = async (
  userId: string,
  transactionId: string
) => {
  return prisma.$transaction(async (tx) => {
    // Find transaction without filtering on deletedAt so we can find the soft-deleted one
    const transaction = await tx.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new HttpError("Transaction not found", 404);
    }

    if (transaction.deletedAt === null) {
      throw new HttpError("Transaction is not deleted", 400);
    }

    await restoreTransactionRepo(tx, transactionId);

    // 🔥 invalidate reporting cache
    await invalidateReportingCache(userId, transaction.createdAt);

    // 📝 Audit Log
    await recordAuditLog(
      tx,
      {
        userId,
        event: AuditEvents.TRANSACTION_RESTORED,
        entityType: EntityTypes.TRANSACTION,
        entityId: transactionId,
        metadata: {
          accountId: transaction.accountId,
          amount: transaction.amount.toString(),
        },
      }
    );
  });
};

export const getAccountBalance = async (
  userId: string,
  accountId: string
) => {
  const account = await findAccountById(prisma, accountId, userId);

  if (!account) {
    throw new HttpError("Account not found", 404);
  }

  const { income, expense } = await aggregateAccountBalance(
    prisma,
    accountId,
    userId
  );
  return {
    accountId,
    income,
    expense,
    balance: income - expense,
  };
};