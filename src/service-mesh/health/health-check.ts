/**
 * Health Check System
 * Implements liveness and readiness probes for Kubernetes and service mesh
 */

import { EventEmitter } from "events";
import { performance } from "perf_hooks";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type ProbeType = "liveness" | "readiness" | "startup";

export interface HealthCheckConfig {
  // Probe intervals
  livenessInterval?: number;
  readinessInterval?: number;
  startupInterval?: number;

  // Timeouts
  timeout?: number;

  // Thresholds
  failureThreshold?: number; // Consecutive failures before unhealthy
  successThreshold?: number; // Consecutive successes before healthy

  // Startup
  startupDelay?: number;
  startupTimeout?: number;
}

export interface HealthCheck {
  name: string;
  type: ProbeType;
  check: () => Promise<HealthCheckResult>;
  critical?: boolean; // If true, failure means entire service is unhealthy
  timeout?: number;
}

export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  metadata?: Record<string, any>;
  responseTime?: number;
  timestamp: Date;
}

export interface ServiceHealth {
  status: HealthStatus;
  checks: Record<string, HealthCheckResult>;
  uptime: number;
  timestamp: Date;
  version?: string;
}

export class HealthCheckManager extends EventEmitter {
  private config: HealthCheckConfig;
  private checks: Map<string, HealthCheck> = new Map();
  private checkResults: Map<string, HealthCheckResult> = new Map();
  private checkCounters: Map<string, { failures: number; successes: number }> =
    new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime: Date = new Date();
  private isStarted: boolean = false;

  constructor(config: HealthCheckConfig = {}) {
    super();
    this.config = {
      livenessInterval: 10000, // 10 seconds
      readinessInterval: 5000, // 5 seconds
      startupInterval: 2000, // 2 seconds
      timeout: 5000, // 5 seconds
      failureThreshold: 3,
      successThreshold: 1,
      startupDelay: 0,
      startupTimeout: 60000, // 1 minute
      ...config,
    };
  }

  /**
   * Register a health check
   */
  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.checkCounters.set(check.name, { failures: 0, successes: 0 });

    this.emit("check-registered", { name: check.name, type: check.type });
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
    this.checkResults.delete(name);
    this.checkCounters.delete(name);

    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }

    this.emit("check-unregistered", { name });
  }

  /**
   * Start all health checks
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    // Apply startup delay
    if (this.config.startupDelay) {
      await this.sleep(this.config.startupDelay);
    }

    // Start checks based on type
    for (const [name, check] of this.checks) {
      this.startCheckInterval(name, check);
    }

    this.isStarted = true;
    this.emit("started");
  }

  /**
   * Stop all health checks
   */
  stop(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }

    this.intervals.clear();
    this.isStarted = false;

    this.emit("stopped");
  }

  /**
   * Start interval for a specific check
   */
  private startCheckInterval(name: string, check: HealthCheck): void {
    let intervalTime: number;

    switch (check.type) {
      case "liveness":
        intervalTime = this.config.livenessInterval!;
        break;
      case "readiness":
        intervalTime = this.config.readinessInterval!;
        break;
      case "startup":
        intervalTime = this.config.startupInterval!;
        break;
      default:
        intervalTime = this.config.readinessInterval!;
    }

    // Run immediately
    this.runCheck(name, check);

    // Schedule recurring checks
    const interval = setInterval(() => {
      this.runCheck(name, check);
    }, intervalTime);

    this.intervals.set(name, interval);
  }

  /**
   * Run a specific health check
   */
  private async runCheck(name: string, check: HealthCheck): Promise<void> {
    const startTime = performance.now();
    const timeout = check.timeout || this.config.timeout!;

    try {
      // Execute check with timeout
      const result = await Promise.race([
        check.check(),
        this.timeoutPromise(timeout),
      ]);

      const responseTime = performance.now() - startTime;
      result.responseTime = responseTime;
      result.timestamp = new Date();

      this.checkResults.set(name, result);
      this.updateCheckCounter(name, result.status === "healthy");

      this.emit("check-completed", { name, result });

      // Handle startup checks
      if (check.type === "startup" && result.status === "healthy") {
        this.unregisterCheck(name); // Remove startup check once successful
      }
    } catch (error) {
      const result: HealthCheckResult = {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Health check failed",
        timestamp: new Date(),
        responseTime: performance.now() - startTime,
      };

      this.checkResults.set(name, result);
      this.updateCheckCounter(name, false);

      this.emit("check-failed", { name, error, result });
    }
  }

  /**
   * Update check counter and emit events
   */
  private updateCheckCounter(name: string, success: boolean): void {
    const counter = this.checkCounters.get(name);
    if (!counter) return;

    if (success) {
      counter.successes++;
      counter.failures = 0;

      if (counter.successes >= this.config.successThreshold!) {
        this.emit("check-recovered", { name });
      }
    } else {
      counter.failures++;
      counter.successes = 0;

      if (counter.failures >= this.config.failureThreshold!) {
        this.emit("check-threshold-exceeded", {
          name,
          failures: counter.failures,
        });
      }
    }
  }

  /**
   * Get current service health
   */
  getHealth(): ServiceHealth {
    const checks: Record<string, HealthCheckResult> = {};
    let overallStatus: HealthStatus = "healthy";

    for (const [name, result] of this.checkResults) {
      checks[name] = result;

      const check = this.checks.get(name);

      // Critical checks affect overall status
      if (check?.critical && result.status === "unhealthy") {
        overallStatus = "unhealthy";
      } else if (
        result.status === "degraded" &&
        overallStatus !== "unhealthy"
      ) {
        overallStatus = "degraded";
      }
    }

    return {
      status: overallStatus,
      checks,
      uptime: Date.now() - this.startTime.getTime(),
      timestamp: new Date(),
    };
  }

  /**
   * Get liveness probe result
   */
  getLiveness(): HealthCheckResult {
    const livenessChecks = Array.from(this.checks.entries())
      .filter(([_, check]) => check.type === "liveness")
      .map(([name]) => this.checkResults.get(name))
      .filter((result): result is HealthCheckResult => result !== undefined);

    if (livenessChecks.length === 0) {
      return {
        status: "healthy",
        message: "No liveness checks configured",
        timestamp: new Date(),
      };
    }

    const hasUnhealthy = livenessChecks.some((r) => r.status === "unhealthy");

    return {
      status: hasUnhealthy ? "unhealthy" : "healthy",
      message: hasUnhealthy ? "Liveness check failed" : "Liveness check passed",
      timestamp: new Date(),
      metadata: { checks: livenessChecks.length },
    };
  }

  /**
   * Get readiness probe result
   */
  getReadiness(): HealthCheckResult {
    const readinessChecks = Array.from(this.checks.entries())
      .filter(([_, check]) => check.type === "readiness")
      .map(([name]) => this.checkResults.get(name))
      .filter((result): result is HealthCheckResult => result !== undefined);

    if (readinessChecks.length === 0) {
      return {
        status: "healthy",
        message: "No readiness checks configured",
        timestamp: new Date(),
      };
    }

    const hasUnhealthy = readinessChecks.some((r) => r.status === "unhealthy");
    const hasDegraded = readinessChecks.some((r) => r.status === "degraded");

    let status: HealthStatus = "healthy";
    let message = "Readiness check passed";

    if (hasUnhealthy) {
      status = "unhealthy";
      message = "Readiness check failed";
    } else if (hasDegraded) {
      status = "degraded";
      message = "Readiness check degraded";
    }

    return {
      status,
      message,
      timestamp: new Date(),
      metadata: { checks: readinessChecks.length },
    };
  }

  /**
   * Create timeout promise
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Health check timeout after ${ms}ms`)),
        ms,
      ),
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all check names
   */
  getCheckNames(): string[] {
    return Array.from(this.checks.keys());
  }

  /**
   * Get specific check result
   */
  getCheckResult(name: string): HealthCheckResult | undefined {
    return this.checkResults.get(name);
  }
}

/**
 * Common health check implementations
 */
export class CommonHealthChecks {
  /**
   * Database connection check
   */
  static database(
    name: string,
    checkConnection: () => Promise<boolean>,
    critical: boolean = true,
  ): HealthCheck {
    return {
      name,
      type: "readiness",
      critical,
      check: async () => {
        const isConnected = await checkConnection();
        return {
          status: isConnected ? "healthy" : "unhealthy",
          message: isConnected
            ? "Database connected"
            : "Database connection failed",
          timestamp: new Date(),
        };
      },
    };
  }

  /**
   * Memory usage check
   */
  static memory(name: string, thresholdPercent: number = 90): HealthCheck {
    return {
      name,
      type: "liveness",
      critical: false,
      check: async () => {
        const usage = process.memoryUsage();
        const usedPercent = (usage.heapUsed / usage.heapTotal) * 100;

        let status: HealthStatus = "healthy";
        if (usedPercent >= thresholdPercent) {
          status = "unhealthy";
        } else if (usedPercent >= thresholdPercent * 0.8) {
          status = "degraded";
        }

        return {
          status,
          message: `Memory usage: ${usedPercent.toFixed(2)}%`,
          timestamp: new Date(),
          metadata: {
            usedPercent,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
          },
        };
      },
    };
  }

  /**
   * Disk space check
   */
  static diskSpace(
    name: string,
    path: string,
    thresholdPercent: number = 90,
  ): HealthCheck {
    return {
      name,
      type: "liveness",
      critical: false,
      check: async () => {
        // Note: Requires additional library like 'check-disk-space'
        // This is a placeholder implementation
        return {
          status: "healthy",
          message: "Disk space check not implemented",
          timestamp: new Date(),
        };
      },
    };
  }

  /**
   * External service dependency check
   */
  static externalService(
    name: string,
    checkService: () => Promise<boolean>,
    critical: boolean = false,
  ): HealthCheck {
    return {
      name,
      type: "readiness",
      critical,
      check: async () => {
        const isAvailable = await checkService();
        return {
          status: isAvailable ? "healthy" : critical ? "unhealthy" : "degraded",
          message: isAvailable ? "Service available" : "Service unavailable",
          timestamp: new Date(),
        };
      },
    };
  }
}

export default HealthCheckManager;
