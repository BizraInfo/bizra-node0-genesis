/**
 * Cache Middleware
 * Redis-based response caching
 */

import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.config";
import { config } from "../config/app.config";
import { logger } from "../middleware/logger";
import crypto from "crypto";

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  shouldCache?: (req: Request, res: Response) => boolean;
  invalidateOn?: string[];
}

/**
 * Create cache middleware
 */
export const createCacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = config.cache.ttl.default,
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
    invalidateOn = [],
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      next();
      return;
    }

    const key = keyGenerator(req);

    try {
      // Try to get from cache
      const cached = await redis.get(key);

      if (cached) {
        logger.debug("Cache hit", { key });

        // Parse cached response
        const { statusCode, headers, body } = JSON.parse(cached);

        // Set headers
        Object.entries(headers).forEach(([name, value]) => {
          res.setHeader(name, value as string);
        });

        // Add cache header
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", key);

        res.status(statusCode).send(body);
        return;
      }

      // Cache miss
      logger.debug("Cache miss", { key });
      res.setHeader("X-Cache", "MISS");

      // Capture response
      const originalSend = res.send;
      res.send = function (data: any): Response {
        // Check if we should cache this response
        if (shouldCache(req, res)) {
          const cacheData = {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: data,
          };

          // Store in cache
          redis.set(key, JSON.stringify(cacheData), ttl).catch((error) => {
            logger.error("Failed to cache response", { error, key });
          });

          logger.debug("Response cached", {
            key,
            ttl,
            statusCode: res.statusCode,
          });
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error", { error, key });
      // Fail open - continue without cache
      next();
    }
  };
};

/**
 * Default cache key generator
 */
const defaultKeyGenerator = (req: Request): string => {
  const userId = (req as any).user?.userId || "anonymous";
  const url = req.originalUrl || req.url;
  const hash = crypto.createHash("md5").update(url).digest("hex");
  return `cache:${userId}:${hash}`;
};

/**
 * Default should cache function
 */
const defaultShouldCache = (req: Request, res: Response): boolean => {
  // Only cache successful responses
  return res.statusCode >= 200 && res.statusCode < 300;
};

/**
 * User profile cache
 */
export const userProfileCache = createCacheMiddleware({
  ttl: config.cache.ttl.auth,
  keyGenerator: (req: Request) => {
    const userId = req.params.userId || (req as any).user?.userId;
    return `cache:user:profile:${userId}`;
  },
});

/**
 * Validation cache
 */
export const validationCache = createCacheMiddleware({
  ttl: 3600, // 1 hour
  keyGenerator: (req: Request) => {
    const { txHash, blockNumber, address } = req.body || {};
    const identifier = txHash || blockNumber || address || "unknown";
    return `cache:validation:${identifier}`;
  },
});

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = async (pattern: string): Promise<number> => {
  try {
    const deleted = await redis.delPattern(`cache:${pattern}`);
    logger.info("Cache invalidated", { pattern, deleted });
    return deleted;
  } catch (error) {
    logger.error("Failed to invalidate cache", { error, pattern });
    return 0;
  }
};

/**
 * Invalidate user cache
 */
export const invalidateUserCache = async (userId: string): Promise<void> => {
  await invalidateCache(`user:*:${userId}`);
  await invalidateCache(`*:${userId}:*`);
};

/**
 * Cache invalidation middleware
 */
export const cacheInvalidationMiddleware = (pattern: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Capture response completion
    const originalSend = res.send;
    res.send = function (data: any): Response {
      // Only invalidate on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(pattern).catch((error) => {
          logger.error("Failed to invalidate cache", { error, pattern });
        });
      }
      return originalSend.call(this, data);
    };

    next();
  };
};
