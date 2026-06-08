import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: "zenith-auth",
      // Only persist accessToken; user is re-fetched on mount
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
