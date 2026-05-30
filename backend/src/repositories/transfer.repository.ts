// src/repositories/transfer.repository.ts
import { PrismaClient, Prisma } from "@prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

export const findTransferTransactionsCursor = (
  prisma: PrismaTx,
  params: {
    userId: string;
    limit: number;
    cursor?: {
      createdAt: Date;
      transferId: string;
    };
    from?: Date;
    to?: Date;
  }
) => {
  const { userId, limit, cursor, from, to } = params;

  return prisma.transaction.findMany({
    where: {
      userId,
      transferId: { not: null },
      deletedAt: null,
      ...(from || to
        ? {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
        : {}),
      ...(cursor && {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            transferId: { lt: cursor.transferId },
          },
        ],
      }),
    },
    orderBy: [
      { createdAt: "desc" },
      { transferId: "desc" },
    ],
    take: 2 * limit + 1,
  });
};


export function countTransfers(
  prisma: PrismaTx,
  userId: string
) {
  return prisma.transaction.count({
    where: {
      userId,
      transferId: { not: null },
      deletedAt: null,
    },
  });
}
