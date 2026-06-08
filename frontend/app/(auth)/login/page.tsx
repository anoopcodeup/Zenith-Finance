"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { useLogin } from "@/lib/queries/auth.queries";
import { getApiError } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { mutateAsync: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
      router.push("/dashboard");
    } catch {}
  };

  const features = [
    { icon: TrendingUp, label: "Track spending in real time" },
    { icon: BarChart3, label: "Monthly reports & analytics" },
    { icon: Zap, label: "Smart recurring transactions" },
  ];

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0d0d1a] to-[#08080f] items-center justify-center p-16">
        {/* Ambient glows */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Zenith</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your finances,{" "}
            <span className="gradient-text">clearly visible.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Take control of every rupee with powerful tracking, budgeting, and insights.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold">Z</span>
            </div>
            <span className="text-xl font-bold gradient-text">Zenith</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {getApiError(error)}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register("password")}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c26] border border-[#2a2a38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
