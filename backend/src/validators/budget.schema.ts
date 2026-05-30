import { z } from "zod";

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  amount: z.number().positive("Amount must be a positive number"),
});

export const listBudgetsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format").optional(),
});

export const budgetIdParamSchema = z.object({
  budgetId: z.string().uuid(),
});
