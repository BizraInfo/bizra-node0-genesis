/**
 * Observability Module Entry Point
 * Exports all observability functionality for easy integration
 * @module observability
 */

// Logger
export * from "./logger";
export {
  logger,
  createLogger,
  logWithContext,
  httpLogger,
  errorLogger,
  PerformanceLogger,
  logBusinessEvent,
  logSecurityEvent,
} from "./logger";

// Metrics
export * from "./metrics";
export {
  register,
  metricsMiddleware,
  startSystemMetricsCollection,
  trackDbQuery,
  trackBusinessEvent,
  getMetrics,
} from "./metrics";

// Tracer
export * from "./tracer";
export {
  startTracing,
  shutdownTracing,
  getTracer,
  withSpan,
  tracingMiddleware,
  traceDbOperation,
  traceApiCall,
  getCurrentTraceId,
  getCurrentSpanId,
} from "./tracer";

// Health checks
export * from "./health-check";
export {
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
} from "./health-check";

// Sentry
export * from "./sentry";
export {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  performanceMiddleware,
  userContextMiddleware,
  trackEvent,
  shutdownSentry,
} from "./sentry";

/**
 * Initialize all observability features
 */
export async function initializeObservability() {
  // Start OpenTelemetry tracing
  const { startTracing } = await import("./tracer");
  startTracing();

  // Initialize Sentry
  const { initSentry } = await import("./sentry");
  initSentry();

  // Start system metrics collection
  const { startSystemMetricsCollection } = await import("./metrics");
  startSystemMetricsCollection();

  console.log("✅ Observability initialized successfully");
}

/**
 * Gracefully shutdown observability
 */
export async function shutdownObservability() {
  const { shutdownTracing } = await import("./tracer");
  const { shutdownSentry } = await import("./sentry");

  await Promise.all([shutdownTracing(), shutdownSentry()]);

  console.log("✅ Observability shut down successfully");
}

export default {
  initializeObservability,
  shutdownObservability,
};
