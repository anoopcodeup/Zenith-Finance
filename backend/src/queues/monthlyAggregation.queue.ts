import { Queue } from "bullmq";
import { bullConnection } from "../config/bullmq";

export const MONTHLY_AGGREGATION_QUEUE = "monthly-aggregation";

export const monthlyAggregationQueue = new Queue(
  MONTHLY_AGGREGATION_QUEUE,
  { connection: bullConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  }
);

export const addMonthlyAggregationJob = async (data: {
  userId: string;
  month: string;
}) => {
  await monthlyAggregationQueue.add(
    "aggregate",
    data,
    {
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};
