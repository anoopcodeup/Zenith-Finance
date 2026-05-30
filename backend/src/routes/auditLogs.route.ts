import { Router } from "express";
import { internalAuth } from "../middlewares/internalAuth.middleware";
import { internalRateLimit } from "../middlewares/rateLimit.middleware";
import { listAuditLogsController } from "../controllers/auditLog.controller";

const router = Router();

router.get(
    "/audit-logs",
    internalAuth,
    internalRateLimit,
    listAuditLogsController
);

export default router;
