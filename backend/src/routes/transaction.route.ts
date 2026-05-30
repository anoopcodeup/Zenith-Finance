import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createTransactionSchema,
  accountIdParamSchema,
  transactionIdParamSchema,
  listTransactionsQuerySchema
} from "../validators/transaction.schema";
import {
  createTransactionHandler,
  listAccountTransactionsHandler, deleteTransactionHandler,
  getAccountBalanceHandler
} from "../controllers/transaction.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createTransactionSchema),
  createTransactionHandler
);

router.get(
  "/accounts/:accountId/history",
  authenticate,
  validate(accountIdParamSchema, "params"),
  validate(listTransactionsQuerySchema, "query"),
  listAccountTransactionsHandler
);

router.delete(
  "/:transactionId",
  authenticate,
  validate(transactionIdParamSchema, "params"),
  deleteTransactionHandler
);

router.get(
  "/accounts/:accountId/balance",
  authenticate,
  validate(accountIdParamSchema, "params"),
  getAccountBalanceHandler
);

export default router;
