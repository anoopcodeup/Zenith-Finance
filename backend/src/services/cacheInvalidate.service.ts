import { redis } from "../config/redis";

/**
 * Invalidates all reporting cache for a given user + month
 */
export const invalidateReportingCache = async (
  userId: string,
  createdAt: Date
) => {
  const month = createdAt.toISOString().slice(0, 7); // YYYY-MM
  const pattern = `report:*:${userId}:${month}*`;

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
};
