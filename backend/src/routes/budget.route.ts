import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authRateLimit } from "../middlewares/rateLimit.middleware";
import {
  upsertBudgetSchema,
  listBudgetsQuerySchema,
  budgetIdParamSchema,
} from "../validators/budget.schema";
import {
  upsertBudget,
  getBudgets,
  getBudgetById,
  deleteBudget,
} from "../controllers/budget.controller";

const router = Router();

// Apply auth rate limit and authenticate globally on this router
router.use(authenticate, authRateLimit);

router.post("/", validate(upsertBudgetSchema), upsertBudget);
router.get("/", validate(listBudgetsQuerySchema, "query"), getBudgets);
router.get("/:budgetId", validate(budgetIdParamSchema, "params"), getBudgetById);
router.delete("/:budgetId", validate(budgetIdParamSchema, "params"), deleteBudget);

export default router;
