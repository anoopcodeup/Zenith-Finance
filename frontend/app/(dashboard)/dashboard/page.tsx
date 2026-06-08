"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, ArrowLeftRight,
  Plus, ArrowRight, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useAccounts } from "@/lib/queries/accounts.queries";
import { useFeed } from "@/lib/queries/feed.queries";
import { useMonthlySummary } from "@/lib/queries/reports.queries";
import { formatCurrency, formatDate, getCurrentMonth, signedAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: feedPages, isLoading: feedLoading } = useFeed();
  const month = getCurrentMonth();
  const { data: summary } = useMonthlySummary(month);

  const recentFeed = feedPages?.pages.flatMap((p) => p.data).slice(0, 5) ?? [];

  const statCards = [
    {
      id: "stat-income",
      label: "Income this month",
      value: summary ? formatCurrency(summary.income) : "—",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "stat-expense",
      label: "Expenses this month",
      value: summary ? formatCurrency(summary.expense) : "—",
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "stat-net",
      label: "Net savings",
      value: summary ? formatCurrency(summary.net) : "—",
      icon: Wallet,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: "stat-accounts",
      label: "Total accounts",
      value: accounts ? `${accounts.length}` : "—",
      icon: ArrowLeftRight,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-2xl font-bold text-white">
          Good {getGreeting()},{" "}
          <span className="gradient-text">{user?.email?.split("@")[0] ?? "there"}</span> 👋
        </h2>
        <p className="text-slate-400 mt-1 text-sm">Here's your financial overview for {formatMonth(month)}.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            className={cn("rounded-2xl border p-5", card.bg)}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{card.label}</p>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
            <p className={cn("text-2xl font-bold", card.color)}>{card.value}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">My Accounts</h3>
            <Link
              href="/accounts"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {accountsLoading && (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-[#1c1c26] rounded-2xl" />
                ))}
              </div>
            )}

            {accounts?.slice(0, 4).map((acc) => (
              <Link
                key={acc.id}
                href={`/accounts/${acc.id}`}
                className="block bg-[#1c1c26] border border-[#2a2a38] rounded-2xl p-4 hover:border-indigo-500/30 hover:bg-[#1e1e2e] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">{acc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{acc.type}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </Link>
            ))}

            <Link
              href="/accounts"
              id="add-account-btn"
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-[#2a2a38] text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add account
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <Link
              href="/transactions"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#111118] border border-[#2a2a38] rounded-2xl overflow-hidden">
            {feedLoading && (
              <div className="animate-pulse p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1c1c26] rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-[#1c1c26] rounded w-1/3" />
                      <div className="h-3 bg-[#1c1c26] rounded w-1/4" />
                    </div>
                    <div className="h-4 bg-[#1c1c26] rounded w-20" />
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && recentFeed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">No transactions yet</p>
                <p className="text-slate-600 text-xs mt-1">Add an account and start tracking</p>
              </div>
            )}

            {recentFeed.map((item, i) => {
              const isTransfer = item.kind === "TRANSFER" || item.type === "TRANSFER";
              const isIncome = !isTransfer && item.type === "INCOME";
              const isExpense = !isTransfer && item.type === "EXPENSE";

              return (
                <div
                  key={item.id ?? item.transferId}

                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition-opacity duration-300",
                    i < recentFeed.length - 1 && "border-b border-[#1e1e28]",
                    item.deletedAt && "opacity-45"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      isIncome && "bg-emerald-500/15",
                      isExpense && "bg-rose-500/15",
                      isTransfer && "bg-violet-500/15"
                    )}
                  >
                    {isIncome && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                    {isExpense && <TrendingDown className="w-4 h-4 text-rose-400" />}
                    {isTransfer && <ArrowLeftRight className="w-4 h-4 text-violet-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                      <span>{item.description ?? item.categoryName ?? (isTransfer ? "Transfer" : item.type)}</span>
                      {item.deletedAt && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-normal">
                          Deleted
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(item.createdAt)}</p>
                  </div>

                  <span
                    className={cn(
                      "text-sm font-semibold flex-shrink-0",
                      item.deletedAt ? "text-slate-500 line-through" :
                      isIncome ? "text-emerald-400" :
                      isExpense ? "text-rose-400" : "text-violet-400"
                    )}
                  >
                    {isTransfer ? formatCurrency(item.amount) : signedAmount(item.amount, item.type as "INCOME" | "EXPENSE")}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatMonth(month: string) {
  try {
    const [y, m] = month.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en", { month: "long", year: "numeric" });
  } catch {
    return month;
  }
}
