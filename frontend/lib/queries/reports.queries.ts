import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { MonthlySummary, CategoryBreakdownItem, TransactionType } from "@/types";

export const reportKeys = {
  monthlySummary: (month: string) => ["reports", "monthly", month] as const,
  categoryBreakdown: (month: string, type: TransactionType) =>
    ["reports", "breakdown", month, type] as const,
};

export function useMonthlySummary(month: string) {
  return useQuery<MonthlySummary>({
    queryKey: reportKeys.monthlySummary(month),
    queryFn: async () => {
      const res = await api.get<MonthlySummary>("/reports/monthly-summary", {
        params: { month },
      });
      return res.data;
    },
    enabled: !!month,
  });
}

export function useCategoryBreakdown(month: string, type: TransactionType) {
  return useQuery<CategoryBreakdownItem[]>({
    queryKey: reportKeys.categoryBreakdown(month, type),
    queryFn: async () => {
      const res = await api.get<{ categories: CategoryBreakdownItem[] }>("/reports/category-breakdown", {
        params: { month, type },
      });
      return res.data.categories;
    },
    enabled: !!month && !!type,
  });
}
