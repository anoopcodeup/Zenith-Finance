import { prisma } from "../config/prisma";
import { getMonthlySummaryService } from "./reporting.service";
import {
  upsertMonthlySummaryRepo,
  getMonthlySummaryRepo,
} from "../repositories/monthlySummary.repo";

/**
 * Computes + persists monthly summary
 */
export const generateMonthlySummaryService = async (
  userId: string,
  month: string
) => {
  // Compute
  const summary = await getMonthlySummaryService(userId, month);

  // Persist
  await upsertMonthlySummaryRepo(prisma, {
    userId,
    month,
    income: summary.income,
    expense: summary.expense,
    net: summary.net,
  });

  return summary;
};

/**
 * Read-through strategy:
 * - return cached if exists
 * - otherwise compute & store
 */
export const getOrGenerateMonthlySummaryService = async (
  userId: string,
  month: string
) => {
  const existing = await getMonthlySummaryRepo(prisma, userId, month);

  if (existing) {
    return existing;
  }

  return generateMonthlySummaryService(userId, month);
};
