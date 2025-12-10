# ENTERPRISE-GRADE Performance Monitoring System

## Overview

The BIZRA-NODE0 monitoring system provides comprehensive, real-time performance tracking with:

- **Real-time metrics collection** (<1% overhead)
- **Multi-tier cache monitoring** (L1/L2 hit rates)
- **Database pool tracking** (connection states, wait times)
- **Circuit breaker monitoring** (state changes, failure rates)
- **Prometheus/Grafana integration**
- **WebSocket streaming** (real-time dashboard updates)
- **Health check endpoints** (Kubernetes-ready)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Monitoring System                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Performance  │  │   Database   │  │    Cache     │ │
│  │   Metrics    │  │Pool Monitor  │  │   Monitor    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │          │
│         └─────────────────┴─────────────────┘          │
│                           │                            │
│         ┌─────────────────┴─────────────────┐          │
│         │                                   │          │
│  ┌──────▼───────┐              ┌───────────▼──────┐   │
│  │  Prometheus  │              │     Metrics      │   │
│  │   Exporter   │              │   Aggregator     │   │
│  └──────┬───────┘              └───────────┬──────┘   │
│         │                                   │          │
│         ▼                                   ▼          │
│  ┌─────────────┐              ┌──────────────────┐    │
│  │   Grafana   │              │    WebSocket     │    │
│  │  Dashboards │              │    Streaming     │    │
│  └─────────────┘              └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Performance Metrics Service

**Location:** `src/monitoring/performance-metrics.service.ts`

**Features:**

- Latency tracking (P50, P95, P99)
- Throughput measurement (ops/sec)
- Cache hit/miss tracking
- Sliding window calculations (1000 samples)
- Event emission for real-time updates
- Prometheus export

**Usage:**

```typescript
import { performanceMetrics } from "./monitoring";

// Record latency
performanceMetrics.recordLatency("api:request", 150); // 150ms

// Record throughput
performanceMetrics.recordThroughput("api:requests", 1);

// Record cache hits/misses
performanceMetrics.recordCacheHit("L1");
performanceMetrics.recordCacheMiss("L2");

// Get metrics
const latency = performanceMetrics.getLatencyPercentiles("api:request");
console.log(`P95: ${latency.p95}ms`);

const hitRate = performanceMetrics.getCacheHitRate("L1");
console.log(`L1 Hit Rate: ${(hitRate * 100).toFixed(1)}%`);
```

### 2. Database Pool Monitor

**Location:** `src/monitoring/db-pool-monitor.ts`

**Features:**

- Active/idle connection tracking
- Queue depth monitoring
- Wait time measurements
- Connection error tracking
- Health assessment (0-100 score)

**Usage:**

```typescript
import { Pool } from "pg";
import { dbPoolMonitor } from "./monitoring";

const pool = new Pool({ max: 20 });

// Attach monitor to pool
dbPoolMonitor.attachToPool(pool);

// Get metrics
const metrics = dbPoolMonitor.getMetrics();
console.log(`Active: ${metrics.activeConnections}`);
console.log(`Waiting: ${metrics.waitingClients}`);

// Assess health
const health = dbPoolMonitor.assessHealth();
console.log(`Health Score: ${health.score}`);
console.log(`Issues: ${health.issues.join(", ")}`);
```

### 3. Cache Monitor

**Location:** `src/monitoring/cache-monitor.ts`

**Features:**

- L1/L2 hit rate tracking
- Eviction frequency monitoring
- Compression ratio measurement
- Latency distribution (min, max, avg, p50, p95, p99)
- Memory usage tracking

**Usage:**

```typescript
import { cacheMonitor } from "./monitoring";

// Record cache operations
cacheMonitor.recordHit("L1", "user:123", 2); // 2ms latency
cacheMonitor.recordMiss("L1", "user:456", 5);
cacheMonitor.recordSet("L2", "product:789", 10, 1024, true); // compressed
cacheMonitor.recordEviction("L1", "old:key", 512);

// Get metrics
const L1Metrics = cacheMonitor.getLayerMetrics("L1");
console.log(`L1 Hit Rate: ${(L1Metrics.hitRate * 100).toFixed(1)}%`);

const distribution = cacheMonitor.getLatencyDistribution("L1", "get");
console.log(`P95 Latency: ${distribution.p95}ms`);

// Assess health
const health = cacheMonitor.assessHealth();
console.log(`Status: ${health.status}`);
```

### 4. Circuit Breaker Monitor

**Location:** `src/monitoring/circuit-breaker-monitor.ts`

**Features:**

- State change tracking (CLOSED → OPEN → HALF_OPEN)
- Failure rate monitoring
- Request latency tracking
- Alert threshold management
- Health scoring

**Usage:**

```typescript
import { circuitBreakerMonitor } from "./monitoring";

// Register circuit
circuitBreakerMonitor.registerCircuit("payment-service", {
  failureRate: 0.5,
  consecutiveFailures: 5,
  avgLatency: 5000,
});

// Record operations
circuitBreakerMonitor.recordSuccess("payment-service", 150);
circuitBreakerMonitor.recordFailure("payment-service", 3000, error);
circuitBreakerMonitor.recordTimeout("payment-service", 5000);

// Track state changes
circuitBreakerMonitor.recordStateChange(
  "payment-service",
  "CLOSED",
  "OPEN",
  "Failure threshold exceeded",
);

// Get metrics
const metrics = circuitBreakerMonitor.getCircuitMetrics("payment-service");
console.log(`Failure Rate: ${(metrics.failureRate * 100).toFixed(1)}%`);
```

### 5. Prometheus Exporter

**Location:** `src/monitoring/prometheus-exporter.ts`

**Features:**

- Aggregates all monitoring metrics
- Prometheus text format export
- Custom metric registration
- Configurable prefix and labels
- System metrics (memory, CPU, event loop)

**Usage:**

```typescript
import { prometheusExporter } from "./monitoring";

// Export all metrics
const metrics = prometheusExporter.export();

// Register custom metric
prometheusExporter.registerMetric(
  "custom_metric",
  "counter",
  "Custom metric description",
  42,
  { service: "api", version: "1.0" },
);

// Export as JSON (debugging)
const json = prometheusExporter.exportJSON();
```

### 6. Real-time Streaming

**Location:** `src/monitoring/metrics-streaming.ts`

**Features:**

- WebSocket-based streaming
- Subscription management
- Configurable update intervals
- Filtering by metric type
- Real-time alerts

**Client Example:**

```javascript
const ws = new WebSocket(
  "ws://localhost:3000/metrics/stream?metrics=performance,cache&interval=1000",
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "snapshot") {
    console.log("Initial snapshot:", message.data);
  } else if (message.type === "update") {
    console.log("Metric update:", message.data);
  } else if (message.type === "alert") {
    console.warn("Alert:", message.data);
  }
};

// Subscribe to additional metrics
ws.send(
  JSON.stringify({
    type: "subscribe",
    metrics: ["circuit-breaker"],
    interval: 500,
  }),
);
```

## Health Check Endpoints

### GET /health/performance

Overall system health check.

**Query Parameters:**

- `detailed=true` - Include detailed component metrics
- `metrics=true` - Include current metrics snapshot

**Response:**

```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "uptime": 3600000,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database pool healthy"
    },
    "cache": {
      "status": "pass",
      "message": "Cache performing well"
    },
    "circuitBreaker": {
      "status": "pass",
      "message": "All circuits healthy"
    },
    "memory": {
      "status": "pass",
      "message": "Heap usage: 65.2%"
    }
  }
}
```

### GET /metrics/database

Database pool metrics.

**Response:**

```json
{
  "timestamp": 1234567890,
  "metrics": {
    "totalConnections": 15,
    "activeConnections": 8,
    "idleConnections": 7,
    "waitingClients": 2,
    "avgWaitTime": 45.3,
    "connectionErrors": 0
  },
  "health": {
    "status": "healthy",
    "score": 92,
    "issues": [],
    "recommendations": []
  },
  "rates": {
    "errorRate": 0,
    "acquisitionRate": 12.5
  }
}
```

### GET /metrics/cache

Cache performance metrics.

**Query Parameters:**

- `layer=L1|L2` - Filter by cache layer

**Response:**

```json
{
  "timestamp": 1234567890,
  "health": {
    "status": "optimal",
    "score": 98,
    "issues": [],
    "recommendations": []
  },
  "L1": {
    "metrics": {
      "hits": 15234,
      "misses": 1876,
      "hitRate": 0.89,
      "avgGetLatency": 2.3,
      "compressionRatio": 1.0
    },
    "latencyDistribution": {
      "min": 0.5,
      "max": 8.2,
      "avg": 2.3,
      "p50": 2.1,
      "p95": 5.4,
      "p99": 7.8
    }
  },
  "L2": { ... }
}
```

### GET /metrics/circuit-breaker

Circuit breaker status and metrics.

**Query Parameters:**

- `service=<name>` - Filter by service name

**Response:**

```json
{
  "timestamp": 1234567890,
  "health": {
    "status": "healthy",
    "score": 95,
    "issues": [],
    "recommendations": []
  },
  "circuits": [
    {
      "service": "payment-service",
      "metrics": {
        "state": "CLOSED",
        "failureRate": 0.02,
        "avgLatency": 145.3,
        "consecutiveFailures": 0
      },
      "failureRate": 0.02,
      "throughput": 45.2
    }
  ]
}
```

### GET /metrics

Prometheus metrics endpoint.

**Content-Type:** `text/plain; version=0.0.4`

**Response:**

```
# HELP latency_ms_api_request Latency in milliseconds for api:request
# TYPE latency_ms_api_request summary
latency_ms_api_request{quantile="0.5"} 145 1234567890
latency_ms_api_request{quantile="0.95"} 523 1234567890
latency_ms_api_request{quantile="0.99"} 1205 1234567890

# HELP cache_L1_hit_rate Cache hit rate for L1
# TYPE cache_L1_hit_rate gauge
cache_L1_hit_rate 0.89 1234567890
...
```

### GET /health/live

Kubernetes liveness probe.

### GET /health/ready

Kubernetes readiness probe.

## Grafana Dashboard

**Location:** `monitoring/dashboards/performance.json`

**Panels:**

1. Request Latency Distribution (P50, P95, P99)
2. Throughput (ops/sec)
3. Cache Hit Rates (L1, L2)
4. Database Pool Metrics
5. Circuit Breaker Status
6. Memory Usage
7. Circuit Breaker Failure Rate
8. System Health Score
9. Component Health Scores

**Alerts:**

- High P95 Latency (>1000ms)
- Low Cache Hit Rate (<70%)
- High Database Wait Queue (>5 clients)
- Circuit Breaker Open
- High Circuit Failure Rate (>50%)

## Alert Rules

**Location:** `monitoring/alerts/performance-alerts.yaml`

**Alert Groups:**

- `performance_alerts` - Latency and throughput
- `cache_alerts` - Cache performance
- `database_alerts` - Database pool
- `circuit_breaker_alerts` - Circuit breaker state
- `system_alerts` - Memory and event loop

## Integration

### Express.js

```typescript
import express from "express";
import { createHealthRoutes, initializeMonitoring } from "./monitoring";

const app = express();

// Add health check routes
app.use(createHealthRoutes());

// Initialize monitoring
const server = app.listen(3000, () => {
  initializeMonitoring({
    enableStreaming: true,
    streamingPath: "/metrics/stream",
    httpServer: server,
  });
});
```

### Instrumentation

```typescript
import { performanceMetrics } from "./monitoring";

// Middleware for request tracking
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const latency = Date.now() - start;
    performanceMetrics.recordLatency("http:request", latency);
    performanceMetrics.recordThroughput("http:requests", 1);
  });

  next();
});
```

## Performance Impact

- **Overhead:** <1% CPU impact
- **Memory:** ~10MB for 1 hour of history
- **Latency:** <0.01ms per metric recording
- **Storage:** Sliding windows prevent unbounded growth

## Best Practices

1. **Use appropriate update intervals**
   - Real-time dashboards: 1-5 seconds
   - Historical analysis: 1-5 minutes
   - Long-term storage: 15-60 minutes

2. **Set meaningful thresholds**
   - Align with SLA requirements
   - Account for peak vs. average load
   - Use percentiles over averages

3. **Monitor health scores**
   - <70: Investigate immediately
   - 70-85: Monitor closely
   - > 85: Healthy operation

4. **Leverage alerts**
   - Configure critical alerts for immediate response
   - Use warning alerts for trending issues
   - Tune thresholds to reduce false positives

5. **Utilize streaming for real-time dashboards**
   - WebSocket reduces polling overhead
   - Subscribe only to needed metrics
   - Use appropriate update intervals

## Troubleshooting

### High Memory Usage

```typescript
// Check metrics history size
const stats = metricsAggregator.getStats();
console.log("Data points:", stats.totalDataPoints);
console.log("Memory:", (stats.memoryUsage / 1024 / 1024).toFixed(2), "MB");

// Cleanup if needed
metricsAggregator.cleanup();
```

### Missing Metrics

```typescript
// Verify monitors are attached
dbPoolMonitor.attachToPool(pool);

// Check event listeners
performanceMetrics.listenerCount("metrics:snapshot");
```

### Alert Fatigue

- Review and tune thresholds
- Use appropriate time windows
- Combine related alerts
- Implement alert aggregation

## Future Enhancements

- [ ] Distributed tracing integration
- [ ] Custom metric dashboards
- [ ] Machine learning anomaly detection
- [ ] Multi-region aggregation
- [ ] Long-term storage (InfluxDB, TimescaleDB)
- [ ] SLO/SLI tracking
- [ ] Automated performance regression detection
