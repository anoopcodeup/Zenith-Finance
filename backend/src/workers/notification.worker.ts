import { Worker, Job } from "bullmq";
import { bullConnection } from "../config/bullmq";
import { NOTIFICATION_QUEUE } from "../queues/notification.queue";

import {
  NotificationPayload,
  NotificationType,
} from "../types/notification";

import {
  sendBudgetExceededNotification,
  sendMonthlySummaryNotification,
} from "../services/notification.service";

import { isNotificationEnabled } from "../services/notificationPreference.service";
import { acquireNotificationIdempotency } from "../services/notificationIdempotency.service";
import { notificationIdempotencyKey } from "../utils/cacheKeys";

import { NotificationType as PrismaNotificationType } from "@prisma/client";

const IDEMPOTENCY_TTL = {
  [NotificationType.BUDGET_EXCEEDED]: 60 * 60 * 24, // 24h
  [NotificationType.MONTHLY_SUMMARY_READY]: 60 * 60 * 24 * 30, // 1 month
};

export const startNotificationWorker = () => {
  return new Worker(
    NOTIFICATION_QUEUE,
    async (job: Job<NotificationPayload>) => {
      const { type, payload } = job.data;
      const { userId } = payload;

      // 🔁 preference check
      const prismaType = type as unknown as PrismaNotificationType;
      const isEnabled = await isNotificationEnabled(userId, prismaType);

      if (!isEnabled) {
        console.log(`🔕 Notification skipped (disabled): ${userId} | ${type}`);
        return;
      }

      // 🔐 idempotency scope
      let scope = "global";

      if (type === NotificationType.BUDGET_EXCEEDED) {
        scope = `${payload.categoryId}:${payload.month}`;
      }

      if (type === NotificationType.MONTHLY_SUMMARY_READY) {
        scope = payload.month;
      }

      const key = notificationIdempotencyKey({
        userId,
        type,
        scope,
      });

      const allowed = await acquireNotificationIdempotency({
        key,
        ttlSeconds: IDEMPOTENCY_TTL[type],
      });

      if (!allowed) {
        console.log(`⏭️ Notification deduped: ${key}`);
        return;
      }

      // 📬 delivery
      switch (type) {
        case NotificationType.BUDGET_EXCEEDED:
          await sendBudgetExceededNotification(payload);
          break;

        case NotificationType.MONTHLY_SUMMARY_READY:
          await sendMonthlySummaryNotification(payload);
          break;

        default:
          console.warn("⚠️ Unknown notification type", job.data);
      }
    },
    {
      connection: bullConnection,
      concurrency: 5,
    }
  );
};
