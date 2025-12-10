/**
 * Observability Middleware
 * Combines all observability middleware for Express
 * @module observability/middleware
 */

import { Express, Request, Response, NextFunction } from "express";
import { httpLogger, errorLogger } from "./logger";
import { metricsMiddleware } from "./metrics";
import { tracingMiddleware } from "./tracer";
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  performanceMiddleware,
  userContextMiddleware,
} from "./sentry";
import {
  healthCheckHandler,
  detailedHealthCheckHandler,
  livenessHandler,
  readinessHandler,
  startupHandler,
} from "./health-check";

/**
 * Apply all observability middleware to Express app
 */
export function applyObservabilityMiddleware(app: Express) {
  // Sentry request handler (must be first)
  app.use(sentryRequestHandler());

  // Sentry tracing
  app.use(sentryTracingHandler());

  // HTTP logging
  app.use(httpLogger);

  // Metrics collection
  app.use(metricsMiddleware);

  // Distributed tracing
  app.use(tracingMiddleware);

  // Sentry performance tracking
  app.use(performanceMiddleware);

  // Sentry user context
  app.use(userContextMiddleware);

  console.log("✅ Observability middleware applied");
}

/**
 * Apply health check endpoints
 */
export function applyHealthCheckEndpoints(app: Express) {
  // Basic health check
  app.get("/health", healthCheckHandler);

  // Detailed health check with dependencies
  app.get("/health/detailed", detailedHealthCheckHandler);

  // Kubernetes liveness probe
  app.get("/health/live", livenessHandler);

  // Kubernetes readiness probe
  app.get("/health/ready", readinessHandler);

  // Kubernetes startup probe
  app.get("/health/startup", startupHandler);

  console.log("✅ Health check endpoints registered");
}

/**
 * Apply metrics endpoint
 */
export function applyMetricsEndpoint(app: Express) {
  const { getMetrics } = require("./metrics");

  app.get("/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await getMetrics();
      res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
      res.send(metrics);
    } catch (error) {
      res.status(500).send("Error collecting metrics");
    }
  });

  console.log("✅ Metrics endpoint registered at /metrics");
}

/**
 * Apply error handling middleware (must be last)
 */
export function applyErrorHandlers(app: Express) {
  // Log errors
  app.use(errorLogger);

  // Sentry error handler
  app.use(sentryErrorHandler());

  // Final error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = (err as any).statusCode || 500;

    res.status(statusCode).json({
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
      requestId: (req as any).correlationId,
    });
  });

  console.log("✅ Error handlers applied");
}

/**
 * Setup complete observability for Express app
 */
export function setupObservability(app: Express) {
  console.log("🔧 Setting up observability...");

  // Apply middleware (order matters!)
  applyObservabilityMiddleware(app);

  // Health checks
  applyHealthCheckEndpoints(app);

  // Metrics endpoint
  applyMetricsEndpoint(app);

  // Error handlers (must be last)
  applyErrorHandlers(app);

  console.log("✅ Observability setup complete");
}

export default {
  applyObservabilityMiddleware,
  applyHealthCheckEndpoints,
  applyMetricsEndpoint,
  applyErrorHandlers,
  setupObservability,
};
