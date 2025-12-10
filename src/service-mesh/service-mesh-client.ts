/**
 * Service Mesh Client
 * Unified client integrating all service mesh components
 */

import ServiceDiscovery, {
  ServiceInstance,
} from "./discovery/service-discovery";
import LoadBalancer from "./load-balancer/load-balancer";
import CircuitBreaker from "./circuit-breaker/circuit-breaker";
import RetryMiddleware from "./retry/retry.middleware";
import HealthCheckManager, { CommonHealthChecks } from "./health/health-check";
import { ServiceMeshConfig } from "../config/service-mesh/service-mesh.config";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { EventEmitter } from "events";
import * as https from "https";
import * as fs from "fs";

export interface ServiceMeshRequest extends AxiosRequestConfig {
  serviceName: string;
  clientId?: string;
  bypassCircuitBreaker?: boolean;
  bypassRetry?: boolean;
}

export interface ServiceMeshResponse<T = any> extends AxiosResponse<T> {
  instanceId?: string;
  attemptCount?: number;
  circuitState?: string;
  responseTime?: number;
}

export class ServiceMeshClient extends EventEmitter {
  private config: ServiceMeshConfig;
  private discovery: ServiceDiscovery;
  private loadBalancer: LoadBalancer;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryMiddleware: RetryMiddleware;
  private healthManager: HealthCheckManager;
  private httpClient: AxiosInstance;
  private startTime: Date = new Date();

  constructor(config: ServiceMeshConfig) {
    super();
    this.config = config;

    // Initialize components
    this.discovery = new ServiceDiscovery(config.discovery);
    this.loadBalancer = new LoadBalancer(config.loadBalancer);
    this.retryMiddleware = new RetryMiddleware(config.retry);
    this.healthManager = new HealthCheckManager(config.healthCheck);

    // Setup HTTP client with mTLS if enabled
    this.httpClient = this.createHttpClient();

    // Setup event handlers
    this.setupEventHandlers();

    // Register health checks
    this.registerHealthChecks();
  }

  /**
   * Create HTTP client with mTLS configuration
   */
  private createHttpClient(): AxiosInstance {
    const clientConfig: any = {
      timeout: this.config.circuitBreaker.timeout,
    };

    // Configure mTLS
    if (this.config.mtls?.enabled) {
      const httpsAgent = new https.Agent({
        cert: this.config.mtls.certPath
          ? fs.readFileSync(this.config.mtls.certPath)
          : undefined,
        key: this.config.mtls.keyPath
          ? fs.readFileSync(this.config.mtls.keyPath)
          : undefined,
        ca: this.config.mtls.caPath
          ? fs.readFileSync(this.config.mtls.caPath)
          : undefined,
        rejectUnauthorized: this.config.mtls.verifyPeer !== false,
      });

      clientConfig.httpsAgent = httpsAgent;
    }

    return axios.create(clientConfig);
  }

  /**
   * Initialize service mesh
   */
  async initialize(): Promise<void> {
    // Start health checks
    await this.healthManager.start();

    this.emit("initialized", {
      serviceName: this.config.serviceName,
      environment: this.config.environment,
    });
  }

  /**
   * Make a request through the service mesh
   */
  async request<T = any>(
    options: ServiceMeshRequest,
  ): Promise<ServiceMeshResponse<T>> {
    const startTime = Date.now();
    const {
      serviceName,
      clientId,
      bypassCircuitBreaker,
      bypassRetry,
      ...axiosConfig
    } = options;

    // Discover service instances
    const instances = await this.discovery.discoverService(serviceName);

    if (!instances || instances.length === 0) {
      throw new Error(`No healthy instances found for service: ${serviceName}`);
    }

    // Select instance using load balancer
    const instance = this.loadBalancer.selectInstance(instances, clientId);

    if (!instance) {
      throw new Error(
        `Load balancer failed to select instance for: ${serviceName}`,
      );
    }

    // Get or create circuit breaker for this service
    let circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker(
        serviceName,
        this.config.circuitBreaker,
      );
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    // Track connection
    this.loadBalancer.onConnectionStart(instance.id);

    try {
      // Execute request with circuit breaker and retry
      const response = await this.executeRequest<T>(
        instance,
        axiosConfig,
        circuitBreaker,
        bypassCircuitBreaker,
        bypassRetry,
      );

      const responseTime = Date.now() - startTime;

      // Track successful connection
      this.loadBalancer.onConnectionEnd(instance.id, responseTime);

      // Add metadata to response
      const meshResponse = response as ServiceMeshResponse<T>;
      meshResponse.instanceId = instance.id;
      meshResponse.circuitState = circuitBreaker.getState();
      meshResponse.responseTime = responseTime;

      this.emit("request-success", {
        serviceName,
        instanceId: instance.id,
        responseTime,
        status: response.status,
      });

      return meshResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Track failed connection
      this.loadBalancer.onConnectionEnd(instance.id, responseTime);
      this.loadBalancer.onRequestFailed(instance.id);

      this.emit("request-failure", {
        serviceName,
        instanceId: instance.id,
        responseTime,
        error,
      });

      throw error;
    }
  }

  /**
   * Execute request with circuit breaker and retry
   */
  private async executeRequest<T>(
    instance: ServiceInstance,
    config: AxiosRequestConfig,
    circuitBreaker: CircuitBreaker,
    bypassCircuitBreaker?: boolean,
    bypassRetry?: boolean,
  ): Promise<AxiosResponse<T>> {
    const url = `${config.url || ""}`;
    const fullUrl = url.startsWith("http")
      ? url
      : `http://${instance.address}:${instance.port}${url}`;

    const requestConfig = {
      ...config,
      url: fullUrl,
    };

    const makeRequest = async () => {
      return this.httpClient.request<T>(requestConfig);
    };

    // Apply circuit breaker if not bypassed
    if (!bypassCircuitBreaker) {
      const executeWithCircuitBreaker = async () => {
        return circuitBreaker.execute(makeRequest);
      };

      // Apply retry if not bypassed
      if (!bypassRetry) {
        return this.retryMiddleware.execute(
          executeWithCircuitBreaker,
          `${instance.name}-${instance.id}`,
        );
      }

      return executeWithCircuitBreaker();
    }

    // Apply only retry if circuit breaker bypassed
    if (!bypassRetry) {
      return this.retryMiddleware.execute(
        makeRequest,
        `${instance.name}-${instance.id}`,
      );
    }

    return makeRequest();
  }

  /**
   * Convenience methods for HTTP verbs
   */
  async get<T = any>(
    serviceName: string,
    url: string,
    config?: Partial<ServiceMeshRequest>,
  ): Promise<ServiceMeshResponse<T>> {
    return this.request<T>({
      serviceName,
      method: "GET",
      url,
      ...config,
    });
  }

  async post<T = any>(
    serviceName: string,
    url: string,
    data?: any,
    config?: Partial<ServiceMeshRequest>,
  ): Promise<ServiceMeshResponse<T>> {
    return this.request<T>({
      serviceName,
      method: "POST",
      url,
      data,
      ...config,
    });
  }

  async put<T = any>(
    serviceName: string,
    url: string,
    data?: any,
    config?: Partial<ServiceMeshRequest>,
  ): Promise<ServiceMeshResponse<T>> {
    return this.request<T>({
      serviceName,
      method: "PUT",
      url,
      data,
      ...config,
    });
  }

  async delete<T = any>(
    serviceName: string,
    url: string,
    config?: Partial<ServiceMeshRequest>,
  ): Promise<ServiceMeshResponse<T>> {
    return this.request<T>({
      serviceName,
      method: "DELETE",
      url,
      ...config,
    });
  }

  async patch<T = any>(
    serviceName: string,
    url: string,
    data?: any,
    config?: Partial<ServiceMeshRequest>,
  ): Promise<ServiceMeshResponse<T>> {
    return this.request<T>({
      serviceName,
      method: "PATCH",
      url,
      data,
      ...config,
    });
  }

  /**
   * Register current service
   */
  async registerService(instance: {
    id: string;
    name: string;
    address: string;
    port: number;
    metadata?: Record<string, any>;
    tags?: string[];
  }): Promise<void> {
    await this.discovery.registerService({
      ...instance,
      health: "passing",
    });

    this.emit("service-registered", { instance });
  }

  /**
   * Deregister current service
   */
  async deregisterService(serviceId: string): Promise<void> {
    await this.discovery.deregisterService(serviceId);

    this.emit("service-deregistered", { serviceId });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Discovery events
    this.discovery.on("service-updated", (event) => {
      this.emit("service-mesh:discovery:updated", event);
    });

    this.discovery.on("service-changed", (event) => {
      this.emit("service-mesh:discovery:changed", event);
    });

    // Load balancer events
    this.loadBalancer.on("connection-start", (event) => {
      this.emit("service-mesh:lb:connection-start", event);
    });

    this.loadBalancer.on("connection-end", (event) => {
      this.emit("service-mesh:lb:connection-end", event);
    });

    // Retry events
    this.retryMiddleware.on("retry-attempt", (event) => {
      this.emit("service-mesh:retry:attempt", event);
    });

    this.retryMiddleware.on("max-retries-reached", (event) => {
      this.emit("service-mesh:retry:max-reached", event);
    });

    // Health check events
    this.healthManager.on("check-completed", (event) => {
      this.emit("service-mesh:health:check-completed", event);
    });

    this.healthManager.on("check-failed", (event) => {
      this.emit("service-mesh:health:check-failed", event);
    });
  }

  /**
   * Register default health checks
   */
  private registerHealthChecks(): void {
    // Memory check
    this.healthManager.registerCheck(
      CommonHealthChecks.memory("memory-usage", 90),
    );

    // Add custom liveness check
    this.healthManager.registerCheck({
      name: "service-mesh-liveness",
      type: "liveness",
      critical: true,
      check: async () => ({
        status: "healthy",
        message: "Service mesh is operational",
        timestamp: new Date(),
        metadata: {
          uptime: Date.now() - this.startTime.getTime(),
          circuitBreakers: this.circuitBreakers.size,
        },
      }),
    });
  }

  /**
   * Get service health
   */
  getHealth() {
    return this.healthManager.getHealth();
  }

  /**
   * Get liveness status
   */
  getLiveness() {
    return this.healthManager.getLiveness();
  }

  /**
   * Get readiness status
   */
  getReadiness() {
    return this.healthManager.getReadiness();
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      loadBalancer: this.loadBalancer.getAllMetrics(),
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(
        ([name, cb]) => ({
          name,
          metrics: cb.getMetrics(),
        }),
      ),
      retry: this.retryMiddleware.getMetrics(),
      discovery: {
        cachedServices: this.discovery.getCachedInstances.length,
      },
    };
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    this.healthManager.stop();
    this.discovery.cleanup();

    this.emit("shutdown");
  }
}

export default ServiceMeshClient;
