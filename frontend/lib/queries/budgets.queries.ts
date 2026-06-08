import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Budget } from "@/types";

export const budgetKeys = {
  all: (month?: string) => ["budgets", month] as const,
  detail: (id: string) => ["budgets", "detail", id] as const,
};

export function useBudgets(month?: string) {
  return useQuery<{ budgets: Budget[] }>({
    queryKey: budgetKeys.all(month),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (month) params.month = month;
      const res = await api.get<{ budgets: Budget[] }>("/budgets", { params });
      return res.data;
    },
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categoryId: string; month: string; amount: number }) => {
      const res = await api.post<{ message: string; budget: Budget }>("/budgets", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budgetId: string) => {
      await api.delete(`/budgets/${budgetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useCategories() {
  return useQuery<Array<{ id: string; name: string; userId?: string | null }>>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<Array<{ id: string; name: string; userId?: string | null }>>("/categories");
      return res.data;
    },
  });
}
