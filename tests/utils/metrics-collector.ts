/**
 * Metrics Collector Utility
 * Collects and aggregates performance metrics
 */

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface MetricSummary {
  name: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  unit: string;
  values: number[];
}

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  /**
   * Record a metric value
   */
  record(name: string, value: number, unit: string = '', tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);
  }

  /**
   * Increment a counter
   */
  increment(name: string, delta: number = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) + delta);
  }

  /**
   * Decrement a counter
   */
  decrement(name: string, delta: number = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) - delta);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Get counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string): number | undefined {
    return this.gauges.get(name);
  }

  /**
   * Get all metrics for a name
   */
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get metric summary
   */
  getSummary(name: string): MetricSummary | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const values = metrics.map((m) => m.value);
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      name,
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
      median: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      unit: metrics[0].unit,
      values,
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get all counter names
   */
  getCounterNames(): string[] {
    return Array.from(this.counters.keys());
  }

  /**
   * Get all gauge names
   */
  getGaugeNames(): string[] {
    return Array.from(this.gauges.keys());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
  }

  /**
   * Clear specific metric
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
    this.counters.delete(name);
    this.gauges.delete(name);
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Export counters
    for (const [name, value] of this.counters.entries()) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${value}`);
    }

    // Export gauges
    for (const [name, value] of this.gauges.entries()) {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${value}`);
    }

    // Export histograms
    for (const name of this.metrics.keys()) {
      const summary = this.getSummary(name);
      if (summary) {
        lines.push(`# TYPE ${name} histogram`);
        lines.push(`${name}_count ${summary.count}`);
        lines.push(`${name}_sum ${summary.mean * summary.count}`);
        lines.push(`${name}{quantile="0.5"} ${summary.median}`);
        lines.push(`${name}{quantile="0.95"} ${summary.p95}`);
        lines.push(`${name}{quantile="0.99"} ${summary.p99}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  exportJSON(): object {
    const result: any = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      metrics: {},
    };

    for (const name of this.metrics.keys()) {
      result.metrics[name] = this.getSummary(name);
    }

    return result;
  }

  /**
   * Generate metrics report
   */
  generateReport(): string {
    const lines: string[] = ['Metrics Report', '==============', ''];

    // Counters
    if (this.counters.size > 0) {
      lines.push('Counters:');
      for (const [name, value] of this.counters.entries()) {
        lines.push(`  ${name}: ${value}`);
      }
      lines.push('');
    }

    // Gauges
    if (this.gauges.size > 0) {
      lines.push('Gauges:');
      for (const [name, value] of this.gauges.entries()) {
        lines.push(`  ${name}: ${value}`);
      }
      lines.push('');
    }

    // Metrics
    if (this.metrics.size > 0) {
      lines.push('Metrics:');
      for (const name of this.metrics.keys()) {
        const summary = this.getSummary(name);
        if (summary) {
          lines.push(`  ${name}:`);
          lines.push(`    Count: ${summary.count}`);
          lines.push(`    Min: ${summary.min.toFixed(2)} ${summary.unit}`);
          lines.push(`    Max: ${summary.max.toFixed(2)} ${summary.unit}`);
          lines.push(`    Mean: ${summary.mean.toFixed(2)} ${summary.unit}`);
          lines.push(`    Median: ${summary.median.toFixed(2)} ${summary.unit}`);
          lines.push(`    P95: ${summary.p95.toFixed(2)} ${summary.unit}`);
          lines.push(`    P99: ${summary.p99.toFixed(2)} ${summary.unit}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Time an operation and record as metric
   */
  async time<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.record(name, duration, 'ms');
    return result;
  }

  /**
   * Create a timer that can be stopped manually
   */
  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.record(name, duration, 'ms');
    };
  }
}

/**
 * Create a metrics collector instance
 */
export function createMetricsCollector(): MetricsCollector {
  return new MetricsCollector();
}

/**
 * Global metrics collector instance
 */
export const globalMetrics = new MetricsCollector();
