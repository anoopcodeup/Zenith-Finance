import { z } from "zod";

export const createRecurringSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(255).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;

export const updateRecurringSchema = z.object({
  accountId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(255).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;

export const recurringIdParamSchema = z.object({
  id: z.string().uuid(),
});
