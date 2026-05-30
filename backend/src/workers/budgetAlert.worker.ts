import { redis } from "../config/redis";
import { Worker, Job } from "bullmq";
import { bullConnection } from "../config/bullmq";
import { BUDGET_ALERT_QUEUE } from "../queues/budgetAlert.queue";
import { notificationQueue } from "../queues/notification.queue";
import { evaluateBudgetAlertsService } from "../services/budgetAlert.service";
import { budgetAlertKey } from "../utils/cacheKeys";
import { NotificationType } from "../types/notification";
import { isNotificationEnabled } from "../services/notificationPreference.service";

// helper - budgetAlertCooldown.ts
const ALERT_COOLDOWN_SECONDS = 60 * 60 * 24; // 24h

export const acquireBudgetAlertCooldown = async (params: {
  userId: string;
  categoryId: string;
  month: string;
}) => {
  const key = budgetAlertKey(
    params.userId,
    params.categoryId,
    params.month
  );

  // SET key NX EX ttl  → atomic
  const result = await redis.call(
    "SET",
    key,
    "1",
    "EX",
    ALERT_COOLDOWN_SECONDS,
    "NX",
  );

  return result === "OK"; // true = allowed to notify
};


export const startBudgetAlertWorker = () => {
  return new Worker(
    BUDGET_ALERT_QUEUE,
    async (job: Job) => {
      const { userId, month } = job.data;

      const alerts = await evaluateBudgetAlertsService(userId, month);

      for (const alert of alerts) {
        const allowed = await acquireBudgetAlertCooldown({
          userId: alert.userId,
          categoryId: alert.categoryId,
          month: alert.month,
        });

        if (!allowed) {
          // 💤 cooldown active — skip
          continue;
        }

        // 🔁 fan-out
        if (
          await isNotificationEnabled(
            alert.userId,
            NotificationType.BUDGET_EXCEEDED
          )
        ) {
          await notificationQueue.add(
            "budget-exceeded",
            {
              type: NotificationType.BUDGET_EXCEEDED,
              createdAt: new Date().toISOString(),
              payload: {
                userId: alert.userId,
                categoryId: alert.categoryId,
                spent: alert.spent.toString(),
                limit: alert.limit.toString(),
                month: alert.month,
              },
            },
            {
              attempts: 5,
              backoff: { type: "exponential", delay: 3000 },
            }
          );
        }
      }
    },
    {
      connection: bullConnection,
      concurrency: 2,
    }
  );
};
