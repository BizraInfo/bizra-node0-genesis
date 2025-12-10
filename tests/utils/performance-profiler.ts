/**
 * Performance Profiler Utility
 * Provides precise timing and resource usage measurements
 */

export interface ProfileResult {
  duration: number;
  cpuUsage: {
    user: number;
    system: number;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  timestamp: number;
}

export interface BenchmarkResult extends ProfileResult {
  operationsPerSecond: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

export class PerformanceProfiler {
  private startTime: number = 0;
  private startCpu: NodeJS.CpuUsage | null = null;
  private startMemory: NodeJS.MemoryUsage | null = null;
  private measurements: number[] = [];

  /**
   * Start profiling
   */
  start(): void {
    this.startTime = performance.now();
    this.startCpu = process.cpuUsage();
    this.startMemory = process.memoryUsage();
    this.measurements = [];
  }

  /**
   * End profiling and return results
   */
  end(): ProfileResult {
    const endTime = performance.now();
    const endCpu = process.cpuUsage(this.startCpu || undefined);
    const endMemory = process.memoryUsage();

    return {
      duration: endTime - this.startTime,
      cpuUsage: {
        user: endCpu.user,
        system: endCpu.system,
      },
      memoryUsage: {
        heapUsed: endMemory.heapUsed - (this.startMemory?.heapUsed || 0),
        heapTotal: endMemory.heapTotal - (this.startMemory?.heapTotal || 0),
        external: endMemory.external - (this.startMemory?.external || 0),
        rss: endMemory.rss - (this.startMemory?.rss || 0),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Record a single measurement
   */
  measure(fn: () => void): number {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    this.measurements.push(duration);
    return duration;
  }

  /**
   * Async measurement
   */
  async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.measurements.push(duration);
    return { result, duration };
  }

  /**
   * Run benchmark with multiple iterations
   */
  async benchmark(
    fn: () => Promise<void> | void,
    iterations: number = 1000,
  ): Promise<BenchmarkResult> {
    const profiler = new PerformanceProfiler();
    profiler.start();

    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      latencies.push(performance.now() - start);
    }

    const result = profiler.end();
    const sortedLatencies = latencies.sort((a, b) => a - b);

    return {
      ...result,
      operationsPerSecond: (iterations / result.duration) * 1000,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / iterations,
      minLatency: sortedLatencies[0],
      maxLatency: sortedLatencies[sortedLatencies.length - 1],
      p50Latency: sortedLatencies[Math.floor(iterations * 0.5)],
      p95Latency: sortedLatencies[Math.floor(iterations * 0.95)],
      p99Latency: sortedLatencies[Math.floor(iterations * 0.99)],
    };
  }

  /**
   * Calculate percentile from measurements
   */
  getPercentile(percentile: number): number {
    const sorted = [...this.measurements].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * (percentile / 100));
    return sorted[index] || 0;
  }

  /**
   * Get statistics from measurements
   */
  getStats(): {
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
  } {
    if (this.measurements.length === 0) {
      return { count: 0, min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.measurements].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
      median: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Reset profiler state
   */
  reset(): void {
    this.startTime = 0;
    this.startCpu = null;
    this.startMemory = null;
    this.measurements = [];
  }
}

/**
 * Create a profiler instance
 */
export function createProfiler(): PerformanceProfiler {
  return new PerformanceProfiler();
}

/**
 * Quick profile wrapper
 */
export async function profile<T>(
  fn: () => Promise<T> | T,
): Promise<{ result: T; profile: ProfileResult }> {
  const profiler = new PerformanceProfiler();
  profiler.start();
  const result = await fn();
  const profile = profiler.end();
  return { result, profile };
}
