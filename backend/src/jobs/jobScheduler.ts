import cron from "node-cron";
import { prisma } from "../config/prisma";
import { addMonthlyAggregationJob } from "../queues/monthlyAggregation.queue";
import { startBudgetAlertWorker } from "../workers/budgetAlert.worker";
import { startMonthlyAggregationWorker } from "../workers/monthlyAggregation.worker";
import { startNotificationWorker } from "../workers/notification.worker";

export const startJobSchedulers = () => {
  // Start workers
  startBudgetAlertWorker();
  startMonthlyAggregationWorker();
  startNotificationWorker();

  // Monthly job scheduler - Runs at 00:05 on the 1st of every month
  cron.schedule("5 0 1 * *", async () => {
    console.log("🕒 Running monthly jobs scheduler");

    const month = getPreviousMonth();

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    for (const user of users) {
      // Monthly summary aggregation
      await addMonthlyAggregationJob({
        userId: user.id,
        month,
      });
    }
  });
};

const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
