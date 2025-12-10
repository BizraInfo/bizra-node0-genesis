/**
 * ENTERPRISE-GRADE Circuit Breaker Monitor
 *
 * Monitors circuit breaker performance:
 * - State change tracking (closed -> open -> half-open)
 * - Failure rate monitoring
 * - Request latency tracking
 * - Throughput measurements
 * - Alert threshold management
 */

import { EventEmitter } from "events";
import { performanceMetrics } from "./performance-metrics.service";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitMetrics {
  serviceName: string;
  state: CircuitState;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  rejectedCount: number;
  totalRequests: number;
  failureRate: number;
  successRate: number;
  avgLatency: number;
  lastStateChange: number;
  stateChanges: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  timestamp: number;
}

interface StateChangeEvent {
  serviceName: string;
  fromState: CircuitState;
  toState: CircuitState;
  timestamp: number;
  reason: string;
  metrics: CircuitMetrics;
}

interface RequestEvent {
  serviceName: string;
  type: "success" | "failure" | "timeout" | "rejected";
  latency: number;
  timestamp: number;
  error?: Error;
}

interface CircuitHealth {
  status: "healthy" | "degraded" | "failing" | "critical";
  score: number;
  issues: string[];
  recommendations: string[];
  metrics: Map<string, CircuitMetrics>;
}

interface AlertThreshold {
  failureRate: number;
  consecutiveFailures: number;
  avgLatency: number;
  stateChangeFrequency: number; // changes per minute
}

export class CircuitBreakerMonitor extends EventEmitter {
  private static instance: CircuitBreakerMonitor;
  private circuits: Map<string, CircuitMetrics> = new Map();
  private stateHistory: StateChangeEvent[] = [];
  private requestHistory: RequestEvent[] = [];
  private latencies: Map<string, number[]> = new Map();
  private readonly HISTORY_SIZE = 5000;
  private readonly LATENCY_WINDOW_SIZE = 1000;
  private monitorInterval?: NodeJS.Timeout;
  private readonly MONITOR_INTERVAL_MS = 5000;

  private readonly DEFAULT_THRESHOLDS: AlertThreshold = {
    failureRate: 0.5, // 50%
    consecutiveFailures: 5,
    avgLatency: 5000, // 5 seconds
    stateChangeFrequency: 3, // 3 changes per minute
  };

  private thresholds: Map<string, AlertThreshold> = new Map();

  private constructor() {
    super();
    this.startMonitoring();
  }

  public static getInstance(): CircuitBreakerMonitor {
    if (!CircuitBreakerMonitor.instance) {
      CircuitBreakerMonitor.instance = new CircuitBreakerMonitor();
    }
    return CircuitBreakerMonitor.instance;
  }

  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.updateMetrics();
      const health = this.assessHealth();

      this.emit("circuit:metrics", this.getAllMetrics());
      this.emit("circuit:health", health);

      if (health.status === "critical") {
        this.emit("circuit:critical", health);
      }
    }, this.MONITOR_INTERVAL_MS);
  }

  /**
   * Register a circuit breaker
   */
  public registerCircuit(
    serviceName: string,
    thresholds?: Partial<AlertThreshold>,
  ): void {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, {
        serviceName,
        state: "CLOSED",
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        rejectedCount: 0,
        totalRequests: 0,
        failureRate: 0,
        successRate: 1,
        avgLatency: 0,
        lastStateChange: Date.now(),
        stateChanges: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        timestamp: Date.now(),
      });

      this.latencies.set(serviceName, []);
    }

    if (thresholds) {
      this.thresholds.set(serviceName, {
        ...this.DEFAULT_THRESHOLDS,
        ...thresholds,
      });
    }
  }

  /**
   * Record state change
   */
  public recordStateChange(
    serviceName: string,
    fromState: CircuitState,
    toState: CircuitState,
    reason: string,
  ): void {
    const metrics = this.circuits.get(serviceName);
    if (!metrics) {
      this.registerCircuit(serviceName);
      return;
    }

    metrics.state = toState;
    metrics.lastStateChange = Date.now();
    metrics.stateChanges++;

    const event: StateChangeEvent = {
      serviceName,
      fromState,
      toState,
      timestamp: Date.now(),
      reason,
      metrics: { ...metrics },
    };

    this.stateHistory.push(event);
    if (this.stateHistory.length > this.HISTORY_SIZE) {
      this.stateHistory.shift();
    }

    this.emit("circuit:state-change", event);
    this.checkAlerts(serviceName, metrics);

    performanceMetrics.recordThroughput(
      `circuit:${serviceName}:state-change`,
      1,
    );
  }

  /**
   * Record successful request
   */
  public recordSuccess(serviceName: string, latency: number): void {
    const metrics = this.circuits.get(serviceName);
    if (!metrics) {
      this.registerCircuit(serviceName);
      return this.recordSuccess(serviceName, latency);
    }

    metrics.successCount++;
    metrics.totalRequests++;
    metrics.consecutiveSuccesses++;
    metrics.consecutiveFailures = 0;

    this.updateRates(metrics);
    this.recordLatency(serviceName, latency);
    this.recordRequest(serviceName, "success", latency);

    performanceMetrics.recordLatency(`circuit:${serviceName}:request`, latency);
    performanceMetrics.recordThroughput(`circuit:${serviceName}:success`, 1);
  }

  /**
   * Record failed request
   */
  public recordFailure(
    serviceName: string,
    latency: number,
    error?: Error,
  ): void {
    const metrics = this.circuits.get(serviceName);
    if (!metrics) {
      this.registerCircuit(serviceName);
      return this.recordFailure(serviceName, latency, error);
    }

    metrics.failureCount++;
    metrics.totalRequests++;
    metrics.consecutiveFailures++;
    metrics.consecutiveSuccesses = 0;

    this.updateRates(metrics);
    this.recordLatency(serviceName, latency);
    this.recordRequest(serviceName, "failure", latency, error);

    this.checkAlerts(serviceName, metrics);

    performanceMetrics.recordLatency(`circuit:${serviceName}:request`, latency);
    performanceMetrics.recordThroughput(`circuit:${serviceName}:failure`, 1);
  }

  /**
   * Record timeout
   */
  public recordTimeout(serviceName: string, latency: number): void {
    const metrics = this.circuits.get(serviceName);
    if (!metrics) {
      this.registerCircuit(serviceName);
      return this.recordTimeout(serviceName, latency);
    }

    metrics.timeoutCount++;
    metrics.failureCount++;
    metrics.totalRequests++;
    metrics.consecutiveFailures++;
    metrics.consecutiveSuccesses = 0;

    this.updateRates(metrics);
    this.recordLatency(serviceName, latency);
    this.recordRequest(serviceName, "timeout", latency);

    this.checkAlerts(serviceName, metrics);

    performanceMetrics.recordThroughput(`circuit:${serviceName}:timeout`, 1);
  }

  /**
   * Record rejected request (circuit open)
   */
  public recordRejection(serviceName: string): void {
    const metrics = this.circuits.get(serviceName);
    if (!metrics) {
      this.registerCircuit(serviceName);
      return this.recordRejection(serviceName);
    }

    metrics.rejectedCount++;
    this.recordRequest(serviceName, "rejected", 0);

    performanceMetrics.recordThroughput(`circuit:${serviceName}:rejected`, 1);
  }

  private updateRates(metrics: CircuitMetrics): void {
    const total = metrics.successCount + metrics.failureCount;
    if (total > 0) {
      metrics.failureRate = metrics.failureCount / total;
      metrics.successRate = metrics.successCount / total;
    }
  }

  private recordLatency(serviceName: string, latency: number): void {
    const latencies = this.latencies.get(serviceName)!;
    latencies.push(latency);

    if (latencies.length > this.LATENCY_WINDOW_SIZE) {
      latencies.shift();
    }

    const metrics = this.circuits.get(serviceName)!;
    metrics.avgLatency =
      latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }

  private recordRequest(
    serviceName: string,
    type: "success" | "failure" | "timeout" | "rejected",
    latency: number,
    error?: Error,
  ): void {
    const event: RequestEvent = {
      serviceName,
      type,
      latency,
      timestamp: Date.now(),
      error,
    };

    this.requestHistory.push(event);
    if (this.requestHistory.length > this.HISTORY_SIZE) {
      this.requestHistory.shift();
    }

    this.emit("circuit:request", event);
  }

  private checkAlerts(serviceName: string, metrics: CircuitMetrics): void {
    const thresholds =
      this.thresholds.get(serviceName) || this.DEFAULT_THRESHOLDS;
    const alerts: string[] = [];

    if (metrics.failureRate >= thresholds.failureRate) {
      alerts.push(
        `High failure rate: ${(metrics.failureRate * 100).toFixed(1)}%`,
      );
    }

    if (metrics.consecutiveFailures >= thresholds.consecutiveFailures) {
      alerts.push(`${metrics.consecutiveFailures} consecutive failures`);
    }

    if (metrics.avgLatency >= thresholds.avgLatency) {
      alerts.push(`High latency: ${metrics.avgLatency.toFixed(0)}ms`);
    }

    // Check state change frequency
    const recentChanges = this.stateHistory.filter(
      (e) => e.serviceName === serviceName && e.timestamp > Date.now() - 60000,
    ).length;

    if (recentChanges >= thresholds.stateChangeFrequency) {
      alerts.push(`Frequent state changes: ${recentChanges} in last minute`);
    }

    if (alerts.length > 0) {
      this.emit("circuit:alert", {
        serviceName,
        alerts,
        metrics: { ...metrics },
        timestamp: Date.now(),
      });
    }
  }

  private updateMetrics(): void {
    this.circuits.forEach((metrics, serviceName) => {
      metrics.timestamp = Date.now();
    });
  }

  /**
   * Assess overall circuit health
   */
  public assessHealth(): CircuitHealth {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let circuitCount = 0;

    this.circuits.forEach((metrics, serviceName) => {
      circuitCount++;
      let score = 100;

      // Check circuit state
      if (metrics.state === "OPEN") {
        score -= 40;
        issues.push(`${serviceName}: Circuit OPEN`);
        recommendations.push(
          `${serviceName}: Investigate underlying service issues`,
        );
      } else if (metrics.state === "HALF_OPEN") {
        score -= 20;
        issues.push(`${serviceName}: Circuit HALF_OPEN (testing)`);
      }

      // Check failure rate
      if (metrics.failureRate > 0.5) {
        score -= 30;
        issues.push(
          `${serviceName}: High failure rate ${(metrics.failureRate * 100).toFixed(1)}%`,
        );
        recommendations.push(`${serviceName}: Review service dependencies`);
      } else if (metrics.failureRate > 0.2) {
        score -= 15;
        issues.push(
          `${serviceName}: Elevated failure rate ${(metrics.failureRate * 100).toFixed(1)}%`,
        );
      }

      // Check latency
      if (metrics.avgLatency > 5000) {
        score -= 20;
        issues.push(
          `${serviceName}: High latency ${metrics.avgLatency.toFixed(0)}ms`,
        );
        recommendations.push(
          `${serviceName}: Optimize service or increase timeout`,
        );
      } else if (metrics.avgLatency > 2000) {
        score -= 10;
        issues.push(
          `${serviceName}: Elevated latency ${metrics.avgLatency.toFixed(0)}ms`,
        );
      }

      // Check state change frequency
      const recentChanges = this.stateHistory.filter(
        (e) =>
          e.serviceName === serviceName && e.timestamp > Date.now() - 300000, // 5 minutes
      ).length;

      if (recentChanges > 5) {
        score -= 15;
        issues.push(
          `${serviceName}: Unstable (${recentChanges} state changes in 5 min)`,
        );
        recommendations.push(
          `${serviceName}: Review failure threshold configuration`,
        );
      }

      totalScore += Math.max(0, score);
    });

    const avgScore = circuitCount > 0 ? totalScore / circuitCount : 100;

    let status: "healthy" | "degraded" | "failing" | "critical";
    if (avgScore >= 85) {
      status = "healthy";
    } else if (avgScore >= 70) {
      status = "degraded";
    } else if (avgScore >= 50) {
      status = "failing";
    } else {
      status = "critical";
    }

    return {
      status,
      score: avgScore,
      issues,
      recommendations,
      metrics: new Map(this.circuits),
    };
  }

  /**
   * Get metrics for a specific circuit
   */
  public getCircuitMetrics(serviceName: string): CircuitMetrics | null {
    const metrics = this.circuits.get(serviceName);
    return metrics ? { ...metrics } : null;
  }

  /**
   * Get all circuit metrics
   */
  public getAllMetrics(): Map<string, CircuitMetrics> {
    return new Map(this.circuits);
  }

  /**
   * Get state change history
   */
  public getStateHistory(
    serviceName?: string,
    limit: number = 100,
  ): StateChangeEvent[] {
    let history = this.stateHistory.slice(-limit);
    if (serviceName) {
      history = history.filter((e) => e.serviceName === serviceName);
    }
    return history;
  }

  /**
   * Get request history
   */
  public getRequestHistory(
    serviceName?: string,
    limit: number = 100,
  ): RequestEvent[] {
    let history = this.requestHistory.slice(-limit);
    if (serviceName) {
      history = history.filter((e) => e.serviceName === serviceName);
    }
    return history;
  }

  /**
   * Get failure rate for time window
   */
  public getFailureRate(
    serviceName: string,
    windowMinutes: number = 5,
  ): number {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    const requests = this.requestHistory.filter(
      (e) =>
        e.serviceName === serviceName &&
        e.timestamp >= cutoff &&
        (e.type === "success" || e.type === "failure" || e.type === "timeout"),
    );

    if (requests.length === 0) return 0;

    const failures = requests.filter(
      (e) => e.type === "failure" || e.type === "timeout",
    ).length;
    return failures / requests.length;
  }

  /**
   * Get throughput (requests per second)
   */
  public getThroughput(
    serviceName: string,
    windowSeconds: number = 60,
  ): number {
    const cutoff = Date.now() - windowSeconds * 1000;
    const requests = this.requestHistory.filter(
      (e) => e.serviceName === serviceName && e.timestamp >= cutoff,
    ).length;

    return requests / windowSeconds;
  }

  /**
   * Export metrics for Prometheus
   */
  public toPrometheus(): string {
    const lines: string[] = [];
    const timestamp = Date.now();

    this.circuits.forEach((metrics, serviceName) => {
      const service = serviceName.replace(/[^a-zA-Z0-9_]/g, "_");

      lines.push(
        `# HELP circuit_state Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)`,
      );
      lines.push(`# TYPE circuit_state gauge`);
      const stateValue =
        metrics.state === "CLOSED" ? 0 : metrics.state === "HALF_OPEN" ? 1 : 2;
      lines.push(
        `circuit_state{service="${serviceName}"} ${stateValue} ${timestamp}`,
      );

      lines.push(`# HELP circuit_failure_rate Failure rate for circuit`);
      lines.push(`# TYPE circuit_failure_rate gauge`);
      lines.push(
        `circuit_failure_rate{service="${serviceName}"} ${metrics.failureRate} ${timestamp}`,
      );

      lines.push(
        `# HELP circuit_requests_total Total requests through circuit`,
      );
      lines.push(`# TYPE circuit_requests_total counter`);
      lines.push(
        `circuit_requests_total{service="${serviceName}",type="success"} ${metrics.successCount} ${timestamp}`,
      );
      lines.push(
        `circuit_requests_total{service="${serviceName}",type="failure"} ${metrics.failureCount} ${timestamp}`,
      );
      lines.push(
        `circuit_requests_total{service="${serviceName}",type="timeout"} ${metrics.timeoutCount} ${timestamp}`,
      );
      lines.push(
        `circuit_requests_total{service="${serviceName}",type="rejected"} ${metrics.rejectedCount} ${timestamp}`,
      );

      lines.push(`# HELP circuit_latency_ms Average request latency`);
      lines.push(`# TYPE circuit_latency_ms gauge`);
      lines.push(
        `circuit_latency_ms{service="${serviceName}"} ${metrics.avgLatency.toFixed(2)} ${timestamp}`,
      );

      lines.push(`# HELP circuit_consecutive_failures Consecutive failures`);
      lines.push(`# TYPE circuit_consecutive_failures gauge`);
      lines.push(
        `circuit_consecutive_failures{service="${serviceName}"} ${metrics.consecutiveFailures} ${timestamp}`,
      );

      lines.push(`# HELP circuit_state_changes_total Total state changes`);
      lines.push(`# TYPE circuit_state_changes_total counter`);
      lines.push(
        `circuit_state_changes_total{service="${serviceName}"} ${metrics.stateChanges} ${timestamp}`,
      );
    });

    const health = this.assessHealth();
    lines.push(
      "# HELP circuit_health_score Overall circuit breaker health (0-100)",
    );
    lines.push("# TYPE circuit_health_score gauge");
    lines.push(`circuit_health_score ${health.score} ${timestamp}`);

    return lines.join("\n") + "\n";
  }

  /**
   * Reset metrics for a circuit
   */
  public resetCircuit(serviceName: string): void {
    const metrics = this.circuits.get(serviceName);
    if (metrics) {
      metrics.successCount = 0;
      metrics.failureCount = 0;
      metrics.timeoutCount = 0;
      metrics.rejectedCount = 0;
      metrics.totalRequests = 0;
      metrics.failureRate = 0;
      metrics.successRate = 1;
      metrics.consecutiveFailures = 0;
      metrics.consecutiveSuccesses = 0;
      metrics.timestamp = Date.now();
    }

    this.latencies.set(serviceName, []);
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
export const circuitBreakerMonitor = CircuitBreakerMonitor.getInstance();
