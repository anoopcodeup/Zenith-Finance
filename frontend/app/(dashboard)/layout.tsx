"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import QuickAddTransactionModal from "@/components/modals/QuickAddTransactionModal";
import QuickAddTransferModal from "@/components/modals/QuickAddTransferModal";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, login, logout, isLoading, setLoading } = useAuthStore();
  const { quickAddOpen, setQuickAddOpen, transferOpen, setTransferOpen } = useUIStore();

  useEffect(() => {
    const init = async () => {
      if (!accessToken) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      try {
        const res = await api.get("/auth/me");
        login(res.data, accessToken);
      } catch {
        logout();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <span className="text-white font-bold">Z</span>
          </div>
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      <Sidebar />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <QuickAddTransactionModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <QuickAddTransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
