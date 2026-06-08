import { redis } from "../config/redis";
import { Decimal } from "@prisma/client/runtime/library";
import { TransactionType } from "@prisma/client";
import {
  getMonthlyTotalsRepo,
  getCategoryBreakdownRepo,
} from "../repositories/reporting.repository";
import { getMonthRange } from "../utils/date.util";
import {
  monthlySummaryKey,
  categoryBreakdownKey,
} from "../utils/cacheKeys";
import { prisma } from "../config/prisma";

const CACHE_TTL = 60 * 10; // 10 minutes

export interface CategoryBreakdown {
  categoryId: string;
  total: Decimal;
  categoryName: string;
}

export interface CategoryBreakdownResponse {
  month: string;
  type: TransactionType;
  categories: CategoryBreakdown[];
}

export interface MonthlySummaryResponse {
  month: string;
  income: Decimal;
  expense: Decimal;
  net: Decimal;
}


export const getMonthlySummaryService = async (
  userId: string,
  month: string
): Promise<MonthlySummaryResponse> => {
  const key = monthlySummaryKey(userId, month);

  const cached = await redis.get(key);
  if (cached) {
    const data = JSON.parse(cached);
    return {
      ...data,
      income: new Decimal(data.income),
      expense: new Decimal(data.expense),
      net: new Decimal(data.net),
    };
  }

  const { start, end } = getMonthRange(month);

  const rows = await getMonthlyTotalsRepo(userId, start, end);
  //rows = [{ type: 'INCOME', _sum: { amount: 150 } }, { type: 'EXPENSE', _sum: { amount: 1200 } }]

  const income =
    rows.find(r => r.type === "INCOME")?._sum.amount ??
    new Decimal(0);

  const expense =
    rows.find(r => r.type === "EXPENSE")?._sum.amount ??
    new Decimal(0);

  const result = {
    month,
    income,
    expense,
    net: income.minus(expense),
  };

  await redis.setex(key, CACHE_TTL, JSON.stringify(result));

  return result;
};



export const getCategoryBreakdownService = async (
  userId: string,
  month: string,
  type: TransactionType
): Promise<CategoryBreakdownResponse> => {
  const key = categoryBreakdownKey(userId, month, type);

  const cached = await redis.get(key);
  if (cached) {
    const data = JSON.parse(cached);
    return {
      ...data,
      categories: data.categories.map((c: any) => ({
        ...c,
        total: new Decimal(c.total),
      })),
    };
  }

  const { start, end } = getMonthRange(month);

  const rows = await getCategoryBreakdownRepo(
    userId,
    type,
    start,
    end
  );

  const categoryIds = rows.map((r) => r.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
    select: {
      id: true,
      name: true,
    },
  });
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

  const result = {
    month,
    type,
    categories: rows.map(r => ({
      categoryId: r.categoryId!,
      categoryName: categoryNameMap.get(r.categoryId!) ?? "Uncategorized",
      total: r._sum.amount ?? new Decimal(0),
    })),
  };

  await redis.setex(key, CACHE_TTL, JSON.stringify(result));

  return result;
};