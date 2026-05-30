import { PrismaTx } from "../types/prisma";

export const upsertBudgetRepo = (
  prisma: PrismaTx,
  data: {
    userId: string;
    categoryId: string;
    month: string;
    amount: any;
  }
) =>
  prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId: data.userId,
        categoryId: data.categoryId,
        month: data.month,
      },
    },
    update: { amount: data.amount },
    create: data,
  });

export const getBudgetsForMonthRepo = (
  prisma: PrismaTx,
  userId: string,
  month?: string
) =>
  prisma.budget.findMany({
    where: {
      userId,
      ...(month ? { month } : {}),
    },
    orderBy: {
      month: "desc",
    },
  });

export const findBudgetByIdRepo = (
  prisma: PrismaTx,
  budgetId: string,
  userId: string
) =>
  prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
  });

export const deleteBudgetRepo = (
  prisma: PrismaTx,
  budgetId: string,
  userId: string
) =>
  prisma.budget.deleteMany({
    where: {
      id: budgetId,
      userId,
    },
  });

