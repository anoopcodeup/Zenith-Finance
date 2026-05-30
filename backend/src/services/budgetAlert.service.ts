import { prisma } from "../config/prisma";
import { getBudgetsForMonthRepo } from "../repositories/budget.repository";
import { getCategoryBreakdownService, CategoryBreakdown } from "./reporting.service";
import { TransactionType } from "@prisma/client";

/**
 * - fetch budgets
 * - compare with actuals
 * - return breaches
 */

export const evaluateBudgetAlertsService = async (
    userId: string,
    month: string
) => {
    const budgets = await getBudgetsForMonthRepo(prisma, userId, month);

    if (budgets.length === 0) return [];

    const breakdown = await getCategoryBreakdownService(
        userId,
        month,
        TransactionType.EXPENSE
    );

    const alerts = [];

    for (const budget of budgets) {
        const category = breakdown.categories.find(
            (c: CategoryBreakdown) => c.categoryId === budget.categoryId
        );

        if (!category) continue;

        if (category.total.greaterThanOrEqualTo(budget.amount)) {
            alerts.push({
                userId,
                month,
                categoryId: budget.categoryId,
                limit: budget.amount,
                spent: category.total,
            });
        }
    }

    return alerts;
    //[{userId: 'user_123', month: '2023-01', categoryId: 'cat_123', limit: 150, spent: 1200}]
};
