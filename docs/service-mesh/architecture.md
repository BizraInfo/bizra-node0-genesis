# Service Mesh Architecture

## Overview

This service mesh implementation provides Netflix-grade resilience patterns for microservices communication, including service discovery, load balancing, circuit breaking, retry logic, and health checking.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Service Mesh Client                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │   Service     │  │     Load     │  │    Circuit      │      │
│  │   Discovery   │─▶│   Balancer   │─▶│    Breaker      │      │
│  └───────────────┘  └──────────────┘  └─────────────────┘      │
│         │                   │                    │               │
│         │                   │                    │               │
│  ┌─────▼────────┐  ┌───────▼──────┐  ┌─────────▼────────┐     │
│  │   Consul/    │  │   Session    │  │     Retry        │     │
│  │  Kubernetes  │  │   Affinity   │  │   Middleware     │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Health Check Manager                        │   │
│  │  • Liveness Probes  • Readiness Probes  • Startup      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              mTLS & Security Layer                       │   │
│  │  • Certificate Management  • Mutual TLS  • Verification │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Target Service  │
                    │   Instances      │
                    └──────────────────┘
```

## Core Components

### 1. Service Discovery

**Purpose**: Locate and track service instances across the infrastructure.

**Features**:

- Multi-backend support (Consul, Kubernetes DNS, Custom)
- Automatic health checking
- Instance caching with TTL
- Real-time service change detection
- Metadata-based filtering

**Backends**:

- **Consul**: Full-featured service registry with health checks
- **Kubernetes**: Native DNS-based discovery via Service resources
- **Custom**: Extensible for etcd, Redis, or database-backed registries

**Implementation**:

```typescript
const discovery = new ServiceDiscovery({
  backend: "consul",
  consulUrl: "http://consul:8500",
  refreshInterval: 30000,
  healthCheckInterval: 10000,
});

const instances = await discovery.discoverService("api-service");
```

### 2. Load Balancer

**Purpose**: Distribute traffic across healthy service instances.

**Strategies**:

- **Round Robin**: Sequential distribution
- **Least Connections**: Favor instances with fewer active connections
- **Random**: Random selection
- **Weighted Round Robin**: Weight-based distribution
- **IP Hash**: Consistent hashing for client affinity
- **Least Response Time**: Performance-based selection

**Features**:

- Session affinity (sticky sessions)
- Connection tracking
- Real-time metrics
- Automatic unhealthy instance exclusion
- Max connections per instance

**Implementation**:

```typescript
const loadBalancer = new LoadBalancer({
  strategy: "least-response-time",
  sessionAffinity: true,
  maxConnectionsPerInstance: 500,
});

const instance = loadBalancer.selectInstance(instances, clientId);
```

### 3. Circuit Breaker

**Purpose**: Prevent cascade failures by failing fast when services are unhealthy.

**States**:

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service unhealthy, requests fail immediately
- **HALF_OPEN**: Testing recovery, limited requests allowed

**Features**:

- Configurable failure thresholds (count and percentage)
- Rolling window for failure tracking
- Automatic state transitions
- Fallback support
- Volume threshold (minimum requests before evaluation)
- Detailed metrics and events

**State Transitions**:

```
CLOSED ──(failures > threshold)──▶ OPEN
  ▲                                  │
  │                                  │
  │                             (timeout)
  │                                  │
  │                                  ▼
  └───(successes > threshold)─── HALF_OPEN
```

**Implementation**:

```typescript
const circuitBreaker = new CircuitBreaker("api-service", {
  failureThreshold: 20,
  failureThresholdPercentage: 30,
  timeout: 3000,
  resetTimeout: 120000,
  fallbackEnabled: true,
});

const result = await circuitBreaker.execute(
  () => makeRequest(),
  () => fallbackResponse(),
);
```

### 4. Retry Middleware

**Purpose**: Automatically retry failed requests with intelligent backoff.

**Backoff Strategies**:

- **Exponential**: delay = initialDelay × (multiplier ^ attempt)
- **Linear**: delay = initialDelay × attempt
- **Constant**: delay = initialDelay
- **Fibonacci**: delay = initialDelay × fibonacci(attempt)

**Features**:

- Configurable max retries
- Jitter to prevent thundering herd
- Retryable error/status code filtering
- Custom retry conditions
- Detailed metrics

**Implementation**:

```typescript
const retry = new RetryMiddleware({
  maxRetries: 10,
  initialDelay: 500,
  maxDelay: 30000,
  backoffStrategy: "fibonacci",
  jitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
});

const result = await retry.execute(() => makeRequest());
```

### 5. Health Check Manager

**Purpose**: Monitor service health through Kubernetes-style probes.

**Probe Types**:

- **Liveness**: Is the service alive? (restart if failing)
- **Readiness**: Is the service ready to handle requests?
- **Startup**: Has the service completed initialization?

**Features**:

- Multiple concurrent health checks
- Configurable intervals and timeouts
- Threshold-based status changes
- Common health check implementations
- Event-driven monitoring

**Common Health Checks**:

- Database connectivity
- Memory usage
- Disk space
- External service dependencies

**Implementation**:

```typescript
const healthManager = new HealthCheckManager({
  livenessInterval: 5000,
  readinessInterval: 3000,
  failureThreshold: 5,
});

healthManager.registerCheck(
  CommonHealthChecks.database("postgres", checkPostgresConnection, true),
);

healthManager.registerCheck(CommonHealthChecks.memory("memory-usage", 90));

await healthManager.start();
```

### 6. mTLS (Mutual TLS)

**Purpose**: Secure service-to-service communication with mutual authentication.

**Features**:

- Certificate-based authentication
- Peer verification
- Support for custom CA
- Automatic certificate rotation (with cert-manager)

**Implementation**:

```typescript
const config = {
  mtls: {
    enabled: true,
    certPath: "/etc/certs/tls.crt",
    keyPath: "/etc/certs/tls.key",
    caPath: "/etc/certs/ca.crt",
    verifyPeer: true,
  },
};
```

## Integration

### Complete Service Mesh Client

```typescript
import { createServiceMeshClient } from "./service-mesh";

// Create client with configuration
const meshClient = createServiceMeshClient("api-gateway");

// Initialize
await meshClient.initialize();

// Register service
await meshClient.registerService({
  id: "api-gateway-1",
  name: "api-gateway",
  address: "10.0.0.1",
  port: 8080,
  tags: ["v1", "production"],
});

// Make requests with full resilience
const response = await meshClient.get("user-service", "/api/users", {
  clientId: "client-123", // For session affinity
});

// Health endpoints
app.get("/health/live", (req, res) => {
  const liveness = meshClient.getLiveness();
  res.status(liveness.status === "healthy" ? 200 : 503).json(liveness);
});

app.get("/health/ready", (req, res) => {
  const readiness = meshClient.getReadiness();
  res.status(readiness.status === "healthy" ? 200 : 503).json(readiness);
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  res.json(meshClient.getMetrics());
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await meshClient.deregisterService("api-gateway-1");
  await meshClient.shutdown();
  process.exit(0);
});
```

## Kubernetes Integration

### Service Mesh with Istio

The implementation supports multiple service mesh platforms:

1. **Istio**: Complete traffic management with VirtualService, DestinationRule
2. **Linkerd**: Lightweight with TrafficSplit and HTTPRoute
3. **Consul**: HashiCorp's service mesh with native Consul integration

### Example Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  template:
    metadata:
      labels:
        app: api-service
        version: v1
      annotations:
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: api-service
      containers:
        - name: api-service
          image: api-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: SERVICE_NAME
              value: "api-service"
            - name: CONSUL_URL
              value: "http://consul:8500"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

## Configuration

### Environment-Specific Settings

- **Development**: Relaxed thresholds, verbose logging
- **Staging**: Production-like with faster timeouts
- **Production**: Strict thresholds, optimized for reliability

### Service-Specific Overrides

Different services have different requirements:

- **API Gateway**: Weighted load balancing, high rate limits
- **Auth Service**: Strict circuit breaker, moderate retries
- **Payment Service**: Conservative circuit breaker, aggressive retries
- **Notification Service**: Fallbacks enabled, extensive retries

## Monitoring and Observability

### Metrics Exported

- **Load Balancer**: Connection counts, response times, distribution
- **Circuit Breaker**: State transitions, error rates, rejection counts
- **Retry**: Attempt counts, success rates, total delays
- **Health Checks**: Check results, failure rates, probe timings

### Events

All components emit events for monitoring:

```typescript
meshClient.on(
  "request-success",
  ({ serviceName, instanceId, responseTime }) => {
    metrics.recordRequestSuccess(serviceName, responseTime);
  },
);

meshClient.on("service-mesh:retry:max-reached", ({ context, error }) => {
  logger.error("Max retries reached", { context, error });
  alerts.send("retry-exhausted", { context });
});

meshClient.on("service-mesh:health:check-failed", ({ name, error }) => {
  logger.warn("Health check failed", { name, error });
});
```

## Best Practices

1. **Start Conservative**: Begin with relaxed thresholds, tighten based on metrics
2. **Monitor Everything**: Use events and metrics for observability
3. **Test Failure Scenarios**: Chaos engineering to validate resilience
4. **Service-Specific Tuning**: Different services need different configurations
5. **Gradual Rollout**: Canary deployments with traffic splitting
6. **Health Check Hierarchy**: Critical checks affect overall status
7. **Fallback Strategies**: Always provide fallbacks for non-critical operations
8. **Circuit Breaker Granularity**: Per-service or per-endpoint based on criticality

## Performance Considerations

- **Connection Pooling**: Reuse HTTP connections
- **Caching**: Instance discovery results cached with TTL
- **Async Operations**: All I/O operations are non-blocking
- **Event Loop**: Minimal blocking, leverages Node.js event loop
- **Memory Management**: Limited history buffers, periodic cleanup

## Security

- **mTLS**: Mutual authentication between services
- **Certificate Rotation**: Automatic with cert-manager
- **Network Policies**: Kubernetes NetworkPolicy for traffic control
- **RBAC**: ServiceAccounts with least-privilege access
- **Secrets Management**: Never hardcode certificates

## Next Steps

See [Resilience Patterns](./resilience-patterns.md) for detailed patterns and usage examples.
