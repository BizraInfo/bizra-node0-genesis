/**
 * Service Mesh Module
 * Export all service mesh components
 */

// Main client
export {
  ServiceMeshClient,
  ServiceMeshRequest,
  ServiceMeshResponse,
} from "./service-mesh-client";

// Service Discovery
export {
  ServiceDiscovery,
  ServiceInstance,
  ServiceDiscoveryConfig,
} from "./discovery/service-discovery";

// Load Balancer
export {
  LoadBalancer,
  LoadBalancerConfig,
  LoadBalancerMetrics,
  LoadBalancingStrategy,
} from "./load-balancer/load-balancer";

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
  CircuitState,
} from "./circuit-breaker/circuit-breaker";

// Retry Middleware
export {
  RetryMiddleware,
  RetryConfig,
  RetryMetrics,
  Retry,
  RetryPresets,
  BackoffStrategy,
} from "./retry/retry.middleware";

// Health Checks
export {
  HealthCheckManager,
  HealthCheck,
  HealthCheckConfig,
  HealthCheckResult,
  HealthStatus,
  ProbeType,
  ServiceHealth,
  CommonHealthChecks,
} from "./health/health-check";

// Configuration
export {
  ServiceMeshConfig,
  getConfig,
  getServiceConfig,
  developmentConfig,
  stagingConfig,
  productionConfig,
} from "../config/service-mesh/service-mesh.config";

/**
 * Create a service mesh client with default configuration
 */
import { ServiceMeshClient } from "./service-mesh-client";
import {
  getConfig,
  getServiceConfig,
} from "../config/service-mesh/service-mesh.config";

export function createServiceMeshClient(
  serviceName?: string,
): ServiceMeshClient {
  const config = serviceName ? getServiceConfig(serviceName) : getConfig();
  return new ServiceMeshClient(config);
}

/**
 * Version
 */
export const VERSION = "1.0.0";
