/**
 * Prometheus Metrics Configuration
 * Production-grade metrics collection with custom business metrics
 * @module observability/metrics
 */

import client from "prom-client";
import { Request, Response, NextFunction } from "express";

// Initialize default metrics
client.collectDefaultMetrics({
  prefix: "bizra_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Create registry
export const register = new client.Registry();
register.setDefaultLabels({
  app: "bizra-api",
  environment: process.env.NODE_ENV || "development",
});

// ======================
// HTTP Metrics
// ======================

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// HTTP request size
export const httpRequestSize = new client.Histogram({
  name: "http_request_size_bytes",
  help: "Size of HTTP requests in bytes",
  labelNames: ["method", "route"],
  buckets: [10, 100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

// HTTP response size
export const httpResponseSize = new client.Histogram({
  name: "http_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["method", "route", "status_code"],
  buckets: [10, 100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

// Active connections
export const activeConnections = new client.Gauge({
  name: "http_active_connections",
  help: "Number of active HTTP connections",
  registers: [register],
});

// ======================
// Database Metrics
// ======================

// Database query duration
export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table", "status"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// Database connection pool
export const dbPoolSize = new client.Gauge({
  name: "db_pool_size",
  help: "Current database connection pool size",
  labelNames: ["state"],
  registers: [register],
});

// Database query errors
export const dbQueryErrors = new client.Counter({
  name: "db_query_errors_total",
  help: "Total number of database query errors",
  labelNames: ["operation", "table", "error_type"],
  registers: [register],
});

// ======================
// Business Metrics
// ======================

// User registrations
export const userRegistrations = new client.Counter({
  name: "business_user_registrations_total",
  help: "Total number of user registrations",
  labelNames: ["source", "tier"],
  registers: [register],
});

// User logins
export const userLogins = new client.Counter({
  name: "business_user_logins_total",
  help: "Total number of user logins",
  labelNames: ["method", "status"],
  registers: [register],
});

// Validation requests
export const validationRequests = new client.Counter({
  name: "business_validation_requests_total",
  help: "Total number of validation requests",
  labelNames: ["validation_type", "status"],
  registers: [register],
});

// Validation processing time
export const validationDuration = new client.Histogram({
  name: "business_validation_duration_seconds",
  help: "Duration of validation processing",
  labelNames: ["validation_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

// Active users
export const activeUsers = new client.Gauge({
  name: "business_active_users",
  help: "Number of currently active users",
  labelNames: ["tier"],
  registers: [register],
});

// Revenue metrics
export const revenueTotal = new client.Counter({
  name: "business_revenue_total",
  help: "Total revenue generated",
  labelNames: ["currency", "tier"],
  registers: [register],
});

// Subscription metrics
export const subscriptions = new client.Gauge({
  name: "business_subscriptions",
  help: "Number of active subscriptions",
  labelNames: ["tier", "status"],
  registers: [register],
});

// ======================
// System Metrics
// ======================

// Memory usage
export const memoryUsage = new client.Gauge({
  name: "system_memory_usage_bytes",
  help: "Memory usage in bytes",
  labelNames: ["type"],
  registers: [register],
});

// CPU usage
export const cpuUsage = new client.Gauge({
  name: "system_cpu_usage_percent",
  help: "CPU usage percentage",
  registers: [register],
});

// Event loop lag
export const eventLoopLag = new client.Gauge({
  name: "system_event_loop_lag_seconds",
  help: "Event loop lag in seconds",
  registers: [register],
});

// Cache metrics
export const cacheHits = new client.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_name"],
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_name"],
  registers: [register],
});

// ======================
// Error Metrics
// ======================

// Application errors
export const applicationErrors = new client.Counter({
  name: "application_errors_total",
  help: "Total number of application errors",
  labelNames: ["error_type", "severity"],
  registers: [register],
});

// Rate limit hits
export const rateLimitHits = new client.Counter({
  name: "rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["endpoint", "user_tier"],
  registers: [register],
});

// ======================
// Middleware
// ======================

/**
 * Express middleware to collect HTTP metrics
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  activeConnections.inc();

  // Track request size
  const requestSize = parseInt(req.get("content-length") || "0", 10);
  httpRequestSize.observe(
    { method: req.method, route: req.route?.path || req.path },
    requestSize,
  );

  // Track response
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode.toString();

    // Update metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration,
    );
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    // Track response size
    const responseSize = parseInt(res.get("content-length") || "0", 10);
    httpResponseSize.observe(
      { method: req.method, route, status_code: statusCode },
      responseSize,
    );

    activeConnections.dec();
  });

  next();
}

/**
 * Update system metrics periodically
 */
export function startSystemMetricsCollection() {
  setInterval(() => {
    // Memory metrics
    const mem = process.memoryUsage();
    memoryUsage.set({ type: "heap_used" }, mem.heapUsed);
    memoryUsage.set({ type: "heap_total" }, mem.heapTotal);
    memoryUsage.set({ type: "rss" }, mem.rss);
    memoryUsage.set({ type: "external" }, mem.external);

    // CPU metrics
    const cpuData = process.cpuUsage();
    const totalCpu = (cpuData.user + cpuData.system) / 1000000; // Convert to seconds
    cpuUsage.set(totalCpu);

    // Event loop lag
    const lagStart = Date.now();
    setImmediate(() => {
      const lag = (Date.now() - lagStart) / 1000;
      eventLoopLag.set(lag);
    });
  }, 5000);
}

/**
 * Track database query
 */
export function trackDbQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const end = dbQueryDuration.startTimer({ operation, table });

  return queryFn()
    .then((result) => {
      end({ status: "success" });
      return result;
    })
    .catch((error) => {
      end({ status: "error" });
      dbQueryErrors.inc({ operation, table, error_type: error.name });
      throw error;
    });
}

/**
 * Track business event
 */
export function trackBusinessEvent(
  eventType: string,
  labels: Record<string, string> = {},
) {
  switch (eventType) {
    case "user_registration":
      userRegistrations.inc(labels);
      break;
    case "user_login":
      userLogins.inc(labels);
      break;
    case "validation_request":
      validationRequests.inc(labels);
      break;
    default:
      // Generic business event counter
      new client.Counter({
        name: `business_${eventType}_total`,
        help: `Total number of ${eventType} events`,
        labelNames: Object.keys(labels),
        registers: [register],
      }).inc(labels);
  }
}

/**
 * Expose metrics endpoint
 */
export async function getMetrics() {
  return register.metrics();
}

export default {
  register,
  metricsMiddleware,
  startSystemMetricsCollection,
  trackDbQuery,
  trackBusinessEvent,
  getMetrics,
};
