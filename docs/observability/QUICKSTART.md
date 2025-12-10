# Observability Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
npm install --save \
  winston \
  prom-client \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @sentry/node \
  @sentry/profiling-node
```

### Step 2: Start Monitoring Stack

```bash
cd monitoring/docker
cp ../.env.example .env
# Edit .env with your configuration
docker-compose up -d
```

Verify services:

```bash
docker-compose ps
```

### Step 3: Initialize in Application

```typescript
// src/app.ts
import express from "express";
import { initializeObservability, setupObservability } from "./observability";

const app = express();

// Initialize observability (before anything else)
await initializeObservability();

// Apply observability middleware
setupObservability(app);

// Your routes here
app.get("/api/users", async (req, res) => {
  // Automatically traced and logged
  const users = await db.query("SELECT * FROM users");
  res.json(users);
});

// Start server
const server = app.listen(3000);

// Graceful shutdown
process.on("SIGTERM", async () => {
  const { shutdownObservability } = await import("./observability");
  await shutdownObservability();
  server.close();
});
```

### Step 4: Access Dashboards

Open your browser:

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Alertmanager**: http://localhost:9093

### Step 5: Import Grafana Dashboards

1. Go to Grafana: http://localhost:3001
2. Login (admin/admin)
3. Go to Dashboards → Import
4. Upload JSON files from `/monitoring/grafana/dashboards/`
   - `api-performance.json`
   - `database-metrics.json`
   - `business-metrics.json`
   - `slo-dashboard.json`

## Common Use Cases

### Track Business Event

```typescript
import { trackBusinessEvent } from "./observability";

// Track user registration
trackBusinessEvent("user_registration", {
  source: "web",
  tier: "free",
});
```

### Log with Context

```typescript
import { logger } from "./observability";

logger.info("Payment processed", {
  userId: user.id,
  amount: payment.amount,
  currency: "USD",
  paymentId: payment.id,
});
```

### Trace Async Operation

```typescript
import { withSpan } from "./observability";

await withSpan("process_order", async (span) => {
  span.setAttribute("order_id", orderId);
  span.setAttribute("items_count", items.length);

  const result = await processOrder(orderId);
  return result;
});
```

### Track Database Query

```typescript
import { trackDbQuery } from "./observability";

const users = await trackDbQuery("SELECT", "users", async () => {
  return await pool.query("SELECT * FROM users WHERE active = true");
});
```

### Capture Exception

```typescript
import { captureException } from "./observability";

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    operation: "payment_processing",
    userId,
    amount,
  });
  throw error;
}
```

### Register Health Check

```typescript
import { registerHealthCheck } from "./observability";

registerHealthCheck("payment-service", async () => {
  try {
    await fetch("https://payment-api.example.com/health");
    return { status: "pass", responseTime: 42 };
  } catch (error) {
    return { status: "fail", message: error.message };
  }
});
```

## Verify Setup

### 1. Check Metrics Endpoint

```bash
curl http://localhost:3000/metrics
```

Should return Prometheus metrics.

### 2. Check Health Endpoint

```bash
curl http://localhost:3000/health/detailed
```

Should return JSON with health status.

### 3. Generate Test Traffic

```bash
# Install Apache Bench
apt-get install apache2-utils

# Generate load
ab -n 1000 -c 10 http://localhost:3000/api/users
```

### 4. View Metrics in Grafana

1. Go to http://localhost:3001
2. Open "API Performance" dashboard
3. You should see request rate and latency graphs

### 5. Test Alerting

Simulate high error rate:

```bash
for i in {1..100}; do
  curl http://localhost:3000/api/nonexistent
done
```

Check alerts: http://localhost:9093

## Production Checklist

- [ ] Configure SENTRY_DSN environment variable
- [ ] Set up PagerDuty integration keys
- [ ] Configure Slack webhook for alerts
- [ ] Set strong Grafana admin password
- [ ] Enable HTTPS for all monitoring services
- [ ] Configure persistent volumes for data
- [ ] Set up backup for Grafana dashboards
- [ ] Test alert delivery (PagerDuty, Slack, email)
- [ ] Configure retention policies (30 days default)
- [ ] Set up authentication for Prometheus/Alertmanager
- [ ] Review and adjust alert thresholds
- [ ] Document on-call procedures
- [ ] Train team on runbooks

## Troubleshooting

### Metrics Not Showing

**Problem**: `/metrics` endpoint returns empty or 404

**Solution**:

```typescript
// Ensure metrics middleware is applied
import { metricsMiddleware } from "./observability";
app.use(metricsMiddleware);
```

### Traces Not Appearing in Jaeger

**Problem**: No traces visible in Jaeger UI

**Solution**:

1. Check OTEL collector health: `curl http://localhost:13133`
2. Verify environment variable: `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318`
3. Check OTEL collector logs: `docker logs otel-collector`

### Alerts Not Firing

**Problem**: Alerts not triggering in Alertmanager

**Solution**:

1. Check Prometheus alerts page: http://localhost:9090/alerts
2. Verify alert rules syntax in `/monitoring/alerts/*.yml`
3. Reload Prometheus config: `curl -X POST http://localhost:9090/-/reload`

### High Memory Usage

**Problem**: Prometheus consuming too much memory

**Solution**:

1. Reduce retention time in `prometheus.yml`:
   ```yaml
   storage.tsdb.retention.time: 15d
   storage.tsdb.retention.size: 25GB
   ```
2. Reduce scrape frequency for less critical metrics
3. Use recording rules for expensive queries

## Next Steps

1. **Customize Dashboards**: Modify Grafana dashboards for your needs
2. **Add Custom Metrics**: Instrument critical business logic
3. **Tune Alerts**: Adjust thresholds based on your traffic patterns
4. **Set Up Runbooks**: Document response procedures for each alert
5. **Train Team**: Ensure everyone knows how to use observability tools

## Resources

- [Full Documentation](./README.md)
- [Metrics Guide](./metrics-guide.md)
- [Alerting Runbook](./alerting-runbook.md)
- [Architecture Decision Records](../adr/)

## Support

Questions? Ask in **#observability** Slack channel or consult the on-call engineer.
