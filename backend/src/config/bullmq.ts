import IORedis from "ioredis";

export const bullConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // REQUIRED by BullMQ
  enableReadyCheck: false,    // recommended for managed Redis
  
});

// ⚠️ Important
// This is NOT the same client you use for caching