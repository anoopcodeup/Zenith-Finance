import { PrismaTx } from "../types/prisma";
import { listFeedRows, FeedRowCursor } from "../repositories/feed.repository";
import { ListFeedQueryInput } from "../validators/feed.schema";
import { FeedItem } from "../types/feed";
import { encodeFeedCursor, decodeFeedCursor } from "../utils/feedCursor";

type FeedServiceResult = {
  items: FeedItem[];
  nextCursor?: string;
};

/**
 * Unified feed service
 * 1. Decode cursor
 * 2. Fetch DB rows
 * 3. Group transfers
 * 4. Map to FeedItem
 * 5. Sort + paginate
 */
export async function listUnifiedFeed(
  prisma: PrismaTx,
  input: ListFeedQueryInput,
  userId: string,
): Promise<FeedServiceResult> {
  // 1. Decode cursor
  const repoCursor: FeedRowCursor | undefined = input.cursor
    ? decodeFeedCursor(input.cursor)
    : undefined;

  // 2. Fetch rows
  const rows = await listFeedRows(prisma, {
  limit: input.limit,
  cursor: repoCursor,
  from: input.from,
  to: input.to,
  kind: input.kind,
  accountId: input.accountId,
  categoryId: input.categoryId,
  minAmount: input.minAmount,
  maxAmount: input.maxAmount,
  userId,

  });

  // 3. Group transfers
  const transfersMap = new Map<string, typeof rows>();
  const transactions: typeof rows = [];

  for (const row of rows) {
    if (row.transferId) {
      if (!transfersMap.has(row.transferId)) {
        transfersMap.set(row.transferId, []);
      }
      transfersMap.get(row.transferId)!.push(row);
    } else {
      transactions.push(row);
    }
  }

  // 4. Map → FeedItem
  const feedItems: FeedItem[] = [];

  // Normal transactions
  for (const t of transactions) {
    feedItems.push({
      kind: "TRANSACTION",
      id: t.id,
      accountId: t.accountId,
      amount: t.amount.toNumber(),
      type: t.type as "INCOME" | "EXPENSE",
      categoryId: t.categoryId ?? undefined,
      description: t.description ?? undefined,
      createdAt: t.createdAt,
      deletedAt: t.deletedAt ?? undefined,
    });
  }

  // Transfers
  transfersMap.forEach((rows, transferId) => {
    if (rows.length !== 2) return; // defensive guard
    const expense = rows.find(r => r.type === "EXPENSE");
    const income = rows.find(r => r.type === "INCOME");
    if (!expense || !income) return;

    feedItems.push({
      kind: "TRANSFER",
      transferId,
      fromAccountId: expense.accountId,
      toAccountId: income.accountId,
      amount: expense.amount.toNumber(),
      description: expense.description ?? undefined,
      createdAt: expense.createdAt,
      deletedAt: expense.deletedAt ?? undefined,
    });
  });

  // 5. Sort feed (DESC)
  feedItems.sort((a, b) => {
    if (a.createdAt > b.createdAt) return -1;
    if (a.createdAt < b.createdAt) return 1;
    if (a.kind === "TRANSFER" && b.kind === "TRANSACTION") return -1;
    if (a.kind === "TRANSACTION" && b.kind === "TRANSFER") return 1;
    const aId = a.kind === "TRANSACTION" ? a.id : a.transferId;
    const bId = b.kind === "TRANSACTION" ? b.id : b.transferId;
    return aId > bId ? -1 : aId < bId ? 1 : 0;
  });

  // 6. Cursor pagination
  let nextCursor: string | undefined;
  if (feedItems.length > input.limit) {
    const lastItem = feedItems[input.limit - 1];
    nextCursor = encodeFeedCursor({
      createdAt: lastItem.createdAt,
      id: lastItem.kind === "TRANSACTION" ? lastItem.id : lastItem.transferId,
    });
    feedItems.splice(input.limit);
  }

  return { items: feedItems, nextCursor };
}
