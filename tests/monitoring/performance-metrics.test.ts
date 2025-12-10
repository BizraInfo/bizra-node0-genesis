/**
 * ENTERPRISE-GRADE Performance Metrics Tests
 *
 * Comprehensive test suite for PerformanceMetricsService
 */

import { PerformanceMetricsService } from '../../src/monitoring/performance-metrics.service';

describe('PerformanceMetricsService', () => {
  let metricsService: PerformanceMetricsService;

  beforeEach(() => {
    metricsService = PerformanceMetricsService.getInstance();
    metricsService.reset();
  });

  afterEach(() => {
    metricsService.reset();
  });

  describe('Latency Tracking', () => {
    it('should record latency measurements', () => {
      metricsService.recordLatency('api:request', 100);
      metricsService.recordLatency('api:request', 200);
      metricsService.recordLatency('api:request', 150);

      const percentiles = metricsService.getLatencyPercentiles('api:request');

      expect(percentiles).toBeDefined();
      expect(percentiles!.min).toBe(100);
      expect(percentiles!.max).toBe(200);
      expect(percentiles!.avg).toBe(150);
      expect(percentiles!.p50).toBe(150);
    });

    it('should calculate correct percentiles', () => {
      // Record 100 samples
      for (let i = 1; i <= 100; i++) {
        metricsService.recordLatency('test:operation', i);
      }

      const percentiles = metricsService.getLatencyPercentiles('test:operation');

      expect(percentiles).toBeDefined();
      expect(percentiles!.p50).toBeCloseTo(50, 0);
      expect(percentiles!.p95).toBeCloseTo(95, 0);
      expect(percentiles!.p99).toBeCloseTo(99, 0);
    });

    it('should maintain sliding window of measurements', () => {
      // Record more than window size (1000)
      for (let i = 0; i < 1500; i++) {
        metricsService.recordLatency('test:window', i);
      }

      const percentiles = metricsService.getLatencyPercentiles('test:window');

      expect(percentiles).toBeDefined();
      // Should only keep last 1000 measurements
      expect(percentiles!.min).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Throughput Tracking', () => {
    it('should record throughput', (done) => {
      metricsService.recordThroughput('api:requests', 10);

      // Delay for throughput rate calculation (needs >1s window)
      setTimeout(() => {
        const throughput = metricsService.getThroughput('api:requests');
        expect(throughput).toBeGreaterThan(0);
        done();
      }, 1200);
    }, 15000); // 15s test timeout

    it('should calculate operations per second', (done) => {
      // Record 100 operations
      for (let i = 0; i < 100; i++) {
        metricsService.recordThroughput('test:ops', 1);
      }

      // Delay for throughput rate calculation (needs >1s window)
      setTimeout(() => {
        const throughput = metricsService.getThroughput('test:ops');
        expect(throughput).toBeGreaterThan(0);
        done();
      }, 1200);
    }, 15000); // 15s test timeout

    it('should return all throughput metrics', () => {
      metricsService.recordThroughput('op1', 5);
      metricsService.recordThroughput('op2', 10);

      const allThroughput = metricsService.getAllThroughput();

      expect(allThroughput.size).toBeGreaterThanOrEqual(2);
      expect(allThroughput.has('op1')).toBe(true);
      expect(allThroughput.has('op2')).toBe(true);
    });
  });

  describe('Cache Metrics', () => {
    it('should record cache hits', () => {
      metricsService.recordCacheHit('L1');
      metricsService.recordCacheHit('L1');

      const hitRate = metricsService.getCacheHitRate('L1');

      expect(hitRate).toBe(1); // 100% hit rate
    });

    it('should record cache misses', () => {
      metricsService.recordCacheMiss('L1');
      metricsService.recordCacheMiss('L1');

      const hitRate = metricsService.getCacheHitRate('L1');

      expect(hitRate).toBe(0); // 0% hit rate
    });

    it('should calculate cache hit rate correctly', () => {
      metricsService.recordCacheHit('L1');
      metricsService.recordCacheHit('L1');
      metricsService.recordCacheHit('L1');
      metricsService.recordCacheMiss('L1');

      const hitRate = metricsService.getCacheHitRate('L1');

      expect(hitRate).toBe(0.75); // 75% hit rate
    });

    it('should track L1 and L2 independently', () => {
      metricsService.recordCacheHit('L1');
      metricsService.recordCacheMiss('L2');

      expect(metricsService.getCacheHitRate('L1')).toBe(1);
      expect(metricsService.getCacheHitRate('L2')).toBe(0);
    });
  });

  describe('Metrics Snapshot', () => {
    it('should capture current metrics snapshot', () => {
      metricsService.recordLatency('test:op', 100);
      metricsService.recordThroughput('test:op', 5);
      metricsService.recordCacheHit('L1');

      const snapshot = metricsService.captureSnapshot();

      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.latency).toBeDefined();
      expect(snapshot.throughput).toBeDefined();
      expect(snapshot.cache).toBeDefined();
      expect(snapshot.memory).toBeDefined();
    });

    it('should store snapshot history', (done) => {
      metricsService.recordLatency('test:op', 100);

      // Wait for automatic snapshot (occurs every 1000ms)
      setTimeout(() => {
        const history = metricsService.getHistory(1);
        expect(history.length).toBeGreaterThan(0);
        done();
      }, 1500);
    });

    it('should limit history size', (done) => {
      // Wait for multiple snapshots
      setTimeout(() => {
        const history = metricsService.getHistory(60);
        expect(history.length).toBeLessThanOrEqual(3600); // 1 hour max
        done();
      }, 3000);
    });
  });

  describe('Prometheus Export', () => {
    it('should export metrics in Prometheus format', () => {
      metricsService.recordLatency('api:request', 100);
      metricsService.recordThroughput('api:requests', 10);
      metricsService.recordCacheHit('L1');

      const prometheus = metricsService.toPrometheus();

      expect(prometheus).toContain('# HELP');
      expect(prometheus).toContain('# TYPE');
      expect(prometheus).toContain('latency_ms');
      expect(prometheus).toContain('cache_hits');
    });

    it('should include timestamps in Prometheus output', () => {
      metricsService.recordLatency('test:op', 50);

      const prometheus = metricsService.toPrometheus();

      // Should contain timestamp (numeric value at end of line)
      expect(prometheus).toMatch(/\d+\s+\d{13}/);
    });

    it('should sanitize metric names', () => {
      metricsService.recordLatency('api:endpoint/users', 100);

      const prometheus = metricsService.toPrometheus();

      // Special characters should be replaced with underscores
      expect(prometheus).toContain('latency_ms_api_endpoint_users');
    });
  });

  describe('Event Emission', () => {
    it('should emit latency events', (done) => {
      metricsService.once('metrics:latency', (event) => {
        expect(event.operation).toBe('test:op');
        expect(event.ms).toBe(100);
        expect(event.timestamp).toBeDefined();
        done();
      });

      metricsService.recordLatency('test:op', 100);
    });

    it('should emit throughput events', (done) => {
      metricsService.once('metrics:throughput', (event) => {
        expect(event.operation).toBe('test:op');
        expect(event.count).toBe(5);
        expect(event.timestamp).toBeDefined();
        done();
      });

      metricsService.recordThroughput('test:op', 5);
    });

    it('should emit cache events', (done) => {
      metricsService.once('metrics:cache', (event) => {
        expect(event.layer).toBe('L1');
        expect(event.hits).toBeGreaterThan(0);
        expect(event.timestamp).toBeDefined();
        done();
      });

      metricsService.recordCacheHit('L1');
    });

    it('should emit snapshot events', (done) => {
      metricsService.once('metrics:snapshot', (snapshot) => {
        expect(snapshot.timestamp).toBeDefined();
        expect(snapshot.latency).toBeDefined();
        done();
      });

      // Wait for automatic snapshot event (occurs every 1000ms)
    }, 2000);
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      metricsService.recordLatency('test:op', 100);
      metricsService.recordThroughput('test:op', 5);
      metricsService.recordCacheHit('L1');

      metricsService.reset();

      expect(metricsService.getLatencyPercentiles('test:op')).toBeNull();
      expect(metricsService.getThroughput('test:op')).toBe(0);
      expect(metricsService.getCacheHitRate('L1')).toBe(0);
    });

    it('should clear history on reset', () => {
      metricsService.reset();
      const history = metricsService.getHistory(60);

      expect(history.length).toBe(0);
    });
  });

  describe('Uptime Tracking', () => {
    it('should track system uptime', () => {
      const uptime = metricsService.getUptime();

      expect(uptime).toBeGreaterThan(0);
      expect(typeof uptime).toBe('number');
    });

    it('should increase uptime over time', (done) => {
      const uptime1 = metricsService.getUptime();

      setTimeout(() => {
        const uptime2 = metricsService.getUptime();
        expect(uptime2).toBeGreaterThan(uptime1);
        done();
      }, 100);
    });
  });

  describe('Performance Impact', () => {
    it('should have minimal overhead (<1%)', () => {
      const iterations = 10000;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        metricsService.recordLatency('perf:test', Math.random() * 100);
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      const avgOverhead = durationMs / iterations;

      // Should be less than 0.01ms per operation
      expect(avgOverhead).toBeLessThan(0.01);
    });

    it('should handle high-frequency updates', () => {
      const iterations = 100000;

      expect(() => {
        for (let i = 0; i < iterations; i++) {
          metricsService.recordThroughput('high:freq', 1);
        }
      }).not.toThrow();
    });
  });
});
