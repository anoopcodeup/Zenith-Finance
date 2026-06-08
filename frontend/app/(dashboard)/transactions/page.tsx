"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, ArrowLeftRight, Loader2, ActivityIcon, ChevronDown } from "lucide-react";
import { useFeed } from "@/lib/queries/feed.queries";
import { useAccounts } from "@/lib/queries/accounts.queries";
import { formatCurrency, formatDate, signedAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const { data: accounts } = useAccounts();
  const { data: pages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(selectedAccountId || undefined);
  const allItems = pages?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">All Transactions</h2>
          <p className="text-sm text-slate-400 mt-0.5">Your complete activity feed across all accounts</p>
        </div>

        {/* Account filter */}
        <div className="relative w-full sm:w-48 flex-shrink-0">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="pl-4 pr-9 py-2.5 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer w-full"
          >
            <option value="">All Accounts</option>
            {accounts?.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-[#111118] border border-[#2a2a38] rounded-2xl overflow-hidden">
        {isLoading && (
          <div className="animate-pulse p-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1c1c26] rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#1c1c26] rounded w-1/3" />
                  <div className="h-3 bg-[#1c1c26] rounded w-1/4" />
                </div>
                <div className="h-4 bg-[#1c1c26] rounded w-24" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && allItems.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <ActivityIcon className="w-12 h-12 text-slate-600" />
            <p className="text-slate-500">No transactions yet.</p>
            <p className="text-slate-600 text-sm">Add accounts and start recording income/expenses.</p>
          </div>
        )}

        {allItems.map((item, i) => {
          const isTransfer = item.kind === "TRANSFER" || item.type === "TRANSFER";
          const isIncome = !isTransfer && item.type === "INCOME";
          const isExpense = !isTransfer && item.type === "EXPENSE";

          return (
            <motion.div
              key={item.id ?? item.transferId}

              initial={{ opacity: 0 }}
              animate={{ opacity: item.deletedAt ? 0.45 : 1 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors",
                i < allItems.length - 1 && "border-b border-[#1e1e28]"
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

              <div className="text-right">
                <p className={cn("text-sm font-semibold",
                  item.deletedAt ? "text-slate-500 line-through" :
                  isIncome ? "text-emerald-400" :
                  isExpense ? "text-rose-400" : "text-violet-400"
                )}>
                  {isTransfer
                    ? formatCurrency(item.amount)
                    : signedAmount(item.amount, item.type as "INCOME" | "EXPENSE")}
                </p>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-md",
                  isIncome ? "income-badge" :
                  isExpense ? "expense-badge" : "transfer-badge"
                )}>
                  {isTransfer ? "TRANSFER" : item.type}
                </span>
              </div>
            </motion.div>
          );
        })}

        {hasNextPage && (
          <div className="p-4 border-t border-[#1e1e28]">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2.5 text-sm text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2 transition-colors rounded-xl hover:bg-indigo-500/10"
            >
              {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Load more transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
