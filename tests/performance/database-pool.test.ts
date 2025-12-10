/**
 * Database Pool Performance Tests
 * Comprehensive testing of connection pool optimizations
 */

import { Pool, PoolClient } from 'pg';
import { createMemoryMonitor } from '../utils/memory-monitor';
import { createLatencyTracker } from '../utils/latency-tracker';
import { createLoadGenerator } from '../utils/load-generator';
import { createMetricsCollector } from '../utils/metrics-collector';
import { createProfiler } from '../utils/performance-profiler';

// احسان: Skip database tests if PostgreSQL is not configured
const hasDatabase = !!(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_USER));
const describeOrSkip = hasDatabase ? describe : describe.skip;

describeOrSkip('Database Pool Performance Tests', () => {
  let pool: Pool;
  let metrics: ReturnType<typeof createMetricsCollector>;

  beforeAll(() => {
    // Initialize pool with optimized settings
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20, // Maximum pool size
      min: 5, // Minimum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      maxUses: 7500, // Connection reuse limit
    });

    metrics = createMetricsCollector();
  });

  afterAll(async () => {
    await pool.end();
  });

  afterEach(() => {
    metrics.clear();
  });

  describe('Connection Pool Sizing', () => {
    it('should maintain minimum pool size', async () => {
      // Wait for pool to initialize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const poolStats = pool.totalCount;
      expect(poolStats).toBeGreaterThanOrEqual(5);
      expect(poolStats).toBeLessThanOrEqual(20);
    });

    it('should scale up under load', async () => {
      const initialCount = pool.totalCount;

      // Create concurrent connections
      const clients: PoolClient[] = [];
      for (let i = 0; i < 15; i++) {
        const client = await pool.connect();
        clients.push(client);
      }

      const scaledCount = pool.totalCount;
      expect(scaledCount).toBeGreaterThan(initialCount);

      // Release connections
      clients.forEach((client) => client.release());
    });

    it('should respect maximum pool size', async () => {
      const clients: PoolClient[] = [];

      try {
        // Try to acquire more than max connections
        for (let i = 0; i < 25; i++) {
          const client = await pool.connect();
          clients.push(client);
        }

        expect(pool.totalCount).toBeLessThanOrEqual(20);
      } finally {
        clients.forEach((client) => client.release());
      }
    });
  });

  describe('Timeout Behavior', () => {
    it('should timeout on connection acquisition', async () => {
      const clients: PoolClient[] = [];

      try {
        // Acquire all connections
        for (let i = 0; i < 20; i++) {
          const client = await pool.connect();
          clients.push(client);
        }

        // Try to acquire one more with timeout
        const timeoutPool = new Pool({
          ...pool.options,
          connectionTimeoutMillis: 1000,
        });

        const start = performance.now();
        await expect(timeoutPool.connect()).rejects.toThrow();
        const duration = performance.now() - start;

        expect(duration).toBeGreaterThanOrEqual(1000);
        expect(duration).toBeLessThan(2000);

        await timeoutPool.end();
      } finally {
        clients.forEach((client) => client.release());
      }
    });

    it('should timeout on query execution', async () => {
      const client = await pool.connect();

      try {
        const start = performance.now();

        await expect(
          client.query('SELECT pg_sleep(10)', [], { statement_timeout: 1000 }),
        ).rejects.toThrow();

        const duration = performance.now() - start;
        expect(duration).toBeLessThan(2000);
      } finally {
        client.release();
      }
    });

    it('should handle idle timeout correctly', async () => {
      const testPool = new Pool({
        ...pool.options,
        idleTimeoutMillis: 1000,
      });

      const client = await testPool.connect();
      client.release();

      // Wait for idle timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newClient = await testPool.connect();
      expect(newClient).toBeDefined();
      newClient.release();

      await testPool.end();
    });
  });

  describe('Connection Lifecycle', () => {
    it('should properly acquire and release connections', async () => {
      const latencyTracker = createLatencyTracker();

      for (let i = 0; i < 100; i++) {
        await latencyTracker.trackAsync(async () => {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
        });
      }

      const metrics = latencyTracker.getMetrics();
      expect(metrics.mean).toBeLessThan(50); // Average < 50ms
      expect(metrics.p95).toBeLessThan(100); // P95 < 100ms
    });

    it('should reuse connections efficiently', async () => {
      const client1 = await pool.connect();
      const pid1 = await client1.query('SELECT pg_backend_pid()');
      client1.release();

      const client2 = await pool.connect();
      const pid2 = await client2.query('SELECT pg_backend_pid()');
      client2.release();

      // Same connection should be reused
      expect(pid1.rows[0].pg_backend_pid).toBe(pid2.rows[0].pg_backend_pid);
    });

    it('should handle connection errors gracefully', async () => {
      const client = await pool.connect();

      try {
        // Simulate connection error
        await client.query('SELECT * FROM nonexistent_table');
      } catch (error) {
        // Connection should still be released
        expect(error).toBeDefined();
      } finally {
        client.release();
      }

      // Pool should still be functional
      const newClient = await pool.connect();
      expect(newClient).toBeDefined();
      newClient.release();
    });

    it('should enforce maxUses connection recycling', async () => {
      const testPool = new Pool({
        ...pool.options,
        max: 1,
        maxUses: 10,
      });

      const pids: number[] = [];

      for (let i = 0; i < 15; i++) {
        const client = await testPool.connect();
        const result = await client.query('SELECT pg_backend_pid()');
        pids.push(result.rows[0].pg_backend_pid);
        client.release();
      }

      // Should have at least 2 different PIDs due to maxUses
      const uniquePids = new Set(pids);
      expect(uniquePids.size).toBeGreaterThanOrEqual(2);

      await testPool.end();
    });
  });

  describe('Load Testing', () => {
    it('should handle 100+ concurrent connections', async () => {
      const loadGen = createLoadGenerator();
      const memoryMonitor = createMemoryMonitor();

      memoryMonitor.startMonitoring(100);

      const result = await loadGen.generateConcurrentLoad(async () => {
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      }, 150);

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(50 * 1024 * 1024); // 50MB threshold

      expect(result.successfulRequests).toBe(150);
      expect(result.failedRequests).toBe(0);
      expect(leakReport.detected).toBe(false);
    });

    it('should maintain low latency under sustained load', async () => {
      const loadGen = createLoadGenerator();
      const latencyTracker = createLatencyTracker();

      const result = await loadGen.generateConstantLoad(
        async () => {
          await latencyTracker.trackAsync(async () => {
            const client = await pool.connect();
            try {
              await client.query('SELECT $1::int as value', [Math.floor(Math.random() * 1000)]);
            } finally {
              client.release();
            }
          });
        },
        50, // 50 RPS
        5000, // 5 seconds
      );

      const metrics = latencyTracker.getMetrics();

      expect(result.successfulRequests).toBeGreaterThan(200);
      expect(metrics.p95).toBeLessThan(100);
      expect(metrics.p99).toBeLessThan(200);
    });

    it('should handle spike traffic gracefully', async () => {
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateSpikeLoad(
        async () => {
          const client = await pool.connect();
          try {
            await client.query('SELECT 1');
          } finally {
            client.release();
          }
        },
        10, // Baseline 10 RPS
        100, // Spike to 100 RPS
        2000, // 2 second spike
        10000, // 10 second total
      );

      const successRate = (result.successfulRequests / result.totalRequests) * 100;
      expect(successRate).toBeGreaterThan(95); // 95%+ success rate
    });

    it('should demonstrate improved throughput vs single connection', async () => {
      const profiler = createProfiler();

      // Test with pool
      profiler.start();
      const poolResults = await Promise.all(
        Array(100)
          .fill(null)
          .map(async () => {
            const client = await pool.connect();
            try {
              return await client.query('SELECT 1');
            } finally {
              client.release();
            }
          }),
      );
      const poolProfile = profiler.end();

      // Test with single connection
      const singlePool = new Pool({ ...pool.options, max: 1 });
      profiler.start();
      const singleResults = await Promise.all(
        Array(100)
          .fill(null)
          .map(async () => {
            const client = await singlePool.connect();
            try {
              return await client.query('SELECT 1');
            } finally {
              client.release();
            }
          }),
      );
      const singleProfile = profiler.end();

      await singlePool.end();

      expect(poolProfile.duration).toBeLessThan(singleProfile.duration);
      const improvement = (singleProfile.duration - poolProfile.duration) / singleProfile.duration;
      expect(improvement).toBeGreaterThan(0.3); // At least 30% improvement
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during normal operation', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(100);

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
      }

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(20 * 1024 * 1024); // 20MB threshold

      expect(leakReport.detected).toBe(false);
    });

    it('should not leak on connection errors', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(100);

      for (let i = 0; i < 100; i++) {
        const client = await pool.connect();
        try {
          await client.query('SELECT * FROM nonexistent');
        } catch (error) {
          // Expected error
        } finally {
          client.release();
        }
      }

      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(20 * 1024 * 1024);

      expect(leakReport.detected).toBe(false);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance SLAs', async () => {
      const profiler = createProfiler();

      const benchmark = await profiler.benchmark(async () => {
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      }, 1000);

      expect(benchmark.averageLatency).toBeLessThan(10); // <10ms average
      expect(benchmark.p95Latency).toBeLessThan(20); // <20ms P95
      expect(benchmark.p99Latency).toBeLessThan(50); // <50ms P99
      expect(benchmark.operationsPerSecond).toBeGreaterThan(100); // >100 ops/sec
    });

    it('should track performance metrics', () => {
      metrics.increment('db.connections.acquired', 100);
      metrics.increment('db.connections.released', 98);
      metrics.record('db.query.duration', 15.5, 'ms');
      metrics.record('db.query.duration', 22.3, 'ms');
      metrics.setGauge('db.pool.size', 12);

      expect(metrics.getCounter('db.connections.acquired')).toBe(100);
      expect(metrics.getCounter('db.connections.released')).toBe(98);
      expect(metrics.getGauge('db.pool.size')).toBe(12);

      const querySummary = metrics.getSummary('db.query.duration');
      expect(querySummary).toBeDefined();
      expect(querySummary!.count).toBe(2);
    });
  });
});
