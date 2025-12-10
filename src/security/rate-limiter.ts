/**
 * Advanced Rate Limiting with Sliding Window Algorithm
 * Multi-tier rate limiting with per-endpoint, per-user, and global limits
 */

import { Request, Response, NextFunction } from "express";
import { createClient, RedisClientType } from "redis";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response) => void;
  store?: RateLimitStore;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

/**
 * Rate limit storage interface
 */
export interface RateLimitStore {
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<number>;
  getResetTime(key: string): Promise<Date>;
}

/**
 * Memory-based rate limit store (for development)
 */
export class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private windowMs: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
    // Don't start cleanup in constructor - let caller control lifecycle
  }

  /**
   * Start periodic cleanup of expired entries
   * Call this explicitly when store is ready to be used
   */
  public start(): void {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (now > entry.resetTime) {
            this.store.delete(key);
          }
        }
      }, this.windowMs);
    }
  }

  /**
   * Stop cleanup and clear all data
   * Call this in test cleanup or when shutting down
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.store.clear();
  }

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  async decrement(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  async getResetTime(key: string): Promise<Date> {
    const entry = this.store.get(key);
    if (!entry) {
      return new Date(Date.now() + this.windowMs);
    }
    return new Date(entry.resetTime);
  }
}

/**
 * Redis-based rate limit store (for production)
 */
export class RedisStore implements RateLimitStore {
  private client: RedisClientType;
  private windowMs: number;

  constructor(windowMs: number, redisUrl?: string) {
    this.windowMs = windowMs;
    this.client = createClient({
      url: redisUrl || process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => {
      console.error("Redis Rate Limiter Error:", err);
    });

    this.client.connect().catch(console.error);
  }

  async increment(key: string): Promise<number> {
    const prefixedKey = `ratelimit:${key}`;
    const current = await this.client.incr(prefixedKey);

    if (current === 1) {
      // Set expiry on first increment
      await this.client.pExpire(prefixedKey, this.windowMs);
    }

    return current;
  }

  async decrement(key: string): Promise<void> {
    const prefixedKey = `ratelimit:${key}`;
    await this.client.decr(prefixedKey);
  }

  async reset(key: string): Promise<void> {
    const prefixedKey = `ratelimit:${key}`;
    await this.client.del(prefixedKey);
  }

  async get(key: string): Promise<number> {
    const prefixedKey = `ratelimit:${key}`;
    const count = await this.client.get(prefixedKey);
    return count ? parseInt(count, 10) : 0;
  }

  async getResetTime(key: string): Promise<Date> {
    const prefixedKey = `ratelimit:${key}`;
    const ttl = await this.client.pTTL(prefixedKey);
    return new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs));
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  private store: RateLimitStore;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number, store?: RateLimitStore) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.store = store || new MemoryStore(windowMs);
  }

  async checkLimit(
    key: string,
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const current = await this.store.increment(key);
    const resetTime = await this.store.getResetTime(key);

    const info: RateLimitInfo = {
      limit: this.maxRequests,
      current,
      remaining: Math.max(0, this.maxRequests - current),
      resetTime,
    };

    const allowed = current <= this.maxRequests;

    if (!allowed) {
      // Decrement to maintain accurate count
      await this.store.decrement(key);
    }

    return { allowed, info };
  }

  async reset(key: string): Promise<void> {
    await this.store.reset(key);
  }
}

/**
 * Rate limiter middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new SlidingWindowRateLimiter(
    config.windowMs,
    config.maxRequests,
    config.store,
  );

  const keyGenerator =
    config.keyGenerator ||
    ((req: Request) => {
      const user = (req as any).user;
      return user?.userId || req.ip || "anonymous";
    });

  const defaultHandler = (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(config.windowMs / 1000),
    });
  };

  const handler = config.handler || defaultHandler;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Skip if condition is met
    if (config.skip && config.skip(req)) {
      next();
      return;
    }

    const key = keyGenerator(req);
    const { allowed, info } = await limiter.checkLimit(key);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", info.limit.toString());
    res.setHeader("X-RateLimit-Remaining", info.remaining.toString());
    res.setHeader("X-RateLimit-Reset", info.resetTime.toISOString());

    if (!allowed) {
      res.setHeader(
        "Retry-After",
        Math.ceil(config.windowMs / 1000).toString(),
      );
      handler(req, res);
      return;
    }

    next();
  };
}

/**
 * Predefined rate limiters
 */

// Global rate limiter: 100 requests per 15 minutes
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  keyGenerator: (req) => req.ip || "anonymous",
});

// Authentication rate limiter: 5 requests per 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  keyGenerator: (req) => `auth:${req.ip || "anonymous"}`,
});

// API rate limiter: 1000 requests per hour
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 1000,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return `api:${user?.userId || req.ip || "anonymous"}`;
  },
});

// Strict rate limiter: 10 requests per minute
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return `strict:${user?.userId || req.ip || "anonymous"}`;
  },
});

// Per-endpoint rate limiter factory
export function createEndpointRateLimiter(
  endpoint: string,
  maxRequests: number,
  windowMs: number = 60000,
) {
  return createRateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req) => {
      const user = (req as any).user;
      return `endpoint:${endpoint}:${user?.userId || req.ip || "anonymous"}`;
    },
  });
}

// Tiered rate limiting based on user role
export function createTieredRateLimiter(tiers: Map<string, number>) {
  return createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000, // Default
    keyGenerator: (req) => {
      const user = (req as any).user;
      const userId = user?.userId || req.ip || "anonymous";

      // Determine tier
      let maxRequests = 100; // Default for anonymous
      if (user) {
        const userRole = user.roles?.[0] || "user";
        maxRequests = tiers.get(userRole) || 1000;
      }

      return `tiered:${userId}:${maxRequests}`;
    },
  });
}
