export enum NotificationType {
  BUDGET_EXCEEDED = "BUDGET_EXCEEDED",
  MONTHLY_SUMMARY_READY = "MONTHLY_SUMMARY_READY",
}

/* ---------- Payloads ---------- */

export interface BudgetExceededPayload {
  userId: string;
  categoryId: string;
  spent: string;
  limit: string;
  month: string;
}

export interface MonthlySummaryPayload {
  userId: string;
  month: string;
  totalIncome: string;
  totalExpense: string;
}

/* ---------- Notification Jobs ---------- */

export interface BudgetExceededNotification {
  type: NotificationType.BUDGET_EXCEEDED;
  payload: BudgetExceededPayload;
  createdAt?: string;
}

export interface MonthlySummaryNotification {
  type: NotificationType.MONTHLY_SUMMARY_READY;
  payload: MonthlySummaryPayload;
  createdAt?: string;
}

/* ---------- Union ---------- */

export type NotificationPayload =
  | BudgetExceededNotification
  | MonthlySummaryNotification;
