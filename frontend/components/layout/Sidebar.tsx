"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  Target,
  RefreshCw,
  BarChart3,
  LogOut,
  X,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/lib/queries/auth.queries";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/accounts", icon: Wallet, label: "Accounts" },
  { href: "/transactions", icon: Receipt, label: "Transactions" },
  { href: "/transfers", icon: ArrowLeftRight, label: "Transfers" },
  { href: "/budgets", icon: Target, label: "Budgets" },
  { href: "/recurring", icon: RefreshCw, label: "Recurring" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { mutateAsync: logout, isPending } = useLogout();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#2a2a38]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-md shadow-indigo-500/30">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Zenith</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-sm shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
                size={18}
              />
              {label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-[#2a2a38]">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-[#1c1c26]">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{user?.email ?? "Loading…"}</p>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-30 bg-[#111118] border-r border-[#2a2a38]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="lg:hidden fixed left-0 top-0 h-full z-50 w-64 bg-[#111118] border-r border-[#2a2a38]"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
