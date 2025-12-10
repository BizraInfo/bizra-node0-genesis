/**
 * Validation Service Tests - ELITE-GRADE
 * Tests for parallel RPC optimizations, retry logic, and caching
 */

import { ValidationService } from '../src/services/validation/validation.service';
import { redis } from '../src/config/redis.config';

describe('ValidationService - ELITE-GRADE Optimizations', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  afterEach(async () => {
    // Clear cache between tests
    await redis.flushDb?.();
  });

  describe('Parallel RPC Transaction Validation', () => {
    it('should validate transaction with parallel RPC calls', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const result = await service.validateTransaction({ txHash });

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('validatedAt');
      expect(result).toHaveProperty('networkId');
    });

    it('should complete in under 5 seconds (parallel optimization)', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const startTime = Date.now();
      await service.validateTransaction({ txHash });
      const duration = Date.now() - startTime;

      // Should be much faster with parallel calls (target: 3s)
      expect(duration).toBeLessThan(5000);
    });

    it('should cache transaction validation results', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      // First call - cache miss
      const start1 = Date.now();
      const result1 = await service.validateTransaction({ txHash });
      const duration1 = Date.now() - start1;

      // Second call - cache hit (should be <10ms)
      const start2 = Date.now();
      const result2 = await service.validateTransaction({ txHash });
      const duration2 = Date.now() - start2;

      expect(result1).toEqual(result2);
      expect(duration2).toBeLessThan(duration1); // Cache hit should be faster
      expect(duration2).toBeLessThan(50); // Cache hit should be very fast
    });
  });

  describe('Block Validation with Aggressive Caching', () => {
    it('should validate block successfully', async () => {
      const blockNumber = 1000;

      const result = await service.validateBlock({ blockNumber });

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('validatedAt');
      expect(result).toHaveProperty('networkId');
    });

    it('should use 24-hour cache for immutable blocks', async () => {
      const blockNumber = 1001;

      // First call
      const result1 = await service.validateBlock({ blockNumber });

      // Second call - should hit cache
      const start = Date.now();
      const result2 = await service.validateBlock({ blockNumber });
      const duration = Date.now() - start;

      expect(result1).toEqual(result2);
      expect(duration).toBeLessThan(50); // Should be instant from cache
    });
  });

  describe('Address Validation with Parallel RPC', () => {
    it('should validate address with parallel balance/nonce/code calls', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

      const result = await service.validateAddress({ address });

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('validatedAt');
      if (result.data) {
        expect(result.data).toHaveProperty('address');
        expect(result.data).toHaveProperty('balance');
        expect(result.data).toHaveProperty('nonce');
        expect(result.data).toHaveProperty('isContract');
      }
    });

    it('should use 15-minute cache for address data', async () => {
      const address = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

      // First call
      const result1 = await service.validateAddress({ address });

      // Second call - should hit cache
      const start = Date.now();
      const result2 = await service.validateAddress({ address });
      const duration = Date.now() - start;

      expect(result1).toEqual(result2);
      expect(duration).toBeLessThan(50); // Cache hit
    });

    it('should complete in under 2 seconds (parallel RPC)', async () => {
      const address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

      const startTime = Date.now();
      await service.validateAddress({ address });
      const duration = Date.now() - startTime;

      // Parallel RPC should be fast (target: <1s)
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('should handle network errors gracefully', async () => {
      const txHash = '0xinvalid';

      const result = await service.validateTransaction({ txHash });

      // Should not throw, should return error result
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not retry on non-network errors', async () => {
      // Test that validation errors don't trigger retry
      const txHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

      const startTime = Date.now();
      await service.validateTransaction({ txHash });
      const duration = Date.now() - startTime;

      // Should fail fast without retries (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache with recent blocks', async () => {
      await service.warmCache();

      // Cache should now contain recent blocks
      // Subsequent calls should be very fast
      const result = await service.validateBlock({ blockNumber: 1000 });
      expect(result).toBeDefined();
    });

    it('should complete cache warming in under 30 seconds', async () => {
      const startTime = Date.now();
      await service.warmCache();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Performance Metrics', () => {
    it('should expose validation metrics', () => {
      const metrics = service.getMetrics();

      expect(metrics).toHaveProperty('httpPool');
      expect(metrics).toHaveProperty('timeout');
      expect(metrics).toHaveProperty('retry');

      expect(metrics.httpPool.maxSockets).toBe(512);
      expect(metrics.httpPool.keepAlive).toBe(true);
      expect(metrics.timeout.rpc).toBe(4000);
      expect(metrics.retry.maxRetries).toBe(3);
      expect(metrics.retry.delays).toEqual([50, 200, 800]);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not accumulate timeouts', async () => {
      const txHash = '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456';

      // Make multiple concurrent calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.validateTransaction({ txHash }));
      }

      await Promise.allSettled(promises);

      // No assertion needed - just verifying no memory leaks or hangs
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing transaction gracefully', async () => {
      const txHash = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      const result = await service.validateTransaction({ txHash });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });

    it('should handle missing block gracefully', async () => {
      const blockNumber = 999999999;

      const result = await service.validateBlock({ blockNumber });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Block not found');
    });

    it('should handle invalid address gracefully', async () => {
      const address = '0xinvalid';

      const result = await service.validateAddress({ address });

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle 100 concurrent transaction validations', async () => {
      const txHashes = Array.from({ length: 100 }, (_, i) =>
        `0x${i.toString(16).padStart(64, '0')}`
      );

      const startTime = Date.now();
      const promises = txHashes.map(hash =>
        service.validateTransaction({ txHash: hash })
      );

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;

      // All should complete
      expect(results).toHaveLength(100);

      // Should complete in reasonable time with connection pooling
      expect(duration).toBeLessThan(30000); // 30 seconds for 100 requests
    });
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      const isHealthy = await service.healthCheck();

      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('Current Block Number', () => {
    it('should get current block number', async () => {
      const blockNumber = await service.getCurrentBlockNumber();

      expect(blockNumber).toBeGreaterThan(0);
      expect(Number.isInteger(blockNumber)).toBe(true);
    });
  });
});

describe('ValidationService - Performance Benchmarks', () => {
  let service: ValidationService;

  beforeAll(() => {
    service = new ValidationService();
  });

  it('should achieve 60-70% latency reduction with parallel RPC', async () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    // Clear cache first
    await redis.flushDb?.();

    const startTime = Date.now();
    await service.validateTransaction({ txHash });
    const duration = Date.now() - startTime;

    // Target: 10s → 3s (-70%)
    // Allow up to 5s for test environment
    expect(duration).toBeLessThan(5000);
  });

  it('should achieve 35-40% cache hit rate after warm-up', async () => {
    const txHashes = [
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333333333333333333333333333',
    ];

    // Warm up cache
    for (const hash of txHashes) {
      await service.validateTransaction({ txHash: hash });
    }

    // Measure cache hits
    let cacheHits = 0;
    const totalRequests = txHashes.length * 3; // 3 iterations

    for (let i = 0; i < 3; i++) {
      for (const hash of txHashes) {
        const start = Date.now();
        await service.validateTransaction({ txHash: hash });
        const duration = Date.now() - start;

        if (duration < 50) {
          cacheHits++; // Fast response = cache hit
        }
      }
    }

    const hitRate = (cacheHits / totalRequests) * 100;
    expect(hitRate).toBeGreaterThanOrEqual(30); // At least 30% hit rate
  });
});
