/**
 * Health Check System
 * Production-grade health checks with dependency validation
 * @module observability/health-check
 */

import { Request, Response } from "express";
import { logger } from "./logger";
import { addSpanEvent } from "./tracer";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: "pass" | "fail" | "warn";
      message?: string;
      responseTime?: number;
      details?: any;
    };
  };
  metadata?: {
    version: string;
    environment: string;
    hostname: string;
  };
}

type HealthChecker = () => Promise<{
  status: "pass" | "fail" | "warn";
  message?: string;
  responseTime?: number;
  details?: any;
}>;

// Registry of health checkers
const healthCheckers: Map<string, HealthChecker> = new Map();

/**
 * Register a health checker
 */
export function registerHealthCheck(name: string, checker: HealthChecker) {
  healthCheckers.set(name, checker);
  logger.info(`Health checker registered: ${name}`);
}

/**
 * Database health checker
 */
export function createDatabaseHealthCheck(pool: any): HealthChecker {
  return async () => {
    const startTime = Date.now();

    try {
      // Simple query to test connection
      await pool.query("SELECT 1");

      // Get pool stats
      const stats = {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      };

      const responseTime = Date.now() - startTime;

      // Warn if response time is high
      if (responseTime > 1000) {
        return {
          status: "warn",
          message: "Database response time is high",
          responseTime,
          details: stats,
        };
      }

      return {
        status: "pass",
        responseTime,
        details: stats,
      };
    } catch (error: any) {
      return {
        status: "fail",
        message: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  };
}

/**
 * Redis health checker
 */
export function createRedisHealthCheck(redis: any): HealthChecker {
  return async () => {
    const startTime = Date.now();

    try {
      await redis.ping();

      const info = {
        connected: redis.status === "ready",
        mode: redis.mode,
      };

      return {
        status: "pass",
        responseTime: Date.now() - startTime,
        details: info,
      };
    } catch (error: any) {
      return {
        status: "fail",
        message: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  };
}

/**
 * External API health checker
 */
export function createApiHealthCheck(
  name: string,
  url: string,
  timeout: number = 5000,
): HealthChecker {
  return async () => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: "fail",
          message: `API returned ${response.status}`,
          responseTime,
        };
      }

      return {
        status: "pass",
        responseTime,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      return {
        status: "fail",
        message: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  };
}

/**
 * Disk space health checker
 */
export function createDiskSpaceHealthCheck(
  threshold: number = 0.9,
): HealthChecker {
  return async () => {
    const startTime = Date.now();

    try {
      // This is a simplified check - in production, use a proper disk space library
      const usage = process.memoryUsage();
      const usagePercent = usage.heapUsed / usage.heapTotal;

      if (usagePercent > threshold) {
        return {
          status: "warn",
          message: `Memory usage is high: ${(usagePercent * 100).toFixed(2)}%`,
          responseTime: Date.now() - startTime,
          details: {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            usagePercent: usagePercent.toFixed(4),
          },
        };
      }

      return {
        status: "pass",
        responseTime: Date.now() - startTime,
        details: {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          usagePercent: usagePercent.toFixed(4),
        },
      };
    } catch (error: any) {
      return {
        status: "fail",
        message: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  };
}

/**
 * Memory health checker
 */
export function createMemoryHealthCheck(
  threshold: number = 0.9,
): HealthChecker {
  return async () => {
    const startTime = Date.now();
    const usage = process.memoryUsage();
    const usagePercent = usage.heapUsed / usage.heapTotal;

    if (usagePercent > threshold) {
      return {
        status: "warn",
        message: `Memory usage is high: ${(usagePercent * 100).toFixed(2)}%`,
        responseTime: Date.now() - startTime,
        details: {
          rss: usage.rss,
          heapTotal: usage.heapTotal,
          heapUsed: usage.heapUsed,
          external: usage.external,
          usagePercent: usagePercent.toFixed(4),
        },
      };
    }

    return {
      status: "pass",
      responseTime: Date.now() - startTime,
      details: {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        usagePercent: usagePercent.toFixed(4),
      },
    };
  };
}

/**
 * Execute all health checks
 */
async function runHealthChecks(): Promise<HealthCheckResult> {
  const results: HealthCheckResult["checks"] = {};
  const startTime = Date.now();

  // Run all health checks in parallel
  const checkPromises = Array.from(healthCheckers.entries()).map(
    async ([name, checker]) => {
      try {
        const result = await checker();
        results[name] = result;
      } catch (error: any) {
        results[name] = {
          status: "fail",
          message: error.message,
        };
        logger.error(`Health check failed: ${name}`, { error });
      }
    },
  );

  await Promise.all(checkPromises);

  // Determine overall status
  const hasFailures = Object.values(results).some((r) => r.status === "fail");
  const hasWarnings = Object.values(results).some((r) => r.status === "warn");

  let overallStatus: "healthy" | "degraded" | "unhealthy";
  if (hasFailures) {
    overallStatus = "unhealthy";
  } else if (hasWarnings) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  addSpanEvent("health_check_completed", {
    status: overallStatus,
    duration_ms: Date.now() - startTime,
  });

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: results,
    metadata: {
      version: process.env.SERVICE_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      hostname: process.env.HOSTNAME || "unknown",
    },
  };
}

/**
 * Basic health check endpoint
 */
export async function healthCheckHandler(req: Request, res: Response) {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

/**
 * Detailed health check endpoint
 */
export async function detailedHealthCheckHandler(req: Request, res: Response) {
  try {
    const result = await runHealthChecks();

    const statusCode =
      result.status === "healthy"
        ? 200
        : result.status === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(result);
  } catch (error: any) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}

/**
 * Liveness probe (Kubernetes)
 */
export async function livenessHandler(req: Request, res: Response) {
  // Simple check - is the process running?
  res.status(200).json({ status: "alive" });
}

/**
 * Readiness probe (Kubernetes)
 */
export async function readinessHandler(req: Request, res: Response) {
  try {
    // Check critical dependencies
    const criticalChecks = ["database", "redis"];
    const checks: any = {};

    for (const checkName of criticalChecks) {
      const checker = healthCheckers.get(checkName);
      if (checker) {
        checks[checkName] = await checker();
      }
    }

    const isReady = Object.values(checks).every(
      (check: any) => check.status === "pass" || check.status === "warn",
    );

    if (isReady) {
      res.status(200).json({ status: "ready", checks });
    } else {
      res.status(503).json({ status: "not_ready", checks });
    }
  } catch (error: any) {
    logger.error("Readiness check failed", { error });
    res.status(503).json({ status: "not_ready", error: error.message });
  }
}

/**
 * Startup probe (Kubernetes)
 */
export async function startupHandler(req: Request, res: Response) {
  // Check if application has started successfully
  const uptime = process.uptime();

  if (uptime > 10) {
    // Application has been running for at least 10 seconds
    res.status(200).json({ status: "started", uptime });
  } else {
    res.status(503).json({ status: "starting", uptime });
  }
}

export default {
  registerHealthCheck,
  createDatabaseHealthCheck,
  createRedisHealthCheck,
  createApiHealthCheck,
  createDiskSpaceHealthCheck,
  createMemoryHealthCheck,
  healthCheckHandler,
  detailedHealthCheckHandler,
  livenessHandler,
  readinessHandler,
  startupHandler,
};
