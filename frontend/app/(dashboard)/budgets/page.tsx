"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, Trash2, Loader2, ChevronDown } from "lucide-react";
import { useBudgets, useUpsertBudget, useDeleteBudget, useCategories } from "@/lib/queries/budgets.queries";
import { useCategoryBreakdown } from "@/lib/queries/reports.queries";
import { formatCurrency, getCurrentMonth, getMonthOptions, getApiError } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().positive("Must be positive")
  ),
});
type FormData = { categoryId: string; amount: number };

const MONTHS = getMonthOptions(6);

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useBudgets(month);
  const { data: categoriesData } = useCategories();
  const { data: breakdown } = useCategoryBreakdown(month, "EXPENSE");
  const { mutateAsync: upsert, isPending: upserting } = useUpsertBudget();
  const { mutateAsync: deleteBudget, isPending: deleting } = useDeleteBudget();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      await upsert({ ...data, month });
      reset();
      setShowForm(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  const budgets = data?.budgets ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Budgets</h2>
          <p className="text-sm text-slate-400 mt-0.5">Set spending limits by category</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="relative">
            <select
              id="budget-month-selector"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="pl-4 pr-9 py-2.5 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <button
            id="new-budget-btn"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Set Budget
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c26] border border-[#2a2a38] rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white mb-4">Set / Update Budget for {MONTHS.find(m => m.value === month)?.label}</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                {...register("categoryId")}
                id="budget-category-id"
                className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {categoriesData?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-400 mt-1">{errors.categoryId.message}</p>}
            </div>
            <div className="w-full sm:w-40">
              <input
                {...register("amount")}
                id="budget-amount"
                type="number"
                step="0.01"
                placeholder="Amount (₹)"
                className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
            </div>
            <button
              type="submit"
              disabled={upserting}
              className="px-5 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {upserting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-[#111118] border border-[#2a2a38] text-slate-400 text-sm rounded-xl hover:text-white"
            >
              Cancel
            </button>
          </form>
        </motion.div>
      )}

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-[#1c1c26] rounded-2xl" />)}
        </div>
      )}

      {!isLoading && budgets.length === 0 && (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No budgets set for this month.</p>
          <p className="text-slate-600 text-sm mt-1">Click "Set Budget" to create one.</p>
        </div>
      )}

      <div className="space-y-4">
        {budgets.map((b) => {
          const amount = parseFloat(b.amount);
          const categorySpent = breakdown?.find((c) => c.categoryId === b.categoryId);
          const spentAmount = categorySpent ? parseFloat(categorySpent.total) : 0;
          const percent = amount > 0 ? (spentAmount / amount) * 100 : 0;
          const displayPercent = Math.min(100, percent);
          const remainingAmount = amount - spentAmount;
          const isOverBudget = remainingAmount < 0;

          // Color themes based on percent
          let progressColor = "from-emerald-500 to-teal-400 shadow-emerald-500/20";
          let textColor = "text-emerald-400";
          let badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

          if (percent >= 70 && percent < 90) {
            progressColor = "from-amber-500 to-orange-400 shadow-amber-500/20";
            textColor = "text-amber-400";
            badgeBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
          } else if (percent >= 90) {
            progressColor = "from-rose-500 to-red-400 shadow-rose-500/20";
            textColor = "text-rose-400";
            badgeBg = "bg-rose-500/10 text-rose-400 border-rose-500/20";
          }

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1c1c26] border border-[#2a2a38] hover:border-[#3a3a50] transition-colors rounded-2xl p-5 shadow-lg group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-white text-base">{b.category?.name ?? "Category"}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Budget limit: {formatCurrency(b.amount)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${badgeBg}`}>
                    {percent.toFixed(0)}% spent
                  </span>
                  <button
                    id={`delete-budget-${b.id}`}
                    onClick={() => deleteBudget(b.id)}
                    disabled={deleting}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-60 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="h-3 bg-[#111118] rounded-full overflow-hidden relative shadow-inner">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                  style={{ width: `${displayPercent}%` }}
                />
              </div>

              {/* Remaining / Over Budget text details */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <p className="text-slate-500">Month: {b.month}</p>
                <p className="font-medium">
                  {isOverBudget ? (
                    <span className="text-rose-400 font-semibold">
                      Over budget by {formatCurrency(Math.abs(remainingAmount))}
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      {formatCurrency(remainingAmount)} remaining
                    </span>
                  )}
                  <span className="text-slate-500 font-normal"> / {formatCurrency(spentAmount)} spent</span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
