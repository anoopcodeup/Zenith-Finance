import { AccountType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import {
  createAccount,
  findAccountsByUser,
  findAccountById,
  softDeleteAccount,
} from "../repositories/account.repository";

/**
 * Create a new account for the authenticated user
 */
export async function createUserAccount(
  userId: string,
  name: string,
  type: AccountType
) {
  if (!name || name.trim().length === 0) {
    throw new HttpError("Account name is required", 400);
  }

  return createAccount(prisma, userId, name.trim(), type);
}

/**
 * List all active accounts of a user
 */
export async function listUserAccounts(userId: string) {
  return findAccountsByUser(prisma, userId);
}

/**
 * Get a single account by ID (user-scoped)
 */
export async function getUserAccountById(
  userId: string,
  accountId: string
) {
  const account = await findAccountById(prisma, accountId, userId);

  if (!account) {
    throw new HttpError("Account not found", 404);
  }

  return account;
}

/**
 * Soft-delete an account
 */
export async function deleteUserAccount(
  userId: string,
  accountId: string
) {
  const result = await softDeleteAccount(prisma, accountId, userId);

  if (result.count === 0) {
    throw new HttpError("Account not found", 404);
  }
}
