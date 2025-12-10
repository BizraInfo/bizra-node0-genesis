# Service Mesh Implementation

A production-grade service mesh implementation with Netflix-inspired resilience patterns for Node.js microservices.

## Features

### Core Components

- **Service Discovery**: Multi-backend support (Consul, Kubernetes DNS, Custom)
- **Load Balancing**: 6 strategies (Round Robin, Least Connections, Weighted, IP Hash, Least Response Time, Random)
- **Circuit Breaker**: Hystrix-inspired with CLOSED/OPEN/HALF_OPEN states
- **Retry Logic**: Exponential backoff with jitter and multiple strategies
- **Health Checks**: Kubernetes-style liveness, readiness, and startup probes
- **mTLS**: Mutual TLS for secure service-to-service communication

### Resilience Patterns

✅ Circuit Breaker with fallback
✅ Retry with exponential backoff
✅ Request timeout
✅ Bulkhead isolation
✅ Health-based routing
✅ Session affinity
✅ Graceful degradation

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```typescript
import { createServiceMeshClient } from "./src/service-mesh";

// Create client
const meshClient = createServiceMeshClient("my-service");

// Initialize
await meshClient.initialize();

// Make resilient requests
const response = await meshClient.get("user-service", "/api/users");
```

### Express Integration

```typescript
import express from "express";
import { createServiceMeshClient } from "./src/service-mesh";

const app = express();
const meshClient = createServiceMeshClient("api-gateway");

await meshClient.initialize();

// Health endpoints
app.get("/health/live", (req, res) => {
  const liveness = meshClient.getLiveness();
  res.status(liveness.status === "healthy" ? 200 : 503).json(liveness);
});

app.get("/health/ready", (req, res) => {
  const readiness = meshClient.getReadiness();
  res.status(readiness.status === "healthy" ? 200 : 503).json(readiness);
});

// API with service mesh
app.get("/api/users", async (req, res) => {
  try {
    const response = await meshClient.get("user-service", "/api/users");
    res.json(response.data);
  } catch (error) {
    res.status(503).json({ error: "Service unavailable" });
  }
});

app.listen(8080);
```

## Configuration

### Environment-Based Configuration

```typescript
// Development
NODE_ENV = development;

// Staging
NODE_ENV = staging;

// Production
NODE_ENV = production;
```

### Service-Specific Configuration

```typescript
import { getServiceConfig } from "./config/service-mesh/service-mesh.config";

const config = getServiceConfig("api-gateway");
const meshClient = new ServiceMeshClient(config);
```

### Configuration Options

```typescript
{
  serviceName: 'my-service',
  environment: 'production',

  discovery: {
    backend: 'consul',
    consulUrl: 'http://consul:8500',
    refreshInterval: 15000,
  },

  loadBalancer: {
    strategy: 'least-response-time',
    sessionAffinity: true,
    maxConnectionsPerInstance: 500,
  },

  circuitBreaker: {
    failureThreshold: 20,
    failureThresholdPercentage: 30,
    timeout: 3000,
    resetTimeout: 120000,
    fallbackEnabled: true,
  },

  retry: {
    maxRetries: 10,
    initialDelay: 500,
    maxDelay: 30000,
    backoffStrategy: 'fibonacci',
  },

  healthCheck: {
    livenessInterval: 5000,
    readinessInterval: 3000,
    failureThreshold: 5,
  },

  mtls: {
    enabled: true,
    certPath: '/etc/certs/tls.crt',
    keyPath: '/etc/certs/tls.key',
    caPath: '/etc/certs/ca.crt',
  },
}
```

## Kubernetes Deployment

### Deploy Service Mesh Resources

```bash
kubectl apply -f infrastructure/k8s/service-mesh/
```

### Resources Created

- VirtualService (Istio) for traffic routing
- DestinationRule for circuit breaker and load balancing
- PeerAuthentication for mTLS
- NetworkPolicy for security
- ServiceAccount for authentication

### Example Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  template:
    metadata:
      annotations:
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: api-service
      containers:
        - name: api-service
          image: api-service:latest
          env:
            - name: SERVICE_NAME
              value: "api-service"
            - name: CONSUL_URL
              value: "http://consul:8500"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
```

## Architecture

```
┌─────────────────────────────────────────┐
│       Service Mesh Client               │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐  ┌───────────┐           │
│  │ Service  │→ │   Load    │           │
│  │Discovery │  │ Balancer  │           │
│  └──────────┘  └───────────┘           │
│        ↓              ↓                  │
│  ┌──────────┐  ┌───────────┐           │
│  │ Circuit  │→ │  Retry    │           │
│  │ Breaker  │  │Middleware │           │
│  └──────────┘  └───────────┘           │
│                                          │
│  ┌────────────────────────────┐        │
│  │   Health Check Manager     │        │
│  └────────────────────────────┘        │
│                                          │
│  ┌────────────────────────────┐        │
│  │   mTLS & Security          │        │
│  └────────────────────────────┘        │
└─────────────────────────────────────────┘
                 ↓
        ┌────────────────┐
        │Target Service  │
        └────────────────┘
```

## Examples

See `examples/service-mesh-usage.ts` for comprehensive examples:

1. Basic setup
2. Making resilient requests
3. Express integration
4. Event monitoring
5. Custom health checks
6. Multi-service orchestration
7. Canary deployments

## Testing

```bash
npm test
```

Tests cover:

- Service discovery
- Load balancing strategies
- Circuit breaker state transitions
- Retry logic with backoff
- Health check management

## Documentation

- [Architecture](docs/service-mesh/architecture.md) - Detailed architecture and design
- [Resilience Patterns](docs/service-mesh/resilience-patterns.md) - Pattern catalog and examples

## Monitoring

### Metrics

```typescript
const metrics = meshClient.getMetrics();

console.log({
  loadBalancer: metrics.loadBalancer,
  circuitBreakers: metrics.circuitBreakers,
  retry: metrics.retry,
});
```

### Events

```typescript
meshClient.on("request-success", ({ serviceName, responseTime }) => {
  console.log(`${serviceName} responded in ${responseTime}ms`);
});

meshClient.on("service-mesh:retry:max-reached", ({ context }) => {
  console.error(`Max retries reached for ${context}`);
});
```

## Best Practices

1. **Start Conservative**: Begin with relaxed thresholds
2. **Monitor Everything**: Use events and metrics
3. **Test Failures**: Chaos engineering
4. **Service-Specific Tuning**: Different services need different configs
5. **Gradual Rollout**: Canary deployments
6. **Fallback Strategies**: Always provide fallbacks
7. **Health Check Hierarchy**: Critical checks affect overall status

## Production Checklist

- [ ] Circuit breakers for all external dependencies
- [ ] Retry logic with exponential backoff
- [ ] Timeouts < 5s
- [ ] Health checks for critical dependencies
- [ ] Fallbacks for non-critical operations
- [ ] mTLS enabled
- [ ] Metrics exported
- [ ] Alerts configured
- [ ] Chaos tests in CI/CD
- [ ] Runbooks documented

## License

MIT

## Contributing

Pull requests welcome! Please read CONTRIBUTING.md first.
