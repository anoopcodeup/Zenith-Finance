"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { useMonthlySummary, useCategoryBreakdown } from "@/lib/queries/reports.queries";
import { formatCurrency, getCurrentMonth, getMonthOptions, formatMonth } from "@/lib/utils";
import { TransactionType } from "@/types";

const MONTHS = getMonthOptions(12);

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#22c55e", "#16a34a", "#ef4444", "#f97316",
  "#eab308", "#06b6d4", "#3b82f6", "#ec4899",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1c1c26] border border-[#2a2a38] rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-medium" style={{ color: p.fill || p.stroke }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [breakdownType, setBreakdownType] = useState<TransactionType>("EXPENSE");

  const { data: summary, isLoading: summaryLoading } = useMonthlySummary(month);
  const { data: breakdown, isLoading: breakdownLoading } = useCategoryBreakdown(month, breakdownType);

  const summaryChartData = summary
    ? [
        { name: "Income", value: parseFloat(summary.income), fill: "#22c55e" },
        { name: "Expenses", value: parseFloat(summary.expense), fill: "#ef4444" },
        { name: "Net", value: Math.max(0, parseFloat(summary.net)), fill: "#6366f1" },
      ]
    : [];

  const pieData = breakdown?.map((item) => ({
    name: item.categoryName,
    value: parseFloat(item.total),
  })) ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Reports & Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">Visualize your financial performance</p>
        </div>
        <div className="relative">
          <select
            id="reports-month-selector"
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
      </div>

      {/* Summary stat cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-[#1c1c26] rounded-2xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-sm text-slate-400 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.income)}</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
            <p className="text-sm text-slate-400 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-rose-400">{formatCurrency(summary.expense)}</p>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
            <p className="text-sm text-slate-400 mb-1">Net Savings</p>
            <p className={`text-2xl font-bold ${parseFloat(summary.net) >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
              {formatCurrency(summary.net)}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No data for {formatMonth(month)}</p>
        </div>
      )}

      {/* Bar chart */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111118] border border-[#2a2a38] rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white mb-6">Monthly Overview — {formatMonth(month)}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summaryChartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {summaryChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Category breakdown */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white">Category Breakdown</h3>
          <div className="flex gap-1 bg-[#1c1c26] p-1 rounded-xl">
            {(["EXPENSE", "INCOME"] as TransactionType[]).map((t) => (
              <button
                key={t}
                id={`breakdown-${t.toLowerCase()}`}
                onClick={() => setBreakdownType(t)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  breakdownType === t
                    ? t === "EXPENSE"
                      ? "bg-rose-500 text-white"
                      : "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {breakdownLoading && (
          <div className="flex items-center justify-center h-56">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!breakdownLoading && pieData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No {breakdownType.toLowerCase()} data for this month.</p>
          </div>
        )}

        {!breakdownLoading && pieData.length > 0 && (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => (v != null ? formatCurrency(Number(v)) : "—")} contentStyle={{ background: "#1c1c26", border: "1px solid #2a2a38", borderRadius: "12px" }} />
                <Legend
                  formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
