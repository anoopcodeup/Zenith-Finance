"use client";

import { Menu, Bell, Plus, ArrowLeftRight } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Accounts",
  "/transactions": "Transactions",
  "/transfers": "Transfers",
  "/budgets": "Budgets",
  "/recurring": "Recurring",
  "/reports": "Reports",
};

export default function Topbar() {
  const { toggleSidebar, setQuickAddOpen, setTransferOpen } = useUIStore();
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1] ??
    "Zenith";

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#08080f]/80 backdrop-blur-xl border-b border-[#2a2a38] flex items-center px-4 lg:px-6 gap-4">
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-lg font-semibold text-white flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white text-xs font-semibold rounded-lg hover:opacity-95 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>

        <button
          onClick={() => setTransferOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1c1c26] border border-[#2a2a38] text-slate-300 hover:text-white hover:bg-[#232330] hover:border-indigo-500/30 text-xs font-semibold rounded-lg active:scale-[0.98] transition-all cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
          Transfer Funds
        </button>

        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
