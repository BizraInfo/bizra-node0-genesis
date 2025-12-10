# Observability Stack Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Winston    │  │  Prom-Client │  │    OTEL SDK  │              │
│  │   Logger     │  │   Metrics    │  │    Tracer    │              │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘              │
│          │                 │                  │                      │
│          │                 │                  │                      │
│  ┌───────▼─────────────────▼──────────────────▼──────┐              │
│  │         Express Middleware Stack                   │              │
│  │  - HTTP Logger  - Metrics  - Tracer - Sentry      │              │
│  └────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Collection & Export Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Prometheus  │  │     OTEL     │  │    Sentry    │              │
│  │   Scraper    │  │  Collector   │  │     API      │              │
│  │   :9090      │  │   :4318      │  │   Cloud      │              │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘              │
│          │                 │                  │                      │
│          ▼                 ▼                  ▼                      │
│  ┌──────────────────────────────────────────────────┐               │
│  │           Time Series & Trace Storage            │               │
│  │  Prometheus TSDB    Jaeger    Sentry Cloud       │               │
│  └──────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Visualization & Alerting Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Grafana    │  │   Jaeger UI  │  │ Alertmanager │              │
│  │  Dashboards  │  │    Traces    │  │  + PagerDuty │              │
│  │   :3001      │  │   :16686     │  │    :9093     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Application Layer

#### Logger (Winston)

- **Purpose**: Structured logging with JSON format
- **Features**:
  - Automatic trace ID injection
  - Log rotation (10MB, 10 files)
  - Log levels: error, warn, info, http, debug, trace
  - Production/development formatters
  - Security event logging
  - Business event logging

#### Metrics (Prom-Client)

- **Purpose**: Prometheus metrics collection
- **Metric Types**:
  - **Counters**: http_requests_total, business_revenue_total
  - **Histograms**: http_request_duration_seconds, db_query_duration_seconds
  - **Gauges**: http_active_connections, business_active_users
- **Custom Business Metrics**:
  - User registrations by tier
  - Validation throughput
  - Revenue tracking
  - Subscription metrics

#### Tracer (OpenTelemetry)

- **Purpose**: Distributed tracing with W3C Trace Context
- **Features**:
  - Automatic HTTP/DB instrumentation
  - Context propagation across services
  - Custom span creation
  - Performance profiling
  - Integration with Jaeger

### 2. Collection & Export Layer

#### Prometheus

- **Port**: 9090
- **Retention**: 30 days, 50GB
- **Scrape Interval**: 15s
- **Targets**:
  - API application (:3000/metrics)
  - Node Exporter (system metrics)
  - PostgreSQL Exporter
  - Redis Exporter
  - OTEL Collector

#### OpenTelemetry Collector

- **Ports**:
  - 4317: OTLP gRPC
  - 4318: OTLP HTTP
  - 8888: Prometheus metrics
  - 13133: Health check
- **Processors**:
  - Batch processor (efficiency)
  - Memory limiter (512MB)
  - Resource processor (attributes)
  - Probabilistic sampler (10%)
- **Exporters**:
  - Prometheus (metrics)
  - Jaeger (traces)
  - Logging (debugging)

#### Sentry

- **Purpose**: Error tracking and performance monitoring
- **Features**:
  - Automatic error capture
  - Performance profiling
  - User context tracking
  - Release tracking
  - Breadcrumb tracking

### 3. Visualization & Alerting Layer

#### Grafana

- **Port**: 3001
- **Features**:
  - Pre-built dashboards (4)
  - Custom query builder
  - Alert visualization
  - Prometheus data source
  - Jaeger integration

#### Jaeger

- **Port**: 16686
- **Purpose**: Trace visualization
- **Features**:
  - Trace timeline view
  - Service dependency graph
  - Performance analytics
  - Trace comparison

#### Alertmanager

- **Port**: 9093
- **Routing**:
  - Critical → PagerDuty (immediate)
  - High → PagerDuty (5min delay)
  - Warning → Slack
- **Features**:
  - Alert grouping
  - Inhibition rules
  - Silencing
  - Time-based routing

## Data Flow

### 1. Request Flow

```
User Request
    │
    ▼
Express App
    │
    ├─→ HTTP Logger (Winston) ──→ logs/combined.log
    │
    ├─→ Metrics Middleware ──→ Prometheus Counter/Histogram
    │
    ├─→ Tracing Middleware ──→ OTEL Collector ──→ Jaeger
    │
    ├─→ Sentry Middleware ──→ Sentry Cloud
    │
    ▼
Route Handler
    │
    ├─→ Database Query ──→ DB Metrics ──→ Prometheus
    │
    ├─→ Business Logic ──→ Business Metrics ──→ Prometheus
    │
    ▼
Response
```

### 2. Metrics Flow

```
Application Metrics
    │
    ├─→ HTTP Metrics (rate, latency, errors)
    ├─→ Database Metrics (query time, pool size)
    ├─→ Business Metrics (users, revenue, validations)
    └─→ System Metrics (memory, CPU, event loop)
    │
    ▼
Prometheus Scraper (:3000/metrics)
    │
    ▼
Prometheus TSDB (retention: 30d)
    │
    ▼
Grafana Dashboards + Alert Rules
    │
    ▼
Alertmanager → PagerDuty / Slack
```

### 3. Trace Flow

```
Request with Trace Context (W3C)
    │
    ▼
OTEL SDK (auto-instrumentation)
    │
    ├─→ HTTP Span (method, url, status)
    ├─→ Database Span (query, table, duration)
    ├─→ Custom Span (business logic)
    │
    ▼
Batch Processor (efficiency)
    │
    ▼
OTEL Collector (:4318)
    │
    ├─→ Sampling (10% in prod)
    ├─→ Attribute filtering
    │
    ▼
Jaeger Backend
    │
    ▼
Jaeger UI (visualization)
```

## Key Design Decisions

### 1. Metric Cardinality Management

**Problem**: High-cardinality labels can explode metric storage

**Solution**:

- Limited label values (< 100 unique per label)
- Avoid user IDs in labels
- Use recording rules for expensive queries

### 2. Sampling Strategy

**Problem**: 100% tracing overhead too high in production

**Solution**:

- 10% sampling in production
- 100% sampling in development
- Head-based sampling (OTEL Collector)
- Future: Tail-based sampling for errors

### 3. Log Aggregation

**Problem**: Logs scattered across multiple files

**Solution**:

- Structured JSON logging
- Automatic trace ID injection
- Future: Ship to ELK/Loki for centralized logging

### 4. Alert Fatigue Prevention

**Problem**: Too many alerts reduce effectiveness

**Solution**:

- Actionable alerts only
- Proper severity levels
- Inhibition rules
- Time-based routing
- 5-10 minute delay for non-critical

### 5. SLO/SLA Tracking

**Problem**: Manual SLO tracking is error-prone

**Solution**:

- Automated 30-day availability calculation
- Error budget burn rate alerts
- SLO dashboard with real-time updates
- Deployment freeze when budget exhausted

## Scalability Considerations

### Current Capacity

- **Traffic**: 1000 req/sec
- **Metrics**: ~5000 time series
- **Traces**: 100 traces/sec (10% sampling)
- **Logs**: 1GB/day

### Scale-Out Strategy

#### Prometheus

- Federation for multiple Prometheus instances
- Remote write to long-term storage (Thanos/Cortex)
- Recording rules for expensive queries

#### OTEL Collector

- Horizontal scaling with load balancer
- Separate collectors per service
- Tail-based sampling at scale

#### Grafana

- Caching layer for dashboards
- Read replicas for queries
- Split dashboards by audience

## Security

### Access Control

- Grafana: Role-based access (Admin, Editor, Viewer)
- Prometheus: Basic auth + reverse proxy
- Alertmanager: IP whitelist

### Data Protection

- PII filtering in logs/traces
- Sensitive headers removed (Authorization, Cookies)
- Encryption in transit (TLS)

### Secrets Management

- Environment variables for credentials
- No hardcoded secrets
- Secret rotation procedures

## Disaster Recovery

### Backup Strategy

- Prometheus snapshots (daily)
- Grafana dashboard backups (git)
- Alert rules versioned (git)

### Recovery Procedures

1. Restore Prometheus from snapshot
2. Reimport Grafana dashboards from git
3. Reapply alert rules
4. Verify metric collection

### RPO/RTO

- **RPO**: 24 hours (daily snapshots)
- **RTO**: 1 hour (automated restore)

## Cost Analysis

### Infrastructure Costs (Monthly)

| Service        | Resources                   | Cost           |
| -------------- | --------------------------- | -------------- |
| Prometheus     | 4 vCPU, 16GB RAM, 100GB SSD | $150           |
| Grafana        | 2 vCPU, 4GB RAM             | $50            |
| OTEL Collector | 2 vCPU, 4GB RAM             | $50            |
| Jaeger         | 2 vCPU, 8GB RAM, 50GB SSD   | $80            |
| Alertmanager   | 1 vCPU, 2GB RAM             | $25            |
| **Total**      |                             | **$355/month** |

### SaaS Costs

- **Sentry**: $26/month (Developer plan)
- **PagerDuty**: $21/user/month
- **Total SaaS**: $47/month

**Total Monthly Cost**: ~$400

## Performance Impact

### Application Overhead

- **Logging**: < 1ms per request
- **Metrics**: < 0.5ms per request
- **Tracing**: 2-5ms per request (with sampling)
- **Total Overhead**: < 10ms per request (~2% of typical response time)

### Resource Usage

- **Memory**: +50MB (instrumentation libraries)
- **CPU**: +5% (metric collection)
- **Network**: +10KB per request (trace export)

## Future Enhancements

### Phase 2 (Q2 2025)

- [ ] Centralized logging with Loki
- [ ] Tail-based sampling for traces
- [ ] Custom Grafana plugins
- [ ] Automated anomaly detection

### Phase 3 (Q3 2025)

- [ ] Machine learning for alert prediction
- [ ] Distributed tracing across cloud providers
- [ ] Cost optimization dashboard
- [ ] Self-healing automation

## References

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/)
- [Google SRE Book](https://sre.google/books/)
- [Grafana Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
