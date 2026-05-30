import {
  BudgetExceededPayload,
  MonthlySummaryPayload,
} from "../types/notification";

/**
 * Side-effect boundary
 * Today: log
 * Tomorrow: email / push / webhook
 */
export const sendBudgetExceededNotification = async (
  payload: BudgetExceededPayload
) => {
  const { userId, categoryId, spent, limit, month } = payload;

  console.log(
    `📬 NOTIFICATION | user=${userId} category=${categoryId} month=${month} spent=${spent} limit=${limit}`
  );
};

export const sendMonthlySummaryNotification = async (
  payload: MonthlySummaryPayload
) => {
  console.log(
    `📊 Monthly summary ready | user=${payload.userId} month=${payload.month} income=${payload.totalIncome} expense=${payload.totalExpense}`
  );
};
