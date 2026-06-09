import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./config/prisma";
import authRoutes from "./routes/auth.route";
import accountRoutes from "./routes/account.route";
import transactionRoutes from "./routes/transaction.route";
import transferRoutes from "./routes/transfer.route";
import feedRoutes from "./routes/feed.route";
import reportingRoutes from "./routes/reporting.route";
import budgetRoutes from "./routes/budget.route";
import recurringRoutes from "./routes/recurringTransaction.route";
import { authRateLimit } from "./middlewares/rateLimit.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { authenticate } from "./middlewares/auth.middleware";

const app = express();

// CORS — allow Next.js frontend with credentials
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(cookieParser());

// routes
app.use("/auth", authRoutes);
app.use("/accounts", authRateLimit, accountRoutes);
app.use("/transactions", authRateLimit, transactionRoutes);
app.use("/transfers", authRateLimit, transferRoutes);
app.use("/feed", authRateLimit, feedRoutes);
app.use("/reports", authRateLimit, reportingRoutes);
app.use("/budgets", budgetRoutes);
app.use("/recurring-transactions", recurringRoutes);

app.get("/categories", authenticate, authRateLimit, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: req.user.id },
        ],
      },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});



// health check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// internal API
// 🧪 How Ops Use It: curl \
//   -H "X-Internal-Token: super-secret-token" \
//   https://api.yourapp.com/internal/audit-logs
import auditLogsRoutes from "./routes/auditLogs.route";
app.use("/internal", auditLogsRoutes);



// global error handler (must be last)
app.use(errorHandler);

export default app;
