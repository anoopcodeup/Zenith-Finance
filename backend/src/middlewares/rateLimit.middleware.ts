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
 * Atomic Lua Script for Rate Limiting
 * KEYS[1] = The Redis key tracking the user
 * ARGV[1] = The window size in milliseconds (TTL)
 * * Logic: Increments the counter. If it's a brand new key (value becomes 1),
 * it instantly attaches the millisecond TTL. Returns the updated counter.
 */
const RATE_LIMIT_LUA = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
        redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    return current
`;

/**
 * Redis-based Atomic Sliding Window Rate Limiter
 */
export const rateLimit = (config: RateLimitConfig) => {
    const { windowMs, max, keyPrefix = "rl", keyGenerator } = config;

    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id = keyGenerator?.(req) ?? req.user?.id ?? req.ip;
            const key = `${keyPrefix}:${id}`;

            // Execute Lua script atomically on the Redis server
            // We cast to number because Redis returns integer replies as numbers in ioredis
            const current = await redis.eval(
                RATE_LIMIT_LUA, 
                1,              // Number of keys being passed
                key,            // KEYS[1]
                windowMs        // ARGV[1]
            ) as number;

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