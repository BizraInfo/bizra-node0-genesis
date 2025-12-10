/**
 * ENTERPRISE-GRADE Monitoring System - Main Entry Point
 *
 * Centralized export of all monitoring components
 */

// Core services
export {
  performanceMetrics,
  PerformanceMetricsService,
} from "./performance-metrics.service";
export { dbPoolMonitor, DatabasePoolMonitor } from "./db-pool-monitor";
export { cacheMonitor, CacheMonitor } from "./cache-monitor";
export {
  circuitBreakerMonitor,
  CircuitBreakerMonitor,
} from "./circuit-breaker-monitor";

// Exporters and aggregation
export { prometheusExporter, PrometheusExporter } from "./prometheus-exporter";
export { metricsAggregator, MetricsAggregator } from "./metrics-aggregator";
export { metricsStreaming, MetricsStreamingService } from "./metrics-streaming";

// Health checks
export * from "../health/performance-health";
export { createHealthRoutes } from "../health/health-routes";

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring(options?: {
  enableStreaming?: boolean;
  streamingPath?: string;
  prometheusPrefix?: string;
  httpServer?: any;
}): void {
  const {
    enableStreaming = true,
    streamingPath = "/metrics/stream",
    prometheusPrefix = "",
    httpServer,
  } = options || {};

  // Initialize Prometheus exporter with prefix
  const exporter = prometheusExporter;
  if (prometheusPrefix) {
    // Prefix would be configured in PrometheusExporter constructor
  }

  // Initialize streaming if enabled and server provided
  if (enableStreaming && httpServer) {
    metricsStreaming.initialize(httpServer, streamingPath);
  }

  console.log("✅ Monitoring system initialized");
  console.log(`   - Performance Metrics: Active`);
  console.log(`   - Database Pool Monitor: Active`);
  console.log(`   - Cache Monitor: Active`);
  console.log(`   - Circuit Breaker Monitor: Active`);
  console.log(`   - Prometheus Exporter: Active`);
  console.log(`   - Metrics Aggregator: Active`);
  if (enableStreaming && httpServer) {
    console.log(`   - Real-time Streaming: Active at ${streamingPath}`);
  }
}

/**
 * Cleanup all monitoring services
 */
export function destroyMonitoring(): void {
  performanceMetrics.destroy();
  dbPoolMonitor.destroy();
  cacheMonitor.destroy();
  circuitBreakerMonitor.destroy();
  metricsAggregator.destroy();
  metricsStreaming.destroy();

  console.log("🛑 Monitoring system destroyed");
}

/**
 * Get overall system health
 */
export function getSystemHealth(): {
  status: "healthy" | "degraded" | "critical";
  score: number;
  components: {
    database: any;
    cache: any;
    circuitBreaker: any;
  };
} {
  const dbHealth = dbPoolMonitor.assessHealth();
  const cacheHealth = cacheMonitor.assessHealth();
  const circuitHealth = circuitBreakerMonitor.assessHealth();

  const scores = [dbHealth.score, cacheHealth.score, circuitHealth.score];
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  let status: "healthy" | "degraded" | "critical";
  if (avgScore >= 85) {
    status = "healthy";
  } else if (avgScore >= 70) {
    status = "degraded";
  } else {
    status = "critical";
  }

  return {
    status,
    score: avgScore,
    components: {
      database: {
        status: dbHealth.status,
        score: dbHealth.score,
        issues: dbHealth.issues,
      },
      cache: {
        status: cacheHealth.status,
        score: cacheHealth.score,
        issues: cacheHealth.issues,
      },
      circuitBreaker: {
        status: circuitHealth.status,
        score: circuitHealth.score,
        issues: circuitHealth.issues,
      },
    },
  };
}
