export type CreateTransactionDomain = {
  userId: string;
  accountId: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  categoryId?: string;
  transferId?: string;
};

export type TransferDomain = {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
};