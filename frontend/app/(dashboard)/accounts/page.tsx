"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, Trash2, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccounts, useCreateAccount, useDeleteAccount } from "@/lib/queries/accounts.queries";
import { AccountType } from "@/types";
import { getApiError } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["SAVINGS", "CREDIT", "CASH"] as const),
});
type FormData = z.infer<typeof schema>;

const accountTypeColors: Record<AccountType, string> = {
  SAVINGS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  CREDIT: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  CASH: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

export default function AccountsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: createAccount, isPending: creating } = useCreateAccount();
  const { mutateAsync: deleteAccount, isPending: deleting } = useDeleteAccount();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "SAVINGS" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setFormError("");
      await createAccount(data);
      reset();
      setShowForm(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Accounts</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage your financial accounts</p>
        </div>
        <button
          id="new-account-btn"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c26] border border-[#2a2a38] rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white mb-4">Create New Account</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                {...register("name")}
                id="account-name"
                placeholder="Account name (e.g. Main Savings)"
                className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>
            <div className="w-full sm:w-36">
              <select
                {...register("type")}
                id="account-type"
                className="w-full px-4 py-2.5 bg-[#111118] border border-[#2a2a38] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="SAVINGS">Savings</option>
                <option value="CREDIT">Credit</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 gradient-brand text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-[#111118] border border-[#2a2a38] text-slate-400 text-sm rounded-xl hover:text-white transition-colors"
            >
              Cancel
            </button>
          </form>
        </motion.div>
      )}

      {/* Accounts list */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[#1c1c26] rounded-2xl" />)}
        </div>
      )}

      {!isLoading && accounts?.length === 0 && (
        <div className="text-center py-16">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No accounts yet. Create your first one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts?.map((acc) => (
          <motion.div
            key={acc.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => router.push(`/accounts/${acc.id}`)}
            className="bg-[#1c1c26] border border-[#2a2a38] hover:border-indigo-500/50 rounded-2xl p-5 hover:bg-[#222230] transition-colors duration-300 group cursor-pointer relative shadow-lg hover:shadow-indigo-500/10 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors duration-300">
                <Wallet className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${accountTypeColors[acc.type]}`}>
                  {acc.type}
                </span>
                <button
                  id={`delete-account-${acc.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAccount(acc.id);
                  }}
                  disabled={deleting}
                  className="flex items-center justify-center p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-60 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="font-semibold text-white text-lg mb-1 group-hover:text-indigo-200 transition-colors duration-300">{acc.name}</p>
            <p className="text-xs text-slate-500">Created {new Date(acc.createdAt).toLocaleDateString()}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
