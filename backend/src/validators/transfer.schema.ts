import { z } from "zod";

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
});
export type TransferInput = z.infer<typeof transferSchema>;

export const listTransfersQuerySchema = z
  .object({
    limit: z.string().optional(),
    cursor: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .transform((data) => {
    const limit = data.limit ? parseInt(data.limit, 10) : 20;

    return {
      limit: Math.min(limit, 50),
      cursor: data.cursor,
      from: data.from ? new Date(data.from) : undefined,
      to: data.to ? new Date(data.to) : undefined,
    };
  });
  export type ListTransfersQueryInput = z.infer<
    typeof listTransfersQuerySchema
  >;
