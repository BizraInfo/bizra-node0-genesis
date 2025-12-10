# BIZRA-NODE0 Testing Guide

## Overview

This guide covers the comprehensive test suite for BIZRA-NODE0 performance optimizations, including database pooling, caching, validation services, and circuit breakers.

## Test Structure

```
tests/
├── utils/                  # Test utilities and helpers
│   ├── performance-profiler.ts
│   ├── memory-monitor.ts
│   ├── latency-tracker.ts
│   ├── load-generator.ts
│   └── metrics-collector.ts
├── performance/           # Performance-specific tests
│   ├── database-pool.test.ts
│   └── cache-lru.test.ts
├── services/             # Service layer tests
│   └── validation-performance.test.ts
├── service-mesh/        # Infrastructure tests
│   └── circuit-breaker-performance.test.ts
├── integration/         # End-to-end tests
│   └── performance-suite.test.ts
└── setup.ts            # Global test configuration
```

## Test Categories

### 1. Database Pool Tests (`tests/performance/database-pool.test.ts`)

**Coverage**: Connection pool sizing, timeouts, lifecycle, load testing, memory leaks

**Run**: `npm run test:db-pool`

**Key Tests**:

- Connection pool scaling (5-20 connections)
- Timeout behavior (acquisition, query, idle)
- Connection lifecycle (acquire, release, reuse)
- Load testing (100+ concurrent connections)
- Memory leak detection
- Performance benchmarks (latency, throughput)

**Expected Performance**:

- Average connection latency: <10ms
- P95 latency: <20ms
- P99 latency: <50ms
- Throughput: >100 ops/sec
- No memory leaks under sustained load

### 2. Validation Service Tests (`tests/services/validation-performance.test.ts`)

**Coverage**: Parallel RPC calls, caching, timeouts, retries, error handling

**Run**: `npm run test:validation`

**Key Tests**:

- Parallel RPC call verification (60-70% faster)
- Timeout handling (configurable timeouts)
- Cache hit rate measurement (>90% target)
- Retry logic with exponential backoff
- Error boundary tests
- Load testing (100+ RPS)

**Expected Performance**:

- Average validation latency: <20ms
- P95 latency: <50ms
- P99 latency: <100ms
- Cache hit rate: >90%
- Throughput: >50 ops/sec

### 3. Cache Service Tests (`tests/performance/cache-lru.test.ts`)

**Coverage**: LRU eviction, hit rates, latency, compression, memory usage

**Run**: `npm run test:cache`

**Key Tests**:

- LRU eviction correctness
- Hit rate improvement (>90%)
- Latency benchmarks (L1 <2ms, L2 <15ms)
- Compression strategy (gzip, brotli)
- Memory usage monitoring
- Performance under load

**Expected Performance**:

- L1 hit rate: >90%
- L1 avg latency: <2ms
- L1 P95 latency: <3ms
- L2 avg latency: <15ms
- Write avg latency: <5ms
- No memory leaks

### 4. Circuit Breaker Tests (`tests/service-mesh/circuit-breaker-performance.test.ts`)

**Coverage**: Circular buffer, throughput, latency, state transitions, memory

**Run**: `npm run test:circuit-breaker`

**Key Tests**:

- Circular buffer correctness (O(1) operations)
- Throughput benchmarks (25K+ req/s target)
- Latency measurements (P50 <0.4ms, P99 <1.2ms)
- State transition tests (CLOSED → OPEN → HALF_OPEN)
- Timeout handling
- Memory stability

**Expected Performance**:

- Throughput: >10K req/s (test environment)
- P50 latency: <0.5ms
- P95 latency: <1ms
- P99 latency: <2ms
- Fixed memory usage (circular buffer)
- No memory leaks

### 5. Integration Tests (`tests/integration/performance-suite.test.ts`)

**Coverage**: End-to-end workflows, load testing, stress testing, regression

**Run**: `npm run test:integration`

**Key Tests**:

- Full-stack optimization validation
- Complex workflow efficiency
- Realistic load scenarios
- Traffic spike handling
- Concurrent user simulation
- Resource cleanup verification

**Expected Performance**:

- Full-stack avg latency: <50ms
- Success rate under load: >95%
- No memory leaks
- Graceful degradation under stress

## Running Tests

### All Tests

```bash
npm test                    # Run all tests with coverage
npm run test:watch         # Watch mode for development
```

### Specific Test Suites

```bash
npm run test:performance   # All performance tests
npm run test:db-pool      # Database pool tests only
npm run test:validation   # Validation service tests only
npm run test:cache        # Cache service tests only
npm run test:circuit-breaker  # Circuit breaker tests only
npm run test:integration  # Integration tests only
```

### Coverage Reports

```bash
npm run test:coverage     # Generate and open HTML coverage report
npm run test:ci          # CI-optimized test run
```

## Test Utilities

### Performance Profiler

Provides precise timing and resource usage measurements.

```typescript
import { createProfiler } from "../utils/performance-profiler";

const profiler = createProfiler();
profiler.start();
// ... code to profile
const result = profiler.end();

console.log(`Duration: ${result.duration}ms`);
console.log(`CPU: ${result.cpuUsage.user}μs`);
```

### Memory Monitor

Detects memory leaks and tracks usage patterns.

```typescript
import { createMemoryMonitor } from "../utils/memory-monitor";

const monitor = createMemoryMonitor();
monitor.startMonitoring(100); // 100ms interval
// ... operations
monitor.stopMonitoring();
const leak = monitor.detectLeak(20 * 1024 * 1024); // 20MB threshold

console.log(`Leak detected: ${leak.detected}`);
```

### Latency Tracker

Tracks and analyzes request/operation latencies.

```typescript
import { createLatencyTracker } from "../utils/latency-tracker";

const tracker = createLatencyTracker();

await tracker.trackAsync(async () => {
  // ... async operation
});

const metrics = tracker.getMetrics();
console.log(`P95 latency: ${metrics.p95}ms`);
```

### Load Generator

Generates realistic load patterns for testing.

```typescript
import { createLoadGenerator } from "../utils/load-generator";

const loadGen = createLoadGenerator();

const result = await loadGen.generateConstantLoad(
  async () => {
    /* operation */
  },
  100, // 100 RPS
  5000, // 5 seconds
);

console.log(
  `Success rate: ${(result.successfulRequests / result.totalRequests) * 100}%`,
);
```

### Metrics Collector

Collects and aggregates performance metrics.

```typescript
import { createMetricsCollector } from "../utils/metrics-collector";

const metrics = createMetricsCollector();

metrics.increment("requests.total");
metrics.record("latency", 15.5, "ms");
metrics.setGauge("active.connections", 42);

const summary = metrics.getSummary("latency");
console.log(`Avg latency: ${summary.mean}ms`);
```

## Coverage Requirements

### Global Thresholds

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### Performance-Critical Code (Stricter)

- `src/performance/**`: 90%/85%/90%/90%
- `src/service-mesh/**`: 90%/85%/90%/90%
- `src/services/validation/**`: 85%/80%/85%/85%
- `config/database.config.ts`: 85%/75%/80%/85%

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:ci
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: postgres
          DB_USER: postgres
          DB_PASSWORD: postgres
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up resources after each test
- Use `beforeEach` and `afterEach` hooks

### 2. Performance Targets

- Set realistic performance targets
- Use SLA checks with latency trackers
- Monitor for performance regression

### 3. Memory Management

- Always check for memory leaks
- Force GC when available (`global.gc()`)
- Use memory monitors for long-running tests

### 4. Load Testing

- Start with low load and scale up
- Test different load patterns (constant, ramp, spike)
- Verify graceful degradation

### 5. Flaky Tests

- Use retries for network-dependent tests
- Set appropriate timeouts
- Handle race conditions properly

## Troubleshooting

### Tests Timing Out

- Increase `testTimeout` in jest.config.js
- Check for open database connections
- Verify network connectivity

### Memory Leaks

- Run tests with `--detectOpenHandles`
- Check for unclosed connections/resources
- Use memory monitors to identify leaks

### Flaky Performance Tests

- Increase iteration counts for stability
- Use percentiles (P95, P99) instead of max
- Run on dedicated test hardware

### Coverage Gaps

- Review coverage reports in `coverage/index.html`
- Add tests for uncovered branches
- Use `--coverage` flag to generate reports

## Continuous Improvement

1. **Baseline Metrics**: Record performance baselines for regression detection
2. **Monitoring**: Track test execution time trends
3. **Optimization**: Identify and fix slow tests
4. **Documentation**: Keep test documentation up to date
5. **Review**: Regular test code reviews for quality

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Performance Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#8-performance-testing-best-practices)
- [Database Connection Pooling](https://node-postgres.com/features/pooling)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)

---

For questions or issues, contact the BIZRA development team.
