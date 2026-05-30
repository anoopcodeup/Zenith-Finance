import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createAccountSchema,
} from "../validators/account.schema";
import {
  createAccount,
  getAccounts,
  getAccountById,
  deleteAccount,
} from "../controllers/account.controller";

const router = Router();

// All account routes require authentication
router.use(authenticate);

// Create account
router.post(
  "/",
  validate(createAccountSchema),
  createAccount
);

// List all accounts for logged-in user
router.get("/", getAccounts);

// Get single account
router.get(
  "/:accountId",
  getAccountById
);

// Soft delete account
router.delete(
  "/:accountId",
  deleteAccount
);

export default router;
