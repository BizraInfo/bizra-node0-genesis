/**
 * Latency Tracker Utility
 * Tracks and analyzes request/operation latencies
 */

export interface LatencyMetrics {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
}

export interface LatencyBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export class LatencyTracker {
  private latencies: number[] = [];
  private buckets: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start tracking an operation
   */
  start(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }

  /**
   * End tracking an operation and record latency
   */
  end(operationId: string): number | null {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return null;

    const latency = performance.now() - startTime;
    this.latencies.push(latency);
    this.startTimes.delete(operationId);
    this.categorizeToBucket(latency);

    return latency;
  }

  /**
   * Record a latency directly
   */
  record(latency: number): void {
    this.latencies.push(latency);
    this.categorizeToBucket(latency);
  }

  /**
   * Track a synchronous operation
   */
  track<T>(fn: () => T): { result: T; latency: number } {
    const start = performance.now();
    const result = fn();
    const latency = performance.now() - start;
    this.record(latency);
    return { result, latency };
  }

  /**
   * Track an async operation
   */
  async trackAsync<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = performance.now();
    const result = await fn();
    const latency = performance.now() - start;
    this.record(latency);
    return { result, latency };
  }

  /**
   * Categorize latency into buckets
   */
  private categorizeToBucket(latency: number): void {
    const buckets = [
      { label: '0-10ms', max: 10 },
      { label: '10-50ms', max: 50 },
      { label: '50-100ms', max: 100 },
      { label: '100-500ms', max: 500 },
      { label: '500ms-1s', max: 1000 },
      { label: '1s-5s', max: 5000 },
      { label: '5s+', max: Infinity },
    ];

    for (const bucket of buckets) {
      if (latency <= bucket.max) {
        this.buckets.set(bucket.label, (this.buckets.get(bucket.label) || 0) + 1);
        break;
      }
    }
  }

  /**
   * Get percentile value
   */
  getPercentile(percentile: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): LatencyMetrics {
    if (this.latencies.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        p50: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        p999: 0,
      };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: this.getPercentile(50),
      stdDev: this.calculateStdDev(sorted, mean),
      p50: this.getPercentile(50),
      p75: this.getPercentile(75),
      p90: this.getPercentile(90),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
      p999: this.getPercentile(99.9),
    };
  }

  /**
   * Get latency distribution buckets
   */
  getDistribution(): LatencyBucket[] {
    return [
      { label: '0-10ms', min: 0, max: 10, count: this.buckets.get('0-10ms') || 0 },
      { label: '10-50ms', min: 10, max: 50, count: this.buckets.get('10-50ms') || 0 },
      { label: '50-100ms', min: 50, max: 100, count: this.buckets.get('50-100ms') || 0 },
      { label: '100-500ms', min: 100, max: 500, count: this.buckets.get('100-500ms') || 0 },
      { label: '500ms-1s', min: 500, max: 1000, count: this.buckets.get('500ms-1s') || 0 },
      { label: '1s-5s', min: 1000, max: 5000, count: this.buckets.get('1s-5s') || 0 },
      { label: '5s+', min: 5000, max: Infinity, count: this.buckets.get('5s+') || 0 },
    ];
  }

  /**
   * Check if latencies meet SLA
   */
  checkSLA(targetP95: number, targetP99: number): { met: boolean; p95: number; p99: number } {
    const metrics = this.getMetrics();
    return {
      met: metrics.p95 <= targetP95 && metrics.p99 <= targetP99,
      p95: metrics.p95,
      p99: metrics.p99,
    };
  }

  /**
   * Generate latency report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const distribution = this.getDistribution();

    const distributionText = distribution
      .map((bucket) => `  ${bucket.label.padEnd(12)}: ${bucket.count} requests`)
      .join('\n');

    return `
Latency Tracker Report
======================
Total Requests: ${metrics.count}
Min Latency: ${metrics.min.toFixed(2)}ms
Max Latency: ${metrics.max.toFixed(2)}ms
Mean Latency: ${metrics.mean.toFixed(2)}ms
Median Latency: ${metrics.median.toFixed(2)}ms
Std Deviation: ${metrics.stdDev.toFixed(2)}ms

Percentiles:
  P50: ${metrics.p50.toFixed(2)}ms
  P75: ${metrics.p75.toFixed(2)}ms
  P90: ${metrics.p90.toFixed(2)}ms
  P95: ${metrics.p95.toFixed(2)}ms
  P99: ${metrics.p99.toFixed(2)}ms
  P99.9: ${metrics.p999.toFixed(2)}ms

Distribution:
${distributionText}
    `.trim();
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this.latencies = [];
    this.buckets.clear();
    this.startTimes.clear();
  }

  /**
   * Get raw latencies
   */
  getRawLatencies(): number[] {
    return [...this.latencies];
  }
}

/**
 * Create a latency tracker instance
 */
export function createLatencyTracker(): LatencyTracker {
  return new LatencyTracker();
}
