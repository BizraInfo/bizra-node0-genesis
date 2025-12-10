/**
 * ENTERPRISE-GRADE Database Pool Monitor
 *
 * Monitors PostgreSQL connection pool:
 * - Active/idle connection tracking
 * - Queue depth monitoring
 * - Wait time measurements
 * - Connection errors tracking
 * - Pool health assessment
 */

import { EventEmitter } from "events";
import { Pool, PoolClient } from "pg";
import { performanceMetrics } from "./performance-metrics.service";

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalWaitTime: number;
  avgWaitTime: number;
  maxWaitTime: number;
  connectionErrors: number;
  totalAcquired: number;
  totalReleased: number;
  timestamp: number;
}

interface ConnectionEvent {
  type: "acquire" | "release" | "error" | "connect" | "remove";
  timestamp: number;
  waitTime?: number;
  error?: Error;
  clientId?: number;
}

interface PoolHealth {
  status: "healthy" | "degraded" | "critical";
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  metrics: PoolMetrics;
}

export class DatabasePoolMonitor extends EventEmitter {
  private static instance: DatabasePoolMonitor;
  private pool?: Pool;
  private metrics: PoolMetrics;
  private events: ConnectionEvent[] = [];
  private readonly EVENT_HISTORY_SIZE = 1000;
  private waitTimeTracker: Map<PoolClient, number> = new Map();
  private clientIdCounter = 0;
  private monitorInterval?: NodeJS.Timeout;
  private readonly MONITOR_INTERVAL_MS = 5000; // 5 seconds

  private constructor() {
    super();
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(): DatabasePoolMonitor {
    if (!DatabasePoolMonitor.instance) {
      DatabasePoolMonitor.instance = new DatabasePoolMonitor();
    }
    return DatabasePoolMonitor.instance;
  }

  private initializeMetrics(): PoolMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalWaitTime: 0,
      avgWaitTime: 0,
      maxWaitTime: 0,
      connectionErrors: 0,
      totalAcquired: 0,
      totalReleased: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Attach monitor to a PostgreSQL pool
   */
  public attachToPool(pool: Pool): void {
    this.pool = pool;
    this.setupPoolListeners();
    this.startMonitoring();
  }

  private setupPoolListeners(): void {
    if (!this.pool) return;

    // Track connection acquisition
    this.pool.on("acquire", (client: PoolClient) => {
      const acquireTime = Date.now();
      const waitTime = this.waitTimeTracker.get(client);

      if (waitTime) {
        const actualWaitTime = acquireTime - waitTime;
        this.metrics.totalWaitTime += actualWaitTime;
        this.metrics.maxWaitTime = Math.max(
          this.metrics.maxWaitTime,
          actualWaitTime,
        );
        this.waitTimeTracker.delete(client);

        this.recordEvent({
          type: "acquire",
          timestamp: acquireTime,
          waitTime: actualWaitTime,
          clientId: this.clientIdCounter++,
        });

        performanceMetrics.recordLatency("db:pool:acquire", actualWaitTime);
      }

      this.metrics.totalAcquired++;
      this.updateMetrics();
    });

    // Track connection release
    this.pool.on("release", (client: PoolClient) => {
      this.recordEvent({
        type: "release",
        timestamp: Date.now(),
      });

      this.metrics.totalReleased++;
      this.updateMetrics();
    });

    // Track connection errors
    this.pool.on("error", (error: Error, client: PoolClient) => {
      this.recordEvent({
        type: "error",
        timestamp: Date.now(),
        error,
      });

      this.metrics.connectionErrors++;
      this.emit("pool:error", { error, client, timestamp: Date.now() });
      this.updateMetrics();
    });

    // Track new connections
    this.pool.on("connect", (client: PoolClient) => {
      this.recordEvent({
        type: "connect",
        timestamp: Date.now(),
      });

      this.updateMetrics();
    });

    // Track connection removal
    this.pool.on("remove", (client: PoolClient) => {
      this.recordEvent({
        type: "remove",
        timestamp: Date.now(),
      });

      this.updateMetrics();
    });
  }

  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.updateMetrics();
      const health = this.assessHealth();

      this.emit("pool:metrics", this.metrics);
      this.emit("pool:health", health);

      // Alert on critical conditions
      if (health.status === "critical") {
        this.emit("pool:critical", health);
      }
    }, this.MONITOR_INTERVAL_MS);
  }

  private updateMetrics(): void {
    if (!this.pool) return;

    const poolStats = this.pool as any;

    this.metrics.totalConnections = poolStats.totalCount || 0;
    this.metrics.idleConnections = poolStats.idleCount || 0;
    this.metrics.activeConnections =
      this.metrics.totalConnections - this.metrics.idleConnections;
    this.metrics.waitingClients = poolStats.waitingCount || 0;

    if (this.metrics.totalAcquired > 0) {
      this.metrics.avgWaitTime =
        this.metrics.totalWaitTime / this.metrics.totalAcquired;
    }

    this.metrics.timestamp = Date.now();

    // Record metrics in performance service
    performanceMetrics.recordThroughput(
      "db:pool:active",
      this.metrics.activeConnections,
    );
    performanceMetrics.recordThroughput(
      "db:pool:idle",
      this.metrics.idleConnections,
    );
    performanceMetrics.recordThroughput(
      "db:pool:waiting",
      this.metrics.waitingClients,
    );
  }

  private recordEvent(event: ConnectionEvent): void {
    this.events.push(event);

    // Maintain event history size
    if (this.events.length > this.EVENT_HISTORY_SIZE) {
      this.events.shift();
    }
  }

  /**
   * Assess pool health
   */
  public assessHealth(): PoolHealth {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (!this.pool) {
      return {
        status: "critical",
        score: 0,
        issues: ["No pool attached"],
        recommendations: ["Attach pool to monitor"],
        metrics: this.metrics,
      };
    }

    const poolConfig = (this.pool as any).options;
    const maxConnections = poolConfig.max || 20;
    const utilizationRate = this.metrics.totalConnections / maxConnections;

    // Check utilization rate
    if (utilizationRate > 0.9) {
      score -= 30;
      issues.push(
        `High pool utilization: ${(utilizationRate * 100).toFixed(1)}%`,
      );
      recommendations.push("Consider increasing max pool size");
    } else if (utilizationRate > 0.7) {
      score -= 15;
      issues.push(
        `Moderate pool utilization: ${(utilizationRate * 100).toFixed(1)}%`,
      );
    }

    // Check waiting clients
    if (this.metrics.waitingClients > 5) {
      score -= 25;
      issues.push(
        `${this.metrics.waitingClients} clients waiting for connections`,
      );
      recommendations.push("Increase pool size or optimize query performance");
    } else if (this.metrics.waitingClients > 0) {
      score -= 10;
      issues.push(`${this.metrics.waitingClients} clients waiting`);
    }

    // Check average wait time
    if (this.metrics.avgWaitTime > 1000) {
      score -= 20;
      issues.push(
        `High average wait time: ${this.metrics.avgWaitTime.toFixed(0)}ms`,
      );
      recommendations.push("Optimize queries or increase pool size");
    } else if (this.metrics.avgWaitTime > 500) {
      score -= 10;
      issues.push(
        `Moderate wait time: ${this.metrics.avgWaitTime.toFixed(0)}ms`,
      );
    }

    // Check connection errors
    const recentErrors = this.events.filter(
      (e) => e.type === "error" && e.timestamp > Date.now() - 60000,
    ).length;

    if (recentErrors > 5) {
      score -= 30;
      issues.push(`${recentErrors} connection errors in last minute`);
      recommendations.push("Check database connectivity and configuration");
    } else if (recentErrors > 0) {
      score -= 15;
      issues.push(`${recentErrors} recent connection errors`);
    }

    // Check idle connection ratio
    const idleRatio =
      this.metrics.totalConnections > 0
        ? this.metrics.idleConnections / this.metrics.totalConnections
        : 0;

    if (
      idleRatio < 0.2 &&
      this.metrics.totalConnections > maxConnections * 0.5
    ) {
      score -= 10;
      issues.push("Low idle connection ratio under high load");
      recommendations.push("Consider optimizing connection pooling strategy");
    }

    // Determine status
    let status: "healthy" | "degraded" | "critical";
    if (score >= 80) {
      status = "healthy";
    } else if (score >= 50) {
      status = "degraded";
    } else {
      status = "critical";
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
      metrics: { ...this.metrics },
    };
  }

  /**
   * Get current pool metrics
   */
  public getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get recent events
   */
  public getRecentEvents(count: number = 100): ConnectionEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get error rate (errors per minute)
   */
  public getErrorRate(windowMinutes: number = 5): number {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    const errors = this.events.filter(
      (e) => e.type === "error" && e.timestamp >= cutoff,
    ).length;

    return errors / windowMinutes;
  }

  /**
   * Get acquisition rate (acquires per second)
   */
  public getAcquisitionRate(windowSeconds: number = 60): number {
    const cutoff = Date.now() - windowSeconds * 1000;
    const acquires = this.events.filter(
      (e) => e.type === "acquire" && e.timestamp >= cutoff,
    ).length;

    return acquires / windowSeconds;
  }

  /**
   * Export metrics for Prometheus
   */
  public toPrometheus(): string {
    const lines: string[] = [];
    const timestamp = Date.now();

    lines.push("# HELP db_pool_total_connections Total database connections");
    lines.push("# TYPE db_pool_total_connections gauge");
    lines.push(
      `db_pool_total_connections ${this.metrics.totalConnections} ${timestamp}`,
    );

    lines.push("# HELP db_pool_active_connections Active database connections");
    lines.push("# TYPE db_pool_active_connections gauge");
    lines.push(
      `db_pool_active_connections ${this.metrics.activeConnections} ${timestamp}`,
    );

    lines.push("# HELP db_pool_idle_connections Idle database connections");
    lines.push("# TYPE db_pool_idle_connections gauge");
    lines.push(
      `db_pool_idle_connections ${this.metrics.idleConnections} ${timestamp}`,
    );

    lines.push(
      "# HELP db_pool_waiting_clients Clients waiting for connections",
    );
    lines.push("# TYPE db_pool_waiting_clients gauge");
    lines.push(
      `db_pool_waiting_clients ${this.metrics.waitingClients} ${timestamp}`,
    );

    lines.push(
      "# HELP db_pool_avg_wait_time_ms Average connection wait time in ms",
    );
    lines.push("# TYPE db_pool_avg_wait_time_ms gauge");
    lines.push(
      `db_pool_avg_wait_time_ms ${this.metrics.avgWaitTime.toFixed(2)} ${timestamp}`,
    );

    lines.push(
      "# HELP db_pool_max_wait_time_ms Maximum connection wait time in ms",
    );
    lines.push("# TYPE db_pool_max_wait_time_ms gauge");
    lines.push(
      `db_pool_max_wait_time_ms ${this.metrics.maxWaitTime} ${timestamp}`,
    );

    lines.push(
      "# HELP db_pool_connection_errors_total Total connection errors",
    );
    lines.push("# TYPE db_pool_connection_errors_total counter");
    lines.push(
      `db_pool_connection_errors_total ${this.metrics.connectionErrors} ${timestamp}`,
    );

    lines.push("# HELP db_pool_acquired_total Total connections acquired");
    lines.push("# TYPE db_pool_acquired_total counter");
    lines.push(
      `db_pool_acquired_total ${this.metrics.totalAcquired} ${timestamp}`,
    );

    const health = this.assessHealth();
    lines.push("# HELP db_pool_health_score Pool health score (0-100)");
    lines.push("# TYPE db_pool_health_score gauge");
    lines.push(`db_pool_health_score ${health.score} ${timestamp}`);

    return lines.join("\n") + "\n";
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.metrics = this.initializeMetrics();
    this.events = [];
    this.waitTimeTracker.clear();
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
export const dbPoolMonitor = DatabasePoolMonitor.getInstance();
