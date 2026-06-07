import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authRateLimit } from "../middlewares/rateLimit.middleware";
import {
  createRecurringSchema,
  updateRecurringSchema,
  recurringIdParamSchema,
} from "../validators/recurringTransaction.schema";
import {
  createRecurring,
  listRecurring,
  getRecurringById,
  updateRecurring,
  pauseRecurring,
  resumeRecurring,
  deleteRecurring,
} from "../controllers/recurringTransaction.controller";

const router = Router();

// Apply auth rate limit and authenticate globally on this router
router.use(authenticate, authRateLimit);

router.post("/", validate(createRecurringSchema), createRecurring);
router.get("/", listRecurring);
router.get("/:id", validate(recurringIdParamSchema, "params"), getRecurringById);
router.patch("/:id", validate(recurringIdParamSchema, "params"), validate(updateRecurringSchema), updateRecurring);
router.patch("/:id/pause", validate(recurringIdParamSchema, "params"), pauseRecurring);
router.patch("/:id/resume", validate(recurringIdParamSchema, "params"), resumeRecurring);
router.delete("/:id", validate(recurringIdParamSchema, "params"), deleteRecurring);

export default router;
