import { PrismaClient } from "@prisma/client";

/**
 * PrismaTx
 * --------
 * Represents a Prisma client that can be either:
 * - the global PrismaClient
 * - OR a transaction-scoped client (from prisma.$transaction)
 *
 * This lets repositories stay transaction-agnostic.
 */
export type PrismaTx = PrismaClient | Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
