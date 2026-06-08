"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ShieldCheck, PieChart, RefreshCw } from "lucide-react";
import { useRegister } from "@/lib/queries/auth.queries";
import { getApiError } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { mutateAsync: register, isPending, error } = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await register({ email: data.email, password: data.password });
      router.push("/dashboard");
    } catch {}
  };

  const perks = [
    { icon: ShieldCheck, label: "Secure cookie-based authentication" },
    { icon: PieChart, label: "Beautiful budget visualization" },
    { icon: RefreshCw, label: "Automated recurring transactions" },
  ];

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0d0d1a] to-[#08080f] items-center justify-center p-16">
        <div className="absolute top-40 right-10 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-10 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Zenith</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Start your{" "}
            <span className="gradient-text">financial journey</span> today.
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Join Zenith and get a complete picture of your money — free, secure, and beautifully designed.
          </p>

          <div className="space-y-4">
            {perks.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold">Z</span>
            </div>
            <span className="text-xl font-bold gradient-text">Zenith</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
          <p className="text-slate-400 mb-8">Get started with Zenith for free</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {getApiError(error)}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...formRegister("email")}
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...formRegister("password")}
                  id="register-password"
                  type="password"
                  placeholder="Min 8 chars, uppercase & number"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...formRegister("confirmPassword")}
                  id="register-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
