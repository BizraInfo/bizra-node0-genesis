/**
 * Service Discovery Client
 * Supports Consul, Kubernetes DNS, and custom registry
 */

import dns from "dns";
import { promisify } from "util";
import axios from "axios";
import { EventEmitter } from "events";

const resolveSrv = promisify(dns.resolveSrv);
const resolve4 = promisify(dns.resolve4);

export interface ServiceInstance {
  id: string;
  name: string;
  address: string;
  port: number;
  metadata?: Record<string, any>;
  health: "passing" | "warning" | "critical";
  tags?: string[];
  lastCheck?: Date;
}

export interface ServiceDiscoveryConfig {
  backend: "consul" | "kubernetes" | "custom";
  consulUrl?: string;
  kubernetesNamespace?: string;
  refreshInterval?: number;
  healthCheckInterval?: number;
  ttl?: number;
}

export class ServiceDiscovery extends EventEmitter {
  private config: ServiceDiscoveryConfig;
  private cache: Map<string, ServiceInstance[]> = new Map();
  private watchers: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckers: Map<string, NodeJS.Timeout> = new Map();
  private registry: Map<string, ServiceInstance> = new Map(); // Custom backend registry

  constructor(config: ServiceDiscoveryConfig) {
    super();
    this.config = {
      refreshInterval: 30000, // 30 seconds
      healthCheckInterval: 10000, // 10 seconds
      ttl: 60000, // 1 minute
      ...config,
    };
  }

  /**
   * Discover all instances of a service
   */
  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    // Check cache first
    const cached = this.cache.get(serviceName);
    if (cached && cached.length > 0) {
      return cached.filter((instance) => instance.health === "passing");
    }

    // Discover based on backend
    let instances: ServiceInstance[];

    switch (this.config.backend) {
      case "consul":
        instances = await this.discoverFromConsul(serviceName);
        break;
      case "kubernetes":
        instances = await this.discoverFromKubernetes(serviceName);
        break;
      case "custom":
        instances = await this.discoverCustom(serviceName);
        break;
      default:
        throw new Error(
          `Unsupported discovery backend: ${this.config.backend}`,
        );
    }

    // Update cache
    this.cache.set(serviceName, instances);

    // Start watching if not already watching
    if (!this.watchers.has(serviceName)) {
      this.startWatcher(serviceName);
    }

    return instances.filter((instance) => instance.health === "passing");
  }

  /**
   * Discover from Consul
   */
  private async discoverFromConsul(
    serviceName: string,
  ): Promise<ServiceInstance[]> {
    if (!this.config.consulUrl) {
      throw new Error("Consul URL not configured");
    }

    try {
      const response = await axios.get(
        `${this.config.consulUrl}/v1/health/service/${serviceName}`,
        { params: { passing: true } },
      );

      return response.data.map((entry: any) => ({
        id: entry.Service.ID,
        name: entry.Service.Service,
        address: entry.Service.Address || entry.Node.Address,
        port: entry.Service.Port,
        metadata: entry.Service.Meta,
        health: this.mapConsulHealth(entry.Checks),
        tags: entry.Service.Tags,
        lastCheck: new Date(),
      }));
    } catch (error) {
      console.error(
        `Failed to discover service ${serviceName} from Consul:`,
        error,
      );
      return [];
    }
  }

  /**
   * Discover from Kubernetes DNS
   */
  private async discoverFromKubernetes(
    serviceName: string,
  ): Promise<ServiceInstance[]> {
    const namespace = this.config.kubernetesNamespace || "default";
    const dnsName = `${serviceName}.${namespace}.svc.cluster.local`;

    try {
      // Try SRV records first (includes port information)
      try {
        const srvRecords = await resolveSrv(dnsName);

        return await Promise.all(
          srvRecords.map(async (record) => {
            const addresses = await resolve4(record.name);
            return {
              id: `${serviceName}-${record.name}-${record.port}`,
              name: serviceName,
              address: addresses[0],
              port: record.port,
              health: "passing" as const,
              metadata: { weight: record.weight, priority: record.priority },
              lastCheck: new Date(),
            };
          }),
        );
      } catch (srvError) {
        // Fallback to A records
        const addresses = await resolve4(dnsName);

        return addresses.map((address, index) => ({
          id: `${serviceName}-${address}`,
          name: serviceName,
          address,
          port: 80, // Default port, should be configured
          health: "passing" as const,
          lastCheck: new Date(),
        }));
      }
    } catch (error) {
      console.error(
        `Failed to discover service ${serviceName} from Kubernetes:`,
        error,
      );
      return [];
    }
  }

  /**
   * Custom discovery implementation - In-memory registry lookup
   */
  private async discoverCustom(
    serviceName: string,
  ): Promise<ServiceInstance[]> {
    // Query custom in-memory registry
    const allInstances = Array.from(this.registry.values());
    const serviceInstances = allInstances.filter(
      (instance) => instance.name === serviceName,
    );

    return serviceInstances;
  }

  /**
   * Register a service instance
   */
  async registerService(
    instance: Omit<ServiceInstance, "lastCheck">,
  ): Promise<void> {
    switch (this.config.backend) {
      case "consul":
        await this.registerToConsul(instance);
        break;
      case "kubernetes":
        // Kubernetes handles registration via Service resources
        console.log("Service registration handled by Kubernetes");
        break;
      case "custom":
        await this.registerCustom(instance);
        break;
    }

    // Start health checking
    this.startHealthChecker(instance);
  }

  /**
   * Register to Consul
   */
  private async registerToConsul(
    instance: Omit<ServiceInstance, "lastCheck">,
  ): Promise<void> {
    if (!this.config.consulUrl) {
      throw new Error("Consul URL not configured");
    }

    const registration = {
      ID: instance.id,
      Name: instance.name,
      Address: instance.address,
      Port: instance.port,
      Tags: instance.tags || [],
      Meta: instance.metadata || {},
      Check: {
        HTTP: `http://${instance.address}:${instance.port}/health`,
        Interval: "10s",
        Timeout: "5s",
      },
    };

    await axios.put(
      `${this.config.consulUrl}/v1/agent/service/register`,
      registration,
    );
  }

  /**
   * Custom registration - In-memory registry for testing/development
   */
  private async registerCustom(
    instance: Omit<ServiceInstance, "lastCheck">,
  ): Promise<void> {
    const now = new Date();
    const fullInstance = { ...instance, lastCheck: now };

    // Register in custom registry
    this.registry.set(instance.id, fullInstance);

    // Update cache for service name
    const serviceInstances = this.registry.values();
    const instances = Array.from(serviceInstances).filter(
      (i) => i.name === instance.name,
    );
    this.cache.set(instance.name, instances);

    // Emit service-updated event
    this.emit("service-updated", {
      serviceName: instance.name,
      instanceId: instance.id,
      ts: now,
    });
  }

  /**
   * Deregister a service instance
   */
  async deregisterService(serviceId: string): Promise<void> {
    if (this.config.backend === "consul" && this.config.consulUrl) {
      await axios.put(
        `${this.config.consulUrl}/v1/agent/service/deregister/${serviceId}`,
      );
    }

    // Stop health checker
    const checker = this.healthCheckers.get(serviceId);
    if (checker) {
      clearInterval(checker);
      this.healthCheckers.delete(serviceId);
    }
  }

  /**
   * Start watching for service changes
   */
  private startWatcher(serviceName: string): void {
    const watcher = setInterval(async () => {
      try {
        const instances = await this.discoverService(serviceName);

        // Emit update event
        this.emit("service-updated", { serviceName, instances });

        // Check for changes
        const cached = this.cache.get(serviceName) || [];
        if (JSON.stringify(instances) !== JSON.stringify(cached)) {
          this.emit("service-changed", {
            serviceName,
            instances,
            previous: cached,
          });
        }
      } catch (error) {
        this.emit("discovery-error", { serviceName, error });
      }
    }, this.config.refreshInterval);

    this.watchers.set(serviceName, watcher);
  }

  /**
   * Start health checker for instance
   */
  private startHealthChecker(
    instance: Omit<ServiceInstance, "lastCheck">,
  ): void {
    const checker = setInterval(async () => {
      try {
        const health = await this.checkHealth(instance);
        this.emit("health-check", { instance, health });
      } catch (error) {
        this.emit("health-check-error", { instance, error });
      }
    }, this.config.healthCheckInterval);

    this.healthCheckers.set(instance.id, checker);
  }

  /**
   * Check health of an instance
   */
  private async checkHealth(
    instance: Omit<ServiceInstance, "lastCheck">,
  ): Promise<string> {
    try {
      const response = await axios.get(
        `http://${instance.address}:${instance.port}/health`,
        { timeout: 5000 },
      );

      return response.status === 200 ? "passing" : "warning";
    } catch (error) {
      return "critical";
    }
  }

  /**
   * Map Consul health checks to status
   */
  private mapConsulHealth(checks: any[]): "passing" | "warning" | "critical" {
    if (!checks || checks.length === 0) return "passing";

    const statuses = checks.map((check) => check.Status);

    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("warning")) return "warning";
    return "passing";
  }

  /**
   * Get cached instances
   */
  getCachedInstances(serviceName: string): ServiceInstance[] {
    return this.cache.get(serviceName) || [];
  }

  /**
   * Stop watching a service
   */
  stopWatcher(serviceName: string): void {
    const watcher = this.watchers.get(serviceName);
    if (watcher) {
      clearInterval(watcher);
      this.watchers.delete(serviceName);
    }
  }

  /**
   * Cleanup all watchers and health checkers
   */
  cleanup(): void {
    this.watchers.forEach((watcher) => clearInterval(watcher));
    this.healthCheckers.forEach((checker) => clearInterval(checker));
    this.watchers.clear();
    this.healthCheckers.clear();
    this.cache.clear();
  }
}

export default ServiceDiscovery;
