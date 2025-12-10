# Service Mesh Resilience Patterns

## Overview

This document describes Netflix-grade resilience patterns implemented in the service mesh, including detailed usage examples and best practices.

## Pattern Catalog

### 1. Circuit Breaker Pattern

**Problem**: Service failures can cascade, overwhelming already struggling services.

**Solution**: Fail fast when a service is unhealthy, giving it time to recover.

**When to Use**:

- External service dependencies
- Database connections
- High-latency operations
- Services with known failure modes

**Example**:

```typescript
// Configure circuit breaker for payment gateway
const circuitBreaker = new CircuitBreaker("payment-gateway", {
  failureThreshold: 5, // Open after 5 failures
  failureThresholdPercentage: 50, // Or 50% error rate
  timeout: 10000, // 10s request timeout
  resetTimeout: 300000, // 5min before HALF_OPEN
  volumeThreshold: 10, // Need 10 requests to evaluate
  halfOpenMaxRequests: 3, // Test with 3 requests
  fallbackEnabled: true,
});

// Execute with fallback
const result = await circuitBreaker.execute(
  async () => {
    return await paymentGateway.processPayment(transaction);
  },
  async () => {
    // Fallback: Queue for async processing
    await paymentQueue.enqueue(transaction);
    return { status: "queued", transactionId: transaction.id };
  },
);

// Monitor state changes
circuitBreaker.on("state-change", ({ from, to, timestamp }) => {
  logger.warn("Circuit breaker state changed", { from, to, timestamp });

  if (to === "OPEN") {
    alerts.send("circuit-breaker-open", { service: "payment-gateway" });
  }
});
```

**Metrics**:

```typescript
const metrics = circuitBreaker.getMetrics();
console.log({
  totalRequests: metrics.totalRequests,
  errorRate: metrics.errorRate,
  currentState: metrics.currentState,
  rejectedRequests: metrics.rejectedRequests,
});
```

### 2. Retry with Exponential Backoff

**Problem**: Transient failures (network hiccups, temporary overload) fail requests unnecessarily.

**Solution**: Retry with increasing delays to avoid overwhelming recovering services.

**When to Use**:

- Network errors (ECONNREFUSED, ETIMEDOUT)
- Rate limiting (429 status)
- Temporary service unavailability (503)
- Database deadlocks

**Example**:

```typescript
// Database retry configuration
const dbRetry = new RetryMiddleware({
  maxRetries: 5,
  initialDelay: 100,
  maxDelay: 5000,
  backoffStrategy: "exponential",
  backoffMultiplier: 2,
  jitter: true,
  jitterFactor: 0.2,
  retryableErrors: ["ECONNREFUSED", "ETIMEDOUT", "deadlock"],

  // Custom retry logic
  shouldRetry: (error, attempt) => {
    // Don't retry validation errors
    if (error.code === "VALIDATION_ERROR") return false;

    // Retry database locks
    if (error.code === "ER_LOCK_DEADLOCK") return true;

    // Default behavior
    return attempt <= 5;
  },

  // Callbacks
  onRetry: (attempt, delay, error) => {
    logger.info("Retrying request", { attempt, delay, error: error.message });
  },

  onMaxRetriesReached: (error) => {
    logger.error("Max retries exceeded", { error });
    alerts.send("retry-exhausted", { error });
  },
});

// Execute with retry
const result = await dbRetry.execute(async () => {
  return await database.query("SELECT * FROM users WHERE id = ?", [userId]);
});

// Or use decorator
class UserService {
  @Retry({
    maxRetries: 3,
    initialDelay: 1000,
    backoffStrategy: "fibonacci",
  })
  async getUserById(userId: string) {
    return await database.query("SELECT * FROM users WHERE id = ?", [userId]);
  }
}
```

**Backoff Comparison**:

```
Attempt | Exponential (2x) | Linear | Fibonacci | Constant
--------|------------------|--------|-----------|----------
1       | 100ms            | 100ms  | 100ms     | 100ms
2       | 200ms            | 200ms  | 100ms     | 100ms
3       | 400ms            | 300ms  | 200ms     | 100ms
4       | 800ms            | 400ms  | 300ms     | 100ms
5       | 1600ms           | 500ms  | 500ms     | 100ms
6       | 3200ms           | 600ms  | 800ms     | 100ms
```

**Presets**:

```typescript
// Network requests
const networkRetry = RetryPresets.networkRequest();

// Database operations
const dbRetry = RetryPresets.databaseOperation();

// Critical operations
const criticalRetry = RetryPresets.criticalOperation();

// Quick retry for fast operations
const quickRetry = RetryPresets.quickRetry();
```

### 3. Bulkhead Pattern

**Problem**: One failing component can consume all resources (connections, threads).

**Solution**: Isolate resources into pools to contain failures.

**Implementation via Load Balancer**:

```typescript
const loadBalancer = new LoadBalancer({
  strategy: "least-connections",
  maxConnectionsPerInstance: 100, // Limit connections per instance
});

// Connection tracking prevents overwhelming instances
loadBalancer.onConnectionStart(instanceId);
try {
  await makeRequest(instance);
} finally {
  loadBalancer.onConnectionEnd(instanceId);
}
```

### 4. Timeout Pattern

**Problem**: Slow responses tie up resources and degrade user experience.

**Solution**: Set aggressive timeouts and fail fast.

**Implementation**:

```typescript
// Circuit breaker includes timeout
const circuitBreaker = new CircuitBreaker("slow-service", {
  timeout: 3000, // 3 second timeout
  failureThreshold: 3,
});

// Timeout applies to each execution
await circuitBreaker.execute(async () => {
  return await slowService.call(); // Will timeout after 3s
});
```

### 5. Fallback Pattern

**Problem**: Service failure leads to complete feature unavailability.

**Solution**: Provide degraded functionality when primary fails.

**Strategies**:

```typescript
// 1. Cached Data Fallback
await circuitBreaker.execute(
  () => userService.getProfile(userId),
  () => cache.get(`user:${userId}`), // Stale data better than none
);

// 2. Default Value Fallback
await circuitBreaker.execute(
  () => recommendationService.getRecommendations(userId),
  () => [], // Empty recommendations
);

// 3. Queue for Async Processing
await circuitBreaker.execute(
  () => emailService.sendEmail(email),
  () => emailQueue.enqueue(email), // Send later
);

// 4. Alternative Service
await circuitBreaker.execute(
  () => primaryPaymentGateway.charge(amount),
  () => backupPaymentGateway.charge(amount),
);

// 5. Static Content
await circuitBreaker.execute(
  () => contentService.getPage(pageId),
  () => staticPages[pageId], // Pre-generated content
);
```

### 6. Health Check Pattern

**Problem**: Routing traffic to unhealthy instances wastes resources.

**Solution**: Continuous health monitoring with automatic removal.

**Kubernetes Integration**:

```typescript
const healthManager = new HealthCheckManager({
  livenessInterval: 5000, // Check every 5s
  readinessInterval: 3000, // Check every 3s
  failureThreshold: 5, // 5 failures before unhealthy
  successThreshold: 2, // 2 successes to recover
});

// Critical dependency: Database
healthManager.registerCheck(
  CommonHealthChecks.database(
    "postgres",
    async () => {
      try {
        await db.query("SELECT 1");
        return true;
      } catch {
        return false;
      }
    },
    true, // Critical: affects readiness
  ),
);

// Non-critical: Memory
healthManager.registerCheck(CommonHealthChecks.memory("memory-usage", 90));

// External dependency: Redis
healthManager.registerCheck(
  CommonHealthChecks.externalService(
    "redis",
    async () => {
      try {
        await redis.ping();
        return true;
      } catch {
        return false;
      }
    },
    false, // Not critical: can operate without cache
  ),
);

// Custom business logic check
healthManager.registerCheck({
  name: "license-validity",
  type: "readiness",
  critical: true,
  check: async () => {
    const license = await getLicense();
    const isValid = license.expiryDate > new Date();

    return {
      status: isValid ? "healthy" : "unhealthy",
      message: isValid ? "License valid" : "License expired",
      timestamp: new Date(),
      metadata: { expiryDate: license.expiryDate },
    };
  },
});

await healthManager.start();
```

**Express Integration**:

```typescript
app.get("/health/live", (req, res) => {
  const liveness = healthManager.getLiveness();
  res.status(liveness.status === "healthy" ? 200 : 503).json(liveness);
});

app.get("/health/ready", (req, res) => {
  const readiness = healthManager.getReadiness();
  res.status(readiness.status === "healthy" ? 200 : 503).json(readiness);
});

app.get("/health", (req, res) => {
  const health = healthManager.getHealth();
  res.status(health.status === "healthy" ? 200 : 503).json(health);
});
```

### 7. Load Balancing Patterns

**Problem**: Uneven distribution leads to hotspots and poor utilization.

**Solution**: Intelligent instance selection based on strategy.

**Strategies**:

```typescript
// 1. Round Robin: Simple, even distribution
const roundRobin = new LoadBalancer({ strategy: "round-robin" });

// 2. Least Connections: For long-lived connections
const leastConn = new LoadBalancer({
  strategy: "least-connections",
  maxConnectionsPerInstance: 500,
});

// 3. Weighted: For heterogeneous instances
const weighted = new LoadBalancer({ strategy: "weighted-round-robin" });
// Instances need metadata.weight

// 4. Least Response Time: Performance-based
const leastRT = new LoadBalancer({ strategy: "least-response-time" });

// 5. IP Hash: Consistent routing per client
const ipHash = new LoadBalancer({
  strategy: "ip-hash",
  sessionAffinity: true,
});

// 6. Random: Simple, no state
const random = new LoadBalancer({ strategy: "random" });
```

**Session Affinity**:

```typescript
const loadBalancer = new LoadBalancer({
  strategy: "round-robin",
  sessionAffinity: true, // Enable sticky sessions
});

// Client ID ensures same instance
const instance = loadBalancer.selectInstance(instances, "user-123");

// Subsequent requests from same user go to same instance
const instance2 = loadBalancer.selectInstance(instances, "user-123");
// instance.id === instance2.id

// Clear session if needed
loadBalancer.clearSession("user-123");
```

### 8. Rate Limiting Pattern

**Problem**: Aggressive clients can overwhelm services.

**Solution**: Limit requests per client/service.

**Implementation** (via Configuration):

```typescript
const config = {
  rateLimit: {
    enabled: true,
    requestsPerSecond: 10000,
    burstSize: 5000,
  },
};
```

### 9. Service Discovery Pattern

**Problem**: Hard-coded endpoints are inflexible and break on changes.

**Solution**: Dynamic service location via registry.

**Multi-Backend Support**:

```typescript
// Consul Discovery
const consulDiscovery = new ServiceDiscovery({
  backend: "consul",
  consulUrl: "http://consul:8500",
  refreshInterval: 15000,
});

// Kubernetes Discovery
const k8sDiscovery = new ServiceDiscovery({
  backend: "kubernetes",
  kubernetesNamespace: "production",
  refreshInterval: 30000,
});

// Watch for changes
discovery.on("service-changed", ({ serviceName, instances, previous }) => {
  logger.info("Service topology changed", {
    serviceName,
    count: instances.length,
    previousCount: previous.length,
  });
});

// Discover and cache
const instances = await discovery.discoverService("api-service");
```

### 10. Chaos Engineering

**Testing Resilience**:

```typescript
// Simulate failures
class ChaosCircuitBreaker extends CircuitBreaker {
  constructor(
    name: string,
    config: CircuitBreakerConfig,
    chaosConfig: {
      failureRate: number;
      latency: number;
    },
  ) {
    super(name, config);
    this.chaosConfig = chaosConfig;
  }

  async execute(fn, fallback) {
    // Inject random failures
    if (Math.random() < this.chaosConfig.failureRate) {
      throw new Error("Chaos: Simulated failure");
    }

    // Inject latency
    await new Promise((r) => setTimeout(r, this.chaosConfig.latency));

    return super.execute(fn, fallback);
  }
}

// Use in testing
const chaosBreaker = new ChaosCircuitBreaker("test-service", config, {
  failureRate: 0.3, // 30% failure rate
  latency: 2000, // 2s added latency
});
```

## Combined Patterns

### Complete Resilience Stack

```typescript
import { createServiceMeshClient } from "./service-mesh";

const meshClient = createServiceMeshClient("api-gateway");
await meshClient.initialize();

// Single request with ALL resilience patterns:
// 1. Service Discovery
// 2. Load Balancing
// 3. Circuit Breaker
// 4. Retry with Backoff
// 5. Timeout
// 6. Health Checking
// 7. mTLS
const response = await meshClient.post(
  "user-service", // Discovered via Consul/K8s
  "/api/users", // Load balanced
  { name: "John" }, // Circuit breaker protects
  { clientId: "client-1" }, // Session affinity
); // Retries on failure
// Times out after 3s
// Only healthy instances
// mTLS encrypted
```

## Best Practices

1. **Defense in Depth**: Layer multiple patterns (circuit breaker + retry + timeout)
2. **Fail Fast**: Don't waste resources on doomed requests
3. **Graceful Degradation**: Fallbacks maintain availability
4. **Monitor Everything**: Metrics and events for observability
5. **Test Failures**: Chaos engineering validates resilience
6. **Tune Thresholds**: Start conservative, tighten based on data
7. **Service-Specific**: Different services need different configurations
8. **Document Decisions**: Why these thresholds? What's the impact?

## Anti-Patterns

❌ **Don't**:

- Retry indefinitely
- Use constant backoff (thundering herd)
- Ignore circuit breaker state
- Set timeouts longer than user patience
- Use global circuit breakers (too coarse)
- Retry non-idempotent operations blindly
- Ignore fallback quality

✅ **Do**:

- Set max retries based on SLA
- Use exponential/fibonacci backoff with jitter
- Monitor circuit breaker state changes
- Timeout aggressively (2-3s for APIs)
- Circuit breaker per service/endpoint
- Implement idempotency keys
- Test fallback paths regularly

## Metrics and Monitoring

```typescript
// Comprehensive metrics
const metrics = meshClient.getMetrics();

console.log({
  loadBalancer: {
    instanceMetrics: metrics.loadBalancer,
    totalInstances: metrics.loadBalancer.size,
  },
  circuitBreakers: metrics.circuitBreakers.map((cb) => ({
    service: cb.name,
    state: cb.metrics.currentState,
    errorRate: cb.metrics.errorRate,
    totalRequests: cb.metrics.totalRequests,
  })),
  retry: {
    totalAttempts: metrics.retry.totalAttempts,
    successRate: metrics.retry.successfulRetries / metrics.retry.totalAttempts,
    avgRetryCount: metrics.retry.avgRetryCount,
  },
});
```

## Production Checklist

- [ ] Circuit breakers configured for all external dependencies
- [ ] Retry logic with exponential backoff and jitter
- [ ] Timeouts set aggressively (< 5s)
- [ ] Health checks for all critical dependencies
- [ ] Fallbacks for non-critical operations
- [ ] Load balancing strategy matches workload
- [ ] mTLS enabled in production
- [ ] Metrics exported to monitoring system
- [ ] Alerts configured for circuit breaker state changes
- [ ] Chaos engineering tests in CI/CD
- [ ] Runbooks for common failure scenarios
- [ ] Capacity planning based on resilience overhead

## Next Steps

- Review [Architecture Documentation](./architecture.md)
- Implement [Monitoring and Alerting](#)
- Set up [Chaos Engineering Tests](#)
- Configure [Service-Specific Tuning](#)
