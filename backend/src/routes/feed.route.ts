import { Router } from "express";
import { listFeedHandler } from "../controllers/feed.controller";
import { validate } from "../middlewares/validate.middleware";
import { listFeedQuerySchema } from "../validators/feed.schema";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  validate(listFeedQuerySchema, "query"),
  listFeedHandler
);

export default router;
