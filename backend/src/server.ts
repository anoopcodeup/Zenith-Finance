import app from "./app";
import { startJobSchedulers } from "./jobs/jobScheduler";
import { redis } from "./config/redis";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    
    // 🔌 Verify Redis connection
    const pong = await redis.ping();
    console.log(`✅ Redis connected, ping response: ${pong}`);



    // 🔥 Start cron / repeatable jobs ONCE at boot
    startJobSchedulers();
    console.log("🕒 Job schedulers initialized");



    // 🚀 Start HTTP server
    app.listen(PORT, () => {
      console.log(`🌐 Server running at http://localhost:${PORT}`);
    });


  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
}

// Execute bootstrap
bootstrap();
