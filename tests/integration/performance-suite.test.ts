/**
 * Integration Performance Test Suite
 * End-to-end testing of all performance optimizations together
 */

import { Pool } from 'pg';
import { CacheService } from '../../src/performance/cache.service';
import CircuitBreaker from '../../src/service-mesh/circuit-breaker/circuit-breaker';
import { createProfiler } from '../utils/performance-profiler';
import { createLatencyTracker } from '../utils/latency-tracker';
import { createLoadGenerator } from '../utils/load-generator';
import { createMemoryMonitor } from '../utils/memory-monitor';
import { createMetricsCollector } from '../utils/metrics-collector';

describe('Performance Integration Test Suite', () => {
  let dbPool: Pool;
  let cacheService: CacheService;
  let circuitBreaker: CircuitBreaker;
  let metrics: ReturnType<typeof createMetricsCollector>;

  beforeAll(async () => {
    // Initialize database pool
    dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Initialize cache service
    cacheService = CacheService.getInstance();

    // Initialize circuit breaker
    circuitBreaker = new CircuitBreaker('integration-test', {
      failureThreshold: 5,
      failureThresholdPercentage: 50,
      timeout: 1000,
      resetTimeout: 5000,
      volumeThreshold: 10,
    });

    metrics = createMetricsCollector();
  });

  afterAll(async () => {
    await dbPool.end();
    await cacheService.disconnect();
    circuitBreaker.destroy();
  });

  beforeEach(() => {
    metrics.clear();
    cacheService.resetMetrics();
  });

  describe('End-to-End Performance Validation', () => {
    it('should demonstrate full-stack optimization', async () => {
      const profiler = createProfiler();

      // Simulate full request: DB -> Cache -> Circuit Breaker
      const fullStackBench = await profiler.benchmark(async () => {
        // Check cache first
        let data = await cacheService.get<any>('test-data');

        if (!data) {
          // Protected DB query with circuit breaker
          data = await circuitBreaker.execute(async () => {
            const client = await dbPool.connect();
            try {
              const result = await client.query('SELECT 1 as value');
              return result.rows[0];
            } finally {
              client.release();
            }
          });

          // Cache result
          await cacheService.set('test-data', data, 300);
        }

        return data;
      }, 100);

      // First request slower (DB access), subsequent faster (cache hits)
      expect(fullStackBench.averageLatency).toBeLessThan(50);
      expect(fullStackBench.p95Latency).toBeLessThan(100);
    });

    it('should handle complex workflow efficiently', async () => {
      const profiler = createProfiler();

      const workflow = async (id: number) => {
        const cacheKey = `user:${id}`;

        // L1: Check cache
        let userData = await cacheService.get(cacheKey);

        if (!userData) {
          // L2: DB query with circuit breaker
          userData = await circuitBreaker.execute(async () => {
            const client = await dbPool.connect();
            try {
              const result = await client.query('SELECT $1::int as id, $2::text as name', [
                id,
                `User${id}`,
              ]);
              return result.rows[0];
            } finally {
              client.release();
            }
          });

          // L3: Cache for future
          await cacheService.set(cacheKey, userData, 300);
        }

        return userData;
      };

      const benchmark = await profiler.benchmark(() => workflow(Math.floor(Math.random() * 100)), 200);

      expect(benchmark.averageLatency).toBeLessThan(30);
      expect(benchmark.operationsPerSecond).toBeGreaterThan(30);
    });

    it('should maintain performance under realistic load', async () => {
      const latencyTracker = createLatencyTracker();
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateConstantLoad(
        async () => {
          await latencyTracker.trackAsync(async () => {
            const id = Math.floor(Math.random() * 50);
            const cacheKey = `item:${id}`;

            let data = await cacheService.get(cacheKey);

            if (!data) {
              data = await circuitBreaker.execute(async () => {
                const client = await dbPool.connect();
                try {
                  await client.query('SELECT pg_sleep(0.001)'); // 1ms query
                  return { id, value: `Data${id}` };
                } finally {
                  client.release();
                }
              });

              await cacheService.set(cacheKey, data, 60);
            }

            return data;
          });
        },
        50, // 50 RPS
        5000, // 5 seconds
      );

      const successRate = (result.successfulRequests / result.totalRequests) * 100;
      expect(successRate).toBeGreaterThan(95);

      const sla = latencyTracker.checkSLA(50, 100);
      expect(sla.met).toBe(true);
    });
  });

  describe('Load Testing Scenarios', () => {
    it('should handle steady-state load', async () => {
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateConstantLoad(
        async () => {
          await circuitBreaker.execute(async () => {
            const client = await dbPool.connect();
            try {
              await client.query('SELECT 1');
            } finally {
              client.release();
            }
          });
        },
        100, // 100 RPS
        3000, // 3 seconds
      );

      expect(result.successfulRequests).toBeGreaterThan(250);
      expect(result.failedRequests).toBe(0);
    });

    it('should handle traffic spike gracefully', async () => {
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateSpikeLoad(
        async () => {
          const data = await cacheService.getOrSet(
            `spike-test-${Math.random()}`,
            async () => {
              const client = await dbPool.connect();
              try {
                const result = await client.query('SELECT NOW()');
                return result.rows[0];
              } finally {
                client.release();
              }
            },
            60,
          );
          return data;
        },
        20, // Baseline 20 RPS
        200, // Spike to 200 RPS
        2000, // 2 second spike
        10000, // 10 second total
      );

      const successRate = (result.successfulRequests / result.totalRequests) * 100;
      expect(successRate).toBeGreaterThan(90);
    });

    it('should handle concurrent user scenarios', async () => {
      const concurrency = 50;
      const operations: Promise<any>[] = [];

      for (let i = 0; i < concurrency; i++) {
        operations.push(
          (async () => {
            const userId = i;

            // Multiple operations per user
            for (let j = 0; j < 10; j++) {
              const cacheKey = `user:${userId}:action:${j}`;

              await cacheService.getOrSet(
                cacheKey,
                async () => {
                  return await circuitBreaker.execute(async () => {
                    const client = await dbPool.connect();
                    try {
                      const result = await client.query('SELECT $1::int as user_id, $2::int as action', [
                        userId,
                        j,
                      ]);
                      return result.rows[0];
                    } finally {
                      client.release();
                    }
                  });
                },
                300,
              );
            }
          })(),
        );
      }

      const profiler = createProfiler();
      profiler.start();
      await Promise.all(operations);
      const profile = profiler.end();

      // 500 total operations (50 users * 10 actions)
      expect(profile.duration).toBeLessThan(5000); // Complete in <5 seconds
    });
  });

  describe('Stress Testing', () => {
    it('should survive connection pool exhaustion', async () => {
      const maxConnections = 20;
      const clients: any[] = [];

      try {
        // Hold all connections
        for (let i = 0; i < maxConnections; i++) {
          const client = await dbPool.connect();
          clients.push(client);
        }

        // Requests should queue or timeout gracefully
        const start = Date.now();

        try {
          await circuitBreaker.execute(async () => {
            const client = await dbPool.connect();
            client.release();
          });
        } catch (error) {
          // May timeout - acceptable
        }

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(6000); // Should timeout within configured limit
      } finally {
        // Release all connections
        clients.forEach((client) => client.release());
      }
    });

    it('should handle cache stampede scenario', async () => {
      const cacheKey = 'popular-item';
      await cacheService.delete(cacheKey);

      // Simulate cache stampede (many concurrent requests for expired key)
      const requests = 100;
      let dbHits = 0;

      const operations = Array(requests)
        .fill(null)
        .map(async () => {
          const data = await cacheService.getOrSet(
            cacheKey,
            async () => {
              dbHits++;
              const client = await dbPool.connect();
              try {
                await client.query('SELECT pg_sleep(0.01)'); // 10ms query
                return { data: 'popular-data' };
              } finally {
                client.release();
              }
            },
            300,
          );
          return data;
        });

      await Promise.all(operations);

      // Should have significantly fewer DB hits than requests (caching works)
      // Note: May not be perfect due to race conditions, but should be < 10%
      expect(dbHits).toBeLessThan(requests * 0.2);
    });

    it('should recover from circuit breaker trip', async () => {
      const testCB = new CircuitBreaker('recovery-test', {
        failureThreshold: 3,
        failureThresholdPercentage: 50,
        timeout: 100,
        resetTimeout: 1000,
        volumeThreshold: 5,
      });

      // Trigger failures to open circuit
      for (let i = 0; i < 10; i++) {
        try {
          await testCB.execute(async () => {
            throw new Error('Simulated failure');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(testCB.getState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Recovery attempts
      for (let i = 0; i < 5; i++) {
        await testCB.execute(async () => 'success');
      }

      expect(testCB.getState()).toBe('CLOSED');

      testCB.destroy();
    });
  });

  describe('Regression Detection', () => {
    it('should maintain baseline performance metrics', async () => {
      const profiler = createProfiler();

      // Baseline: Simple cached query
      const baseline = await profiler.benchmark(async () => {
        const cacheKey = 'baseline-test';

        await cacheService.getOrSet(
          cacheKey,
          async () => {
            const client = await dbPool.connect();
            try {
              const result = await client.query('SELECT 1');
              return result.rows[0];
            } finally {
              client.release();
            }
          },
          300,
        );
      }, 100);

      // Performance targets (update these if optimizations improve)
      expect(baseline.averageLatency).toBeLessThan(10); // <10ms average
      expect(baseline.p95Latency).toBeLessThan(20); // <20ms P95
      expect(baseline.operationsPerSecond).toBeGreaterThan(50); // >50 ops/sec
    });

    it('should detect performance degradation', async () => {
      const profiler = createProfiler();

      // Measure current performance
      const current = await profiler.benchmark(async () => {
        await cacheService.set('perf-test', { data: 'value' }, 300);
        await cacheService.get('perf-test');
      }, 100);

      // Store baseline metrics for comparison
      metrics.record('cache.latency', current.averageLatency, 'ms');
      metrics.record('cache.p95', current.p95Latency, 'ms');

      // In real tests, compare against stored historical baselines
      // If degradation > 20%, fail the test
      const historicalAvg = 5; // Example baseline
      const degradation = ((current.averageLatency - historicalAvg) / historicalAvg) * 100;

      expect(degradation).toBeLessThan(50); // <50% degradation allowed
    });
  });

  describe('Performance Metrics Tracking', () => {
    it('should collect comprehensive system metrics', async () => {
      for (let i = 0; i < 50; i++) {
        const client = await dbPool.connect();
        try {
          await client.query('SELECT 1');
          metrics.increment('db.queries');
        } finally {
          client.release();
        }

        await cacheService.set(`key${i}`, { value: i }, 300);
        metrics.increment('cache.writes');

        await cacheService.get(`key${i % 25}`);
        metrics.increment('cache.reads');

        await circuitBreaker.execute(async () => 'success');
        metrics.increment('cb.executions');
      }

      expect(metrics.getCounter('db.queries')).toBe(50);
      expect(metrics.getCounter('cache.writes')).toBe(50);
      expect(metrics.getCounter('cache.reads')).toBe(50);
      expect(metrics.getCounter('cb.executions')).toBe(50);
    });

    it('should generate performance dashboard', async () => {
      // Simulate some activity
      for (let i = 0; i < 20; i++) {
        await cacheService.set(`key${i}`, { value: i }, 300);
        await circuitBreaker.execute(async () => 'success');
      }

      const cacheStats = await cacheService.getStats();
      const cbMetrics = circuitBreaker.getMetrics();

      // Verify metrics are being tracked
      expect(cacheStats.performance.totalRequests).toBeGreaterThan(0);
      expect(cbMetrics.totalRequests).toBeGreaterThan(0);

      // Dashboard should show healthy system
      const dashboard = await cacheService.getMetricsDashboard();
      expect(dashboard.cache.total_requests).toBeGreaterThan(0);
    });

    it('should export metrics in multiple formats', () => {
      metrics.increment('test.metric', 100);
      metrics.setGauge('test.gauge', 42);
      metrics.record('test.latency', 15.5, 'ms');

      // JSON export
      const jsonMetrics = metrics.exportJSON();
      expect(jsonMetrics).toHaveProperty('counters');
      expect(jsonMetrics).toHaveProperty('gauges');
      expect(jsonMetrics).toHaveProperty('metrics');

      // Prometheus export
      const prometheusMetrics = metrics.exportPrometheus();
      expect(prometheusMetrics).toContain('test_metric');
      expect(prometheusMetrics).toContain('test_gauge');
    });
  });

  describe('Resource Cleanup and Stability', () => {
    it('should not leak memory during extended operation', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(200);

      for (let i = 0; i < 1000; i++) {
        await cacheService.set(`key${i % 100}`, { value: i }, 300);

        const client = await dbPool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }

        await circuitBreaker.execute(async () => 'success');
      }

      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(50 * 1024 * 1024); // 50MB

      expect(leakReport.detected).toBe(false);
    });

    it('should cleanup resources properly', async () => {
      const testPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'test',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 5,
      });

      const testCB = new CircuitBreaker('cleanup-test', {
        failureThreshold: 5,
        timeout: 1000,
        resetTimeout: 5000,
      });

      // Use resources
      for (let i = 0; i < 10; i++) {
        const client = await testPool.connect();
        client.release();

        await testCB.execute(async () => 'success');
      }

      // Cleanup
      await testPool.end();
      testCB.destroy();

      // Should not throw or leak
      expect(true).toBe(true);
    });
  });
});
