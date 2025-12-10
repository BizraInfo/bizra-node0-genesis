/**
 * ENTERPRISE-GRADE Performance Health Check Endpoints
 *
 * Comprehensive health check system:
 * - /health/performance - Overall system health
 * - /metrics/database - DB pool metrics
 * - /metrics/cache - Cache performance
 * - /metrics/circuit-breaker - CB status
 * - /metrics - Prometheus metrics endpoint
 */

import { Request, Response } from "express";
import { performanceMetrics } from "../monitoring/performance-metrics.service";
import { dbPoolMonitor } from "../monitoring/db-pool-monitor";
import { cacheMonitor } from "../monitoring/cache-monitor";
import { circuitBreakerMonitor } from "../monitoring/circuit-breaker-monitor";
import { prometheusExporter } from "../monitoring/prometheus-exporter";

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "critical";
  timestamp: number;
  uptime: number;
  version: string;
  checks: {
    database?: HealthCheck;
    cache?: HealthCheck;
    circuitBreaker?: HealthCheck;
    memory?: HealthCheck;
  };
  metrics?: {
    latency?: any;
    throughput?: any;
    cache?: any;
    database?: any;
  };
}

interface HealthCheck {
  status: "pass" | "warn" | "fail";
  message?: string;
  details?: any;
}

/**
 * Overall performance health endpoint
 * GET /health/performance
 */
export async function performanceHealthCheck(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const detailed = req.query.detailed === "true";
    const includeMetrics = req.query.metrics === "true";

    // Check database pool health
    const dbHealth = dbPoolMonitor.assessHealth();
    const dbCheck: HealthCheck = {
      status:
        dbHealth.status === "healthy"
          ? "pass"
          : dbHealth.status === "degraded"
            ? "warn"
            : "fail",
      message:
        dbHealth.issues.length > 0
          ? dbHealth.issues.join(", ")
          : "Database pool healthy",
      details: detailed
        ? {
            score: dbHealth.score,
            metrics: dbHealth.metrics,
            recommendations: dbHealth.recommendations,
          }
        : undefined,
    };

    // Check cache health
    const cacheHealth = cacheMonitor.assessHealth();
    const cacheCheck: HealthCheck = {
      status:
        cacheHealth.status === "optimal" || cacheHealth.status === "good"
          ? "pass"
          : cacheHealth.status === "degraded"
            ? "warn"
            : "fail",
      message:
        cacheHealth.issues.length > 0
          ? cacheHealth.issues.join(", ")
          : "Cache performing well",
      details: detailed
        ? {
            score: cacheHealth.score,
            L1: cacheHealth.L1,
            L2: cacheHealth.L2,
            recommendations: cacheHealth.recommendations,
          }
        : undefined,
    };

    // Check circuit breaker health
    const circuitHealth = circuitBreakerMonitor.assessHealth();
    const circuitCheck: HealthCheck = {
      status:
        circuitHealth.status === "healthy"
          ? "pass"
          : circuitHealth.status === "degraded"
            ? "warn"
            : "fail",
      message:
        circuitHealth.issues.length > 0
          ? circuitHealth.issues.join(", ")
          : "All circuits healthy",
      details: detailed
        ? {
            score: circuitHealth.score,
            circuits: Array.from(circuitHealth.metrics.entries()),
            recommendations: circuitHealth.recommendations,
          }
        : undefined,
    };

    // Check memory health
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const memoryCheck: HealthCheck = {
      status:
        heapUsagePercent < 85
          ? "pass"
          : heapUsagePercent < 95
            ? "warn"
            : "fail",
      message: `Heap usage: ${heapUsagePercent.toFixed(1)}%`,
      details: detailed ? memUsage : undefined,
    };

    // Determine overall status
    const statuses = [
      dbCheck.status,
      cacheCheck.status,
      circuitCheck.status,
      memoryCheck.status,
    ];
    let overallStatus: "healthy" | "degraded" | "critical";

    if (statuses.includes("fail")) {
      overallStatus = "critical";
    } else if (statuses.includes("warn")) {
      overallStatus = "degraded";
    } else {
      overallStatus = "healthy";
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: performanceMetrics.getUptime(),
      version: process.env.npm_package_version || "1.0.0",
      checks: {
        database: dbCheck,
        cache: cacheCheck,
        circuitBreaker: circuitCheck,
        memory: memoryCheck,
      },
    };

    // Include metrics if requested
    if (includeMetrics) {
      const snapshot = performanceMetrics.captureSnapshot();
      response.metrics = {
        latency: Array.from(snapshot.latency.entries()),
        throughput: Array.from(snapshot.throughput.entries()),
        cache: snapshot.cache,
        database: dbHealth.metrics,
      };
    }

    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(response);
  } catch (error) {
    res.status(500).json({
      status: "critical",
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Database metrics endpoint
 * GET /metrics/database
 */
export async function databaseMetrics(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const metrics = dbPoolMonitor.getMetrics();
    const health = dbPoolMonitor.assessHealth();
    const recentEvents = dbPoolMonitor.getRecentEvents(50);

    res.json({
      timestamp: Date.now(),
      metrics,
      health: {
        status: health.status,
        score: health.score,
        issues: health.issues,
        recommendations: health.recommendations,
      },
      recentEvents,
      rates: {
        errorRate: dbPoolMonitor.getErrorRate(5),
        acquisitionRate: dbPoolMonitor.getAcquisitionRate(60),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Cache metrics endpoint
 * GET /metrics/cache
 */
export async function cacheMetrics(req: Request, res: Response): Promise<void> {
  try {
    const layer = req.query.layer as "L1" | "L2" | undefined;

    if (layer && layer !== "L1" && layer !== "L2") {
      res.status(400).json({ error: "Invalid layer. Must be L1 or L2" });
      return;
    }

    const health = cacheMonitor.assessHealth();
    const L1Metrics = cacheMonitor.getLayerMetrics("L1");
    const L2Metrics = cacheMonitor.getLayerMetrics("L2");
    const L1Distribution = cacheMonitor.getLatencyDistribution("L1", "get");
    const L2Distribution = cacheMonitor.getLatencyDistribution("L2", "get");

    const response: any = {
      timestamp: Date.now(),
      health: {
        status: health.status,
        score: health.score,
        issues: health.issues,
        recommendations: health.recommendations,
      },
    };

    if (!layer || layer === "L1") {
      response.L1 = {
        metrics: L1Metrics,
        latencyDistribution: L1Distribution,
        recentEvents: cacheMonitor.getRecentEvents(50, "L1"),
      };
    }

    if (!layer || layer === "L2") {
      response.L2 = {
        metrics: L2Metrics,
        latencyDistribution: L2Distribution,
        recentEvents: cacheMonitor.getRecentEvents(50, "L2"),
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Circuit breaker metrics endpoint
 * GET /metrics/circuit-breaker
 */
export async function circuitBreakerMetrics(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const service = req.query.service as string | undefined;

    const health = circuitBreakerMonitor.assessHealth();
    const allMetrics = circuitBreakerMonitor.getAllMetrics();

    const response: any = {
      timestamp: Date.now(),
      health: {
        status: health.status,
        score: health.score,
        issues: health.issues,
        recommendations: health.recommendations,
      },
    };

    if (service) {
      const metrics = circuitBreakerMonitor.getCircuitMetrics(service);
      if (!metrics) {
        res.status(404).json({ error: `Circuit not found: ${service}` });
        return;
      }

      response.circuit = {
        metrics,
        failureRate: circuitBreakerMonitor.getFailureRate(service, 5),
        throughput: circuitBreakerMonitor.getThroughput(service, 60),
        stateHistory: circuitBreakerMonitor.getStateHistory(service, 20),
        requestHistory: circuitBreakerMonitor.getRequestHistory(service, 50),
      };
    } else {
      response.circuits = Array.from(allMetrics.entries()).map(
        ([name, metrics]) => ({
          service: name,
          metrics,
          failureRate: circuitBreakerMonitor.getFailureRate(name, 5),
          throughput: circuitBreakerMonitor.getThroughput(name, 60),
        }),
      );
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Prometheus metrics endpoint
 * GET /metrics
 */
export async function prometheusMetrics(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const metrics = prometheusExporter.export();

    res.setHeader("Content-Type", prometheusExporter.getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Metrics summary endpoint (JSON format)
 * GET /metrics/summary
 */
export async function metricsSummary(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const summary = prometheusExporter.exportJSON();

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Performance snapshot endpoint
 * GET /metrics/snapshot
 */
export async function performanceSnapshot(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const minutes = parseInt(req.query.minutes as string) || 5;
    const history = performanceMetrics.getHistory(Math.min(minutes, 60));
    const current = performanceMetrics.captureSnapshot();

    res.json({
      timestamp: Date.now(),
      current,
      history,
      summary: {
        dataPoints: history.length,
        timeRange: `${minutes} minutes`,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Liveness probe (for Kubernetes)
 * GET /health/live
 */
export async function livenessProbe(
  req: Request,
  res: Response,
): Promise<void> {
  res.status(200).json({
    status: "alive",
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
}

/**
 * Readiness probe (for Kubernetes)
 * GET /health/ready
 */
export async function readinessProbe(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // Check if critical services are ready
    const dbHealth = dbPoolMonitor.assessHealth();
    const cacheHealth = cacheMonitor.assessHealth();

    const isReady =
      dbHealth.status !== "critical" && cacheHealth.status !== "critical";

    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "not ready",
      timestamp: Date.now(),
      checks: {
        database: dbHealth.status,
        cache: cacheHealth.status,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
