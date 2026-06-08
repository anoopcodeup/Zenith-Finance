import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString: string, fmt = "MMM d, yyyy"): string {
  try {
    return format(parseISO(dateString), fmt);
  } catch {
    return dateString;
  }
}

export function formatMonth(month: string): string {
  // month format: "YYYY-MM"
  try {
    return format(parseISO(`${month}-01`), "MMMM yyyy");
  } catch {
    return month;
  }
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function getMonthOptions(count = 12): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(d, "yyyy-MM");
    const label = format(d, "MMMM yyyy");
    options.push({ value, label });
  }
  return options;
}

export function getApiError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? "An error occurred";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function classifyAmount(type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME" ? "text-emerald-400" : "text-rose-400";
}

export function signedAmount(amount: string, type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME" ? `+${formatCurrency(amount)}` : `-${formatCurrency(amount)}`;
}
