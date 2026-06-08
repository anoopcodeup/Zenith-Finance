"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const { accessToken, login, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!accessToken) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      try {
        const res = await api.get("/auth/me");
        login(res.data, accessToken);
        router.replace("/dashboard");
      } catch {
        setLoading(false);
        router.replace("/login");
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center">
          <span className="text-white font-bold text-xl">Z</span>
        </div>
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
