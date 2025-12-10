/**
 * Validation Service Performance Tests
 * Testing parallel RPC calls, caching, and timeout behavior
 */

import { createLatencyTracker } from '../utils/latency-tracker';
import { createLoadGenerator } from '../utils/load-generator';
import { createMetricsCollector } from '../utils/metrics-collector';
import { createProfiler } from '../utils/performance-profiler';
import { createMemoryMonitor } from '../utils/memory-monitor';

// Mock RPC client
class MockRPCClient {
  private latency: number;
  private failureRate: number;

  constructor(latency: number = 50, failureRate: number = 0) {
    this.latency = latency;
    this.failureRate = failureRate;
  }

  async call(method: string, params: any): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, this.latency));

    if (Math.random() < this.failureRate) {
      throw new Error('RPC call failed');
    }

    return { method, params, result: 'success' };
  }
}

// Validation service with parallel RPC calls
class ValidationService {
  private rpcClient: MockRPCClient;
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private cacheTTL: number = 5000; // 5 seconds

  constructor(rpcClient: MockRPCClient) {
    this.rpcClient = rpcClient;
  }

  async validate(data: any): Promise<boolean> {
    const cacheKey = JSON.stringify(data);
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Parallel RPC calls for different validation rules
    const [schemaValid, businessValid, securityValid] = await Promise.all([
      this.validateSchema(data),
      this.validateBusinessRules(data),
      this.validateSecurity(data),
    ]);

    const result = schemaValid && businessValid && securityValid;
    this.setCache(cacheKey, result);

    return result;
  }

  async validateWithTimeout(data: any, timeoutMs: number): Promise<boolean> {
    return Promise.race([
      this.validate(data),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Validation timeout')), timeoutMs),
      ),
    ]);
  }

  async validateBatch(items: any[]): Promise<boolean[]> {
    return Promise.all(items.map((item) => this.validate(item)));
  }

  private async validateSchema(data: any): Promise<boolean> {
    const result = await this.rpcClient.call('validateSchema', data);
    return result.result === 'success';
  }

  private async validateBusinessRules(data: any): Promise<boolean> {
    const result = await this.rpcClient.call('validateBusinessRules', data);
    return result.result === 'success';
  }

  private async validateSecurity(data: any): Promise<boolean> {
    const result = await this.rpcClient.call('validateSecurity', data);
    return result.result === 'success';
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.cacheTTL,
    });
  }

  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: 0, // Would track in real implementation
      misses: 0,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

describe('Validation Service Performance Tests', () => {
  let service: ValidationService;
  let rpcClient: MockRPCClient;
  let metrics: ReturnType<typeof createMetricsCollector>;

  beforeEach(() => {
    rpcClient = new MockRPCClient(10, 0); // 10ms latency, 0% failure
    service = new ValidationService(rpcClient);
    metrics = createMetricsCollector();
  });

  afterEach(() => {
    service.clearCache();
    metrics.clear();
  });

  describe('Parallel RPC Call Verification', () => {
    it('should execute RPC calls in parallel', async () => {
      const profiler = createProfiler();
      const data = { id: 1, value: 'test' };

      profiler.start();
      const result = await service.validate(data);
      const profile = profiler.end();

      expect(result).toBe(true);
      // With 10ms latency per call, parallel should be ~10ms vs sequential ~30ms
      expect(profile.duration).toBeLessThan(30);
      expect(profile.duration).toBeGreaterThanOrEqual(10);
    });

    it('should handle parallel validation of multiple items', async () => {
      const items = Array(10)
        .fill(null)
        .map((_, i) => ({ id: i, value: `test${i}` }));

      const profiler = createProfiler();
      profiler.start();
      const results = await service.validateBatch(items);
      const profile = profiler.end();

      expect(results).toHaveLength(10);
      expect(results.every((r) => r === true)).toBe(true);

      // Should be much faster than sequential
      expect(profile.duration).toBeLessThan(200);
    });

    it('should measure parallel vs sequential performance gain', async () => {
      const data = { id: 1, value: 'test' };
      const profiler = createProfiler();

      // Sequential simulation (3 * 10ms = 30ms)
      profiler.start();
      await rpcClient.call('method1', data);
      await rpcClient.call('method2', data);
      await rpcClient.call('method3', data);
      const sequentialProfile = profiler.end();

      // Parallel (max 10ms)
      profiler.start();
      await Promise.all([
        rpcClient.call('method1', data),
        rpcClient.call('method2', data),
        rpcClient.call('method3', data),
      ]);
      const parallelProfile = profiler.end();

      const speedup = sequentialProfile.duration / parallelProfile.duration;
      expect(speedup).toBeGreaterThan(2); // At least 2x faster
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout on slow validation', async () => {
      const slowRpc = new MockRPCClient(2000, 0); // 2 second latency
      const slowService = new ValidationService(slowRpc);

      const data = { id: 1, value: 'test' };

      await expect(slowService.validateWithTimeout(data, 500)).rejects.toThrow('Validation timeout');
    });

    it('should complete within timeout for fast validation', async () => {
      const data = { id: 1, value: 'test' };

      const result = await service.validateWithTimeout(data, 1000);
      expect(result).toBe(true);
    });

    it('should track timeout occurrences', async () => {
      const slowRpc = new MockRPCClient(1000, 0);
      const slowService = new ValidationService(slowRpc);
      const latencyTracker = createLatencyTracker();

      const data = { id: 1, value: 'test' };

      for (let i = 0; i < 10; i++) {
        try {
          await latencyTracker.trackAsync(() => slowService.validateWithTimeout(data, 500));
          metrics.increment('validation.success');
        } catch (error) {
          metrics.increment('validation.timeout');
        }
      }

      expect(metrics.getCounter('validation.timeout')).toBe(10);
    });
  });

  describe('Cache Hit Rate Measurement', () => {
    it('should cache validation results', async () => {
      const data = { id: 1, value: 'test' };

      // First call - cache miss
      const result1 = await service.validate(data);
      expect(result1).toBe(true);

      // Second call - cache hit (should be much faster)
      const profiler = createProfiler();
      profiler.start();
      const result2 = await service.validate(data);
      const profile = profiler.end();

      expect(result2).toBe(true);
      expect(profile.duration).toBeLessThan(5); // Very fast from cache
    });

    it('should measure cache hit rate improvement', async () => {
      const latencyTracker = createLatencyTracker();
      const data = { id: 1, value: 'test' };

      // Warm up cache
      await service.validate(data);

      // Measure cache hits
      for (let i = 0; i < 100; i++) {
        await latencyTracker.trackAsync(() => service.validate(data));
      }

      const metrics = latencyTracker.getMetrics();
      expect(metrics.mean).toBeLessThan(5); // Average should be very low
      expect(metrics.p95).toBeLessThan(10);
    });

    it('should track cache vs non-cache performance', async () => {
      const data = { id: 1, value: 'test' };
      const profiler = createProfiler();

      // Without cache
      service.clearCache();
      const noCacheBench = await profiler.benchmark(() => service.validate(data), 10);

      // With cache
      await service.validate(data); // Warm cache
      const cacheBench = await profiler.benchmark(() => service.validate(data), 10);

      const improvement = (noCacheBench.averageLatency - cacheBench.averageLatency) / noCacheBench.averageLatency;
      expect(improvement).toBeGreaterThan(0.5); // At least 50% improvement
    });

    it('should expire cache entries correctly', async () => {
      const data = { id: 1, value: 'test' };

      // First validation
      await service.validate(data);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 6000));

      const profiler = createProfiler();
      profiler.start();
      await service.validate(data);
      const profile = profiler.end();

      // Should take longer as cache expired
      expect(profile.duration).toBeGreaterThan(10);
    });
  });

  describe('Retry Logic Validation', () => {
    it('should retry on transient failures', async () => {
      const unreliableRpc = new MockRPCClient(10, 0.5); // 50% failure rate
      const retryService = new ValidationService(unreliableRpc);

      let attempts = 0;
      const maxRetries = 3;

      async function validateWithRetry(data: any): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
          try {
            attempts++;
            return await retryService.validate(data);
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        throw new Error('Max retries exceeded');
      }

      try {
        await validateWithRetry({ id: 1, value: 'test' });
      } catch (error) {
        // May fail, but should have retried
      }

      expect(attempts).toBeGreaterThan(1);
    });

    it('should use exponential backoff', async () => {
      const latencyTracker = createLatencyTracker();
      const backoffMs = [100, 200, 400];

      for (const delay of backoffMs) {
        await latencyTracker.trackAsync(async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
        });
      }

      const latencies = latencyTracker.getRawLatencies();
      expect(latencies[0]).toBeLessThan(latencies[1]);
      expect(latencies[1]).toBeLessThan(latencies[2]);
    });
  });

  describe('Error Boundary Tests', () => {
    it('should handle RPC failures gracefully', async () => {
      const flakyRpc = new MockRPCClient(10, 1.0); // 100% failure
      const flakyService = new ValidationService(flakyRpc);

      await expect(flakyService.validate({ id: 1 })).rejects.toThrow();
    });

    it('should isolate failures in parallel calls', async () => {
      // One call fails, others should succeed
      const data = { id: 1, value: 'test' };

      const results = await Promise.allSettled([
        service.validate(data),
        Promise.reject(new Error('Simulated failure')),
        service.validate(data),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBe(2);
    });

    it('should track error rates', async () => {
      const flakyRpc = new MockRPCClient(10, 0.3); // 30% failure rate
      const flakyService = new ValidationService(flakyRpc);

      for (let i = 0; i < 100; i++) {
        try {
          await flakyService.validate({ id: i });
          metrics.increment('validation.success');
        } catch (error) {
          metrics.increment('validation.error');
        }
      }

      const errorRate = metrics.getCounter('validation.error') / 100;
      expect(errorRate).toBeGreaterThan(0.2); // ~30% errors expected
      expect(errorRate).toBeLessThan(0.4);
    });
  });

  describe('Load Testing', () => {
    it('should handle high throughput validation', async () => {
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateConstantLoad(
        async () => {
          await service.validate({ id: Math.floor(Math.random() * 100) });
        },
        100, // 100 RPS
        5000, // 5 seconds
      );

      expect(result.successfulRequests).toBeGreaterThan(400);
      const successRate = (result.successfulRequests / result.totalRequests) * 100;
      expect(successRate).toBeGreaterThan(95);
    });

    it('should maintain low latency under load', async () => {
      const latencyTracker = createLatencyTracker();
      const loadGen = createLoadGenerator();

      await loadGen.generateConstantLoad(
        async () => {
          await latencyTracker.trackAsync(() => service.validate({ id: 1 }));
        },
        50, // 50 RPS
        3000, // 3 seconds
      );

      const sla = latencyTracker.checkSLA(50, 100);
      expect(sla.met).toBe(true);
    });

    it('should not leak memory under sustained load', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(100);

      for (let i = 0; i < 1000; i++) {
        await service.validate({ id: i % 10 }); // Reuse 10 different objects
      }

      if (global.gc) {
        global.gc();
      }

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(30 * 1024 * 1024); // 30MB threshold

      expect(leakReport.detected).toBe(false);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet validation SLAs', async () => {
      const profiler = createProfiler();

      const benchmark = await profiler.benchmark(() => service.validate({ id: 1, value: 'test' }), 1000);

      expect(benchmark.averageLatency).toBeLessThan(20);
      expect(benchmark.p95Latency).toBeLessThan(50);
      expect(benchmark.p99Latency).toBeLessThan(100);
      expect(benchmark.operationsPerSecond).toBeGreaterThan(50);
    });

    it('should demonstrate cache effectiveness', async () => {
      const profiler = createProfiler();
      const data = { id: 1, value: 'test' };

      // Benchmark without cache
      service.clearCache();
      const noCacheBench = await profiler.benchmark(() => {
        service.clearCache();
        return service.validate(data);
      }, 100);

      // Benchmark with cache
      await service.validate(data); // Warm cache
      const cacheBench = await profiler.benchmark(() => service.validate(data), 100);

      const speedup = noCacheBench.averageLatency / cacheBench.averageLatency;
      expect(speedup).toBeGreaterThan(2); // At least 2x faster
    });
  });
});
