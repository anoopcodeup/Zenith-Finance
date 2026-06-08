"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccounts } from "@/lib/queries/accounts.queries";
import { useCreateTransfer } from "@/lib/queries/transfers.queries";
import { getApiError } from "@/lib/utils";
import { useState } from "react";

const schema = z.object({
  fromAccountId: z.string().min(1, "Source account is required"),
  toAccountId: z.string().min(1, "Destination account is required"),
  amount: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().positive("Must be positive")
  ),
  description: z.string().optional(),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: "Cannot transfer to the same account",
  path: ["toAccountId"]
});

type FormData = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
};

interface QuickAddTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddTransferModal({ isOpen, onClose }: QuickAddTransferModalProps) {
  const [formError, setFormError] = useState("");
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { mutateAsync: createTransfer, isPending } = useCreateTransfer();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { fromAccountId: "", toAccountId: "" },
  });


  const fromAccountId = watch("fromAccountId");

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      await createTransfer({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        description: data.description || undefined,
      });
      reset();
      onClose();
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  const filteredDestinationAccounts = accounts?.filter(acc => acc.id !== fromAccountId) ?? [];

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
              <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                Transfer Funds
              </h3>
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

              {/* Source Account */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">From Account (Source)</label>
                <select
                  {...register("fromAccountId")}
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                  disabled={accountsLoading}
                >
                  <option value="">{accountsLoading ? "Loading accounts..." : "Select source account"}</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
                {errors.fromAccountId && <p className="text-xs text-red-400 mt-1">{errors.fromAccountId.message}</p>}
              </div>

              {/* Destination Account */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">To Account (Destination)</label>
                <select
                  {...register("toAccountId")}
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                  disabled={accountsLoading || !fromAccountId}
                >
                  <option value="">
                    {!fromAccountId 
                      ? "First select a source account" 
                      : accountsLoading 
                        ? "Loading accounts..." 
                        : "Select destination account"}
                  </option>
                  {filteredDestinationAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
                {errors.toAccountId && <p className="text-xs text-red-400 mt-1">{errors.toAccountId.message}</p>}
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

              {/* Description Input */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Description (optional)</label>
                <input
                  {...register("description")}
                  placeholder="What is this transfer for?"
                  className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#2a2a38]">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Transfer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#111118] border border-[#2a2a38] text-slate-400 text-sm rounded-xl hover:text-white transition-colors cursor-pointer"
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
