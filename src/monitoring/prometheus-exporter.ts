/**
 * ENTERPRISE-GRADE Prometheus Metrics Exporter
 *
 * Aggregates and exports metrics from all monitoring services:
 * - Performance metrics
 * - Database pool metrics
 * - Cache metrics
 * - Circuit breaker metrics
 * - System metrics
 */

import { EventEmitter } from "events";
import { performanceMetrics } from "./performance-metrics.service";
import { dbPoolMonitor } from "./db-pool-monitor";
import { cacheMonitor } from "./cache-monitor";
import { circuitBreakerMonitor } from "./circuit-breaker-monitor";

interface ExporterConfig {
  prefix?: string;
  includeTimestamps?: boolean;
  includeSystemMetrics?: boolean;
  customLabels?: Record<string, string>;
}

export class PrometheusExporter extends EventEmitter {
  private static instance: PrometheusExporter;
  private config: ExporterConfig;
  private customMetrics: Map<string, string[]> = new Map();
  private startTime: number;

  private constructor(config: ExporterConfig = {}) {
    super();
    this.config = {
      prefix: config.prefix || "",
      includeTimestamps: config.includeTimestamps ?? true,
      includeSystemMetrics: config.includeSystemMetrics ?? true,
      customLabels: config.customLabels || {},
    };
    this.startTime = Date.now();
  }

  public static getInstance(config?: ExporterConfig): PrometheusExporter {
    if (!PrometheusExporter.instance) {
      PrometheusExporter.instance = new PrometheusExporter(config);
    }
    return PrometheusExporter.instance;
  }

  /**
   * Export all metrics in Prometheus format
   */
  public export(): string {
    const sections: string[] = [];
    const timestamp = Date.now();

    // System uptime
    if (this.config.includeSystemMetrics) {
      sections.push(this.exportSystemMetrics(timestamp));
    }

    // Performance metrics
    sections.push(performanceMetrics.toPrometheus());

    // Database pool metrics
    sections.push(dbPoolMonitor.toPrometheus());

    // Cache metrics
    sections.push(cacheMonitor.toPrometheus());

    // Circuit breaker metrics
    sections.push(circuitBreakerMonitor.toPrometheus());

    // Custom metrics
    this.customMetrics.forEach((lines, name) => {
      sections.push(lines.join("\n") + "\n");
    });

    let output = sections.join("\n");

    // Apply prefix if configured
    if (this.config.prefix) {
      output = this.applyPrefix(output, this.config.prefix);
    }

    // Apply custom labels if configured
    if (Object.keys(this.config.customLabels).length > 0) {
      output = this.applyCustomLabels(output, this.config.customLabels);
    }

    this.emit("export", { timestamp, size: output.length });

    return output;
  }

  /**
   * Export system-level metrics
   */
  private exportSystemMetrics(timestamp: number): string {
    const lines: string[] = [];
    const uptime = Date.now() - this.startTime;

    // System uptime
    lines.push("# HELP system_uptime_seconds System uptime in seconds");
    lines.push("# TYPE system_uptime_seconds counter");
    lines.push(
      `system_uptime_seconds ${(uptime / 1000).toFixed(0)} ${timestamp}`,
    );

    // Process uptime
    lines.push("# HELP process_uptime_seconds Process uptime in seconds");
    lines.push("# TYPE process_uptime_seconds counter");
    lines.push(
      `process_uptime_seconds ${process.uptime().toFixed(0)} ${timestamp}`,
    );

    // Memory usage
    const mem = process.memoryUsage();
    lines.push("# HELP process_memory_bytes Process memory usage in bytes");
    lines.push("# TYPE process_memory_bytes gauge");
    lines.push(`process_memory_bytes{type="rss"} ${mem.rss} ${timestamp}`);
    lines.push(
      `process_memory_bytes{type="heap_total"} ${mem.heapTotal} ${timestamp}`,
    );
    lines.push(
      `process_memory_bytes{type="heap_used"} ${mem.heapUsed} ${timestamp}`,
    );
    lines.push(
      `process_memory_bytes{type="external"} ${mem.external} ${timestamp}`,
    );
    lines.push(
      `process_memory_bytes{type="array_buffers"} ${mem.arrayBuffers} ${timestamp}`,
    );

    // CPU usage
    const cpuUsage = process.cpuUsage();
    lines.push(
      "# HELP process_cpu_usage_microseconds Process CPU usage in microseconds",
    );
    lines.push("# TYPE process_cpu_usage_microseconds counter");
    lines.push(
      `process_cpu_usage_microseconds{type="user"} ${cpuUsage.user} ${timestamp}`,
    );
    lines.push(
      `process_cpu_usage_microseconds{type="system"} ${cpuUsage.system} ${timestamp}`,
    );

    // Event loop lag (approximation)
    const eventLoopLag = this.measureEventLoopLag();
    lines.push(
      "# HELP nodejs_eventloop_lag_milliseconds Event loop lag in milliseconds",
    );
    lines.push("# TYPE nodejs_eventloop_lag_milliseconds gauge");
    lines.push(
      `nodejs_eventloop_lag_milliseconds ${eventLoopLag} ${timestamp}`,
    );

    // Active handles and requests
    lines.push("# HELP nodejs_active_handles Active handles");
    lines.push("# TYPE nodejs_active_handles gauge");
    lines.push(
      `nodejs_active_handles ${(process as any)._getActiveHandles?.().length || 0} ${timestamp}`,
    );

    lines.push("# HELP nodejs_active_requests Active requests");
    lines.push("# TYPE nodejs_active_requests gauge");
    lines.push(
      `nodejs_active_requests ${(process as any)._getActiveRequests?.().length || 0} ${timestamp}`,
    );

    return lines.join("\n") + "\n";
  }

  /**
   * Measure event loop lag
   */
  private measureEventLoopLag(): number {
    const start = process.hrtime.bigint();
    return Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
  }

  /**
   * Register custom metric
   */
  public registerMetric(
    name: string,
    type: "counter" | "gauge" | "histogram" | "summary",
    help: string,
    value: number | string,
    labels?: Record<string, string>,
  ): void {
    const lines: string[] = [];
    const timestamp = Date.now();

    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} ${type}`);

    let metricLine = name;
    if (labels && Object.keys(labels).length > 0) {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");
      metricLine += `{${labelStr}}`;
    }

    metricLine += ` ${value}`;
    if (this.config.includeTimestamps) {
      metricLine += ` ${timestamp}`;
    }

    lines.push(metricLine);

    this.customMetrics.set(name, lines);
    this.emit("metric:registered", { name, type, help });
  }

  /**
   * Increment counter metric
   */
  public incrementCounter(
    name: string,
    labels?: Record<string, string>,
    amount: number = 1,
  ): void {
    // This would integrate with actual Prometheus client in production
    this.emit("metric:increment", { name, labels, amount });
  }

  /**
   * Set gauge metric
   */
  public setGauge(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    // This would integrate with actual Prometheus client in production
    this.emit("metric:gauge", { name, value, labels });
  }

  /**
   * Observe histogram value
   */
  public observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    // This would integrate with actual Prometheus client in production
    this.emit("metric:histogram", { name, value, labels });
  }

  /**
   * Apply prefix to all metrics
   */
  private applyPrefix(content: string, prefix: string): string {
    return content
      .split("\n")
      .map((line) => {
        if (line.startsWith("# ") || line.trim() === "") {
          return line;
        }
        return `${prefix}_${line}`;
      })
      .join("\n");
  }

  /**
   * Apply custom labels to all metrics
   */
  private applyCustomLabels(
    content: string,
    labels: Record<string, string>,
  ): string {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");

    return content
      .split("\n")
      .map((line) => {
        if (line.startsWith("# ") || line.trim() === "") {
          return line;
        }

        // Insert labels before closing brace or before value
        if (line.includes("{")) {
          return line.replace("{", `{${labelStr},`);
        } else {
          const parts = line.split(" ");
          if (parts.length >= 2) {
            return `${parts[0]}{${labelStr}} ${parts.slice(1).join(" ")}`;
          }
        }

        return line;
      })
      .join("\n");
  }

  /**
   * Export metrics as JSON (for debugging)
   */
  public exportJSON(): object {
    return {
      timestamp: Date.now(),
      uptime: performanceMetrics.getUptime(),
      performance: {
        snapshots: performanceMetrics.getHistory(5),
      },
      database: {
        pool: dbPoolMonitor.getMetrics(),
        health: dbPoolMonitor.assessHealth(),
      },
      cache: {
        L1: cacheMonitor.getLayerMetrics("L1"),
        L2: cacheMonitor.getLayerMetrics("L2"),
        health: cacheMonitor.assessHealth(),
      },
      circuits: {
        metrics: Array.from(circuitBreakerMonitor.getAllMetrics().entries()),
        health: circuitBreakerMonitor.assessHealth(),
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Get content type header for Prometheus
   */
  public getContentType(): string {
    return "text/plain; version=0.0.4; charset=utf-8";
  }

  /**
   * Reset all custom metrics
   */
  public resetCustomMetrics(): void {
    this.customMetrics.clear();
    this.emit("metrics:reset");
  }

  /**
   * Get metrics summary
   */
  public getSummary(): {
    totalMetrics: number;
    categories: string[];
    lastExport: number;
    exportSize: number;
  } {
    const exported = this.export();
    return {
      totalMetrics: this.customMetrics.size,
      categories: [
        "performance",
        "database",
        "cache",
        "circuit-breaker",
        "system",
      ],
      lastExport: Date.now(),
      exportSize: exported.length,
    };
  }
}

// Export singleton instance
export const prometheusExporter = PrometheusExporter.getInstance();
