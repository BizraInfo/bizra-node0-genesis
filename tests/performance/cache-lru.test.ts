/**
 * Cache Service LRU Tests
 * Comprehensive testing of multi-layer caching with LRU eviction
 */

import { CacheService, CacheKeys } from '../../src/performance/cache.service';
import { createMemoryMonitor } from '../utils/memory-monitor';
import { createLatencyTracker } from '../utils/latency-tracker';
import { createLoadGenerator } from '../utils/load-generator';
import { createMetricsCollector } from '../utils/metrics-collector';
import { createProfiler } from '../utils/performance-profiler';

describe('Cache Service LRU Performance Tests', () => {
  let cacheService: CacheService;
  let metrics: ReturnType<typeof createMetricsCollector>;

  beforeAll(async () => {
    cacheService = CacheService.getInstance();
    // Note: Tests will run in L1-only mode (memory cache) without Redis
    metrics = createMetricsCollector();
  });

  beforeEach(async () => {
    await cacheService.clear();
    cacheService.resetMetrics();
    metrics.clear();
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  describe('LRU Eviction Correctness', () => {
    it('should evict least recently used entries when cache is full', async () => {
      const maxSize = 1000; // L1 cache max size

      // Fill cache to capacity
      for (let i = 0; i < maxSize; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      // Add one more item, should evict key0 (least recently used)
      await cacheService.set('keyNew', { value: 'new' }, 600);

      // key0 should be evicted
      const evicted = await cacheService.get('key0');
      expect(evicted).toBeNull();

      // Recent keys should still exist
      const recent = await cacheService.get('key999');
      expect(recent).toEqual({ value: 999 });
    });

    it('should promote accessed entries to most recently used', async () => {
      // Add 100 entries
      for (let i = 0; i < 100; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      // Access key0 to promote it
      await cacheService.get('key0');

      // Fill cache to trigger eviction
      for (let i = 100; i < 1100; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      // key0 should still exist (promoted by access)
      const promoted = await cacheService.get('key0');
      expect(promoted).toEqual({ value: 0 });

      // key1 should be evicted (not accessed)
      const evicted = await cacheService.get('key1');
      expect(evicted).toBeNull();
    });

    it('should maintain LRU order with mixed read/write operations', async () => {
      const tracker = createLatencyTracker();

      for (let i = 0; i < 50; i++) {
        await tracker.trackAsync(async () => {
          // Write
          await cacheService.set(`key${i}`, { value: i }, 600);

          // Read random keys to change LRU order
          const randomKey = Math.floor(Math.random() * i);
          await cacheService.get(`key${randomKey}`);

          // Update existing key
          await cacheService.set(`key${randomKey}`, { value: randomKey * 2 }, 600);
        });
      }

      const latencyMetrics = tracker.getMetrics();
      expect(latencyMetrics.mean).toBeLessThan(5); // Avg <5ms
    });

    it('should handle concurrent LRU operations safely', async () => {
      const operations: Promise<void>[] = [];

      for (let i = 0; i < 100; i++) {
        operations.push(
          (async () => {
            await cacheService.set(`key${i}`, { value: i }, 600);
            await cacheService.get(`key${Math.floor(Math.random() * i)}`);
          })(),
        );
      }

      await Promise.all(operations);

      const stats = await cacheService.getStats();
      expect(stats.l1.size).toBeGreaterThan(0);
      expect(stats.l1.size).toBeLessThanOrEqual(stats.l1.maxSize);
    });
  });

  describe('Hit Rate Improvement Verification', () => {
    it('should achieve 90%+ hit rate for repeated access patterns', async () => {
      const keys = Array.from({ length: 50 }, (_, i) => `key${i}`);

      // Warm cache
      for (const key of keys) {
        await cacheService.set(key, { value: key }, 600);
      }

      // Measure hit rate with repeated access
      let hits = 0;
      let misses = 0;

      for (let i = 0; i < 1000; i++) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const value = await cacheService.get(randomKey);

        if (value) {
          hits++;
        } else {
          misses++;
        }
      }

      const hitRate = (hits / (hits + misses)) * 100;
      expect(hitRate).toBeGreaterThan(90);
    });

    it('should demonstrate hit rate improvement vs no cache', async () => {
      let noCacheLatency = 0;
      let cachedLatency = 0;

      const profiler = createProfiler();
      const data = { value: 'test'.repeat(100) }; // ~400 bytes

      // Simulate no cache (always compute)
      profiler.start();
      for (let i = 0; i < 100; i++) {
        const _ = JSON.stringify(data); // Simulate compute
      }
      noCacheLatency = profiler.end().duration;

      // With cache
      await cacheService.set('testKey', data, 600);
      profiler.start();
      for (let i = 0; i < 100; i++) {
        await cacheService.get('testKey');
      }
      cachedLatency = profiler.end().duration;

      const improvement = ((noCacheLatency - cachedLatency) / noCacheLatency) * 100;
      expect(improvement).toBeGreaterThan(50); // At least 50% improvement
    });

    it('should track hit rate metrics accurately', async () => {
      const keys = ['key1', 'key2', 'key3'];

      // Set keys
      for (const key of keys) {
        await cacheService.set(key, { value: key }, 600);
      }

      // Mix of hits and misses
      await cacheService.get('key1'); // Hit
      await cacheService.get('key2'); // Hit
      await cacheService.get('nonexistent'); // Miss
      await cacheService.get('key3'); // Hit

      const stats = await cacheService.getStats();
      expect(stats.l1.hitRate).toBeGreaterThan(0);
      expect(stats.l1.hitRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Latency Benchmark Tests', () => {
    it('should achieve <2ms L1 cache latency target', async () => {
      const profiler = createProfiler();

      // Warm cache
      await cacheService.set('testKey', { data: 'value' }, 600);

      // Benchmark L1 hits
      const benchmark = await profiler.benchmark(async () => {
        await cacheService.get('testKey');
      }, 1000);

      expect(benchmark.averageLatency).toBeLessThan(2);
      expect(benchmark.p95Latency).toBeLessThan(3);
      expect(benchmark.p99Latency).toBeLessThan(5);
    });

    it('should maintain low latency under concurrent load', async () => {
      const latencyTracker = createLatencyTracker();
      const loadGen = createLoadGenerator();

      // Warm cache
      for (let i = 0; i < 10; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      await loadGen.generateConstantLoad(
        async () => {
          const key = `key${Math.floor(Math.random() * 10)}`;
          await latencyTracker.trackAsync(() => cacheService.get(key));
        },
        100, // 100 RPS
        3000, // 3 seconds
      );

      const sla = latencyTracker.checkSLA(3, 5);
      expect(sla.met).toBe(true);
      expect(sla.p95).toBeLessThan(3);
    });

    it('should demonstrate L1 vs L2 latency difference', async () => {
      const profiler = createProfiler();

      // L1 latency (memory)
      await cacheService.set('l1Key', { data: 'value' }, 600);
      const l1Benchmark = await profiler.benchmark(() => cacheService.get('l1Key'), 100);

      // L2 would be higher (simulated by clearing L1)
      await cacheService.clear();
      const l2Benchmark = await profiler.benchmark(() => cacheService.get('missingKey'), 100);

      // L1 should be significantly faster
      expect(l1Benchmark.averageLatency).toBeLessThan(l2Benchmark.averageLatency);
    });

    it('should track latency percentiles accurately', async () => {
      const latencyTracker = createLatencyTracker();

      // Warm cache
      await cacheService.set('key', { value: 'data' }, 600);

      // Perform many reads
      for (let i = 0; i < 1000; i++) {
        await latencyTracker.trackAsync(() => cacheService.get('key'));
      }

      const metrics = latencyTracker.getMetrics();
      expect(metrics.p50).toBeLessThan(metrics.p95);
      expect(metrics.p95).toBeLessThan(metrics.p99);
      expect(metrics.p99).toBeGreaterThan(0);
    });
  });

  describe('Compression Strategy Tests', () => {
    it('should compress large payloads efficiently', async () => {
      const largeData = { data: 'x'.repeat(10000) }; // 10KB
      const key = 'largeKey';

      const profiler = createProfiler();
      profiler.start();
      await cacheService.set(key, largeData, 600);
      const writeProfile = profiler.end();

      expect(writeProfile.duration).toBeLessThan(50); // <50ms for compression

      profiler.start();
      const retrieved = await cacheService.get(key);
      const readProfile = profiler.end();

      expect(retrieved).toEqual(largeData);
      expect(readProfile.duration).toBeLessThan(20); // <20ms for decompression
    });

    it('should skip compression for small payloads', async () => {
      const smallData = { value: 'small' }; // <1KB
      const profiler = createProfiler();

      profiler.start();
      await cacheService.set('smallKey', smallData, 600);
      const duration = profiler.end().duration;

      // Should be very fast without compression
      expect(duration).toBeLessThan(5);
    });

    it('should achieve good compression ratios', async () => {
      // Highly compressible data
      const compressibleData = {
        repeated: 'a'.repeat(5000),
        data: 'test',
      };

      await cacheService.set('compKey', compressibleData, 600);

      const stats = await cacheService.getStats();
      // Compression ratio should be >1 (original/compressed)
      expect(stats.performance.avgCompressionRatio).toBeGreaterThan(1);
    });

    it('should handle mixed payload sizes efficiently', async () => {
      const profiler = createProfiler();

      const payloads = [
        { size: 'small', data: 'x'.repeat(100) },
        { size: 'medium', data: 'x'.repeat(2000) },
        { size: 'large', data: 'x'.repeat(15000) },
      ];

      const benchmark = await profiler.benchmark(async () => {
        const payload = payloads[Math.floor(Math.random() * payloads.length)];
        await cacheService.set('mixedKey', payload, 600);
        await cacheService.get('mixedKey');
      }, 100);

      expect(benchmark.averageLatency).toBeLessThan(10);
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should not leak memory under sustained load', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(100);

      for (let i = 0; i < 2000; i++) {
        await cacheService.set(`key${i % 100}`, { value: i }, 600);
        await cacheService.get(`key${i % 50}`);
      }

      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(30 * 1024 * 1024); // 30MB

      expect(leakReport.detected).toBe(false);
    });

    it('should respect L1 cache size limits', async () => {
      // Fill beyond capacity
      for (let i = 0; i < 2000; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      const stats = await cacheService.getStats();
      expect(stats.l1.size).toBeLessThanOrEqual(stats.l1.maxSize);
      expect(stats.l1.utilization).toBeLessThanOrEqual(100);
    });

    it('should track memory usage metrics', async () => {
      for (let i = 0; i < 100; i++) {
        await cacheService.set(`key${i}`, { value: 'data'.repeat(10) }, 600);
      }

      const stats = await cacheService.getStats();
      expect(stats.memory.l1Bytes).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle high throughput operations', async () => {
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateConstantLoad(
        async () => {
          const key = `key${Math.floor(Math.random() * 100)}`;
          if (Math.random() > 0.3) {
            await cacheService.get(key);
          } else {
            await cacheService.set(key, { value: key }, 600);
          }
        },
        200, // 200 RPS
        5000, // 5 seconds
      );

      const successRate = (result.successfulRequests / result.totalRequests) * 100;
      expect(successRate).toBeGreaterThan(99);
    });

    it('should meet performance SLAs', async () => {
      const profiler = createProfiler();

      // Warm cache
      for (let i = 0; i < 10; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      const readBench = await profiler.benchmark(
        () => cacheService.get(`key${Math.floor(Math.random() * 10)}`),
        1000,
      );

      const writeBench = await profiler.benchmark(
        () => cacheService.set('writeKey', { value: 'test' }, 600),
        1000,
      );

      expect(readBench.averageLatency).toBeLessThan(2);
      expect(writeBench.averageLatency).toBeLessThan(5);
      expect(readBench.p95Latency).toBeLessThan(3);
      expect(writeBench.p95Latency).toBeLessThan(8);
    });

    it('should demonstrate eviction performance (no spikes)', async () => {
      const latencyTracker = createLatencyTracker();

      // Continuously write beyond capacity to trigger evictions
      for (let i = 0; i < 2000; i++) {
        await latencyTracker.trackAsync(() => cacheService.set(`key${i}`, { value: i }, 600));
      }

      const metrics = latencyTracker.getMetrics();
      const stats = await cacheService.getStats();

      // Check for eviction spikes
      const p99ToP50Ratio = metrics.p99 / metrics.p50;
      expect(p99ToP50Ratio).toBeLessThan(5); // P99 should not be >5x P50

      expect(stats.performance.evictionCount).toBeGreaterThan(0);
    });

    it('should support efficient batch operations', async () => {
      const keys = Array.from({ length: 100 }, (_, i) => `key${i}`);

      // Set all keys
      for (const key of keys) {
        await cacheService.set(key, { value: key }, 600);
      }

      // Batch get
      const profiler = createProfiler();
      profiler.start();
      const results = await cacheService.mget(keys);
      const duration = profiler.end().duration;

      expect(results.size).toBe(100);
      expect(duration).toBeLessThan(50); // <50ms for 100 keys
    });
  });

  describe('Cache Statistics and Monitoring', () => {
    it('should provide comprehensive statistics', async () => {
      for (let i = 0; i < 50; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
        await cacheService.get(`key${i % 25}`);
      }

      const stats = await cacheService.getStats();

      expect(stats.l1.size).toBeGreaterThan(0);
      expect(stats.l1.hitRate).toBeGreaterThan(0);
      expect(stats.l1.avgLatencyMs).toBeGreaterThan(0);
      expect(stats.performance.totalRequests).toBeGreaterThan(0);
    });

    it('should track eviction counts', async () => {
      // Fill beyond capacity
      for (let i = 0; i < 1500; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      const stats = await cacheService.getStats();
      expect(stats.performance.evictionCount).toBeGreaterThan(0);
    });

    it('should provide metrics dashboard format', async () => {
      for (let i = 0; i < 20; i++) {
        await cacheService.set(`key${i}`, { value: i }, 600);
      }

      const dashboard = await cacheService.getMetricsDashboard();

      expect(dashboard.timestamp).toBeGreaterThan(0);
      expect(dashboard.cache.l1_hit_rate_percent).toBeGreaterThanOrEqual(0);
      expect(dashboard.cache.l1_avg_latency_ms).toBeGreaterThanOrEqual(0);
      expect(dashboard.targets.l1_hit_rate_target).toBe(90);
      expect(dashboard.status).toBeDefined();
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      await cacheService.set('expKey', { value: 'test' }, 1); // 1 second TTL

      // Should exist immediately
      let value = await cacheService.get('expKey');
      expect(value).toEqual({ value: 'test' });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Should be expired
      value = await cacheService.get('expKey');
      expect(value).toBeNull();
    });

    it('should handle lazy deletion efficiently', async () => {
      const profiler = createProfiler();

      // Set many keys with short TTL
      for (let i = 0; i < 100; i++) {
        await cacheService.set(`key${i}`, { value: i }, 1);
      }

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Access should trigger lazy deletion without spike
      profiler.start();
      for (let i = 0; i < 100; i++) {
        await cacheService.get(`key${i}`);
      }
      const duration = profiler.end().duration;

      expect(duration).toBeLessThan(100); // No deletion spike
    });
  });
});
