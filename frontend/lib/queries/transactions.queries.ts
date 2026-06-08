import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaginatedTransactions, Transaction, TransactionType } from "@/types";

export const txKeys = {
  byAccount: (accountId: string) => ["transactions", "account", accountId] as const,
};

export function useAccountTransactions(accountId: string) {
  return useInfiniteQuery<PaginatedTransactions>({
    queryKey: txKeys.byAccount(accountId),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { limit: "20" };
      if (pageParam) params.cursor = pageParam as string;
      const res = await api.get<{
        data: Transaction[];
        pageInfo: { hasNextPage: boolean; nextCursor: string | null };
      }>(`/transactions/accounts/${accountId}/history`, { params });
      return {
        data: res.data.data,
        nextCursor: res.data.pageInfo.nextCursor,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!accountId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      accountId: string;
      amount: number;
      type: TransactionType;
      categoryId?: string;
      description?: string;
      createdAt?: string;
    }) => {
      const res = await api.post<Transaction>("/transactions", data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: txKeys.byAccount(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.accountId, "balance"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transactionId }: { transactionId: string; accountId: string }) => {
      await api.delete(`/transactions/${transactionId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: txKeys.byAccount(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.accountId, "balance"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useRestoreTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transactionId }: { transactionId: string; accountId: string }) => {
      await api.post(`/transactions/${transactionId}/restore`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: txKeys.byAccount(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.accountId, "balance"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
