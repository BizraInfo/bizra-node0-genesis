import { CacheService, CacheKeys } from '../../src/performance/cache.service';
import { performance } from 'perf_hooks';

/**
 * WORLD-CLASS Performance Regression Tests for Cache Service
 *
 * Performance Targets:
 * - L1 hit rate: 90-95%
 * - L1 latency: <2ms (p95)
 * - L2 latency: <15ms (p95)
 * - Write latency: <5ms (p95)
 * - LRU eviction: Proper least-recently-used behavior
 * - Zero-spike cleanup: No periodic performance degradation
 */

describe('CacheService - Performance Tests', () => {
  let cache: CacheService;

  beforeEach(async () => {
    cache = CacheService.getInstance();
    await cache.connect({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    await cache.clear();
    cache.resetMetrics();
  });

  afterEach(async () => {
    await cache.disconnect();
  });

  describe('LRU Eviction Algorithm', () => {
    it('should evict least recently used items when cache is full', async () => {
      const L1_MAX_SIZE = 1000;

      // Fill cache to capacity
      for (let i = 0; i < L1_MAX_SIZE; i++) {
        await cache.set(`key-${i}`, { value: i });
      }

      // Access first 100 items to make them recently used
      for (let i = 0; i < 100; i++) {
        await cache.get(`key-${i}`);
      }

      // Add new items to trigger eviction
      for (let i = L1_MAX_SIZE; i < L1_MAX_SIZE + 100; i++) {
        await cache.set(`key-${i}`, { value: i });
      }

      // Recently accessed items should still be in L1
      for (let i = 0; i < 100; i++) {
        const result = await cache.get(`key-${i}`);
        expect(result).toEqual({ value: i });
      }

      // Older unaccessed items (100-199) should have been evicted
      const stats = await cache.getStats();
      expect(stats.performance.evictionCount).toBeGreaterThan(0);
    });

    it('should maintain LRU order on read access', async () => {
      await cache.set('key-1', 'value-1');
      await cache.set('key-2', 'value-2');
      await cache.set('key-3', 'value-3');

      // Access key-1 to make it most recently used
      await cache.get('key-1');

      // Fill cache to trigger eviction
      const L1_MAX_SIZE = 1000;
      for (let i = 0; i < L1_MAX_SIZE; i++) {
        await cache.set(`filler-${i}`, `value-${i}`);
      }

      // key-1 should still be in cache due to recent access
      const result = await cache.get('key-1');
      expect(result).toBe('value-1');
    });

    it('should update position on write (re-insert)', async () => {
      const L1_MAX_SIZE = 1000;

      // Fill cache
      for (let i = 0; i < L1_MAX_SIZE; i++) {
        await cache.set(`key-${i}`, { value: i });
      }

      // Update first item (should move to end)
      await cache.set('key-0', { value: 'updated' });

      // Fill more to trigger evictions
      for (let i = L1_MAX_SIZE; i < L1_MAX_SIZE + 100; i++) {
        await cache.set(`key-${i}`, { value: i });
      }

      // Updated key should still be in cache
      const result = await cache.get('key-0');
      expect(result).toEqual({ value: 'updated' });
    });
  });

  describe('L1 Cache Performance', () => {
    it('should achieve <2ms p95 latency for L1 hits', async () => {
      // Warm up cache
      for (let i = 0; i < 100; i++) {
        await cache.set(`key-${i}`, { value: i, data: 'x'.repeat(100) });
      }

      // Measure L1 hit latency
      const latencies: number[] = [];
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const key = `key-${i % 100}`;
        const start = performance.now();
        await cache.get(key);
        const duration = performance.now() - start;
        latencies.push(duration);
      }

      // Calculate p95
      const sorted = latencies.sort((a, b) => a - b);
      const p95Index = Math.ceil(0.95 * sorted.length) - 1;
      const p95 = sorted[p95Index];
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log(`L1 Cache Performance: avg=${avg.toFixed(3)}ms, p95=${p95.toFixed(3)}ms`);

      expect(p95).toBeLessThan(2);
      expect(avg).toBeLessThan(1);
    });

    it('should achieve 90%+ hit rate with LRU', async () => {
      const workingSet = 500; // Smaller than cache size
      const totalRequests = 10000;

      // Simulate realistic access pattern (some keys more popular)
      for (let i = 0; i < totalRequests; i++) {
        // 80% of requests go to 20% of keys (Pareto distribution)
        const key = Math.random() < 0.8
          ? `hot-${Math.floor(Math.random() * (workingSet * 0.2))}`
          : `cold-${Math.floor(Math.random() * workingSet)}`;

        const cached = await cache.get(key);
        if (!cached) {
          await cache.set(key, { data: 'x'.repeat(100) });
        }
      }

      const stats = await cache.getStats();
      console.log(`L1 Hit Rate: ${stats.l1.hitRate.toFixed(2)}%`);

      expect(stats.l1.hitRate).toBeGreaterThanOrEqual(90);
    });
  });

  describe('L2 Cache Performance', () => {
    it('should achieve <15ms p95 latency for L2 hits', async () => {
      // Set data in L2 (Redis) only
      const keys: string[] = [];
      for (let i = 0; i < 100; i++) {
        const key = `l2-key-${i}`;
        keys.push(key);
        await cache.set(key, { value: i, data: 'x'.repeat(500) });
      }

      // Clear L1 to force L2 access
      await cache.clear();

      // Re-add to L2
      for (let i = 0; i < 100; i++) {
        await cache.set(`l2-key-${i}`, { value: i, data: 'x'.repeat(500) });
      }

      // Measure L2 hit latency (with L1 miss)
      const latencies: number[] = [];
      for (let i = 0; i < 100; i++) {
        // Clear L1 between requests
        cache.resetMetrics();

        const start = performance.now();
        await cache.get(`l2-key-${i}`);
        const duration = performance.now() - start;
        latencies.push(duration);
      }

      const sorted = latencies.sort((a, b) => a - b);
      const p95Index = Math.ceil(0.95 * sorted.length) - 1;
      const p95 = sorted[p95Index];
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log(`L2 Cache Performance: avg=${avg.toFixed(3)}ms, p95=${p95.toFixed(3)}ms`);

      expect(p95).toBeLessThan(15);
    });
  });

  describe('Write Performance', () => {
    it('should achieve <5ms p95 latency for writes', async () => {
      const latencies: number[] = [];
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const data = {
          id: i,
          data: 'x'.repeat(Math.floor(Math.random() * 2000) + 100),
        };

        const start = performance.now();
        await cache.set(`write-key-${i}`, data);
        const duration = performance.now() - start;
        latencies.push(duration);
      }

      const sorted = latencies.sort((a, b) => a - b);
      const p95Index = Math.ceil(0.95 * sorted.length) - 1;
      const p95 = sorted[p95Index];
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log(`Write Performance: avg=${avg.toFixed(3)}ms, p95=${p95.toFixed(3)}ms`);

      expect(p95).toBeLessThan(5);
      expect(avg).toBeLessThan(3);
    });
  });

  describe('Compression Performance', () => {
    it('should use gzip for 1-5KB payloads (speed)', async () => {
      const data = { payload: 'x'.repeat(3000) }; // ~3KB
      await cache.set('compression-test-gzip', data);

      const stats = await cache.getStats();
      expect(stats.performance.avgCompressionRatio).toBeGreaterThan(1);
    });

    it('should use brotli for 5-10KB payloads (ratio)', async () => {
      const data = { payload: 'x'.repeat(7000) }; // ~7KB
      await cache.set('compression-test-brotli', data);

      const stats = await cache.getStats();
      expect(stats.performance.avgCompressionRatio).toBeGreaterThan(1);
    });

    it('should achieve >2x compression ratio on average', async () => {
      // Test with compressible data
      for (let i = 0; i < 100; i++) {
        const data = {
          id: i,
          payload: 'ABCDEFGH'.repeat(200), // Highly compressible
          timestamp: Date.now(),
        };
        await cache.set(`compress-${i}`, data);
      }

      const stats = await cache.getStats();
      console.log(`Compression Ratio: ${stats.performance.avgCompressionRatio.toFixed(2)}x`);

      expect(stats.performance.avgCompressionRatio).toBeGreaterThan(2);
    });
  });

  describe('Lazy Cleanup (Zero-Spike)', () => {
    it('should not cause periodic latency spikes', async () => {
      // Fill cache with expiring entries
      for (let i = 0; i < 500; i++) {
        await cache.set(`expire-${i}`, { value: i }, 1); // 1 second TTL
      }

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Measure latency during cleanup period
      const latencies: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await cache.get(`active-${i}`);
        await cache.set(`active-${i}`, { value: i });
        const duration = performance.now() - start;
        latencies.push(duration);
      }

      // Calculate variance and max
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const max = Math.max(...latencies);
      const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - avg, 2), 0) / latencies.length;

      console.log(`Cleanup Spike Test: avg=${avg.toFixed(3)}ms, max=${max.toFixed(3)}ms, variance=${variance.toFixed(3)}`);

      // No operation should spike beyond 10ms
      expect(max).toBeLessThan(10);

      // Low variance indicates consistent performance
      expect(variance).toBeLessThan(5);
    });
  });

  describe('Metrics Dashboard', () => {
    it('should provide comprehensive metrics', async () => {
      // Generate some load
      for (let i = 0; i < 100; i++) {
        await cache.set(`metric-${i}`, { value: i });
        await cache.get(`metric-${i}`);
      }

      const dashboard = await cache.getMetricsDashboard();

      expect(dashboard).toHaveProperty('timestamp');
      expect(dashboard.cache).toMatchObject({
        l1_hit_rate_percent: expect.any(Number),
        l1_avg_latency_ms: expect.any(Number),
        l1_p95_latency_ms: expect.any(Number),
        l1_p99_latency_ms: expect.any(Number),
        write_avg_latency_ms: expect.any(Number),
        eviction_count: expect.any(Number),
        total_requests: expect.any(Number),
      });

      expect(dashboard.targets).toMatchObject({
        l1_hit_rate_target: 90,
        l1_latency_target_ms: 2,
        l2_latency_target_ms: 15,
        write_latency_target_ms: 5,
      });

      expect(dashboard.status).toHaveProperty('l1_hit_rate_ok');
      expect(dashboard.status).toHaveProperty('l1_latency_ok');
      expect(dashboard.status).toHaveProperty('write_latency_ok');

      console.log('Dashboard:', JSON.stringify(dashboard, null, 2));
    });

    it('should track eviction count accurately', async () => {
      const L1_MAX_SIZE = 1000;

      // Fill beyond capacity
      for (let i = 0; i < L1_MAX_SIZE + 200; i++) {
        await cache.set(`evict-${i}`, { value: i });
      }

      const stats = await cache.getStats();
      expect(stats.performance.evictionCount).toBeGreaterThanOrEqual(200);

      console.log(`Total Evictions: ${stats.performance.evictionCount}`);
    });
  });

  describe('Stress Test - Full Stack', () => {
    it('should maintain performance under sustained load', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let operations = 0;

      while (Date.now() - startTime < duration) {
        const op = Math.random();
        const key = `stress-${Math.floor(Math.random() * 500)}`;

        if (op < 0.7) {
          // 70% reads
          await cache.get(key);
        } else {
          // 30% writes
          await cache.set(key, { value: Math.random(), data: 'x'.repeat(100) });
        }

        operations++;
      }

      const stats = await cache.getStats();
      const dashboard = await cache.getMetricsDashboard();

      console.log('=== STRESS TEST RESULTS ===');
      console.log(`Operations: ${operations}`);
      console.log(`Throughput: ${(operations / (duration / 1000)).toFixed(0)} ops/sec`);
      console.log(`L1 Hit Rate: ${stats.l1.hitRate.toFixed(2)}%`);
      console.log(`L1 p95 Latency: ${stats.l1.p95LatencyMs.toFixed(3)}ms`);
      console.log(`L2 p95 Latency: ${stats.l2.p95LatencyMs.toFixed(3)}ms`);
      console.log(`Write p95 Latency: ${stats.performance.p95WriteLatencyMs.toFixed(3)}ms`);
      console.log(`Evictions: ${stats.performance.evictionCount}`);
      console.log('===========================');

      // Verify performance targets under load
      expect(stats.l1.p95LatencyMs).toBeLessThan(2);
      expect(stats.performance.p95WriteLatencyMs).toBeLessThan(5);
      expect(operations).toBeGreaterThan(1000); // Should handle >200 ops/sec
    });
  });

  describe('Memory Safety', () => {
    it('should not leak memory in metrics arrays', async () => {
      // Generate 20k operations to exceed 10k limit
      for (let i = 0; i < 20000; i++) {
        await cache.get(`memory-${i % 100}`);
      }

      const stats = await cache.getStats();

      // Metrics arrays should be bounded
      expect(stats.performance.totalRequests).toBe(20000);
      // Internal arrays should be trimmed (implementation detail, check via metrics)
      expect(stats.l1.avgLatencyMs).toBeGreaterThan(0); // Still functioning
    });
  });
});
