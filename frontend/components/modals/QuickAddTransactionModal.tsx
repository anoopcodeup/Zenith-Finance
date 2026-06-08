"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccounts } from "@/lib/queries/accounts.queries";
import { useCategories } from "@/lib/queries/budgets.queries";
import { useCreateTransaction } from "@/lib/queries/transactions.queries";
import { useCreateRecurring } from "@/lib/queries/recurring.queries";
import { getApiError } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TransactionType } from "@/types";

const schema = z.object({
  accountId: z.string().min(1, "Account is required"),
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
  accountId: string;
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

interface QuickAddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddTransactionModal({ isOpen, onClose }: QuickAddTransactionModalProps) {
  const [formError, setFormError] = useState("");
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: categories } = useCategories();

  const { mutateAsync: createTx, isPending: creating } = useCreateTransaction();
  const { mutateAsync: createRecurring, isPending: creatingRecurring } = useCreateRecurring();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "EXPENSE", isRecurring: false, frequency: "MONTHLY", accountId: "" },
  });

  const txType = watch("type");
  const isRecurring = watch("isRecurring");

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      if (data.isRecurring) {
        await createRecurring({
          accountId: data.accountId,
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
          accountId: data.accountId,
          amount: data.amount,
          type: data.type,
          categoryId: data.categoryId,
          description: data.description || undefined,
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
        });
      }
      reset();
      onClose();
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  const isPending = creating || creatingRecurring;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-[#1c1c26] border border-[#2a2a38] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a38]">
              <h3 className="font-semibold text-white text-lg">Add Transaction</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {formError}
                </div>
              )}

              {/* Account Dropdown */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Select Account</label>
                <select
                  {...register("accountId")}
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                  disabled={accountsLoading}
                >
                  <option value="">{accountsLoading ? "Loading accounts..." : "Select account"}</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
                {errors.accountId && <p className="text-xs text-red-400 mt-1">{errors.accountId.message}</p>}
              </div>

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
                {/* Category Dropdown */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
                  <select
                    {...register("categoryId")}
                    className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-xs text-red-400 mt-1">{errors.categoryId.message}</p>}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Amount (₹)</label>
                  <input
                    {...register("amount")}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Description (optional)</label>
                <input
                  {...register("description")}
                  placeholder="What was this for?"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Make Recurring Checkbox */}
              <div className="flex items-center gap-2 py-1">
                <input
                  {...register("isRecurring")}
                  type="checkbox"
                  id="modal-is-recurring"
                  className="w-4 h-4 rounded border-[#2a2a38] bg-[#111118] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#1c1c26] cursor-pointer"
                />
                <label htmlFor="modal-is-recurring" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
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

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#2a2a38]">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#111118] border border-[#2a2a38] text-slate-400 text-sm rounded-xl hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
