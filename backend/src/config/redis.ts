import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("✅ Redis connected (app)");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});
