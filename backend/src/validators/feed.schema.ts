import { z } from "zod";

export const listFeedQuerySchema = z
  .object({
    limit: z.string().optional(),
    cursor: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    kind: z.enum(["TRANSACTION", "TRANSFER"]).optional(),
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    minAmount: z.string().optional(),
    maxAmount: z.string().optional(),
  })
  .transform((data) => {
    const limit = data.limit ? parseInt(data.limit, 10) : 20;

    return {
      limit: Math.min(limit, 50),
      cursor: data.cursor,
      from: data.from ? new Date(data.from) : undefined,
      to: data.to ? new Date(data.to) : undefined,
      kind: data.kind,
      accountId: data.accountId,

      // NEW
      categoryId: data.categoryId,
      minAmount: data.minAmount ? Number(data.minAmount) : undefined,
      maxAmount: data.maxAmount ? Number(data.maxAmount) : undefined,
    };
  });

export type ListFeedQueryInput = z.infer<typeof listFeedQuerySchema>;
