/**
 * Circuit Breaker Performance Benchmark Suite
 * Compares original vs optimized implementations
 */

import { performance } from 'perf_hooks';
import { CircuitBreaker } from '../src/service-mesh/circuit-breaker/circuit-breaker';
import { OptimizedCircuitBreaker } from './circuit-breaker-optimized-implementation';

interface BenchmarkResult {
  name: string;
  implementation: 'Original' | 'Optimized';
  opsPerSecond: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  memoryUsedMB: number;
  gcCollections?: number;
}

/**
 * Performance utilities
 */
class PerformanceMonitor {
  private latencies: number[] = [];
  private startMemory: number = 0;
  private startTime: number = 0;

  start(): void {
    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    this.startMemory = process.memoryUsage().heapUsed;
    this.startTime = performance.now();
    this.latencies = [];
  }

  recordLatency(latency: number): void {
    this.latencies.push(latency);
  }

  getResults(name: string, impl: 'Original' | 'Optimized'): BenchmarkResult {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const totalTime = (endTime - this.startTime) / 1000; // seconds
    const opsPerSecond = this.latencies.length / totalTime;

    // Calculate percentiles
    const sorted = this.latencies.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;

    return {
      name,
      implementation: impl,
      opsPerSecond: Math.round(opsPerSecond),
      avgLatencyMs: parseFloat(avg.toFixed(4)),
      p50LatencyMs: parseFloat(p50.toFixed(4)),
      p95LatencyMs: parseFloat(p95.toFixed(4)),
      p99LatencyMs: parseFloat(p99.toFixed(4)),
      memoryUsedMB: parseFloat(((endMemory - this.startMemory) / 1024 / 1024).toFixed(2)),
    };
  }
}

/**
 * Benchmark scenarios
 */
class CircuitBreakerBenchmark {
  private config = {
    failureThreshold: 5,
    failureThresholdPercentage: 50,
    timeout: 100,
    resetTimeout: 5000,
    rollingWindowSize: 60000,
    volumeThreshold: 10,
  };

  /**
   * Benchmark 1: Throughput - Successful requests
   */
  async benchmarkSuccessfulRequests(
    breaker: CircuitBreaker | OptimizedCircuitBreaker,
    iterations: number
  ): Promise<number[]> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await breaker.execute(async () => {
        return 'success';
      });

      latencies.push(performance.now() - start);
    }

    return latencies;
  }

  /**
   * Benchmark 2: Mixed success/failure pattern
   */
  async benchmarkMixedPattern(
    breaker: CircuitBreaker | OptimizedCircuitBreaker,
    iterations: number,
    failureRate: number = 0.3
  ): Promise<number[]> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      try {
        await breaker.execute(async () => {
          if (Math.random() < failureRate) {
            throw new Error('Random failure');
          }
          return 'success';
        });
      } catch (error) {
        // Expected failures
      }

      latencies.push(performance.now() - start);
    }

    return latencies;
  }

  /**
   * Benchmark 3: Rapid state transitions
   */
  async benchmarkStateTransitions(
    breaker: CircuitBreaker | OptimizedCircuitBreaker,
    iterations: number
  ): Promise<number[]> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Cause failures to open circuit
      for (let j = 0; j < 10; j++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Failure');
          });
        } catch {}
      }

      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 10));

      // Reset circuit
      breaker.reset();

      latencies.push(performance.now() - start);
    }

    return latencies;
  }

  /**
   * Benchmark 4: Rolling window performance at capacity
   */
  async benchmarkRollingWindowAtCapacity(
    breaker: CircuitBreaker | OptimizedCircuitBreaker,
    iterations: number
  ): Promise<number[]> {
    const latencies: number[] = [];

    // Fill buffer to capacity
    for (let i = 0; i < 1000; i++) {
      await breaker.execute(async () => 'warmup');
    }

    // Benchmark operations at capacity
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await breaker.execute(async () => {
        return Math.random() > 0.2 ? 'success' : Promise.reject('fail');
      }).catch(() => {});

      latencies.push(performance.now() - start);
    }

    return latencies;
  }

  /**
   * Benchmark 5: Metrics collection overhead
   */
  async benchmarkMetricsOverhead(
    breaker: CircuitBreaker | OptimizedCircuitBreaker,
    iterations: number
  ): Promise<number[]> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await breaker.execute(async () => 'success');

      // Get metrics (should be fast)
      breaker.getMetrics();

      latencies.push(performance.now() - start);
    }

    return latencies;
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Circuit Breaker Performance Benchmark Suite\n');
    console.log('=' .repeat(80));

    const results: BenchmarkResult[] = [];

    // Benchmark configurations
    const benchmarks = [
      {
        name: 'Successful Requests (10k iterations)',
        iterations: 10000,
        runner: this.benchmarkSuccessfulRequests.bind(this),
      },
      {
        name: 'Mixed Success/Failure (10k iterations, 30% failure)',
        iterations: 10000,
        runner: this.benchmarkMixedPattern.bind(this),
      },
      {
        name: 'Rolling Window at Capacity (5k iterations)',
        iterations: 5000,
        runner: this.benchmarkRollingWindowAtCapacity.bind(this),
      },
      {
        name: 'Metrics Collection Overhead (5k iterations)',
        iterations: 5000,
        runner: this.benchmarkMetricsOverhead.bind(this),
      },
    ];

    for (const benchmark of benchmarks) {
      console.log(`\n📊 Running: ${benchmark.name}`);
      console.log('-'.repeat(80));

      // Test original implementation
      console.log('  Testing Original Implementation...');
      const originalBreaker = new CircuitBreaker('test-original', this.config);
      const originalMonitor = new PerformanceMonitor();

      originalMonitor.start();
      const originalLatencies = await benchmark.runner(originalBreaker, benchmark.iterations);
      originalLatencies.forEach(l => originalMonitor.recordLatency(l));

      const originalResult = originalMonitor.getResults(benchmark.name, 'Original');
      results.push(originalResult);

      // Small delay to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test optimized implementation
      console.log('  Testing Optimized Implementation...');
      const optimizedBreaker = new OptimizedCircuitBreaker('test-optimized', this.config);
      const optimizedMonitor = new PerformanceMonitor();

      optimizedMonitor.start();
      const optimizedLatencies = await benchmark.runner(optimizedBreaker, benchmark.iterations);
      optimizedLatencies.forEach(l => optimizedMonitor.recordLatency(l));

      const optimizedResult = optimizedMonitor.getResults(benchmark.name, 'Optimized');
      results.push(optimizedResult);

      // Cleanup
      if ('destroy' in optimizedBreaker) {
        optimizedBreaker.destroy();
      }

      // Print comparison
      this.printComparison(originalResult, optimizedResult);
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 OVERALL SUMMARY');
    console.log('='.repeat(80));
    this.printSummaryTable(results);
  }

  /**
   * Print comparison between two results
   */
  private printComparison(original: BenchmarkResult, optimized: BenchmarkResult): void {
    const throughputImprovement = ((optimized.opsPerSecond - original.opsPerSecond) / original.opsPerSecond) * 100;
    const latencyImprovement = ((original.avgLatencyMs - optimized.avgLatencyMs) / original.avgLatencyMs) * 100;
    const memoryImprovement = ((original.memoryUsedMB - optimized.memoryUsedMB) / original.memoryUsedMB) * 100;

    console.log('\n  Results:');
    console.log('  ┌─────────────────────────────────────────────────────────────┐');
    console.log(`  │ Metric                    │ Original      │ Optimized     │`);
    console.log('  ├─────────────────────────────────────────────────────────────┤');
    console.log(`  │ Throughput (ops/sec)      │ ${original.opsPerSecond.toString().padStart(13)} │ ${optimized.opsPerSecond.toString().padStart(13)} │`);
    console.log(`  │ Avg Latency (ms)          │ ${original.avgLatencyMs.toFixed(4).padStart(13)} │ ${optimized.avgLatencyMs.toFixed(4).padStart(13)} │`);
    console.log(`  │ P50 Latency (ms)          │ ${original.p50LatencyMs.toFixed(4).padStart(13)} │ ${optimized.p50LatencyMs.toFixed(4).padStart(13)} │`);
    console.log(`  │ P95 Latency (ms)          │ ${original.p95LatencyMs.toFixed(4).padStart(13)} │ ${optimized.p95LatencyMs.toFixed(4).padStart(13)} │`);
    console.log(`  │ P99 Latency (ms)          │ ${original.p99LatencyMs.toFixed(4).padStart(13)} │ ${optimized.p99LatencyMs.toFixed(4).padStart(13)} │`);
    console.log(`  │ Memory Used (MB)          │ ${original.memoryUsedMB.toFixed(2).padStart(13)} │ ${optimized.memoryUsedMB.toFixed(2).padStart(13)} │`);
    console.log('  └─────────────────────────────────────────────────────────────┘');

    console.log('\n  Improvements:');
    console.log(`    🚀 Throughput: ${throughputImprovement > 0 ? '+' : ''}${throughputImprovement.toFixed(2)}%`);
    console.log(`    ⚡ Latency:    ${latencyImprovement > 0 ? '+' : ''}${latencyImprovement.toFixed(2)}%`);
    console.log(`    💾 Memory:     ${memoryImprovement > 0 ? '+' : ''}${memoryImprovement.toFixed(2)}%`);
  }

  /**
   * Print summary table
   */
  private printSummaryTable(results: BenchmarkResult[]): void {
    const originalResults = results.filter(r => r.implementation === 'Original');
    const optimizedResults = results.filter(r => r.implementation === 'Optimized');

    let totalThroughputImprovement = 0;
    let totalLatencyImprovement = 0;
    let totalMemoryImprovement = 0;

    console.log('\n┌───────────────────────────────────────────────────────────────────────────┐');
    console.log('│                        PERFORMANCE IMPROVEMENTS                           │');
    console.log('├───────────────────────────────────────────────────────────────────────────┤');

    for (let i = 0; i < originalResults.length; i++) {
      const original = originalResults[i];
      const optimized = optimizedResults[i];

      const throughputGain = ((optimized.opsPerSecond - original.opsPerSecond) / original.opsPerSecond) * 100;
      const latencyGain = ((original.avgLatencyMs - optimized.avgLatencyMs) / original.avgLatencyMs) * 100;
      const memoryGain = ((original.memoryUsedMB - optimized.memoryUsedMB) / original.memoryUsedMB) * 100;

      totalThroughputImprovement += throughputGain;
      totalLatencyImprovement += latencyGain;
      totalMemoryImprovement += memoryGain;

      console.log(`│ ${original.name.padEnd(73)} │`);
      console.log(`│   Throughput: ${throughputGain >= 0 ? '+' : ''}${throughputGain.toFixed(2)}% │ Latency: ${latencyGain >= 0 ? '+' : ''}${latencyGain.toFixed(2)}% │ Memory: ${memoryGain >= 0 ? '+' : ''}${memoryGain.toFixed(2)}%`.padEnd(74) + '│');
      console.log('├───────────────────────────────────────────────────────────────────────────┤');
    }

    const avgThroughput = totalThroughputImprovement / originalResults.length;
    const avgLatency = totalLatencyImprovement / originalResults.length;
    const avgMemory = totalMemoryImprovement / originalResults.length;

    console.log(`│ AVERAGE IMPROVEMENT                                                       │`);
    console.log(`│   Throughput: ${avgThroughput >= 0 ? '+' : ''}${avgThroughput.toFixed(2)}%                                                      │`);
    console.log(`│   Latency:    ${avgLatency >= 0 ? '+' : ''}${avgLatency.toFixed(2)}%                                                      │`);
    console.log(`│   Memory:     ${avgMemory >= 0 ? '+' : ''}${avgMemory.toFixed(2)}%                                                      │`);
    console.log('└───────────────────────────────────────────────────────────────────────────┘');

    // Verdict
    console.log('\n🎯 VERDICT:\n');

    if (avgThroughput > 100) {
      console.log(`   ✅ EXCELLENT: >2x throughput improvement (${avgThroughput.toFixed(0)}%)`);
    } else if (avgThroughput > 50) {
      console.log(`   ✅ GOOD: Significant throughput improvement (${avgThroughput.toFixed(0)}%)`);
    } else if (avgThroughput > 20) {
      console.log(`   ⚠️  MODERATE: Noticeable throughput improvement (${avgThroughput.toFixed(0)}%)`);
    } else {
      console.log(`   ❌ MINIMAL: Limited throughput improvement (${avgThroughput.toFixed(0)}%)`);
    }

    if (avgLatency > 50) {
      console.log(`   ✅ EXCELLENT: >50% latency reduction (${avgLatency.toFixed(0)}%)`);
    } else if (avgLatency > 25) {
      console.log(`   ✅ GOOD: Significant latency reduction (${avgLatency.toFixed(0)}%)`);
    } else if (avgLatency > 10) {
      console.log(`   ⚠️  MODERATE: Noticeable latency reduction (${avgLatency.toFixed(0)}%)`);
    } else {
      console.log(`   ❌ MINIMAL: Limited latency reduction (${avgLatency.toFixed(0)}%)`);
    }

    if (avgMemory > 30) {
      console.log(`   ✅ EXCELLENT: >30% memory reduction (${avgMemory.toFixed(0)}%)`);
    } else if (avgMemory > 10) {
      console.log(`   ✅ GOOD: Noticeable memory reduction (${avgMemory.toFixed(0)}%)`);
    } else if (avgMemory > 0) {
      console.log(`   ⚠️  MODERATE: Small memory reduction (${avgMemory.toFixed(0)}%)`);
    } else {
      console.log(`   ❌ REGRESSION: Memory usage increased (${avgMemory.toFixed(0)}%)`);
    }

    console.log('\n');
  }
}

/**
 * Run benchmarks
 */
async function main() {
  console.log('Starting Circuit Breaker Performance Benchmark...\n');
  console.log('⚠️  Note: Run with --expose-gc for accurate memory measurements');
  console.log('   Example: node --expose-gc circuit-breaker-benchmark.js\n');

  const benchmark = new CircuitBreakerBenchmark();
  await benchmark.runAllBenchmarks();

  console.log('\n✅ Benchmark complete!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

export { CircuitBreakerBenchmark, PerformanceMonitor };
