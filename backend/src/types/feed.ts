export type FeedItem =
  | {
      kind: "TRANSACTION";
      id: string;
      accountId: string;
      amount: number;
      type: "INCOME" | "EXPENSE";
      categoryId?: string;
      description?: string;
      createdAt: Date;
    }
  | {
      kind: "TRANSFER";
      transferId: string;
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
      createdAt: Date;
    };
