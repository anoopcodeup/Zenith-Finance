import { redis } from "../config/redis";

/**
 * Returns true if notification was already sent
 * Otherwise marks it as sent
 */
export const checkAndMarkNotification = async (
  key: string,
  ttlSeconds: number
): Promise<boolean> => {
  const alreadySent = await redis.get(key);
  if (alreadySent) return true;

  await redis.set(key, "1", "EX", ttlSeconds);
  return false;
};

// TTL rules:
// Monthly summary → 45 days
// Budget exceeded → end of month (+ buffer)



/**
 * Ensures a notification is sent only once within a TTL window
 * Returns true if this notification is allowed to be sent
 */
export const acquireNotificationIdempotency = async (params: {
  key: string;
  ttlSeconds: number;
}) => {
  const result = await redis.call(
    "SET",
    params.key,
    "1",
    "NX",
    "EX",
    params.ttlSeconds
  );

  return result === "OK";
};
