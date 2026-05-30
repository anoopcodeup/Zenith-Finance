import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import crypto from "crypto";

export const internalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.header("X-Internal-Token");

  if (!token) {
    throw new HttpError("Unauthorized", 401);
  }

  const expected = process.env.INTERNAL_API_TOKEN;

  if (!expected) {
    throw new Error("INTERNAL_API_TOKEN not configured");
  }

  // constant-time comparison
  const isValid =
    token.length === expected.length &&
    crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expected)
    );

  if (!isValid) {
    throw new HttpError("Unauthorized", 401);
  }

  next();
};
