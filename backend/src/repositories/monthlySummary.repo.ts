import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const upsertMonthlySummaryRepo = (
  prisma: PrismaClient,
  data: {
    userId: string;
    month: string;
    income: Decimal;
    expense: Decimal;
    net: Decimal;
  }
) =>
  prisma.monthlyUserSummary.upsert({
    where: {
      userId_month: {
        userId: data.userId,
        month: data.month,
      },
    },
    update: {
      income: data.income,
      expense: data.expense,
      net: data.net,
      generatedAt: new Date(),
    },
    create: {
      ...data,
      generatedAt: new Date(),
    },
  });

export const getMonthlySummaryRepo = (
  prisma: PrismaClient,
  userId: string,
  month: string
) =>
  prisma.monthlyUserSummary.findUnique({
    where: {
      userId_month: { userId, month },
    },
  });
