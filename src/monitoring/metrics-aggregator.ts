/**
 * ENTERPRISE-GRADE Metrics Aggregator
 *
 * Aggregates metrics across time windows:
 * - Time-based aggregation (1m, 5m, 15m, 1h)
 * - Statistical aggregation (min, max, avg, sum, percentiles)
 * - Metric rollup and downsampling
 * - Historical data retention
 */

import { EventEmitter } from "events";

interface TimeWindow {
  duration: number; // milliseconds
  maxSize: number; // maximum data points to retain
}

interface AggregatedMetric {
  timestamp: number;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface MetricDataPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export class MetricsAggregator extends EventEmitter {
  private static instance: MetricsAggregator;

  private readonly TIME_WINDOWS: Record<string, TimeWindow> = {
    "1m": { duration: 60 * 1000, maxSize: 1440 }, // 1 day at 1-minute resolution
    "5m": { duration: 5 * 60 * 1000, maxSize: 2016 }, // 7 days at 5-minute resolution
    "15m": { duration: 15 * 60 * 1000, maxSize: 2880 }, // 30 days at 15-minute resolution
    "1h": { duration: 60 * 60 * 1000, maxSize: 2160 }, // 90 days at 1-hour resolution
  };

  private metrics: Map<string, Map<string, MetricDataPoint[]>> = new Map();
  private aggregated: Map<string, Map<string, AggregatedMetric[]>> = new Map();
  private aggregationInterval?: NodeJS.Timeout;
  private readonly AGGREGATION_INTERVAL_MS = 60000; // 1 minute

  private constructor() {
    super();
    this.startAggregation();
  }

  public static getInstance(): MetricsAggregator {
    if (!MetricsAggregator.instance) {
      MetricsAggregator.instance = new MetricsAggregator();
    }
    return MetricsAggregator.instance;
  }

  private startAggregation(): void {
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
      this.cleanup();
    }, this.AGGREGATION_INTERVAL_MS);
  }

  /**
   * Record a metric data point
   */
  public record(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const labelKey = this.getLabelKey(labels);

    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, new Map());
    }

    const metricMap = this.metrics.get(metricName)!;
    if (!metricMap.has(labelKey)) {
      metricMap.set(labelKey, []);
    }

    const dataPoints = metricMap.get(labelKey)!;
    dataPoints.push({
      timestamp: Date.now(),
      value,
      labels,
    });

    // Limit raw data points to prevent memory bloat
    const MAX_RAW_POINTS = 10000;
    if (dataPoints.length > MAX_RAW_POINTS) {
      dataPoints.shift();
    }

    this.emit("metric:recorded", {
      metricName,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Get aggregated metrics for a time window
   */
  public getAggregated(
    metricName: string,
    window: "1m" | "5m" | "15m" | "1h",
    labels?: Record<string, string>,
    limit?: number,
  ): AggregatedMetric[] {
    const labelKey = this.getLabelKey(labels);

    if (!this.aggregated.has(metricName)) {
      return [];
    }

    const metricMap = this.aggregated.get(metricName)!;
    const key = `${window}:${labelKey}`;

    if (!metricMap.has(key)) {
      return [];
    }

    const aggregates = metricMap.get(key)!;
    return limit ? aggregates.slice(-limit) : aggregates;
  }

  /**
   * Aggregate metrics across all time windows
   */
  private aggregateMetrics(): void {
    const now = Date.now();

    this.metrics.forEach((metricMap, metricName) => {
      metricMap.forEach((dataPoints, labelKey) => {
        Object.entries(this.TIME_WINDOWS).forEach(([windowName, window]) => {
          this.aggregateWindow(
            metricName,
            labelKey,
            dataPoints,
            windowName,
            window,
            now,
          );
        });
      });
    });

    this.emit("aggregation:complete", { timestamp: now });
  }

  /**
   * Aggregate data points for a specific time window
   */
  private aggregateWindow(
    metricName: string,
    labelKey: string,
    dataPoints: MetricDataPoint[],
    windowName: string,
    window: TimeWindow,
    now: number,
  ): void {
    const windowStart = now - window.duration;
    const relevantPoints = dataPoints.filter(
      (dp) => dp.timestamp >= windowStart,
    );

    if (relevantPoints.length === 0) {
      return;
    }

    const values = relevantPoints.map((dp) => dp.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;

    const aggregated: AggregatedMetric = {
      timestamp: now,
      count,
      sum,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / count,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };

    // Store aggregated metric
    if (!this.aggregated.has(metricName)) {
      this.aggregated.set(metricName, new Map());
    }

    const metricMap = this.aggregated.get(metricName)!;
    const key = `${windowName}:${labelKey}`;

    if (!metricMap.has(key)) {
      metricMap.set(key, []);
    }

    const aggregates = metricMap.get(key)!;
    aggregates.push(aggregated);

    // Maintain size limit
    if (aggregates.length > window.maxSize) {
      aggregates.shift();
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get label key for grouping
   */
  private getLabelKey(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return "default";
    }

    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const now = Date.now();
    const MAX_RAW_AGE = 24 * 60 * 60 * 1000; // 24 hours

    this.metrics.forEach((metricMap) => {
      metricMap.forEach((dataPoints) => {
        const cutoff = now - MAX_RAW_AGE;
        const filtered = dataPoints.filter((dp) => dp.timestamp >= cutoff);
        dataPoints.length = 0;
        dataPoints.push(...filtered);
      });
    });

    this.emit("cleanup:complete", { timestamp: now });
  }

  /**
   * Get metric statistics
   */
  public getStats(): {
    totalMetrics: number;
    totalDataPoints: number;
    totalAggregates: number;
    memoryUsage: number;
  } {
    let totalDataPoints = 0;
    let totalAggregates = 0;

    this.metrics.forEach((metricMap) => {
      metricMap.forEach((dataPoints) => {
        totalDataPoints += dataPoints.length;
      });
    });

    this.aggregated.forEach((metricMap) => {
      metricMap.forEach((aggregates) => {
        totalAggregates += aggregates.length;
      });
    });

    return {
      totalMetrics: this.metrics.size,
      totalDataPoints,
      totalAggregates,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Query metrics with time range
   */
  public query(
    metricName: string,
    startTime: number,
    endTime: number,
    labels?: Record<string, string>,
  ): MetricDataPoint[] {
    const labelKey = this.getLabelKey(labels);

    if (!this.metrics.has(metricName)) {
      return [];
    }

    const metricMap = this.metrics.get(metricName)!;
    if (!metricMap.has(labelKey)) {
      return [];
    }

    const dataPoints = metricMap.get(labelKey)!;
    return dataPoints.filter(
      (dp) => dp.timestamp >= startTime && dp.timestamp <= endTime,
    );
  }

  /**
   * Export metrics to external system
   */
  public export(
    format: "json" | "csv" = "json",
    metricNames?: string[],
  ): string {
    const metricsToExport = metricNames || Array.from(this.metrics.keys());

    if (format === "json") {
      const data: any = {};

      metricsToExport.forEach((name) => {
        if (this.metrics.has(name)) {
          const metricMap = this.metrics.get(name)!;
          data[name] = {};

          metricMap.forEach((dataPoints, labelKey) => {
            data[name][labelKey] = dataPoints;
          });
        }
      });

      return JSON.stringify(data, null, 2);
    } else {
      // CSV format
      const lines: string[] = ["timestamp,metric,labels,value"];

      metricsToExport.forEach((name) => {
        if (this.metrics.has(name)) {
          const metricMap = this.metrics.get(name)!;

          metricMap.forEach((dataPoints, labelKey) => {
            dataPoints.forEach((dp) => {
              lines.push(`${dp.timestamp},${name},${labelKey},${dp.value}`);
            });
          });
        }
      });

      return lines.join("\n");
    }
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.metrics.clear();
    this.aggregated.clear();
    this.emit("reset");
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = undefined;
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const metricsAggregator = MetricsAggregator.getInstance();
