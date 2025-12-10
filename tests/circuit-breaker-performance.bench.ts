/**
 * Circuit Breaker Performance Benchmarks
 * Measures throughput, latency, and memory efficiency
 */

import { describe, bench, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker } from '../src/service-mesh/circuit-breaker/circuit-breaker';
import { CircularRequestBuffer } from '../src/service-mesh/circuit-breaker/circular-buffer';

describe('CircularRequestBuffer Performance', () => {
  let buffer: CircularRequestBuffer;

  beforeEach(() => {
    buffer = new CircularRequestBuffer(1024);
  });

  bench('add operation (O(1))', () => {
    buffer.add(Math.random() > 0.5);
  }, {
    iterations: 100000,
  });

  bench('getFailureRate with cache', () => {
    buffer.getFailureRate();
  }, {
    iterations: 100000,
  });

  bench('batch add 100 requests', () => {
    for (let i = 0; i < 100; i++) {
      buffer.add(i % 2 === 0);
    }
  });

  bench('getMetrics', () => {
    buffer.getMetrics();
  }, {
    iterations: 10000,
  });

  bench('removeOlderThan', () => {
    const cutoff = Date.now() - 30000;
    buffer.removeOlderThan(cutoff);
  });
});

describe('CircuitBreaker Performance', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('benchmark-service', {
      failureThreshold: 50,
      failureThresholdPercentage: 50,
      timeout: 5000,
      resetTimeout: 10000,
      volumeThreshold: 100,
      bufferSize: 1024,
    });
  });

  afterEach(() => {
    breaker.destroy();
  });

  bench('execute successful request', async () => {
    await breaker.execute(async () => 'success');
  }, {
    iterations: 10000,
  });

  bench('execute with 50% failure rate', async () => {
    try {
      await breaker.execute(async () => {
        if (Math.random() > 0.5) return 'success';
        throw new Error('fail');
      });
    } catch (e) {
      // Expected
    }
  }, {
    iterations: 10000,
  });

  bench('getMetrics', () => {
    breaker.getMetrics();
  }, {
    iterations: 100000,
  });

  bench('getState', () => {
    breaker.getState();
  }, {
    iterations: 100000,
  });
});

describe('Throughput Benchmarks', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('throughput-test', {
      failureThreshold: 100,
      timeout: 10000,
      resetTimeout: 60000,
      bufferSize: 2048,
    });
  });

  afterEach(() => {
    breaker.destroy();
  });

  bench('sequential throughput - 1000 requests', async () => {
    for (let i = 0; i < 1000; i++) {
      await breaker.execute(async () => 'success');
    }
  });

  bench('parallel throughput - 100 concurrent requests', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(breaker.execute(async () => 'success'));
    }
    await Promise.all(promises);
  });
});

describe('Memory Benchmarks', () => {
  bench('buffer memory usage - 1024 capacity', () => {
    const buffer = new CircularRequestBuffer(1024);
    for (let i = 0; i < 1024; i++) {
      buffer.add(i % 2 === 0);
    }
    const usage = buffer.getMemoryUsage();
    // Should be < 10KB
    if (usage > 10000) {
      throw new Error(`Memory usage too high: ${usage} bytes`);
    }
  });

  bench('buffer memory usage - 4096 capacity', () => {
    const buffer = new CircularRequestBuffer(4096);
    for (let i = 0; i < 4096; i++) {
      buffer.add(i % 2 === 0);
    }
    const usage = buffer.getMemoryUsage();
    // Should be < 40KB
    if (usage > 40000) {
      throw new Error(`Memory usage too high: ${usage} bytes`);
    }
  });
});

describe('Latency Benchmarks', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('latency-test', {
      failureThreshold: 100,
      timeout: 10000,
      resetTimeout: 60000,
      bufferSize: 1024,
    });
  });

  afterEach(() => {
    breaker.destroy();
  });

  bench('P50 latency measurement', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      await breaker.execute(async () => 'success');
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];

    // Target: < 0.4ms
    if (p50 > 0.4) {
      console.warn(`P50 latency: ${p50.toFixed(3)}ms (target: < 0.4ms)`);
    }
  });

  bench('P95 latency measurement', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      await breaker.execute(async () => 'success');
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    // Target: < 0.8ms
    if (p95 > 0.8) {
      console.warn(`P95 latency: ${p95.toFixed(3)}ms (target: < 0.8ms)`);
    }
  });

  bench('P99 latency measurement', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      await breaker.execute(async () => 'success');
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    // Target: < 1.2ms
    if (p99 > 1.2) {
      console.warn(`P99 latency: ${p99.toFixed(3)}ms (target: < 1.2ms)`);
    }
  });
});
