import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { redis } from "../config/redis";

type RateLimitConfig = {
    windowMs: number;
    max: number;
    keyPrefix?: string;
    keyGenerator?: (req: Request) => string;
};

/**
 * Redis-based Sliding Window (Simple Counter) Rate Limiter
 */
export const rateLimit = (config: RateLimitConfig) => {
    const { windowMs, max, keyPrefix = "rl", keyGenerator } = config;

    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id = keyGenerator?.(req) ?? req.user?.id ?? req.ip;
            const key = `${keyPrefix}:${id}`;

            // Atomic increment
            const current = await redis.incr(key);

            // Set TTL only on the first request in the window
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }

            if (current > max) {
                throw new HttpError("Too many requests, please try again later.", 429);
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Pre-configured rate limits
 */

// Public routes: 10 requests per minute
export const publicRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: "rl:public",
});

// Authenticated routes: 60 requests per minute
export const authRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyPrefix: "rl:auth",
});

// Internal routes: 100 requests per minute
export const internalRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyPrefix: "rl:internal",
});
