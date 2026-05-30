import { prisma } from "../config/prisma";
import { TransactionType } from "@prisma/client";

export const getMonthlyTotalsRepo = async (
  userId: string,
  start: Date,
  end: Date
) => {
  return prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      deletedAt: null,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amount: true,
    },
  });
};

export const getCategoryBreakdownRepo = async (
  userId: string,
  type: TransactionType,
  start: Date,
  end: Date
) => {
  return prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type,
      deletedAt: null,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amount: true,
    },
  });
};
