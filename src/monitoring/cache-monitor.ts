/**
 * ENTERPRISE-GRADE Cache Performance Monitor
 *
 * Monitors multi-tier cache performance:
 * - L1/L2 hit rate tracking
 * - Eviction frequency monitoring
 * - Compression ratio measurement
 * - Latency distribution analysis
 * - Memory usage tracking
 */

import { EventEmitter } from "events";
import { performanceMetrics } from "./performance-metrics.service";

interface CacheLayerMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  sets: number;
  gets: number;
  deletes: number;
  size: number;
  memoryUsage: number;
  avgGetLatency: number;
  avgSetLatency: number;
  compressionRatio: number;
  timestamp: number;
}

interface CacheEvent {
  type: "hit" | "miss" | "set" | "eviction" | "delete";
  layer: "L1" | "L2";
  key: string;
  timestamp: number;
  latency?: number;
  size?: number;
  compressed?: boolean;
}

interface CacheHealth {
  status: "optimal" | "good" | "degraded" | "critical";
  score: number;
  issues: string[];
  recommendations: string[];
  L1: CacheLayerMetrics;
  L2: CacheLayerMetrics;
}

interface LatencyDistribution {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export class CacheMonitor extends EventEmitter {
  private static instance: CacheMonitor;
  private L1Metrics: CacheLayerMetrics;
  private L2Metrics: CacheLayerMetrics;
  private events: CacheEvent[] = [];
  private readonly EVENT_HISTORY_SIZE = 5000;
  private getLatencies: Map<"L1" | "L2", number[]> = new Map();
  private setLatencies: Map<"L1" | "L2", number[]> = new Map();
  private readonly LATENCY_WINDOW_SIZE = 1000;
  private monitorInterval?: NodeJS.Timeout;
  private readonly MONITOR_INTERVAL_MS = 5000;

  private constructor() {
    super();
    this.L1Metrics = this.initializeMetrics();
    this.L2Metrics = this.initializeMetrics();
    this.getLatencies.set("L1", []);
    this.getLatencies.set("L2", []);
    this.setLatencies.set("L1", []);
    this.setLatencies.set("L2", []);
    this.startMonitoring();
  }

  public static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  private initializeMetrics(): CacheLayerMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      sets: 0,
      gets: 0,
      deletes: 0,
      size: 0,
      memoryUsage: 0,
      avgGetLatency: 0,
      avgSetLatency: 0,
      compressionRatio: 1.0,
      timestamp: Date.now(),
    };
  }

  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.updateMetrics();
      const health = this.assessHealth();

      this.emit("cache:metrics", {
        L1: this.L1Metrics,
        L2: this.L2Metrics,
      });

      this.emit("cache:health", health);

      if (health.status === "critical") {
        this.emit("cache:critical", health);
      }
    }, this.MONITOR_INTERVAL_MS);
  }

  /**
   * Record cache hit
   */
  public recordHit(layer: "L1" | "L2", key: string, latency: number): void {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;

    metrics.hits++;
    metrics.gets++;
    this.updateHitRate(metrics);

    this.recordLatency(layer, "get", latency);
    this.recordEvent({
      type: "hit",
      layer,
      key,
      timestamp: Date.now(),
      latency,
    });

    performanceMetrics.recordCacheHit(layer);
    performanceMetrics.recordLatency(`cache:${layer}:get`, latency);
  }

  /**
   * Record cache miss
   */
  public recordMiss(layer: "L1" | "L2", key: string, latency: number): void {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;

    metrics.misses++;
    metrics.gets++;
    this.updateHitRate(metrics);

    this.recordLatency(layer, "get", latency);
    this.recordEvent({
      type: "miss",
      layer,
      key,
      timestamp: Date.now(),
      latency,
    });

    performanceMetrics.recordCacheMiss(layer);
    performanceMetrics.recordLatency(`cache:${layer}:get`, latency);
  }

  /**
   * Record cache set operation
   */
  public recordSet(
    layer: "L1" | "L2",
    key: string,
    latency: number,
    size: number,
    compressed: boolean = false,
  ): void {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;

    metrics.sets++;
    metrics.size += size;
    metrics.memoryUsage += size;

    this.recordLatency(layer, "set", latency);
    this.recordEvent({
      type: "set",
      layer,
      key,
      timestamp: Date.now(),
      latency,
      size,
      compressed,
    });

    performanceMetrics.recordLatency(`cache:${layer}:set`, latency);
  }

  /**
   * Record cache eviction
   */
  public recordEviction(layer: "L1" | "L2", key: string, size: number): void {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;

    metrics.evictions++;
    metrics.size -= size;
    metrics.memoryUsage -= size;

    this.recordEvent({
      type: "eviction",
      layer,
      key,
      timestamp: Date.now(),
      size,
    });

    this.emit("cache:eviction", { layer, key, size, timestamp: Date.now() });
  }

  /**
   * Record cache delete operation
   */
  public recordDelete(layer: "L1" | "L2", key: string, size: number): void {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;

    metrics.deletes++;
    metrics.size -= size;
    metrics.memoryUsage -= size;

    this.recordEvent({
      type: "delete",
      layer,
      key,
      timestamp: Date.now(),
      size,
    });
  }

  /**
   * Update compression ratio
   */
  public updateCompressionRatio(layer: "L1" | "L2", ratio: number): void {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;
    metrics.compressionRatio = ratio;
  }

  private recordLatency(
    layer: "L1" | "L2",
    operation: "get" | "set",
    latency: number,
  ): void {
    const latencies =
      operation === "get" ? this.getLatencies : this.setLatencies;
    const arr = latencies.get(layer)!;

    arr.push(latency);

    // Maintain window size
    if (arr.length > this.LATENCY_WINDOW_SIZE) {
      arr.shift();
    }
  }

  private recordEvent(event: CacheEvent): void {
    this.events.push(event);

    if (this.events.length > this.EVENT_HISTORY_SIZE) {
      this.events.shift();
    }
  }

  private updateHitRate(metrics: CacheLayerMetrics): void {
    const total = metrics.hits + metrics.misses;
    metrics.hitRate = total > 0 ? metrics.hits / total : 0;
  }

  private updateMetrics(): void {
    // Update L1 metrics
    this.updateLayerMetrics(this.L1Metrics, "L1");

    // Update L2 metrics
    this.updateLayerMetrics(this.L2Metrics, "L2");
  }

  private updateLayerMetrics(
    metrics: CacheLayerMetrics,
    layer: "L1" | "L2",
  ): void {
    const getLatencies = this.getLatencies.get(layer)!;
    const setLatencies = this.setLatencies.get(layer)!;

    if (getLatencies.length > 0) {
      metrics.avgGetLatency =
        getLatencies.reduce((a, b) => a + b, 0) / getLatencies.length;
    }

    if (setLatencies.length > 0) {
      metrics.avgSetLatency =
        setLatencies.reduce((a, b) => a + b, 0) / setLatencies.length;
    }

    metrics.timestamp = Date.now();
  }

  /**
   * Get latency distribution for a layer
   */
  public getLatencyDistribution(
    layer: "L1" | "L2",
    operation: "get" | "set",
  ): LatencyDistribution {
    const latencies =
      operation === "get" ? this.getLatencies : this.setLatencies;
    const arr = latencies.get(layer)!;

    if (arr.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...arr].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      min: sorted[0],
      max: sorted[len - 1],
      avg: arr.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }

  /**
   * Assess cache health
   */
  public assessHealth(): CacheHealth {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check L1 hit rate
    if (this.L1Metrics.hitRate < 0.5) {
      score -= 20;
      issues.push(
        `Low L1 hit rate: ${(this.L1Metrics.hitRate * 100).toFixed(1)}%`,
      );
      recommendations.push("Consider increasing L1 cache size or TTL");
    } else if (this.L1Metrics.hitRate < 0.7) {
      score -= 10;
      issues.push(
        `Moderate L1 hit rate: ${(this.L1Metrics.hitRate * 100).toFixed(1)}%`,
      );
    }

    // Check L2 hit rate
    if (this.L2Metrics.hitRate < 0.7) {
      score -= 15;
      issues.push(
        `Low L2 hit rate: ${(this.L2Metrics.hitRate * 100).toFixed(1)}%`,
      );
      recommendations.push("Review L2 eviction policy or increase size");
    } else if (this.L2Metrics.hitRate < 0.85) {
      score -= 5;
      issues.push(
        `Moderate L2 hit rate: ${(this.L2Metrics.hitRate * 100).toFixed(1)}%`,
      );
    }

    // Check eviction rate
    const recentEvictions = this.events.filter(
      (e) => e.type === "eviction" && e.timestamp > Date.now() - 60000,
    ).length;

    if (recentEvictions > 100) {
      score -= 15;
      issues.push(`High eviction rate: ${recentEvictions} evictions/min`);
      recommendations.push("Increase cache size or optimize eviction policy");
    } else if (recentEvictions > 50) {
      score -= 8;
      issues.push(`Moderate eviction rate: ${recentEvictions} evictions/min`);
    }

    // Check L1 latency
    if (this.L1Metrics.avgGetLatency > 10) {
      score -= 15;
      issues.push(
        `High L1 latency: ${this.L1Metrics.avgGetLatency.toFixed(2)}ms`,
      );
      recommendations.push("Investigate L1 cache implementation");
    } else if (this.L1Metrics.avgGetLatency > 5) {
      score -= 8;
      issues.push(
        `Moderate L1 latency: ${this.L1Metrics.avgGetLatency.toFixed(2)}ms`,
      );
    }

    // Check L2 latency
    if (this.L2Metrics.avgGetLatency > 50) {
      score -= 10;
      issues.push(
        `High L2 latency: ${this.L2Metrics.avgGetLatency.toFixed(2)}ms`,
      );
      recommendations.push("Check Redis connection or optimize queries");
    } else if (this.L2Metrics.avgGetLatency > 25) {
      score -= 5;
      issues.push(
        `Moderate L2 latency: ${this.L2Metrics.avgGetLatency.toFixed(2)}ms`,
      );
    }

    // Check compression ratio
    if (this.L2Metrics.compressionRatio > 1.5) {
      // Good compression
      score += 5;
    } else if (this.L2Metrics.compressionRatio < 1.1) {
      recommendations.push(
        "Consider enabling compression for better efficiency",
      );
    }

    // Determine status
    let status: "optimal" | "good" | "degraded" | "critical";
    if (score >= 95) {
      status = "optimal";
    } else if (score >= 80) {
      status = "good";
    } else if (score >= 60) {
      status = "degraded";
    } else {
      status = "critical";
    }

    return {
      status,
      score: Math.max(0, Math.min(105, score)),
      issues,
      recommendations,
      L1: { ...this.L1Metrics },
      L2: { ...this.L2Metrics },
    };
  }

  /**
   * Get metrics for a specific layer
   */
  public getLayerMetrics(layer: "L1" | "L2"): CacheLayerMetrics {
    const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;
    return { ...metrics };
  }

  /**
   * Get recent events
   */
  public getRecentEvents(
    count: number = 100,
    layer?: "L1" | "L2",
  ): CacheEvent[] {
    let events = this.events.slice(-count);
    if (layer) {
      events = events.filter((e) => e.layer === layer);
    }
    return events;
  }

  /**
   * Export metrics for Prometheus
   */
  public toPrometheus(): string {
    const lines: string[] = [];
    const timestamp = Date.now();

    ["L1", "L2"].forEach((layer) => {
      const metrics = layer === "L1" ? this.L1Metrics : this.L2Metrics;

      lines.push(`# HELP cache_${layer}_hit_rate Cache hit rate for ${layer}`);
      lines.push(`# TYPE cache_${layer}_hit_rate gauge`);
      lines.push(`cache_${layer}_hit_rate ${metrics.hitRate} ${timestamp}`);

      lines.push(
        `# HELP cache_${layer}_hits_total Total cache hits for ${layer}`,
      );
      lines.push(`# TYPE cache_${layer}_hits_total counter`);
      lines.push(`cache_${layer}_hits_total ${metrics.hits} ${timestamp}`);

      lines.push(
        `# HELP cache_${layer}_misses_total Total cache misses for ${layer}`,
      );
      lines.push(`# TYPE cache_${layer}_misses_total counter`);
      lines.push(`cache_${layer}_misses_total ${metrics.misses} ${timestamp}`);

      lines.push(
        `# HELP cache_${layer}_evictions_total Total evictions for ${layer}`,
      );
      lines.push(`# TYPE cache_${layer}_evictions_total counter`);
      lines.push(
        `cache_${layer}_evictions_total ${metrics.evictions} ${timestamp}`,
      );

      lines.push(
        `# HELP cache_${layer}_size_bytes Current size in bytes for ${layer}`,
      );
      lines.push(`# TYPE cache_${layer}_size_bytes gauge`);
      lines.push(
        `cache_${layer}_size_bytes ${metrics.memoryUsage} ${timestamp}`,
      );

      lines.push(
        `# HELP cache_${layer}_get_latency_ms Average GET latency for ${layer}`,
      );
      lines.push(`# TYPE cache_${layer}_get_latency_ms gauge`);
      lines.push(
        `cache_${layer}_get_latency_ms ${metrics.avgGetLatency.toFixed(2)} ${timestamp}`,
      );

      lines.push(
        `# HELP cache_${layer}_set_latency_ms Average SET latency for ${layer}`,
      );
      lines.push(`# TYPE cache_${layer}_set_latency_ms gauge`);
      lines.push(
        `cache_${layer}_set_latency_ms ${metrics.avgSetLatency.toFixed(2)} ${timestamp}`,
      );

      if (layer === "L2") {
        lines.push(
          `# HELP cache_${layer}_compression_ratio Compression ratio for ${layer}`,
        );
        lines.push(`# TYPE cache_${layer}_compression_ratio gauge`);
        lines.push(
          `cache_${layer}_compression_ratio ${metrics.compressionRatio.toFixed(2)} ${timestamp}`,
        );
      }
    });

    const health = this.assessHealth();
    lines.push("# HELP cache_health_score Overall cache health score (0-100)");
    lines.push("# TYPE cache_health_score gauge");
    lines.push(`cache_health_score ${health.score} ${timestamp}`);

    return lines.join("\n") + "\n";
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.L1Metrics = this.initializeMetrics();
    this.L2Metrics = this.initializeMetrics();
    this.events = [];
    this.getLatencies.set("L1", []);
    this.getLatencies.set("L2", []);
    this.setLatencies.set("L1", []);
    this.setLatencies.set("L2", []);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const cacheMonitor = CacheMonitor.getInstance();
