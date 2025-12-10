/**
 * Rate Limiter Middleware
 * Redis-based distributed rate limiting
 */

import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.config";
import { config } from "../config/app.config";
import { RateLimitError } from "../types";
import { logger } from "../middleware/logger";

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    handler = defaultHandler,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const key = keyGenerator(req);
    const windowSeconds = Math.floor(windowMs / 1000);

    try {
      // Increment counter
      const current = await redis.incrWithExpiry(key, windowSeconds);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - current),
      );
      res.setHeader("X-RateLimit-Reset", Date.now() + windowMs);

      // Check if limit exceeded
      if (current > maxRequests) {
        logger.warn("Rate limit exceeded", {
          key,
          current,
          limit: maxRequests,
          ip: req.ip,
        });

        const retryAfter = await redis.ttl(key);
        res.setHeader("Retry-After", retryAfter);

        handler(req, res);
        return;
      }

      // Track successful/failed requests
      const originalSend = res.send;
      res.send = function (data: any): Response {
        const statusCode = res.statusCode;

        // Decrement counter if we should skip this response
        if (
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          redis.incr(key).then((val) => {
            if (val > 0) {
              // Decrement
              redis.getClient().decr(key);
            }
          });
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error("Rate limiter error", { error, key });
      // Fail open - allow request if Redis is down
      next();
    }
  };
};

/**
 * Default key generator (IP + endpoint)
 */
const defaultKeyGenerator = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const endpoint = req.path;
  return `ratelimit:${ip}:${endpoint}`;
};

/**
 * Default rate limit exceeded handler
 */
const defaultHandler = (req: Request, res: Response): void => {
  const error = new RateLimitError();
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  });
};

/**
 * User-based rate limiter
 */
export const createUserRateLimiter = (options: RateLimitOptions = {}) => {
  return createRateLimiter({
    ...options,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.userId || "anonymous";
      const endpoint = req.path;
      return `ratelimit:user:${userId}:${endpoint}`;
    },
  });
};

/**
 * Global rate limiter
 */
export const createGlobalRateLimiter = (options: RateLimitOptions = {}) => {
  return createRateLimiter({
    ...options,
    keyGenerator: (req: Request) => {
      return `ratelimit:global:${req.path}`;
    },
  });
};

/**
 * Stricter rate limit for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req: Request) => {
    const ip = req.ip || "unknown";
    return `ratelimit:auth:${ip}`;
  },
});

/**
 * Standard API rate limiter
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  maxRequests: config.rateLimit.maxRequests,
});

/**
 * Lenient rate limiter for public endpoints
 */
export const publicRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 300, // 300 requests per minute
});
