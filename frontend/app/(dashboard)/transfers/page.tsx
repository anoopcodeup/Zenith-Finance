"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Plus, Loader2, RefreshCw } from "lucide-react";
import { useAccounts } from "@/lib/queries/accounts.queries";
import { useTransfers, useCreateTransfer } from "@/lib/queries/transfers.queries";
import { formatCurrency, formatDate, getApiError } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  fromAccountId: z.string().min(1, "Select source account"),
  toAccountId: z.string().min(1, "Select destination account"),
  amount: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().positive("Must be positive")
  ),
  description: z.string().optional(),
}).refine((d) => d.fromAccountId !== d.toAccountId, {
  message: "Source and destination cannot be the same",
  path: ["toAccountId"],
});

type FormData = { fromAccountId: string; toAccountId: string; amount: number; description?: string };

export default function TransfersPage() {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const { data: accounts } = useAccounts();
  const { data: transfers, isLoading } = useTransfers();
  const { mutateAsync: createTransfer, isPending } = useCreateTransfer();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      await createTransfer(data);
      reset();
      setShowForm(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  const accountMap = Object.fromEntries(accounts?.map((a) => [a.id, a.name]) ?? []);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transfers</h2>
          <p className="text-sm text-slate-400 mt-0.5">Move money between your accounts</p>
        </div>
        <button
          id="new-transfer-btn"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Transfer
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c26] border border-[#2a2a38] rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white mb-4">Create Transfer</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">From Account</label>
                <select
                  {...register("fromAccountId")}
                  id="transfer-from"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">Select account</option>
                  {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {errors.fromAccountId && <p className="text-xs text-red-400 mt-1">{errors.fromAccountId.message}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">To Account</label>
                <select
                  {...register("toAccountId")}
                  id="transfer-to"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">Select account</option>
                  {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {errors.toAccountId && <p className="text-xs text-red-400 mt-1">{errors.toAccountId.message}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  {...register("amount")}
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  placeholder="Amount (₹)"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
                {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
              </div>
              <input
                {...register("description")}
                id="transfer-desc"
                placeholder="Note (optional)"
                className="flex-1 px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Transfer
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

      {/* Transfer history */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-2xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[#2a2a38]">
          <h3 className="font-medium text-white text-sm">Transfer History</h3>
        </div>

        {isLoading && (
          <div className="animate-pulse p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1c1c26] rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#1c1c26] rounded w-2/5" />
                  <div className="h-3 bg-[#1c1c26] rounded w-1/4" />
                </div>
                <div className="h-4 bg-[#1c1c26] rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!transfers || transfers.length === 0) && (
          <div className="flex flex-col items-center py-12 gap-3">
            <RefreshCw className="w-10 h-10 text-slate-600" />
            <p className="text-slate-500 text-sm">No transfers yet</p>
          </div>
        )}

        {transfers?.map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${i < transfers.length - 1 ? "border-b border-[#1e1e28]" : ""}`}
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {accountMap[t.fromAccountId] ?? "Unknown"} → {accountMap[t.toAccountId] ?? "Unknown"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.description ? `${t.description} · ` : ""}{formatDate(t.createdAt)}
              </p>
            </div>
            <span className="text-sm font-semibold text-violet-400">{formatCurrency(t.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
