import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaginatedFeed } from "@/types";

export const feedKeys = {
  all: (accountId?: string) => ["feed", { accountId }] as const,
};

export function useFeed(accountId?: string) {
  return useInfiniteQuery<PaginatedFeed>({
    queryKey: feedKeys.all(accountId),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { limit: "15" };
      if (pageParam) params.cursor = pageParam as string;
      if (accountId) params.accountId = accountId;
      const res = await api.get<{ items: any[]; nextCursor: string | null }>("/feed", { params });
      return {
        data: res.data.items,
        nextCursor: res.data.nextCursor,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
