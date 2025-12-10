/**
 * ENTERPRISE-GRADE Health Check Routes
 *
 * Express router configuration for health and metrics endpoints
 */

import { Router } from "express";
import {
  performanceHealthCheck,
  databaseMetrics,
  cacheMetrics,
  circuitBreakerMetrics,
  prometheusMetrics,
  metricsSummary,
  performanceSnapshot,
  livenessProbe,
  readinessProbe,
} from "./performance-health";

export function createHealthRoutes(): Router {
  const router = Router();

  // Health check endpoints
  router.get("/health/performance", performanceHealthCheck);
  router.get("/health/live", livenessProbe);
  router.get("/health/ready", readinessProbe);

  // Metrics endpoints
  router.get("/metrics", prometheusMetrics);
  router.get("/metrics/summary", metricsSummary);
  router.get("/metrics/snapshot", performanceSnapshot);
  router.get("/metrics/database", databaseMetrics);
  router.get("/metrics/cache", cacheMetrics);
  router.get("/metrics/circuit-breaker", circuitBreakerMetrics);

  return router;
}

export default createHealthRoutes;
