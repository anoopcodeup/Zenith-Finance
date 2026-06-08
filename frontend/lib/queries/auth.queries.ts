import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AuthResponse, User } from "@/types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  return useQuery<User>({
    queryKey: authKeys.me,
    queryFn: async () => {
      const res = await api.get<User>("/auth/me");
      return res.data;
    },
    retry: false,
  });
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>("/auth/register", data);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}
