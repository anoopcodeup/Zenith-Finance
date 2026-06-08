"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Pause, Play, Trash2, Loader2 } from "lucide-react";
import {
  useRecurring,
  useCreateRecurring,
  usePauseRecurring,
  useResumeRecurring,
  useDeleteRecurring,
} from "@/lib/queries/recurring.queries";
import { useAccounts } from "@/lib/queries/accounts.queries";
import { formatCurrency, formatDate, getApiError } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RecurringFrequency, TransactionType } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  accountId: z.string().min(1, "Select an account"),
  amount: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().positive("Must be positive")
  ),
  type: z.enum(["INCOME", "EXPENSE"] as const),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const),
  startDate: z.string().min(1, "Start date required"),
  description: z.string().optional(),
});
type FormData = { accountId: string; amount: number; type: "INCOME" | "EXPENSE"; frequency: RecurringFrequency; startDate: string; description?: string };

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export default function RecurringPage() {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: recurring, isLoading } = useRecurring();
  const { data: accounts } = useAccounts();
  const { mutateAsync: create, isPending: creating } = useCreateRecurring();
  const { mutateAsync: pause } = usePauseRecurring();
  const { mutateAsync: resume } = useResumeRecurring();
  const { mutateAsync: deleteRecurring } = useDeleteRecurring();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "EXPENSE", frequency: "MONTHLY" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      await create({ ...data, startDate: new Date(data.startDate).toISOString() });
      reset();
      setShowForm(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Recurring Transactions</h2>
          <p className="text-sm text-slate-400 mt-0.5">Automate repeating income or expenses</p>
        </div>
        <button
          id="new-recurring-btn"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Recurring
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c26] border border-[#2a2a38] rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white mb-4">Create Recurring Transaction</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Account</label>
                <select
                  {...register("accountId")}
                  id="recurring-account"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select account</option>
                  {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {errors.accountId && <p className="text-xs text-red-400 mt-1">{errors.accountId.message}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Amount (₹)</label>
                <input
                  {...register("amount")}
                  id="recurring-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
                {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Type</label>
                <select
                  {...register("type")}
                  id="recurring-type"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Frequency</label>
                <select
                  {...register("frequency")}
                  id="recurring-freq"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as RecurringFrequency[]).map((f) => (
                    <option key={f} value={f}>{FREQ_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Start Date</label>
                <input
                  {...register("startDate")}
                  id="recurring-start"
                  type="date"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                {errors.startDate && <p className="text-xs text-red-400 mt-1">{errors.startDate.message}</p>}
              </div>
            </div>
            <input
              {...register("description")}
              id="recurring-desc"
              placeholder="Description (optional)"
              className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create
              </button>
              <button
                type="button"
                onClick={() => { reset(); setShowForm(false); }}
                className="px-4 py-2.5 bg-[#111118] border border-[#2a2a38] text-slate-400 text-sm rounded-xl hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[#1c1c26] rounded-2xl" />)}
        </div>
      )}

      {!isLoading && (!recurring || recurring.length === 0) && (
        <div className="text-center py-16">
          <RefreshCw className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No recurring transactions.</p>
          <p className="text-slate-600 text-sm mt-1">Automate rent, salary, subscriptions, and more.</p>
        </div>
      )}

      <div className="space-y-4">
        {recurring?.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-[#1c1c26] border rounded-2xl p-5",
              r.active ? "border-[#2a2a38]" : "border-[#1e1e24] opacity-60"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  r.type === "INCOME" ? "bg-emerald-500/15" : "bg-rose-500/15"
                )}>
                  <RefreshCw className={cn("w-5 h-5", r.type === "INCOME" ? "text-emerald-400" : "text-rose-400")} />
                </div>
                <div>
                  <p className="font-semibold text-white">{r.description ?? r.type}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{FREQ_LABELS[r.frequency]}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-500">Next: {formatDate(r.nextRunAt)}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-md",
                      r.active ? "income-badge" : "bg-slate-500/15 text-slate-400 border border-slate-500/20"
                    )}>
                      {r.active ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>
              </div>
              <span className={cn("text-lg font-bold", r.type === "INCOME" ? "text-emerald-400" : "text-rose-400")}>
                {formatCurrency(r.amount)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2a2a38]">
              {r.active ? (
                <button
                  id={`pause-recurring-${r.id}`}
                  onClick={() => pause(r.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              ) : (
                <button
                  id={`resume-recurring-${r.id}`}
                  onClick={() => resume(r.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              )}
              <button
                id={`delete-recurring-${r.id}`}
                onClick={() => deleteRecurring(r.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
