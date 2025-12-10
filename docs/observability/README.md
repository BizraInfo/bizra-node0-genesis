# Observability Stack Documentation

## Overview

Production-grade observability stack for the BIZRA platform with Prometheus, Grafana, OpenTelemetry, and comprehensive monitoring.

**Target SLO**: 99.9% uptime (43.2 minutes downtime/month)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Logger     │  │   Metrics    │  │    Tracer    │      │
│  │  (Winston)   │  │ (Prometheus) │  │   (OTEL)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Collection Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Prometheus  │  │ OTEL Collect │  │    Sentry    │      │
│  │   Scraper    │  │   (4318)     │  │  Error Track │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Visualization Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Grafana    │  │   Jaeger     │  │ Alertmanager │      │
│  │  Dashboards  │  │    Traces    │  │   + PagerDuty│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install winston prom-client @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @sentry/node @sentry/profiling-node
```

### 2. Start Monitoring Stack

```bash
cd monitoring/docker
docker-compose up -d
```

**Services**:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Alertmanager: http://localhost:9093
- Jaeger UI: http://localhost:16686

### 3. Integrate in Application

```typescript
import { initializeObservability, setupObservability } from "./observability";

// Initialize
await initializeObservability();

// Setup Express middleware
setupObservability(app);
```

### 4. Register Health Checks

```typescript
import {
  registerHealthCheck,
  createDatabaseHealthCheck,
  createRedisHealthCheck,
} from "./observability";

// Register health checkers
registerHealthCheck("database", createDatabaseHealthCheck(pool));
registerHealthCheck("redis", createRedisHealthCheck(redis));
```

## Components

### 1. Structured Logging

**File**: `/src/observability/logger.ts`

Features:

- JSON structured logging in production
- Colored console output in development
- Automatic trace ID injection
- Log levels: error, warn, info, http, debug, trace
- Automatic log rotation

**Usage**:

```typescript
import { logger, logBusinessEvent, logSecurityEvent } from "./observability";

logger.info("User registered", { userId, email, tier });
logBusinessEvent("subscription_created", { tier, amount }, userId);
logSecurityEvent("failed_login", "high", { ip, username });
```

### 2. Prometheus Metrics

**File**: `/src/observability/metrics.ts`

**Metric Types**:

- HTTP: Request rate, latency, errors
- Database: Query performance, pool stats
- Business: Validations, users, revenue
- System: Memory, CPU, event loop lag

**Usage**:

```typescript
import { trackDbQuery, trackBusinessEvent } from "./observability";

// Track database query
await trackDbQuery("SELECT", "users", async () => {
  return await pool.query("SELECT * FROM users");
});

// Track business event
trackBusinessEvent("user_registration", { source: "web", tier: "free" });
```

### 3. Distributed Tracing

**File**: `/src/observability/tracer.ts`

Features:

- OpenTelemetry distributed tracing
- Automatic HTTP/DB instrumentation
- Trace context propagation
- Integration with Jaeger

**Usage**:

```typescript
import { withSpan, traceDbOperation, traceApiCall } from "./observability";

// Wrap operation in span
await withSpan(
  "process_payment",
  async (span) => {
    span.setAttribute("payment_id", paymentId);
    span.setAttribute("amount", amount);

    return await processPayment(paymentId);
  },
  { user_id: userId },
);

// Trace DB operation
await traceDbOperation("INSERT", "payments", async () => {
  return await db.insert("payments", data);
});
```

### 4. Health Checks

**File**: `/src/observability/health-check.ts`

**Endpoints**:

- `GET /health` - Basic health check
- `GET /health/detailed` - Full health with dependencies
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/startup` - Kubernetes startup probe

**Custom Health Checks**:

```typescript
registerHealthCheck("my-service", async () => {
  const isHealthy = await checkMyService();
  return {
    status: isHealthy ? "pass" : "fail",
    responseTime: 42,
    message: isHealthy ? undefined : "Service unavailable",
  };
});
```

### 5. Sentry Error Tracking

**File**: `/src/observability/sentry.ts`

Features:

- Automatic error capture
- Performance profiling
- User context tracking
- Breadcrumb tracking
- Release tracking

**Usage**:

```typescript
import { captureException, setUser, addBreadcrumb } from "./observability";

// Capture exception
try {
  await riskyOperation();
} catch (error) {
  captureException(error, { operation: "payment", amount });
  throw error;
}

// Set user context
setUser({ id: userId, email, tier });

// Add breadcrumb
addBreadcrumb("payment", "Payment initiated", { amount, method });
```

## Dashboards

### 1. API Performance Dashboard

**File**: `/monitoring/grafana/dashboards/api-performance.json`

Metrics:

- Request rate and error rate
- Latency (p50, p95, p99)
- Active connections
- Request/response sizes

### 2. Database Metrics Dashboard

**File**: `/monitoring/grafana/dashboards/database-metrics.json`

Metrics:

- Query latency and error rate
- Connection pool usage
- Cache hit ratio
- Database size growth

### 3. Business Metrics Dashboard

**File**: `/monitoring/grafana/dashboards/business-metrics.json`

Metrics:

- Active users and registrations
- Validation throughput
- Revenue and subscriptions
- Login success rate

### 4. SLO Dashboard

**File**: `/monitoring/grafana/dashboards/slo-dashboard.json`

Metrics:

- 30-day availability (99.9% target)
- Error budget remaining
- Latency SLO compliance
- Service uptime tracking

## Alerting

### Alert Rules

**Files**:

- `/monitoring/alerts/api-alerts.yml` - API performance and availability
- `/monitoring/alerts/database-alerts.yml` - Database health
- `/monitoring/alerts/business-alerts.yml` - Business metrics
- `/monitoring/alerts/slo-alerts.yml` - SLO compliance

### Alert Severity Levels

- **Critical**: Page immediately, major user impact
- **High**: Page during business hours, significant impact
- **Warning**: Notify via Slack, investigate within 4 hours

### PagerDuty Integration

Configure in `/monitoring/alertmanager.yml`:

```yaml
pagerduty_configs:
  - service_key: "${PAGERDUTY_SERVICE_KEY_CRITICAL}"
    severity: "critical"
```

## SLO/SLA Tracking

### Availability SLO: 99.9%

**Error Budget**: 43.2 minutes/month

**Monitoring**:

```promql
# Current availability
(sum(rate(http_requests_total{status_code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))) * 100

# Error budget remaining
((1 - (sum(increase(http_requests_total{status_code=~"5.."}[30d])) / sum(increase(http_requests_total[30d])))) / (1 - 0.999)) * 100
```

### Latency SLO

- **p50 < 200ms**: 99.9% of requests
- **p95 < 500ms**: 99.5% of requests
- **p99 < 2000ms**: 99% of requests

## Deployment

### Environment Variables

```bash
# Prometheus
PROMETHEUS_RETENTION_TIME=30d
PROMETHEUS_RETENTION_SIZE=50GB

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=bizra-api
OTEL_SERVICE_VERSION=1.0.0

# Sentry
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<secure-password>
```

### Docker Compose

```bash
cd monitoring/docker
docker-compose up -d
```

### Kubernetes

Apply manifests:

```bash
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml
kubectl apply -f k8s/alertmanager.yaml
```

## Troubleshooting

### Metrics Not Appearing

1. Check `/metrics` endpoint: `curl http://localhost:3000/metrics`
2. Verify Prometheus scraping: http://localhost:9090/targets
3. Check Prometheus logs: `docker logs prometheus`

### Alerts Not Firing

1. Check alert rules: http://localhost:9090/alerts
2. Verify Alertmanager: http://localhost:9093
3. Check PagerDuty integration key

### Traces Not Showing

1. Verify OTEL collector: `curl http://localhost:13133`
2. Check Jaeger UI: http://localhost:16686
3. Review OTEL collector logs: `docker logs otel-collector`

## Best Practices

1. **Metrics**: Keep label cardinality low (< 100 unique values)
2. **Logging**: Use structured logging with consistent field names
3. **Tracing**: Sample 10% in production, 100% in development
4. **Alerts**: Avoid alert fatigue, focus on actionable alerts
5. **Dashboards**: Build user-focused dashboards, not just technical metrics

## References

- [Metrics Guide](./metrics-guide.md)
- [Alerting Runbook](./alerting-runbook.md)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

## Support

- **Slack**: #observability
- **On-Call**: PagerDuty rotation
- **Runbooks**: `/docs/observability/alerting-runbook.md`
