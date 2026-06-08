import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Transfer } from "@/types";

export const transferKeys = {
  all: ["transfers"] as const,
};

export function useTransfers() {
  return useQuery<Transfer[]>({
    queryKey: transferKeys.all,
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>("/transfers");
      return res.data.data.map((item) => ({
        id: item.transferId,
        fromAccountId: item.from?.accountId ?? "",
        toAccountId: item.to?.accountId ?? "",
        amount: item.from?.amount ?? item.to?.amount ?? "0",
        createdAt: item.createdAt,
        description: item.from?.description ?? item.to?.description ?? null,
      }));
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
    }) => {
      const res = await api.post<Transfer>("/transfers", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
