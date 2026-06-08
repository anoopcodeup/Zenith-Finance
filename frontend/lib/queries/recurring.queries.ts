import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RecurringTransaction, RecurringFrequency, TransactionType } from "@/types";

export const recurringKeys = {
  all: ["recurring"] as const,
  detail: (id: string) => ["recurring", id] as const,
};

export function useRecurring() {
  return useQuery<RecurringTransaction[]>({
    queryKey: recurringKeys.all,
    queryFn: async () => {
      const res = await api.get<{ recurringTransactions: RecurringTransaction[] }>("/recurring-transactions");
      return res.data.recurringTransactions;
    },
  });
}

export function useRecurringById(id: string) {
  return useQuery<RecurringTransaction>({
    queryKey: recurringKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<{ recurringTransaction: RecurringTransaction }>(`/recurring-transactions/${id}`);
      return res.data.recurringTransaction;
    },
    enabled: !!id,
  });
}

interface CreateRecurringData {
  accountId: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: string;
  categoryId?: string;
  description?: string;
  endDate?: string;
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecurringData) => {
      const res = await api.post<{ recurringTransaction: RecurringTransaction }>("/recurring-transactions", data);
      return res.data.recurringTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

export function usePauseRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<{ recurringTransaction: RecurringTransaction }>(`/recurring-transactions/${id}/pause`);
      return res.data.recurringTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

export function useResumeRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<{ recurringTransaction: RecurringTransaction }>(`/recurring-transactions/${id}/resume`);
      return res.data.recurringTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recurring-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}
