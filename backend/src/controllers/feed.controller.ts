import { Request, Response, NextFunction } from "express";
import { listUnifiedFeed } from "../services/feed.service";
import { prisma } from "../config/prisma";
import { ListFeedQueryInput } from "../validators/feed.schema";

/**
 * GET /feed
 * Unified feed endpoint (transactions + transfers)
 */
export async function listFeedHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Zod middleware already validated + transformed this
    const input = req.query as unknown as ListFeedQueryInput;
    const userId = req.user.id;
    // 2. Execute feed service
    const result = await listUnifiedFeed(prisma, input, userId);

    // 3. Stable public response shape
    res.status(200).json({
      items: result.items,
      nextCursor: result.nextCursor ?? null,
    });
  } catch (err) {
    next(err);
  }
}
