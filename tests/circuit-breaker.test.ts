/**
 * Comprehensive Circuit Breaker Tests
 * Tests circular buffer performance and correctness
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../src/service-mesh/circuit-breaker/circuit-breaker';
import { CircularRequestBuffer } from '../src/service-mesh/circuit-breaker/circular-buffer';

describe('CircularRequestBuffer', () => {
  let buffer: CircularRequestBuffer;

  beforeEach(() => {
    buffer = new CircularRequestBuffer(32);
  });

  describe('Basic Operations', () => {
    it('should initialize with correct capacity', () => {
      expect(buffer.getCapacity()).toBe(32);
      expect(buffer.size()).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
    });

    it('should add requests correctly', () => {
      buffer.add(true);
      buffer.add(false);
      buffer.add(true);

      expect(buffer.size()).toBe(3);
      expect(buffer.getSuccessCount()).toBe(2);
      expect(buffer.getFailureCount()).toBe(1);
    });

    it('should calculate failure rate correctly', () => {
      buffer.add(true);
      buffer.add(false);
      buffer.add(false);
      buffer.add(true);

      expect(buffer.getFailureRate()).toBe(50);
      expect(buffer.getSuccessRate()).toBe(50);
    });

    it('should handle circular buffer overflow', () => {
      // Fill buffer to capacity
      for (let i = 0; i < 40; i++) {
        buffer.add(i % 2 === 0);
      }

      expect(buffer.size()).toBe(32);
      expect(buffer.isFull()).toBe(true);
    });

    it('should maintain correct counts after overflow', () => {
      // Add 16 successes and 16 failures
      for (let i = 0; i < 32; i++) {
        buffer.add(i < 16);
      }

      expect(buffer.getSuccessCount()).toBe(16);
      expect(buffer.getFailureCount()).toBe(16);

      // Add more, should remove oldest
      buffer.add(true);

      expect(buffer.size()).toBe(32);
      expect(buffer.getSuccessCount()).toBe(16); // Removed 1 success, added 1 success
    });
  });

  describe('Time-based Operations', () => {
    it('should remove entries older than cutoff', () => {
      const now = Date.now();

      buffer.add(true, now - 5000);
      buffer.add(false, now - 3000);
      buffer.add(true, now - 1000);
      buffer.add(false, now);

      const removed = buffer.removeOlderThan(now - 2000);

      expect(removed).toBe(2);
      expect(buffer.size()).toBe(2);
    });

    it('should track oldest and newest timestamps', () => {
      const now = Date.now();

      buffer.add(true, now - 1000);
      buffer.add(false, now - 500);
      buffer.add(true, now);

      expect(buffer.getOldestTimestamp()).toBe(now - 1000);
      expect(buffer.getNewestTimestamp()).toBe(now);
    });
  });

  describe('Memory and Performance', () => {
    it('should report accurate memory usage', () => {
      const usage = buffer.getMemoryUsage();

      // Should be approximately: (32/32 * 4) + (32 * 8) + 64 = 324 bytes
      expect(usage).toBeGreaterThan(250);
      expect(usage).toBeLessThan(400);
    });

    it('should provide detailed metrics', () => {
      buffer.add(true);
      buffer.add(false);

      const metrics = buffer.getMetrics();

      expect(metrics.size).toBe(2);
      expect(metrics.capacity).toBe(32);
      expect(metrics.failureCount).toBe(1);
      expect(metrics.successCount).toBe(1);
      expect(metrics.failureRate).toBe(50);
      expect(metrics.utilizationRate).toBe((2 / 32) * 100);
    });

    it('should clear all data efficiently', () => {
      for (let i = 0; i < 20; i++) {
        buffer.add(i % 2 === 0);
      }

      buffer.clear();

      expect(buffer.size()).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.getFailureCount()).toBe(0);
      expect(buffer.getSuccessCount()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty buffer operations', () => {
      expect(buffer.getFailureRate()).toBe(0);
      expect(buffer.getSuccessRate()).toBe(0);
      expect(buffer.getOldestTimestamp()).toBeNull();
      expect(buffer.getNewestTimestamp()).toBeNull();
    });

    it('should handle single element', () => {
      buffer.add(true);

      expect(buffer.size()).toBe(1);
      expect(buffer.getSuccessRate()).toBe(100);
      expect(buffer.getFailureRate()).toBe(0);
    });

    it('should export to array correctly', () => {
      buffer.add(true);
      buffer.add(false);
      buffer.add(true);

      const arr = buffer.toArray();

      expect(arr.length).toBe(3);
      expect(arr[0].success).toBe(true);
      expect(arr[1].success).toBe(false);
      expect(arr[2].success).toBe(true);
    });
  });

  describe('Performance - O(1) Operations', () => {
    it('should perform add operation in constant time', () => {
      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        buffer.add(i % 2 === 0);
      }

      const duration = performance.now() - start;
      const avgPerOp = duration / iterations;

      // Should be < 0.01ms per operation
      expect(avgPerOp).toBeLessThan(0.01);
    });

    it('should cache failure rate calculations', () => {
      for (let i = 0; i < 100; i++) {
        buffer.add(i % 2 === 0);
      }

      // First call calculates
      const start1 = performance.now();
      const rate1 = buffer.getFailureRate();
      const duration1 = performance.now() - start1;

      // Second call should use cache
      const start2 = performance.now();
      const rate2 = buffer.getFailureRate();
      const duration2 = performance.now() - start2;

      expect(rate1).toBe(rate2);
      expect(duration2).toBeLessThan(duration1 * 0.5); // Cached should be much faster
    });
  });
});

describe('CircuitBreaker with Circular Buffer', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-service', {
      failureThreshold: 5,
      failureThresholdPercentage: 50,
      timeout: 1000,
      resetTimeout: 5000,
      volumeThreshold: 10,
      bufferSize: 64,
    });
  });

  afterEach(() => {
    breaker.destroy();
  });

  describe('Basic Circuit Breaker Functionality', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should execute successful requests', async () => {
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');

      const metrics = breaker.getMetrics();
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should handle failed requests', async () => {
      try {
        await breaker.execute(async () => {
          throw new Error('test error');
        });
      } catch (error) {
        expect((error as Error).message).toBe('test error');
      }

      const metrics = breaker.getMetrics();
      expect(metrics.failedRequests).toBe(1);
    });

    it('should open circuit after threshold failures', async () => {
      // Add enough volume
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reject requests when circuit is OPEN', async () => {
      // Force OPEN state
      breaker.forceState('OPEN');

      try {
        await breaker.execute(async () => 'success');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Circuit breaker is OPEN');
      }

      const metrics = breaker.getMetrics();
      expect(metrics.rejectedRequests).toBeGreaterThan(0);
    });

    it('should use fallback when available', async () => {
      breaker.forceState('OPEN');

      const result = await breaker.execute(
        async () => 'primary',
        async () => 'fallback'
      );

      expect(result).toBe('fallback');
    });
  });

  describe('State Transitions', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Open circuit
      breaker.forceState('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try request (should attempt HALF_OPEN)
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('should close circuit after successful HALF_OPEN requests', async () => {
      breaker.forceState('HALF_OPEN');

      // Execute successful requests
      for (let i = 0; i < 3; i++) {
        await breaker.execute(async () => 'success');
      }

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reopen circuit on HALF_OPEN failure', async () => {
      breaker.forceState('HALF_OPEN');

      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch (e) {
        // Expected
      }

      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('Performance Metrics', () => {
    it('should track buffer utilization', async () => {
      for (let i = 0; i < 20; i++) {
        await breaker.execute(async () => 'success');
      }

      const metrics = breaker.getMetrics();
      expect(metrics.bufferUtilization).toBeGreaterThan(0);
      expect(metrics.bufferUtilization).toBeLessThanOrEqual(100);
    });

    it('should report memory usage', async () => {
      const metrics = breaker.getMetrics();
      expect(metrics.memoryUsageBytes).toBeGreaterThan(0);
      expect(metrics.memoryUsageBytes).toBeLessThan(10000); // Should be < 10KB
    });

    it('should calculate accurate error rates', async () => {
      // 5 successes, 5 failures
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.execute(async () => {
            if (i % 2 === 0) return 'success';
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      const metrics = breaker.getMetrics();
      expect(metrics.errorRate).toBeCloseTo(50, 1);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running requests', async () => {
      try {
        await breaker.execute(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return 'success';
        });
        expect.fail('Should have timed out');
      } catch (error) {
        expect((error as Error).message).toContain('timeout');
      }

      const metrics = breaker.getMetrics();
      expect(metrics.timeoutRequests).toBe(1);
    });
  });

  describe('Reset and Cleanup', () => {
    it('should reset all state', async () => {
      // Generate some activity
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('fail');
          });
        } catch (e) {
          // Expected
        }
      }

      breaker.reset();

      expect(breaker.getState()).toBe('CLOSED');
      const metrics = breaker.getMetrics();
      expect(metrics.errorRate).toBe(0);
    });

    it('should cleanup resources on destroy', () => {
      breaker.destroy();
      // Should not throw
    });
  });
});
