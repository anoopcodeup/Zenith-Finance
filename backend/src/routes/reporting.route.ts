import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  monthlySummaryQuerySchema,
  categoryBreakdownQuerySchema,
} from "../validators/reporting.schema";
import {
  getMonthlySummaryController,
  getCategoryBreakdownController,
} from "../controllers/reporting.controller";

const router = Router();
//GET /reports/monthly-summary?month=2025-01
router.get(
  "/monthly-summary",
  authenticate,
  validate(monthlySummaryQuerySchema),
  getMonthlySummaryController
);

//GET /reports/category-breakdown?month=2025-01&type=EXPENSE
router.get(
  "/category-breakdown",
  authenticate,
  validate(categoryBreakdownQuerySchema),
  getCategoryBreakdownController
);

export default router;
