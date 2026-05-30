/**
 * - All write operations accept a PrismaTx (transaction-aware)
 * - Read-only operations may use the global prisma client
 */

import { PrismaTx } from "../types/prisma";
import { CreateTransactionDomain } from "../types/domain";

/**
 * Create a transaction (used by both normal transactions and transfers)
 * - The prisma client is injected from the service
 * - This allows atomic multi-step operations (transfers, reversals, etc.)
 */
export const createTransactionRepo = (
  prisma: PrismaTx,
  input: CreateTransactionDomain
) => {
  const {
    userId,
    accountId,
    amount,
    type,
    description,
    categoryId,
    transferId,
  } = input;

  return prisma.transaction.create({
    data: {
      user: { connect: { id: userId } },
      account: { connect: { id: accountId } },
      category: categoryId
        ? { connect: { id: categoryId } }
        : undefined,
      amount,
      type,
      description,
      transferId,
    },
  });
};


/**
 * Find a single transaction by ID
 * Used in delete / validation flows
 * Accepts PrismaTx so it can be used inside a transaction if needed
 */
export const findTransactionById = (
  prisma: PrismaTx,
  transactionId: string,
  userId: string
) => {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
      deletedAt: null,
    },
  });
};

/**
 * Soft-delete a transaction
 * - We never hard delete financial records
 * - Uses PrismaTx to allow atomic delete + balance recalculation
 */
export const softDeleteTransaction = (
  prisma: PrismaTx,
  transactionId: string
) => {
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { deletedAt: new Date() },
  });
};

/**
 * Aggregate account balance (income vs expense)
 * Used by dashboards, summaries, validations
 * PrismaTx allows this to run inside a wider transaction if needed
 */
export const aggregateAccountBalance = async (
  prisma: PrismaTx,
  accountId: string,
  userId: string
) => {
  const result = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      accountId,
      userId,
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  });

  let income = 0;
  let expense = 0;

  for (const row of result) {
    if (row.type === "INCOME") {
      income = row._sum.amount?.toNumber() ?? 0;
    }
    if (row.type === "EXPENSE") {
      expense = row._sum.amount?.toNumber() ?? 0;
    }
  }

  return { income, expense };
};

/**
 * Paginated + filtered transaction listing
 * Used by:
 * - account transaction screens
 * - history views
 * Read-only, so global prisma is acceptable
 */
export const findAccountTransactionsCursor = (
  prisma: PrismaTx,
  params: {
    accountId: string;
    userId: string;
    limit: number;
    cursor?: {
      createdAt: Date;
      id: string;
    };
    filters?: {
      type?: "INCOME" | "EXPENSE";
      from?: Date;
      to?: Date;
    };
  }
) => {
  const { accountId, userId, limit, cursor, filters } = params;

  return prisma.transaction.findMany({
    where: {
      accountId,
      userId,
      deletedAt: null,

      // business filters
      ...(filters?.type && { type: filters.type }),
      ...(filters?.from || filters?.to
        ? {
          createdAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to && { lte: filters.to }),
          },
        }
        : {}),

      // cursor window (pagination constraint)
      ...(cursor && {
        OR: [
          {
            createdAt: { lt: cursor.createdAt },
          },
          {
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      }),
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: 2 * limit + 1,
  });
};

