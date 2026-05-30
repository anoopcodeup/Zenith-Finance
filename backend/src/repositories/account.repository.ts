import { AccountType } from "@prisma/client";
import { PrismaTx } from "../types/prisma";

/**
 * Create a new account for a user
 */
export const createAccount = (
  prisma: PrismaTx,
  userId: string,
  name: string,
  type: AccountType
) => {
  return prisma.account.create({
    data: {
      userId,
      name,
      type,
    },
  });
};

/**
 * Fetch all active (non-deleted) accounts for a user
 */
export const findAccountsByUser = (
  prisma: PrismaTx,
  userId: string
) => {
  return prisma.account.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Find a single account by ID, scoped to user
 */
export const findAccountById = (
  prisma: PrismaTx,
  accountId: string,
  userId: string
) => {
  return prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
      deletedAt: null,
    },
  });
};

/**
 * Soft-delete an account (idempotent)
 */
export const softDeleteAccount = (
  prisma: PrismaTx,
  accountId: string,
  userId: string
) => {
  return prisma.account.updateMany({
    where: {
      id: accountId,
      userId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

// account.repository.ts

/**
 * Lock multiple accounts for transfer using SELECT ... FOR UPDATE
 * MUST be called inside a Prisma interactive transaction
 */
export const lockAccountsForTransfer = async (
  prisma: PrismaTx,
  accountIds: string[],
  userId: string
) => {
  if (accountIds.length === 0) return;

  // Deterministic ordering to prevent deadlocks
  const sortedIds = [...new Set(accountIds)].sort();

  await prisma.$queryRawUnsafe(
    `
    SELECT id
    FROM "Account"
    WHERE id = ANY($1)
      AND userId = $2
      AND "deletedAt" IS NULL
    FOR UPDATE
    `,
    sortedIds,
    userId
  );
};

