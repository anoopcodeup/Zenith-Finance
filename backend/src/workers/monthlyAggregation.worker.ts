import { Worker, Job } from "bullmq";
import { bullConnection } from "../config/bullmq";
import { MONTHLY_AGGREGATION_QUEUE } from "../queues/monthlyAggregation.queue";
import { notificationQueue } from "../queues/notification.queue";
import { getOrGenerateMonthlySummaryService } from "../services/monthlySummary.service";
import { NotificationType } from "../types/notification";
import { isNotificationEnabled } from "../services/notificationPreference.service";

export const startMonthlyAggregationWorker = () => {
  return new Worker(
    MONTHLY_AGGREGATION_QUEUE,
    async (job: Job) => {
      const { userId, month } = job.data;

      const summary = await getOrGenerateMonthlySummaryService(
        userId,
        month
      );

      // 🔔 enqueue notification (non-blocking side effect)
      if (
        await isNotificationEnabled(
          userId,
          NotificationType.MONTHLY_SUMMARY_READY
        )
      ) {
        await notificationQueue.add("notify", {
          type: NotificationType.MONTHLY_SUMMARY_READY,
          payload: {
            userId,
            month,
            totalIncome: summary.income.toString(),
            totalExpense: summary.expense.toString(),
          },
        });
      }
    },
    {
      connection: bullConnection,
      concurrency: 1,
    }
  );
};
