import { Queue } from "bullmq";
import { bullConnection } from "../config/bullmq";

export const NOTIFICATION_QUEUE = "notification";

export const notificationQueue = new Queue(
  NOTIFICATION_QUEUE,
  {
    connection: bullConnection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
    },
  }
);
