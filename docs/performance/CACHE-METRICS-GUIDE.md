# Cache Metrics Monitoring Guide

## Overview

The cache service provides comprehensive metrics tracking for production monitoring, including hit rates, latencies (avg, p95, p99), eviction counts, and compression ratios.

## Quick Start

### Get Basic Stats

```typescript
import { cacheService } from "./performance/cache.service";

const stats = await cacheService.getStats();

console.log("L1 Hit Rate:", stats.l1.hitRate); // 93.5%
console.log("L1 p95 Latency:", stats.l1.p95LatencyMs); // 1.2ms
console.log("Evictions:", stats.performance.evictionCount); // 234
```

### Get Dashboard Export

```typescript
const dashboard = await cacheService.getMetricsDashboard();

// Monitoring-ready format
{
  timestamp: 1234567890,
  cache: {
    l1_hit_rate_percent: 93.5,
    l1_p95_latency_ms: 1.2,
    l1_p99_latency_ms: 1.8,
    eviction_count: 234,
    compression_ratio: 2.3,
  },
  targets: {
    l1_hit_rate_target: 90,
    l1_latency_target_ms: 2,
  },
  status: {
    l1_hit_rate_ok: true,
    l1_latency_ok: true,
  }
}
```

## Metrics Reference

### L1 Cache Metrics

| Metric            | Description               | Target | Type  |
| ----------------- | ------------------------- | ------ | ----- |
| `l1.size`         | Current number of entries | -      | Gauge |
| `l1.maxSize`      | Maximum capacity          | 1000   | Gauge |
| `l1.utilization`  | Usage percentage          | <90%   | Gauge |
| `l1.hitRate`      | Hit rate percentage       | >90%   | Gauge |
| `l1.avgLatencyMs` | Average latency           | <1ms   | Gauge |
| `l1.p95LatencyMs` | 95th percentile latency   | <2ms   | Gauge |
| `l1.p99LatencyMs` | 99th percentile latency   | <5ms   | Gauge |

### L2 Cache Metrics

| Metric            | Description             | Target | Type    |
| ----------------- | ----------------------- | ------ | ------- |
| `l2.size`         | Redis DB size           | -      | Gauge   |
| `l2.connected`    | Connection status       | true   | Boolean |
| `l2.hitRate`      | Hit rate percentage     | >50%   | Gauge   |
| `l2.avgLatencyMs` | Average latency         | <10ms  | Gauge   |
| `l2.p95LatencyMs` | 95th percentile latency | <15ms  | Gauge   |
| `l2.p99LatencyMs` | 99th percentile latency | <30ms  | Gauge   |

### Performance Metrics

| Metric                            | Description                   | Target | Type    |
| --------------------------------- | ----------------------------- | ------ | ------- |
| `performance.totalRequests`       | Total cache requests          | -      | Counter |
| `performance.evictionCount`       | LRU evictions                 | -      | Counter |
| `performance.avgWriteLatencyMs`   | Average write latency         | <3ms   | Gauge   |
| `performance.p95WriteLatencyMs`   | 95th percentile write latency | <5ms   | Gauge   |
| `performance.p99WriteLatencyMs`   | 99th percentile write latency | <10ms  | Gauge   |
| `performance.avgCompressionRatio` | Average compression ratio     | >2x    | Gauge   |
| `performance.uptimeMs`            | Service uptime                | -      | Gauge   |

## Integration Examples

### Express.js Metrics Endpoint

```typescript
import express from "express";
import { cacheService } from "./performance/cache.service";

const app = express();

// Basic metrics
app.get("/metrics/cache", async (req, res) => {
  const stats = await cacheService.getStats();
  res.json(stats);
});

// Dashboard format
app.get("/metrics/cache/dashboard", async (req, res) => {
  const dashboard = await cacheService.getMetricsDashboard();
  res.json(dashboard);
});

// Prometheus format
app.get("/metrics", async (req, res) => {
  const dashboard = await cacheService.getMetricsDashboard();

  const prometheus = `
# HELP cache_l1_hit_rate_percent L1 cache hit rate
# TYPE cache_l1_hit_rate_percent gauge
cache_l1_hit_rate_percent ${dashboard.cache.l1_hit_rate_percent}

# HELP cache_l1_p95_latency_ms L1 p95 latency in milliseconds
# TYPE cache_l1_p95_latency_ms gauge
cache_l1_p95_latency_ms ${dashboard.cache.l1_p95_latency_ms}

# HELP cache_eviction_count Total LRU evictions
# TYPE cache_eviction_count counter
cache_eviction_count ${dashboard.cache.eviction_count}
  `.trim();

  res.set("Content-Type", "text/plain");
  res.send(prometheus);
});
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Cache Performance",
    "panels": [
      {
        "title": "L1 Hit Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "cache_l1_hit_rate_percent",
            "legendFormat": "Hit Rate %"
          }
        ],
        "yaxes": [
          {
            "format": "percent",
            "min": 0,
            "max": 100
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": {
                "params": [90],
                "type": "lt"
              },
              "operator": {
                "type": "and"
              },
              "query": {
                "params": ["A", "5m", "now"]
              },
              "reducer": {
                "params": [],
                "type": "avg"
              },
              "type": "query"
            }
          ],
          "name": "Low Cache Hit Rate"
        }
      },
      {
        "title": "Latency Distribution",
        "type": "graph",
        "targets": [
          {
            "expr": "cache_l1_avg_latency_ms",
            "legendFormat": "L1 Avg"
          },
          {
            "expr": "cache_l1_p95_latency_ms",
            "legendFormat": "L1 p95"
          },
          {
            "expr": "cache_l1_p99_latency_ms",
            "legendFormat": "L1 p99"
          }
        ],
        "yaxes": [
          {
            "format": "ms",
            "label": "Latency"
          }
        ]
      },
      {
        "title": "Eviction Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(cache_eviction_count[5m])",
            "legendFormat": "Evictions/sec"
          }
        ]
      }
    ]
  }
}
```

### Prometheus Alerts

```yaml
groups:
  - name: cache_performance
    interval: 30s
    rules:
      # Hit Rate Alert
      - alert: LowCacheHitRate
        expr: cache_l1_hit_rate_percent < 90
        for: 5m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "L1 cache hit rate below target"
          description: "L1 hit rate is {{ $value }}%, target is >=90%"

      # Latency Alert
      - alert: HighCacheLatency
        expr: cache_l1_p95_latency_ms > 2
        for: 5m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "L1 p95 latency exceeds target"
          description: "L1 p95 latency is {{ $value }}ms, target is <2ms"

      # Eviction Rate Alert
      - alert: HighEvictionRate
        expr: rate(cache_eviction_count[5m]) > 10
        for: 5m
        labels:
          severity: info
          component: cache
        annotations:
          summary: "High cache eviction rate"
          description: "Eviction rate is {{ $value }}/sec, consider increasing cache size"

      # Write Latency Alert
      - alert: HighWriteLatency
        expr: cache_write_p95_latency_ms > 5
        for: 5m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "Write p95 latency exceeds target"
          description: "Write p95 latency is {{ $value }}ms, target is <5ms"
```

### CloudWatch Metrics

```typescript
import { CloudWatch } from "aws-sdk";

const cloudwatch = new CloudWatch();

async function publishCacheMetrics() {
  const dashboard = await cacheService.getMetricsDashboard();

  await cloudwatch
    .putMetricData({
      Namespace: "Application/Cache",
      MetricData: [
        {
          MetricName: "L1HitRate",
          Value: dashboard.cache.l1_hit_rate_percent,
          Unit: "Percent",
          Timestamp: new Date(),
        },
        {
          MetricName: "L1P95Latency",
          Value: dashboard.cache.l1_p95_latency_ms,
          Unit: "Milliseconds",
          Timestamp: new Date(),
        },
        {
          MetricName: "EvictionCount",
          Value: dashboard.cache.eviction_count,
          Unit: "Count",
          Timestamp: new Date(),
        },
      ],
    })
    .promise();
}

// Publish every minute
setInterval(publishCacheMetrics, 60000);
```

### Datadog Integration

```typescript
import { StatsD } from "node-statsd";

const statsd = new StatsD({
  host: "localhost",
  port: 8125,
  prefix: "cache.",
});

async function publishToDatadog() {
  const dashboard = await cacheService.getMetricsDashboard();

  statsd.gauge("l1.hit_rate", dashboard.cache.l1_hit_rate_percent);
  statsd.gauge("l1.p95_latency", dashboard.cache.l1_p95_latency_ms);
  statsd.gauge("l1.p99_latency", dashboard.cache.l1_p99_latency_ms);
  statsd.gauge("l2.p95_latency", dashboard.cache.l2_p95_latency_ms);
  statsd.increment("evictions", dashboard.cache.eviction_count);
  statsd.gauge("compression.ratio", dashboard.cache.compression_ratio);
}

setInterval(publishToDatadog, 10000); // Every 10 seconds
```

## Interpreting Metrics

### Hit Rate Analysis

**Healthy**:

- L1: 90-95% (working set fits in cache)
- L2: 50-70% (warm data in Redis)

**Action Required**:

- L1 <80%: Working set too large, increase L1_MAX_SIZE
- L2 <30%: Cold access pattern or TTL too short

### Latency Analysis

**Healthy**:

- L1 p95: <2ms
- L1 p99: <5ms
- L2 p95: <15ms
- Write p95: <5ms

**Action Required**:

- L1 >5ms: Memory pressure or GC issues
- L2 >30ms: Redis network issues or overload
- Write >10ms: Compression taking too long

### Eviction Analysis

**Healthy**:

- Steady low rate (cache sized correctly)
- Increases with traffic (proportional)

**Action Required**:

- High constant rate: Cache too small
- Spiky rate: Bursty access pattern
- Zero evictions: Cache underutilized

## Performance Baselines

### Expected Values (Production)

```typescript
{
  l1: {
    hitRate: 90-95%,
    avgLatencyMs: 0.3-0.8ms,
    p95LatencyMs: 0.8-2ms,
    p99LatencyMs: 1.5-5ms,
  },
  l2: {
    hitRate: 50-70%,
    avgLatencyMs: 5-10ms,
    p95LatencyMs: 10-15ms,
    p99LatencyMs: 15-30ms,
  },
  performance: {
    avgWriteLatencyMs: 1-3ms,
    p95WriteLatencyMs: 3-5ms,
    avgCompressionRatio: 2-3x,
  }
}
```

### Anomaly Detection

```typescript
async function detectAnomalies() {
  const dashboard = await cacheService.getMetricsDashboard();
  const anomalies: string[] = [];

  // Hit rate too low
  if (dashboard.cache.l1_hit_rate_percent < 80) {
    anomalies.push(
      `L1 hit rate ${dashboard.cache.l1_hit_rate_percent}% below 80%`,
    );
  }

  // Latency too high
  if (dashboard.cache.l1_p95_latency_ms > 3) {
    anomalies.push(
      `L1 p95 latency ${dashboard.cache.l1_p95_latency_ms}ms exceeds 3ms`,
    );
  }

  // High eviction rate
  const evictionRate =
    dashboard.cache.eviction_count / (dashboard.cache.uptime_seconds / 60);
  if (evictionRate > 10) {
    anomalies.push(`High eviction rate: ${evictionRate.toFixed(2)}/min`);
  }

  return anomalies;
}

// Alert on anomalies
setInterval(async () => {
  const anomalies = await detectAnomalies();
  if (anomalies.length > 0) {
    console.error("Cache anomalies detected:", anomalies);
    // Send alert (PagerDuty, Slack, etc.)
  }
}, 60000);
```

## Troubleshooting

### Low Hit Rate

**Symptoms**: L1 hit rate <80%

**Diagnosis**:

```typescript
const stats = await cacheService.getStats();
console.log("Cache Size:", stats.l1.size, "/", stats.l1.maxSize);
console.log("Evictions:", stats.performance.evictionCount);
```

**Solutions**:

1. Increase `L1_MAX_SIZE` if utilization is 100%
2. Analyze access patterns (hot vs. cold keys)
3. Adjust TTL if too aggressive

### High Latency

**Symptoms**: p95 latency >2ms

**Diagnosis**:

```typescript
const dashboard = await cacheService.getMetricsDashboard();
console.log("p95:", dashboard.cache.l1_p95_latency_ms);
console.log("p99:", dashboard.cache.l1_p99_latency_ms);
```

**Solutions**:

1. Check memory pressure (heap usage)
2. Look for GC pauses
3. Verify no blocking operations

### High Eviction Rate

**Symptoms**: Constant evictions

**Diagnosis**:

```typescript
const stats = await cacheService.getStats();
const evictionsPerMin =
  stats.performance.evictionCount / (stats.performance.uptimeMs / 60000);
console.log("Evictions/min:", evictionsPerMin);
```

**Solutions**:

1. Increase cache size
2. Optimize data structures (smaller values)
3. Review access patterns

## Best Practices

1. **Monitor Continuously**: Track metrics in production
2. **Set Alerts**: p95 latency, hit rate, eviction rate
3. **Baseline Normal**: Know your typical values
4. **Review Regularly**: Weekly metric reviews
5. **Test Changes**: Before/after comparisons

## Summary

The cache service provides **elite-level observability** with:

- ✅ Comprehensive metrics (hit rates, latencies, evictions)
- ✅ Percentile tracking (p95, p99)
- ✅ Dashboard-ready exports
- ✅ Monitoring tool integrations
- ✅ Anomaly detection support

**Production-ready monitoring for world-class performance.**
