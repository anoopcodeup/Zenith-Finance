import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { transferSchema, listTransfersQuerySchema } from "../validators/transfer.schema";
import { transferHandler, listTransferHistoryHandler } from "../controllers/transfer.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(transferSchema),
  transferHandler
);

router.get(
  "/",
  authenticate,
  validate(listTransfersQuerySchema, "query"),
  listTransferHistoryHandler
);


export default router;
