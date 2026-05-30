import { z } from "zod";

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)");

export const monthlySummaryQuerySchema = z.object({
  month: monthSchema,
});

export const categoryBreakdownQuerySchema = z.object({
  month: monthSchema,
  type: z.enum(["INCOME", "EXPENSE"]),
});

//GET /reports/monthly-summary?month=YYYY-MM
//GET /reports/category-breakdown?month=YYYY-MM&type=EXPENSE
