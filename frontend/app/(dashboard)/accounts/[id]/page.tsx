"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus, Trash2, Loader2, Wallet, RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useAccount, useAccountBalance } from "@/lib/queries/accounts.queries";
import {
  useAccountTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useRestoreTransaction,
} from "@/lib/queries/transactions.queries";
import { useCreateRecurring } from "@/lib/queries/recurring.queries";
import { useCategories } from "@/lib/queries/budgets.queries";
import { formatCurrency, formatDate, getApiError, signedAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TransactionType } from "@/types";

const schema = z.object({
  amount: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().positive("Must be positive")
  ),
  type: z.enum(["INCOME", "EXPENSE"] as const),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  createdAt: z.string().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
type FormData = {
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  categoryId: string;
  createdAt?: string;
  isRecurring?: boolean;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate?: string;
  endDate?: string;
};

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: account, isLoading: accountLoading } = useAccount(id);
  const { data: balance } = useAccountBalance(id);
  const { data: categoriesData } = useCategories();
  const {
    data: txPages,
    isLoading: txLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAccountTransactions(id);

  const { mutateAsync: createTx, isPending: creating } = useCreateTransaction();
  const { mutateAsync: deleteTx } = useDeleteTransaction();
  const { mutateAsync: restoreTx } = useRestoreTransaction();
  const { mutateAsync: createRecurring, isPending: creatingRecurring } = useCreateRecurring();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "EXPENSE", isRecurring: false, frequency: "MONTHLY" },
  });

  const txType = watch("type");
  const isRecurring = watch("isRecurring");

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      if (data.isRecurring) {
        await createRecurring({
          accountId: id,
          amount: data.amount,
          type: data.type,
          frequency: data.frequency || "MONTHLY",
          startDate: data.startDate || new Date().toISOString().split("T")[0],
          categoryId: data.categoryId,
          description: data.description || undefined,
          endDate: data.endDate || undefined,
        });
      } else {
        await createTx({
          accountId: id,
          amount: data.amount,
          type: data.type,
          categoryId: data.categoryId,
          description: data.description || undefined,
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
        });
      }
      reset();
      setShowForm(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  const transactions = txPages?.pages.flatMap((p) => p.data) ?? [];

  if (accountLoading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[#1c1c26] rounded-xl" />
        <div className="h-32 bg-[#1c1c26] rounded-2xl" />
        <div className="h-64 bg-[#1c1c26] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      {/* Account header */}
      <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-indigo-300 font-medium mb-1">{account?.type}</p>
            <h2 className="text-2xl font-bold text-white">{account?.name}</h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-slate-400">Current Balance</p>
          <p className="text-3xl font-bold text-white mt-1">
            {balance ? formatCurrency(balance.balance) : "—"}
          </p>
        </div>
      </div>

      {/* Transaction controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Transactions</h3>
        <button
          id="add-transaction-btn"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Add transaction form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c26] border border-[#2a2a38] rounded-2xl p-5"
        >
          <h4 className="font-medium text-white mb-4">New Transaction</h4>
          {formError && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(["EXPENSE", "INCOME"] as TransactionType[]).map((t) => (
                <label
                  key={t}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all",
                    txType === t && t === "INCOME"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : txType === t && t === "EXPENSE"
                      ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                      : "border-[#2a2a38] text-slate-500 hover:border-[#3a3a50]"
                  )}
                >
                  <input type="radio" {...register("type")} value={t} className="sr-only" />
                  {t === "INCOME" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {t}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
                <select
                  {...register("categoryId")}
                  id="tx-category"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select category</option>
                  {categoriesData?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-400 mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Amount (₹)</label>
                <input
                  {...register("amount")}
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
                {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Description (optional)</label>
              <input
                {...register("description")}
                id="tx-description"
                placeholder="What was this for?"
                className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Recurring transaction option */}
            <div className="flex items-center gap-2 py-2">
              <input
                {...register("isRecurring")}
                type="checkbox"
                id="is-recurring"
                className="w-4 h-4 rounded border-[#2a2a38] bg-[#111118] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#1c1c26] cursor-pointer"
              />
              <label htmlFor="is-recurring" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                Make this a recurring transaction
              </label>
            </div>

            {isRecurring ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-2 border-t border-[#2a2a38] overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Frequency</label>
                    <select
                      {...register("frequency")}
                      className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Start Date</label>
                    <input
                      {...register("startDate")}
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">End Date (optional)</label>
                    <input
                      {...register("endDate")}
                      type="date"
                      className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Transaction Date (optional)</label>
                <input
                  {...register("createdAt")}
                  type="date"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating || creatingRecurring}
                className="flex-1 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {creating || creatingRecurring ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={() => { reset(); setShowForm(false); }}
                className="px-4 py-2.5 bg-[#111118] border border-[#2a2a38] text-slate-400 text-sm rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Transactions list */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-2xl overflow-hidden">
        {txLoading && (
          <div className="animate-pulse p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1c1c26] rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#1c1c26] rounded w-1/3" />
                  <div className="h-3 bg-[#1c1c26] rounded w-1/5" />
                </div>
                <div className="h-4 bg-[#1c1c26] rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {!txLoading && transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No transactions yet for this account.</p>
          </div>
        )}

        {transactions.map((tx, i) => (
          <div
            key={tx.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] group transition-opacity duration-300",
              i < transactions.length - 1 && "border-b border-[#1e1e28]",
              tx.deletedAt && "opacity-45"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                tx.type === "INCOME" ? "bg-emerald-500/15" : "bg-rose-500/15"
              )}
            >
              {tx.type === "INCOME"
                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                : <TrendingDown className="w-4 h-4 text-rose-400" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                <span>{tx.description ?? tx.category?.name ?? tx.type}</span>
                {tx.deletedAt && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-normal">
                    Deleted
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.createdAt)}</p>
            </div>

            <span className={cn("text-sm font-semibold",
              tx.deletedAt ? "text-slate-500 line-through" :
              tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
            )}>
              {signedAmount(tx.amount, tx.type)}
            </span>

            <div className="w-8 flex-shrink-0 flex items-center justify-center ml-2">
              {!tx.deletedAt ? (
                <button
                  id={`delete-tx-${tx.id}`}
                  onClick={() => deleteTx({ transactionId: tx.id, accountId: id })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete transaction"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id={`restore-tx-${tx.id}`}
                  onClick={() => restoreTx({ transactionId: tx.id, accountId: id })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                  title="Restore transaction"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {hasNextPage && (
          <div className="p-4 border-t border-[#1e1e28]">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2 transition-colors"
            >
              {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
