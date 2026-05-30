import { z } from "zod";

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(255).optional(),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;



export const accountIdParamSchema = z.object({
  accountId: z.string().uuid(),
});



export const transactionIdParamSchema = z.object({
  transactionId: z.string().uuid(),
});



export const listTransactionsQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.string().optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .transform((data) => ({
    cursor: data.cursor,
    limit: Math.min(
      data.limit ? parseInt(data.limit, 10) : 20,
      50
    ),
    type: data.type,
    from: data.from ? new Date(data.from) : undefined,
    to: data.to ? new Date(data.to) : undefined,
  }));
export type ListTransactionsQuery = z.infer<
  typeof listTransactionsQuerySchema
>;