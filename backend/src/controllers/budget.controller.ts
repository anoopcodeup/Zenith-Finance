import { Request, Response } from "express";
import {
  setMonthlyBudgetService,
  getBudgetsService,
  getBudgetByIdService,
  deleteBudgetService,
} from "../services/budget.service";

export const upsertBudget = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { categoryId, month, amount } = req.body;

  const budget = await setMonthlyBudgetService(userId, categoryId, month, amount);

  return res.status(200).json({
    message: "Budget set successfully",
    budget,
  });
};

export const getBudgets = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const month = req.query.month as string | undefined;

  const budgets = await getBudgetsService(userId, month);

  return res.status(200).json({
    budgets,
  });
};

export const getBudgetById = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const budgetId = req.params.budgetId;

  const budget = await getBudgetByIdService(userId, budgetId);

  return res.status(200).json({
    budget,
  });
};

export const deleteBudget = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const budgetId = req.params.budgetId;

  await deleteBudgetService(userId, budgetId);

  return res.status(204).send();
};
