import { z } from "zod";

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(50, "Account name too long"),

  type: z.enum(["SAVINGS", "CREDIT", "CASH"]),
});

export const accountIdParamSchema = z.object({
  accountId: z.string().uuid(),
});