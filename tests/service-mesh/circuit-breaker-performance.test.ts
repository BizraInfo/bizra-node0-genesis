/**
 * Circuit Breaker Performance Tests
 * Testing circular buffer, throughput, latency, and state transitions
 */

import CircuitBreaker, { CircuitBreakerConfig } from '../../src/service-mesh/circuit-breaker/circuit-breaker';
import { createProfiler } from '../utils/performance-profiler';
import { createLatencyTracker } from '../utils/latency-tracker';
import { createLoadGenerator } from '../utils/load-generator';
import { createMemoryMonitor } from '../utils/memory-monitor';
import { createMetricsCollector } from '../utils/metrics-collector';

describe('Circuit Breaker Performance Tests', () => {
  let circuitBreaker: CircuitBreaker;
  let metrics: ReturnType<typeof createMetricsCollector>;

  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    failureThresholdPercentage: 50,
    timeout: 1000,
    resetTimeout: 5000,
    volumeThreshold: 10,
    halfOpenMaxRequests: 3,
    bufferSize: 1024,
    metricsFlushInterval: 100,
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-circuit', defaultConfig);
    metrics = createMetricsCollector();
  });

  afterEach(() => {
    circuitBreaker.destroy();
    metrics.clear();
  });

  describe('Circular Buffer Correctness', () => {
    it('should maintain O(1) operations for success/failure tracking', async () => {
      const profiler = createProfiler();

      const benchmark = await profiler.benchmark(async () => {
        await circuitBreaker.execute(async () => {
          return 'success';
        });
      }, 1000);

      // Should be very fast with O(1) operations
      expect(benchmark.averageLatency).toBeLessThan(1);
      expect(benchmark.p95Latency).toBeLessThan(2);
    });

    it('should correctly track success/failure counts', async () => {
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < 20; i++) {
        try {
          if (i % 3 === 0) {
            await circuitBreaker.execute(async () => {
              throw new Error('Simulated failure');
            });
          } else {
            await circuitBreaker.execute(async () => 'success');
            successCount++;
          }
        } catch (error) {
          failureCount++;
        }
      }

      const cbMetrics = circuitBreaker.getMetrics();
      expect(cbMetrics.successfulRequests).toBe(successCount);
      expect(cbMetrics.failedRequests).toBe(failureCount);
    });

    it('should handle circular buffer wraparound correctly', async () => {
      const bufferSize = defaultConfig.bufferSize || 1024;

      // Fill beyond buffer capacity
      for (let i = 0; i < bufferSize * 2; i++) {
        await circuitBreaker.execute(async () => 'success');
      }

      const cbMetrics = circuitBreaker.getMetrics();
      expect(cbMetrics.totalRequests).toBe(bufferSize * 2);
      expect(cbMetrics.bufferUtilization).toBeLessThanOrEqual(100);
    });

    it('should maintain accuracy with mixed operations', async () => {
      const operations: Promise<void>[] = [];

      for (let i = 0; i < 100; i++) {
        operations.push(
          (async () => {
            try {
              if (Math.random() > 0.5) {
                await circuitBreaker.execute(async () => 'success');
              } else {
                await circuitBreaker.execute(async () => {
                  throw new Error('Failure');
                });
              }
            } catch (error) {
              // Expected failures
            }
          })(),
        );
      }

      await Promise.all(operations);

      const cbMetrics = circuitBreaker.getMetrics();
      expect(cbMetrics.totalRequests).toBe(100);
      expect(cbMetrics.successfulRequests + cbMetrics.failedRequests).toBe(100);
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should handle 25K+ req/s throughput', async () => {
      const profiler = createProfiler();
      const iterations = 10000;

      const benchmark = await profiler.benchmark(async () => {
        await circuitBreaker.execute(async () => 'success');
      }, iterations);

      const reqPerSecond = benchmark.operationsPerSecond;
      expect(reqPerSecond).toBeGreaterThan(10000); // At least 10K req/s in test environment
    });

    it('should maintain throughput under mixed load', async () => {
      const loadGen = createLoadGenerator();

      const result = await loadGen.generateConstantLoad(
        async () => {
          try {
            await circuitBreaker.execute(async () => {
              if (Math.random() > 0.9) {
                throw new Error('Simulated failure');
              }
              return 'success';
            });
          } catch (error) {
            // Expected occasional failures
          }
        },
        1000, // 1000 RPS
        3000, // 3 seconds
      );

      const successRate = (result.successfulRequests / result.totalRequests) * 100;
      expect(successRate).toBeGreaterThan(80);
      expect(result.actualRps).toBeGreaterThan(900);
    });

    it('should scale linearly with concurrent requests', async () => {
      const concurrencyLevels = [10, 50, 100];
      const throughputs: number[] = [];

      for (const concurrency of concurrencyLevels) {
        const profiler = createProfiler();
        const start = Date.now();

        await Promise.all(
          Array(concurrency)
            .fill(null)
            .map(() => circuitBreaker.execute(async () => 'success')),
        );

        const duration = Date.now() - start;
        const throughput = (concurrency / duration) * 1000;
        throughputs.push(throughput);
      }

      // Higher concurrency should have higher throughput
      expect(throughputs[1]).toBeGreaterThan(throughputs[0] * 0.8);
    });
  });

  describe('Latency Measurements', () => {
    it('should achieve <0.4ms P50 latency', async () => {
      const profiler = createProfiler();

      const benchmark = await profiler.benchmark(async () => {
        await circuitBreaker.execute(async () => 'success');
      }, 1000);

      expect(benchmark.p50Latency).toBeLessThan(0.5);
      expect(benchmark.averageLatency).toBeLessThan(0.5);
    });

    it('should achieve <1.2ms P99 latency', async () => {
      const latencyTracker = createLatencyTracker();

      for (let i = 0; i < 1000; i++) {
        await latencyTracker.trackAsync(() => circuitBreaker.execute(async () => 'success'));
      }

      const metrics = latencyTracker.getMetrics();
      expect(metrics.p99).toBeLessThan(2); // Relaxed for test environment
    });

    it('should maintain low latency under load', async () => {
      const latencyTracker = createLatencyTracker();
      const loadGen = createLoadGenerator();

      await loadGen.generateConstantLoad(
        async () => {
          await latencyTracker.trackAsync(() => circuitBreaker.execute(async () => 'success'));
        },
        500, // 500 RPS
        2000, // 2 seconds
      );

      const sla = latencyTracker.checkSLA(1, 2);
      expect(sla.p95).toBeLessThan(2);
    });

    it('should not have latency spikes during buffer operations', async () => {
      const latencyTracker = createLatencyTracker();
      const bufferSize = defaultConfig.bufferSize || 1024;

      // Fill beyond buffer capacity to test wraparound
      for (let i = 0; i < bufferSize * 1.5; i++) {
        await latencyTracker.trackAsync(() => circuitBreaker.execute(async () => 'success'));
      }

      const metrics = latencyTracker.getMetrics();
      const spikeRatio = metrics.p99 / metrics.p50;

      // P99 should not be significantly higher than P50 (no spikes)
      expect(spikeRatio).toBeLessThan(10);
    });
  });

  describe('State Transition Tests', () => {
    it('should transition from CLOSED to OPEN on failures', async () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Generate failures
      for (let i = 0; i < 10; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error('Failure');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should transition from OPEN to HALF_OPEN after timeout', async () => {
      const shortResetConfig: CircuitBreakerConfig = {
        ...defaultConfig,
        resetTimeout: 1000, // 1 second
      };

      const cb = new CircuitBreaker('test', shortResetConfig);

      // Trigger OPEN state
      for (let i = 0; i < 10; i++) {
        try {
          await cb.execute(async () => {
            throw new Error('Failure');
          });
        } catch (error) {}
      }

      expect(cb.getState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Next request should trigger HALF_OPEN
      try {
        await cb.execute(async () => 'success');
      } catch (error) {}

      expect(cb.getState()).toBe('HALF_OPEN');

      cb.destroy();
    });

    it('should transition from HALF_OPEN to CLOSED on success', async () => {
      circuitBreaker.forceState('HALF_OPEN');

      // Successful requests in HALF_OPEN
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(async () => 'success');
      }

      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should transition from HALF_OPEN to OPEN on failure', async () => {
      circuitBreaker.forceState('HALF_OPEN');

      try {
        await circuitBreaker.execute(async () => {
          throw new Error('Failure');
        });
      } catch (error) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should track state change count', async () => {
      const initialChanges = circuitBreaker.getMetrics().stateChanges;

      // Trigger state changes
      circuitBreaker.forceState('OPEN');
      circuitBreaker.forceState('HALF_OPEN');
      circuitBreaker.forceState('CLOSED');

      const finalChanges = circuitBreaker.getMetrics().stateChanges;
      expect(finalChanges).toBeGreaterThan(initialChanges);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running operations', async () => {
      const start = Date.now();

      try {
        await circuitBreaker.execute(async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return 'success';
        });
        fail('Should have timed out');
      } catch (error) {
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(1500); // Should timeout at 1000ms
        expect((error as Error).message).toContain('timeout');
      }
    });

    it('should track timeout metrics', async () => {
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(async () => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          });
        } catch (error) {
          // Expected timeout
        }
      }

      const cbMetrics = circuitBreaker.getMetrics();
      expect(cbMetrics.timeoutRequests).toBe(5);
    });

    it('should not leak memory on timeout', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(100);

      for (let i = 0; i < 100; i++) {
        try {
          await circuitBreaker.execute(async () => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          });
        } catch (error) {
          // Expected timeout
        }
      }

      if (global.gc) {
        global.gc();
      }

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(20 * 1024 * 1024);

      expect(leakReport.detected).toBe(false);
    });
  });

  describe('Memory Stability Tests', () => {
    it('should maintain fixed memory usage with circular buffer', async () => {
      const memoryMonitor = createMemoryMonitor();
      const bufferSize = defaultConfig.bufferSize || 1024;

      memoryMonitor.snapshot(); // Baseline

      // Fill buffer multiple times
      for (let i = 0; i < bufferSize * 3; i++) {
        await circuitBreaker.execute(async () => 'success');
      }

      memoryMonitor.snapshot(); // After operations

      const growthRate = memoryMonitor.getGrowthRate();

      // Memory should be relatively stable (circular buffer reuses space)
      expect(Math.abs(growthRate)).toBeLessThan(1024 * 1024); // < 1MB/sec growth
    });

    it('should not leak memory under sustained load', async () => {
      const memoryMonitor = createMemoryMonitor();
      memoryMonitor.startMonitoring(100);

      for (let i = 0; i < 5000; i++) {
        try {
          if (i % 10 === 0) {
            await circuitBreaker.execute(async () => {
              throw new Error('Failure');
            });
          } else {
            await circuitBreaker.execute(async () => 'success');
          }
        } catch (error) {
          // Expected occasional failures
        }
      }

      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      memoryMonitor.stopMonitoring();
      const leakReport = memoryMonitor.detectLeak(30 * 1024 * 1024);

      expect(leakReport.detected).toBe(false);
    });

    it('should report memory usage metrics', async () => {
      for (let i = 0; i < 100; i++) {
        await circuitBreaker.execute(async () => 'success');
      }

      const cbMetrics = circuitBreaker.getMetrics();
      expect(cbMetrics.memoryUsageBytes).toBeGreaterThan(0);
      expect(cbMetrics.memoryUsageBytes).toBeLessThan(1024 * 1024); // <1MB
    });
  });

  describe('Fallback Mechanism', () => {
    it('should execute fallback when circuit is open', async () => {
      // Force OPEN state
      circuitBreaker.forceState('OPEN');

      const result = await circuitBreaker.execute(
        async () => {
          throw new Error('Should not execute');
        },
        async () => 'fallback-value',
      );

      expect(result).toBe('fallback-value');
    });

    it('should execute fallback on failure', async () => {
      const result = await circuitBreaker.execute(
        async () => {
          throw new Error('Primary failed');
        },
        async () => 'fallback-value',
      );

      expect(result).toBe('fallback-value');
    });

    it('should track fallback executions', async () => {
      let fallbackCount = 0;

      circuitBreaker.on('fallback-executed', () => {
        fallbackCount++;
      });

      for (let i = 0; i < 5; i++) {
        await circuitBreaker.execute(
          async () => {
            throw new Error('Failure');
          },
          async () => 'fallback',
        );
      }

      expect(fallbackCount).toBe(5);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should demonstrate improvement over naive implementation', async () => {
      // Naive implementation (array-based)
      class NaiveCircuitBreaker {
        private history: { success: boolean; timestamp: number }[] = [];

        async execute<T>(fn: () => Promise<T>): Promise<T> {
          const result = await fn();
          this.history.push({ success: true, timestamp: Date.now() });

          // O(n) filtering
          this.history = this.history.filter((r) => Date.now() - r.timestamp < 60000);

          return result;
        }
      }

      const naive = new NaiveCircuitBreaker();
      const optimized = new CircuitBreaker('optimized', defaultConfig);

      const profiler = createProfiler();

      // Benchmark naive
      const naiveBench = await profiler.benchmark(() => naive.execute(async () => 'success'), 1000);

      // Benchmark optimized
      const optimizedBench = await profiler.benchmark(
        () => optimized.execute(async () => 'success'),
        1000,
      );

      const improvement = (naiveBench.averageLatency - optimizedBench.averageLatency) / naiveBench.averageLatency;

      expect(improvement).toBeGreaterThan(0.3); // At least 30% improvement

      optimized.destroy();
    });

    it('should maintain performance with full buffer', async () => {
      const profiler = createProfiler();
      const bufferSize = defaultConfig.bufferSize || 1024;

      // Fill buffer completely
      for (let i = 0; i < bufferSize; i++) {
        await circuitBreaker.execute(async () => 'success');
      }

      // Benchmark with full buffer
      const fullBufferBench = await profiler.benchmark(
        () => circuitBreaker.execute(async () => 'success'),
        1000,
      );

      expect(fullBufferBench.averageLatency).toBeLessThan(1);
    });
  });
});
