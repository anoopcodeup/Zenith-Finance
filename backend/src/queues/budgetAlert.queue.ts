import { Queue } from "bullmq";
import { bullConnection } from "../config/bullmq";

export const BUDGET_ALERT_QUEUE = "budget-alert";

export const budgetAlertQueue = new Queue(
  BUDGET_ALERT_QUEUE,
  { connection: bullConnection, 
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
    }
  }
);

export const addBudgetAlertJob = async (data: {
  userId: string;
  month: string;
}) => {
  await budgetAlertQueue.add(
    "check",
    data,
    {
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};
