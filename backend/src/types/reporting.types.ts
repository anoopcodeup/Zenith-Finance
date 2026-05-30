import { Decimal } from "@prisma/client/runtime/library";

/**
 * Monthly financial summary for a user.
 * Semantics:
 * - Aggregated in UTC
 * - Excludes soft-deleted transactions
 * - Deterministic for a given month
 */
export type MonthlySummary = {
  month: string;            // YYYY-MM (UTC)
  income: Decimal;          // >= 0
  expense: Decimal;         // >= 0
  net: Decimal;             // income expense
};

/**
 * Category-wise aggregation for a month.
 * Semantics:
 * - User-scoped
 * - Single transaction type (INCOME | EXPENSE)
 * - Empty categories are omitted
 */
export type CategoryBreakdown = {
  month: string;
  type: "INCOME" | "EXPENSE";
  categories: {
    categoryId: string;
    total: Decimal;
  }[];
};
