/**
 * Redis Configuration
 * Connection and caching utilities
 */

import Redis, { RedisOptions } from "ioredis";
import { config } from "./app.config";
import { logger } from "../middleware/logger";

class RedisConnection {
  private client: Redis | null = null;
  private isConnected = false;

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn("Redis already connected");
      return;
    }

    try {
      const redisOptions: RedisOptions = {
        // Parse Redis URL
        ...(config.redis.url.startsWith("redis://") ||
        config.redis.url.startsWith("rediss://")
          ? {}
          : { host: config.redis.url }),
        password: config.redis.password,
        db: config.redis.db,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
      };

      this.client = new Redis(config.redis.url, redisOptions);

      // Event handlers
      this.client.on("connect", () => {
        logger.info("Redis connecting...");
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        logger.info("Redis connected successfully", {
          db: config.redis.db,
        });
      });

      this.client.on("error", (err) => {
        logger.error("Redis error", { error: err.message });
      });

      this.client.on("close", () => {
        this.isConnected = false;
        logger.warn("Redis connection closed");
      });

      this.client.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });

      // Wait for ready state
      await new Promise<void>((resolve, reject) => {
        this.client!.once("ready", () => resolve());
        this.client!.once("error", (err) => reject(err));
      });
    } catch (error) {
      logger.error("Redis connection failed", { error });
      throw new Error(
        `Failed to connect to Redis: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Redis client
   */
  getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis not connected. Call connect() first.");
    }
    return this.client;
  }

  /**
   * Set a key with optional TTL
   */
  async set(key: string, value: string | object, ttl?: number): Promise<void> {
    const client = this.getClient();
    const serializedValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (ttl) {
      await client.setex(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  }

  /**
   * Get a key value
   */
  async get<T = string>(key: string, parse = false): Promise<T | null> {
    const client = this.getClient();
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    if (parse) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    }

    return value as T;
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const client = this.getClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    return await client.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  /**
   * Set expiry on existing key
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = this.getClient();
    await client.expire(key, seconds);
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    const client = this.getClient();
    return await client.ttl(key);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    const client = this.getClient();
    return await client.incr(key);
  }

  /**
   * Increment counter with expiry
   */
  async incrWithExpiry(key: string, ttl: number): Promise<number> {
    const client = this.getClient();
    const value = await client.incr(key);

    // Set expiry only on first increment
    if (value === 1) {
      await client.expire(key, ttl);
    }

    return value;
  }

  /**
   * Cache with automatic serialization
   */
  async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = config.cache.ttl.default,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, true);
    if (cached !== null) {
      logger.debug("Cache hit", { key });
      return cached;
    }

    // Cache miss - fetch data
    logger.debug("Cache miss", { key });
    const data = await fetcher();

    // Store in cache
    await this.set(key, data, ttl);

    return data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("Redis health check failed", { error });
      return false;
    }
  }

  /**
   * Get Redis info
   */
  async getInfo(): Promise<string> {
    const client = this.getClient();
    return await client.info();
  }

  /**
   * Flush database (use with caution!)
   */
  async flush(): Promise<void> {
    if (config.app.isProduction) {
      throw new Error("Cannot flush Redis in production");
    }

    const client = this.getClient();
    await client.flushdb();
    logger.warn("Redis database flushed");
  }

  /**
   * Gracefully close Redis connection
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis disconnected successfully");
    } catch (error) {
      logger.error("Error disconnecting Redis", { error });
      throw error;
    }
  }
}

// Export singleton instance
export const redis = new RedisConnection();

// Cache key builders
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  session: (sessionId: string) => `session:${sessionId}`,
  refreshToken: (token: string) => `refresh:${token}`,
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  validation: (txHash: string) => `validation:${txHash}`,
  oauth: (provider: string, state: string) => `oauth:${provider}:${state}`,
};
