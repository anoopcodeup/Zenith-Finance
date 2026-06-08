import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Account, AccountBalance, AccountType } from "@/types";

export const accountKeys = {
  all: ["accounts"] as const,
  detail: (id: string) => ["accounts", id] as const,
  balance: (id: string) => ["accounts", id, "balance"] as const,
};

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: accountKeys.all,
    queryFn: async () => {
      const res = await api.get<{ accounts: Account[] }>("/accounts");
      return res.data.accounts;
    },
  });
}

export function useAccount(id: string) {
  return useQuery<Account>({
    queryKey: accountKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<{ account: Account }>(`/accounts/${id}`);
      return res.data.account;
    },
    enabled: !!id,
  });
}

export function useAccountBalance(accountId: string) {
  return useQuery<AccountBalance>({
    queryKey: accountKeys.balance(accountId),
    queryFn: async () => {
      const res = await api.get<AccountBalance>(
        `/transactions/accounts/${accountId}/balance`
      );
      return res.data;
    },
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type: AccountType }) => {
      const res = await api.post<{ account: Account }>("/accounts", data);
      return res.data.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
