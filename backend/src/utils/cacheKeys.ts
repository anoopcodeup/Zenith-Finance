export const monthlySummaryKey = (userId: string, month: string) =>
  `report:monthly:${userId}:${month}`;

export const categoryBreakdownKey = (
  userId: string,
  month: string,
  type: string
) => `report:category:${userId}:${month}:${type}`;

export const budgetAlertKey = (userId: string, categoryId: string, month: string) =>
  `budget-alert:${userId}:${categoryId}:${month}`;


import { NotificationType } from "../types/notification";
export const notificationIdempotencyKey = (params: {
  userId: string;
  type: NotificationType;
  scope: string; // month / category / etc
}) => {
  return `notif:${params.userId}:${params.type}:${params.scope}`;
};