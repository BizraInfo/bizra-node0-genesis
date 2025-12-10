/**
 * Client-Side Load Balancer
 * Supports multiple strategies: Round Robin, Least Connections, Random, Weighted
 */

import { ServiceInstance } from "../discovery/service-discovery";
import { EventEmitter } from "events";

export type LoadBalancingStrategy =
  | "round-robin"
  | "least-connections"
  | "random"
  | "weighted-round-robin"
  | "ip-hash"
  | "least-response-time";

export interface LoadBalancerConfig {
  strategy: LoadBalancingStrategy;
  healthCheckEnabled?: boolean;
  sessionAffinity?: boolean;
  maxConnectionsPerInstance?: number;
}

export interface LoadBalancerMetrics {
  instanceId: string;
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  lastResponseTime?: number;
  lastUsed?: Date;
}

export class LoadBalancer extends EventEmitter {
  private config: LoadBalancerConfig;
  private currentIndex: number = 0;
  private connectionCounts: Map<string, number> = new Map();
  private metrics: Map<string, LoadBalancerMetrics> = new Map();
  private sessionMap: Map<string, string> = new Map(); // clientId -> instanceId
  private weightedIndexes: string[] = [];

  constructor(config: LoadBalancerConfig) {
    super();
    this.config = {
      healthCheckEnabled: true,
      sessionAffinity: false,
      maxConnectionsPerInstance: 100,
      ...config,
    };
  }

  /**
   * Select next instance based on strategy
   */
  selectInstance(
    instances: ServiceInstance[],
    clientId?: string,
    metadata?: Record<string, any>,
  ): ServiceInstance | null {
    if (!instances || instances.length === 0) {
      return null;
    }

    // Filter healthy instances
    const healthyInstances = this.config.healthCheckEnabled
      ? instances.filter((instance) => instance.health === "passing")
      : instances;

    if (healthyInstances.length === 0) {
      return null;
    }

    // Check session affinity
    if (this.config.sessionAffinity && clientId) {
      const sessionInstance = this.getSessionInstance(
        clientId,
        healthyInstances,
      );
      if (sessionInstance) {
        return sessionInstance;
      }
    }

    // Select based on strategy
    let selected: ServiceInstance | null;

    switch (this.config.strategy) {
      case "round-robin":
        selected = this.roundRobin(healthyInstances);
        break;
      case "least-connections":
        selected = this.leastConnections(healthyInstances);
        break;
      case "random":
        selected = this.random(healthyInstances);
        break;
      case "weighted-round-robin":
        selected = this.weightedRoundRobin(healthyInstances);
        break;
      case "ip-hash":
        selected = this.ipHash(healthyInstances, clientId);
        break;
      case "least-response-time":
        selected = this.leastResponseTime(healthyInstances);
        break;
      default:
        selected = this.roundRobin(healthyInstances);
    }

    if (selected && this.config.sessionAffinity && clientId) {
      this.sessionMap.set(clientId, selected.id);
    }

    // Initialize metrics if needed
    if (selected && !this.metrics.has(selected.id)) {
      this.initializeMetrics(selected.id);
    }

    return selected;
  }

  /**
   * Round Robin strategy
   */
  private roundRobin(instances: ServiceInstance[]): ServiceInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance;
  }

  /**
   * Least Connections strategy
   */
  private leastConnections(instances: ServiceInstance[]): ServiceInstance {
    let minConnections = Infinity;
    let selected = instances[0];

    for (const instance of instances) {
      const connections = this.connectionCounts.get(instance.id) || 0;

      // Respect max connections limit
      if (
        this.config.maxConnectionsPerInstance &&
        connections >= this.config.maxConnectionsPerInstance
      ) {
        continue;
      }

      if (connections < minConnections) {
        minConnections = connections;
        selected = instance;
      }
    }

    return selected;
  }

  /**
   * Random strategy
   */
  private random(instances: ServiceInstance[]): ServiceInstance {
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  /**
   * Weighted Round Robin strategy
   */
  private weightedRoundRobin(instances: ServiceInstance[]): ServiceInstance {
    // Build weighted index array if needed
    if (this.weightedIndexes.length === 0) {
      this.buildWeightedIndexes(instances);
    }

    const instanceId =
      this.weightedIndexes[this.currentIndex % this.weightedIndexes.length];
    this.currentIndex = (this.currentIndex + 1) % this.weightedIndexes.length;

    const instance = instances.find((i) => i.id === instanceId);
    return instance || instances[0];
  }

  /**
   * IP Hash strategy (consistent hashing)
   */
  private ipHash(
    instances: ServiceInstance[],
    clientId?: string,
  ): ServiceInstance {
    if (!clientId) {
      return this.random(instances);
    }

    const hash = this.hashString(clientId);
    const index = hash % instances.length;
    return instances[index];
  }

  /**
   * Least Response Time strategy
   */
  private leastResponseTime(instances: ServiceInstance[]): ServiceInstance {
    let minResponseTime = Infinity;
    let selected = instances[0];

    for (const instance of instances) {
      const metrics = this.metrics.get(instance.id);
      const responseTime = metrics?.avgResponseTime || 0;

      if (responseTime < minResponseTime) {
        minResponseTime = responseTime;
        selected = instance;
      }
    }

    return selected;
  }

  /**
   * Build weighted indexes for weighted round robin
   */
  private buildWeightedIndexes(instances: ServiceInstance[]): void {
    this.weightedIndexes = [];

    for (const instance of instances) {
      const weight = (instance.metadata?.weight as number) || 1;

      for (let i = 0; i < weight; i++) {
        this.weightedIndexes.push(instance.id);
      }
    }
  }

  /**
   * Get session affinity instance
   */
  private getSessionInstance(
    clientId: string,
    instances: ServiceInstance[],
  ): ServiceInstance | null {
    const instanceId = this.sessionMap.get(clientId);
    if (!instanceId) {
      return null;
    }

    return instances.find((i) => i.id === instanceId) || null;
  }

  /**
   * Track connection start
   */
  onConnectionStart(instanceId: string): void {
    const count = this.connectionCounts.get(instanceId) || 0;
    this.connectionCounts.set(instanceId, count + 1);

    const metrics = this.metrics.get(instanceId);
    if (metrics) {
      metrics.activeConnections = count + 1;
    }

    this.emit("connection-start", { instanceId, activeConnections: count + 1 });
  }

  /**
   * Track connection end
   */
  onConnectionEnd(instanceId: string, responseTime?: number): void {
    const count = Math.max((this.connectionCounts.get(instanceId) || 1) - 1, 0);
    this.connectionCounts.set(instanceId, count);

    const metrics = this.metrics.get(instanceId);
    if (metrics) {
      metrics.activeConnections = count;
      metrics.totalRequests++;

      if (responseTime !== undefined) {
        metrics.lastResponseTime = responseTime;
        metrics.avgResponseTime =
          (metrics.avgResponseTime * (metrics.totalRequests - 1) +
            responseTime) /
          metrics.totalRequests;
      }

      metrics.lastUsed = new Date();
    }

    this.emit("connection-end", {
      instanceId,
      activeConnections: count,
      responseTime,
    });
  }

  /**
   * Track failed request
   */
  onRequestFailed(instanceId: string): void {
    const metrics = this.metrics.get(instanceId);
    if (metrics) {
      metrics.failedRequests++;
    }

    this.emit("request-failed", { instanceId });
  }

  /**
   * Initialize metrics for instance
   */
  private initializeMetrics(instanceId: string): void {
    this.metrics.set(instanceId, {
      instanceId,
      activeConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
    });
  }

  /**
   * Get metrics for instance
   */
  getMetrics(instanceId: string): LoadBalancerMetrics | undefined {
    return this.metrics.get(instanceId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, LoadBalancerMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.connectionCounts.clear();
  }

  /**
   * Clear session affinity
   */
  clearSession(clientId: string): void {
    this.sessionMap.delete(clientId);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessionMap.clear();
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update strategy
   */
  updateStrategy(strategy: LoadBalancingStrategy): void {
    this.config.strategy = strategy;
    this.currentIndex = 0;
    this.weightedIndexes = [];

    this.emit("strategy-updated", { strategy });
  }
}

export default LoadBalancer;
