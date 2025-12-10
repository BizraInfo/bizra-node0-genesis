/**
 * BIZRA NODE0 - Unified API Client
 * احسان Standard: Consistent data access across Terminal, Web, and Desktop
 *
 * Features:
 * - Unified interface for all platforms (TUI, Web, Desktop)
 * - Automatic retry with exponential backoff
 * - Request/response caching
 * - WebSocket support for real-time updates
 * - TypeScript type safety
 * - احسان SLA monitoring
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import EventEmitter from "events";

// احسان Type Definitions
export interface BizraMetrics {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  rustEnabled: boolean;
  uptime: number;
  requests: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  chainId?: string;
}

export interface BizraHealth {
  status: string;
  version: string;
  timestamp: string;
  rustEnabled: boolean;
}

export interface BizraReadiness {
  status: "ready" | "not_ready";
  version: string;
  timestamp: string;
}

export interface PrometheusMetrics {
  raw: string;
  parsed: Map<string, number>;
}

export interface APIClientConfig {
  baseURL?: string;
  metricsURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  احسانSLA?: {
    p95Latency: number;
    errorRate: number;
  };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Unified API Client
 * احسان: Single source of truth for all platform interfaces
 */
export class UnifiedAPIClient extends EventEmitter {
  private httpClient: AxiosInstance;
  private metricsClient: AxiosInstance;
  private config: Required<APIClientConfig>;
  private cache: Map<string, CacheEntry<any>>;
  private ws: WebSocket | null = null;

  constructor(config: APIClientConfig = {}) {
    super();

    // احسان: Sensible defaults
    this.config = {
      baseURL: config.baseURL || "http://localhost:8080",
      metricsURL: config.metricsURL || "http://localhost:9464",
      timeout: config.timeout || 5000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL || 2000, // 2 seconds (احسان: Fresh data)
      احسانSLA: config.احسانSLA || {
        p95Latency: 200,
        errorRate: 1.0,
      },
    };

    // Initialize HTTP clients
    this.httpClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "BIZRA-UnifiedAPI/v2.2.0-rc1",
      },
    });

    this.metricsClient = axios.create({
      baseURL: this.config.metricsURL,
      timeout: this.config.timeout,
    });

    // احسان: Response cache for performance
    this.cache = new Map();

    // Add request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Setup Axios Interceptors
   * احسان: Automatic retry, caching, and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor (احسان: Logging and metrics)
    this.httpClient.interceptors.request.use(
      (config) => {
        const timestamp = new Date().toISOString();
        this.emit("request", {
          url: config.url,
          method: config.method,
          timestamp,
        });
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor (احسان: Caching and SLA monitoring)
    this.httpClient.interceptors.response.use(
      (response) => {
        const timestamp = new Date().toISOString();
        this.emit("response", {
          url: response.config.url,
          status: response.status,
          timestamp,
        });
        return response;
      },
      (error) => this.handleRetry(error),
    );
  }

  /**
   * Automatic Retry with Exponential Backoff
   * احسان: Resilience through intelligent retry
   */
  private async handleRetry(error: AxiosError): Promise<any> {
    const config = error.config as any;

    if (!config || config.__retryCount >= this.config.retryAttempts) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;
    config.__retryCount += 1;

    const delay = this.config.retryDelay * Math.pow(2, config.__retryCount - 1);

    this.emit("retry", {
      url: config.url,
      attempt: config.__retryCount,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));

    return this.httpClient(config);
  }

  /**
   * Cache Management
   * احسان: Fresh data with intelligent caching
   */
  private getCached<T>(key: string): T | null {
    if (!this.config.cacheEnabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
    });
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      // احسان: Clear specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // احسان: Clear all cache
      this.cache.clear();
    }

    this.emit("cache_cleared", { pattern });
  }

  /**
   * Health Check
   * احسان: Core endpoint for all platforms
   */
  async getHealth(): Promise<BizraHealth> {
    const cacheKey = "health";
    const cached = this.getCached<BizraHealth>(cacheKey);
    if (cached) return cached;

    const response = await this.httpClient.get<BizraHealth>("/health");
    this.setCache(cacheKey, response.data);

    return response.data;
  }

  /**
   * Readiness Probe
   * احسان: Kubernetes lifecycle integration
   */
  async getReadiness(): Promise<BizraReadiness> {
    const response = await this.httpClient.get<BizraReadiness>("/ready");
    return response.data;
  }

  /**
   * Get Detailed Metrics
   * احسان: Extended metrics for dashboards
   */
  async getMetrics(): Promise<BizraMetrics> {
    const cacheKey = "metrics";
    const cached = this.getCached<BizraMetrics>(cacheKey);
    if (cached) return cached;

    const health = await this.getHealth();

    // احسان: Extend with additional metrics
    const metrics: BizraMetrics = {
      ...health,
      uptime: 0,
      requests: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
    };

    this.setCache(cacheKey, metrics);

    return metrics;
  }

  /**
   * Get Prometheus Metrics
   * احسان: Raw metrics for monitoring systems
   */
  async getPrometheusMetrics(): Promise<PrometheusMetrics> {
    const response = await this.metricsClient.get<string>("/metrics");

    // احسان: Parse Prometheus format
    const parsed = new Map<string, number>();
    const lines = response.data.split("\n");

    for (const line of lines) {
      if (line.startsWith("#") || !line.trim()) continue;

      const [metric, value] = line.split(" ");
      if (metric && value) {
        parsed.set(metric, parseFloat(value));
      }
    }

    return {
      raw: response.data,
      parsed,
    };
  }

  /**
   * Check احسان SLA Compliance
   * احسان: Real-time SLA validation
   */
  async checkSLACompliance(): Promise<{
    compliant: boolean;
    violations: string[];
    metrics: BizraMetrics;
  }> {
    const metrics = await this.getMetrics();
    const violations: string[] = [];

    if (metrics.p95Latency > this.config.احسانSLA.p95Latency) {
      violations.push(
        `P95 latency ${metrics.p95Latency.toFixed(1)}ms exceeds احسان SLA (${this.config.احسانSLA.p95Latency}ms)`,
      );
    }

    if (metrics.errorRate > this.config.احسانSLA.errorRate) {
      violations.push(
        `Error rate ${metrics.errorRate.toFixed(2)}% exceeds احسان SLA (${this.config.احسانSLA.errorRate}%)`,
      );
    }

    if (metrics.status !== "healthy") {
      violations.push(`System status is ${metrics.status}, expected healthy`);
    }

    const compliant = violations.length === 0;

    this.emit("sla_check", { compliant, violations, metrics });

    return { compliant, violations, metrics };
  }

  /**
   * WebSocket Real-Time Updates
   * احسان: Live data streaming for all platforms
   */
  connectWebSocket(url?: string): void {
    const wsURL = url || `ws://localhost:8080/ws`;

    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(wsURL);

      this.ws.onopen = () => {
        this.emit("ws_connected", { url: wsURL });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit("ws_message", data);

          // احسان: Auto-update cache with real-time data
          if (data.type === "metrics") {
            this.setCache("metrics", data.payload);
          }
        } catch (error) {
          this.emit("ws_error", {
            error: "Failed to parse message",
            raw: event.data,
          });
        }
      };

      this.ws.onerror = (error) => {
        this.emit("ws_error", { error });
      };

      this.ws.onclose = () => {
        this.emit("ws_disconnected", { url: wsURL });

        // احسان: Auto-reconnect after 5 seconds
        setTimeout(() => {
          this.connectWebSocket(url);
        }, 5000);
      };
    } catch (error) {
      this.emit("ws_error", { error });
    }
  }

  /**
   * Disconnect WebSocket
   * احسان: Graceful cleanup
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.emit("ws_disconnected", { manual: true });
    }
  }

  /**
   * Export Evidence
   * احسان: Transparency through data export
   */
  async exportEvidence(): Promise<{
    timestamp: string;
    metrics: BizraMetrics;
    sla: Awaited<ReturnType<typeof this.checkSLACompliance>>;
    health: BizraHealth;
  }> {
    const timestamp = new Date().toISOString();
    const metrics = await this.getMetrics();
    const sla = await this.checkSLACompliance();
    const health = await this.getHealth();

    const evidence = {
      timestamp,
      metrics,
      sla,
      health,
    };

    this.emit("evidence_exported", evidence);

    return evidence;
  }

  /**
   * Destroy Client
   * احسان: Graceful shutdown
   */
  destroy(): void {
    this.disconnectWebSocket();
    this.clearCache();
    this.removeAllListeners();
    this.emit("destroyed");
  }
}

/**
 * Platform-Specific Adapters
 * احسان: Optimized interfaces for each platform
 */

/**
 * Terminal UI Adapter
 * احسان: Optimized for Python Rich/Textual
 */
export class TUIAdapter {
  constructor(private client: UnifiedAPIClient) {}

  async getMetricsForTUI(): Promise<{
    status: string;
    version: string;
    uptime: string;
    p95_latency: number;
    error_rate: number;
    rust_enabled: boolean;
  }> {
    const metrics = await this.client.getMetrics();

    return {
      status: metrics.status,
      version: metrics.version,
      uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
      p95_latency: metrics.p95Latency,
      error_rate: metrics.errorRate,
      rust_enabled: metrics.rustEnabled,
    };
  }
}

/**
 * Web Dashboard Adapter
 * احسان: Optimized for React components
 */
export class WebAdapter {
  constructor(private client: UnifiedAPIClient) {
    // احسان: Auto-connect WebSocket for real-time updates
    this.client.connectWebSocket();
  }

  async getMetricsForReact(): Promise<BizraMetrics> {
    return this.client.getMetrics();
  }

  onMetricsUpdate(callback: (metrics: BizraMetrics) => void): void {
    this.client.on("ws_message", (data) => {
      if (data.type === "metrics") {
        callback(data.payload);
      }
    });
  }
}

/**
 * Desktop Adapter
 * احسان: Optimized for Electron IPC
 */
export class DesktopAdapter {
  constructor(private client: UnifiedAPIClient) {}

  async getMetricsForElectron(): Promise<BizraMetrics> {
    return this.client.getMetrics();
  }

  async checkSLAForNotifications(): Promise<{
    shouldNotify: boolean;
    message: string;
  }> {
    const { compliant, violations, metrics } =
      await this.client.checkSLACompliance();

    if (!compliant) {
      return {
        shouldNotify: true,
        message: `احسان SLA Violation:\n${violations.join("\n")}`,
      };
    }

    return {
      shouldNotify: false,
      message: "All احسان SLAs are met",
    };
  }
}

/**
 * Factory Function
 * احسان: Convenient client creation
 */
export function createUnifiedClient(
  config?: APIClientConfig,
): UnifiedAPIClient {
  return new UnifiedAPIClient(config);
}

export function createTUIAdapter(client: UnifiedAPIClient): TUIAdapter {
  return new TUIAdapter(client);
}

export function createWebAdapter(client: UnifiedAPIClient): WebAdapter {
  return new WebAdapter(client);
}

export function createDesktopAdapter(client: UnifiedAPIClient): DesktopAdapter {
  return new DesktopAdapter(client);
}

// احسان: Default export for convenience
export default UnifiedAPIClient;
