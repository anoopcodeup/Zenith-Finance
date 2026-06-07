import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { HttpError } from "../utils/httpError";

/**
 * Set CSRF Token Cookie
 */
export function setCsrfCookie(res: Response): string {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false, // Must be readable by client JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return csrfToken;
}

/**
 * Clear CSRF Token Cookie
 */
export function clearCsrfCookie(res: Response) {
  res.clearCookie("csrfToken", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

/**
 * Validate CSRF Token Middleware
 */
export const validateCsrf = (req: Request, _res: Response, next: NextFunction) => {
  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new HttpError("Invalid or missing CSRF token", 403);
  }
  next();
};
