import { PrismaClient, Prisma } from "@prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

/**
 * Try to create an idempotency key row.
 * Fails if (userId, key) already exists.
 */
export const createIdempotencyKey = (
  prisma: PrismaTx,
  input: {
    userId: string;
    key: string;
    requestHash: string;
  }
) => {
  return prisma.idempotencyKey.create({
    data: {
      userId: input.userId,
      key: input.key,
      requestHash: input.requestHash,
      status: "IN_PROGRESS",
    },
  });
};

/**
 * Fetch existing idempotency key (if any)
 */
export const findIdempotencyKey = (
  prisma: PrismaTx,
  userId: string,
  key: string
) => {
  return prisma.idempotencyKey.findUnique({
    where: {
      userId_key: {
        userId,
        key,
      },
    },
  });
};

/**
 * Mark idempotency key as completed and store response
 */
export const completeIdempotencyKey = (
  prisma: PrismaTx,
  idempotencyKeyId: string,
  responseBody: unknown
) => {
  return prisma.idempotencyKey.update({
    where: { id: idempotencyKeyId },
    data: {
      status: "COMPLETED",
      responseBody: responseBody as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });
};
