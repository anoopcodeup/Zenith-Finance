import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import {
  upsertBudgetRepo,
  getBudgetsForMonthRepo,
  findBudgetByIdRepo,
  deleteBudgetRepo,
} from "../repositories/budget.repository";

export const setMonthlyBudgetService = async (
  userId: string,
  categoryId: string,
  month: string,
  amount: number
) => {
  // Validate category existence for this user first
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [
        { userId },
        { userId: null }
      ]
    }
  });

  if (!category) {
    throw new HttpError("Category not found", 404);
  }

  return upsertBudgetRepo(prisma, {
    userId,
    categoryId,
    month,
    amount,
  });
};

export const getBudgetsService = async (userId: string, month?: string) => {
  return getBudgetsForMonthRepo(prisma, userId, month);
};

export const getBudgetByIdService = async (userId: string, budgetId: string) => {
  const budget = await findBudgetByIdRepo(prisma, budgetId, userId);
  if (!budget) {
    throw new HttpError("Budget not found", 404);
  }
  return budget;
};

export const deleteBudgetService = async (userId: string, budgetId: string) => {
  const result = await deleteBudgetRepo(prisma, budgetId, userId);
  if (result.count === 0) {
    throw new HttpError("Budget not found", 404);
  }
};

