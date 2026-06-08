import { PrismaTx } from "../types/prisma";
import { Transaction, Prisma } from "@prisma/client";

// Cursor type for DB-level paging
export type FeedRowCursor = {
  createdAt: Date;
  id: string;
};

// Repository input type
export type ListFeedRowsParams = {
  limit: number;
  cursor?: FeedRowCursor;
  from?: Date;
  to?: Date;
  kind?: "TRANSACTION" | "TRANSFER";
  accountId?: string;
  userId?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
};

/**
 * Fetches raw transaction rows from DB for the unified feed.
 * Cursor-based, DB-safe, no business logic.
 */
export async function listFeedRows(
  prisma: PrismaTx,
  params: ListFeedRowsParams
): Promise<Transaction[]> {
  const { limit, cursor, from, to, kind, accountId, userId, categoryId, minAmount, maxAmount } = params;

  const where: Prisma.TransactionWhereInput = {
    userId
  };

  // Optional account filter
  if (accountId) {
    where.accountId = accountId;
  }

  // Optional amount filters
  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {};
    if (minAmount !== undefined) where.amount.gte = minAmount;
    if (maxAmount !== undefined) where.amount.lte = maxAmount;
  }


  // Date filters
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  // kind → map to transferId IS NULL / NOT NULL
  if (kind === "TRANSACTION") {
    where.transferId = null;
    // Optional category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }
  } else if (kind === "TRANSFER") {
    where.transferId = { not: null };
  }

  // Cursor filter (DB columns only)
  if (cursor) {
    where.OR = [
      {
        createdAt: { lt: cursor.createdAt },
      },
      {
        createdAt: cursor.createdAt,
        id: { lt: cursor.id },
      },
    ];
  }

  return prisma.transaction.findMany({
    where,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: 2 * limit + 1, // fetch extra rows to safely compute nextCursor for transfers
  });
}
