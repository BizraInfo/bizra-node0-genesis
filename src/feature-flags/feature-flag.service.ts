import * as LaunchDarkly from "launchdarkly-node-server-sdk";
import { Logger } from "../utils/logger";

/**
 * Feature Flag Service
 * Integrates with LaunchDarkly for feature flag management
 * Supports A/B testing, gradual rollouts, and emergency kill switches
 */

export interface FeatureFlagContext {
  key: string;
  name?: string;
  email?: string;
  custom?: Record<string, any>;
}

export interface FeatureFlagConfig {
  sdkKey: string;
  streamingEnabled?: boolean;
  offlineMode?: boolean;
  pollInterval?: number;
  timeout?: number;
}

export class FeatureFlagService {
  private client: LaunchDarkly.LDClient | null = null;
  private logger: Logger;
  private isReady: boolean = false;
  private fallbackFlags: Map<string, boolean> = new Map();

  constructor(
    private config: FeatureFlagConfig,
    logger?: Logger,
  ) {
    this.logger = logger || new Logger("FeatureFlagService");
    this.initializeFallbackFlags();
  }

  /**
   * Initialize the LaunchDarkly client
   */
  async initialize(): Promise<void> {
    try {
      if (this.config.offlineMode) {
        this.logger.warn("Feature flags running in offline mode");
        return;
      }

      const ldConfig: LaunchDarkly.LDOptions = {
        stream: this.config.streamingEnabled !== false,
        timeout: this.config.timeout || 5,
      };

      if (this.config.pollInterval) {
        ldConfig.pollInterval = this.config.pollInterval;
      }

      this.client = LaunchDarkly.init(this.config.sdkKey, ldConfig);

      await this.client.waitForInitialization({ timeout: 10 });

      this.isReady = true;
      this.logger.info("Feature flag service initialized successfully");

      // Set up event handlers
      this.setupEventHandlers();
    } catch (error) {
      this.logger.error("Failed to initialize feature flag service", error);
      this.isReady = false;
      // Continue with fallback flags
    }
  }

  /**
   * Set up LaunchDarkly event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on("ready", () => {
      this.logger.info("Feature flag client is ready");
      this.isReady = true;
    });

    this.client.on("failed", () => {
      this.logger.error("Feature flag client failed");
      this.isReady = false;
    });

    this.client.on("update", (settings) => {
      this.logger.debug("Feature flags updated", {
        flags: Object.keys(settings),
      });
    });

    this.client.on("error", (error) => {
      this.logger.error("Feature flag client error", error);
    });
  }

  /**
   * Initialize fallback flags for offline mode or failures
   */
  private initializeFallbackFlags(): void {
    // Define fallback flags with conservative defaults
    this.fallbackFlags.set("new-api-endpoint", false);
    this.fallbackFlags.set("canary-deployment", false);
    this.fallbackFlags.set("maintenance-mode", false);
    this.fallbackFlags.set("feature-x-enabled", false);
    this.fallbackFlags.set("advanced-analytics", false);
    this.fallbackFlags.set("new-ui-design", false);
  }

  /**
   * Check if a feature flag is enabled for a user
   */
  async isEnabled(
    flagKey: string,
    context: FeatureFlagContext,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    try {
      if (!this.isReady || !this.client) {
        this.logger.warn(`Using fallback for flag: ${flagKey}`);
        return this.fallbackFlags.get(flagKey) ?? defaultValue;
      }

      const ldContext: LaunchDarkly.LDContext = {
        kind: "user",
        key: context.key,
        name: context.name,
        email: context.email,
        ...context.custom,
      };

      const value = await this.client.variation(
        flagKey,
        ldContext,
        defaultValue,
      );

      this.logger.debug(`Flag ${flagKey} for user ${context.key}: ${value}`);

      return value;
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagKey}`, error);
      return this.fallbackFlags.get(flagKey) ?? defaultValue;
    }
  }

  /**
   * Get variation value for a feature flag (for A/B testing)
   */
  async getVariation<T = any>(
    flagKey: string,
    context: FeatureFlagContext,
    defaultValue: T,
  ): Promise<T> {
    try {
      if (!this.isReady || !this.client) {
        this.logger.warn(`Using default value for flag: ${flagKey}`);
        return defaultValue;
      }

      const ldContext: LaunchDarkly.LDContext = {
        kind: "user",
        key: context.key,
        name: context.name,
        email: context.email,
        ...context.custom,
      };

      const value = await this.client.variation(
        flagKey,
        ldContext,
        defaultValue,
      );

      this.logger.debug(`Variation ${flagKey} for user ${context.key}:`, value);

      return value;
    } catch (error) {
      this.logger.error(`Error getting variation ${flagKey}`, error);
      return defaultValue;
    }
  }

  /**
   * Get all feature flags for a user
   */
  async getAllFlags(context: FeatureFlagContext): Promise<Record<string, any>> {
    try {
      if (!this.isReady || !this.client) {
        const fallbackObj: Record<string, any> = {};
        this.fallbackFlags.forEach((value, key) => {
          fallbackObj[key] = value;
        });
        return fallbackObj;
      }

      const ldContext: LaunchDarkly.LDContext = {
        kind: "user",
        key: context.key,
        name: context.name,
        email: context.email,
        ...context.custom,
      };

      const allFlags = await this.client.allFlagsState(ldContext);

      return allFlags.allValues();
    } catch (error) {
      this.logger.error("Error getting all flags", error);
      return {};
    }
  }

  /**
   * Track a custom event (for analytics and experimentation)
   */
  async track(
    eventName: string,
    context: FeatureFlagContext,
    data?: any,
    metricValue?: number,
  ): Promise<void> {
    try {
      if (!this.isReady || !this.client) {
        this.logger.warn(`Cannot track event in offline mode: ${eventName}`);
        return;
      }

      const ldContext: LaunchDarkly.LDContext = {
        kind: "user",
        key: context.key,
        name: context.name,
        email: context.email,
        ...context.custom,
      };

      this.client.track(eventName, ldContext, data, metricValue);

      this.logger.debug(`Tracked event: ${eventName} for user ${context.key}`);
    } catch (error) {
      this.logger.error(`Error tracking event ${eventName}`, error);
    }
  }

  /**
   * Flush events (useful before shutdown)
   */
  async flush(): Promise<void> {
    try {
      if (this.client) {
        await this.client.flush();
        this.logger.info("Feature flag events flushed");
      }
    } catch (error) {
      this.logger.error("Error flushing feature flag events", error);
    }
  }

  /**
   * Close the feature flag client
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.flush();
        await this.client.close();
        this.isReady = false;
        this.client = null;
        this.logger.info("Feature flag service closed");
      }
    } catch (error) {
      this.logger.error("Error closing feature flag service", error);
    }
  }

  /**
   * Health check for feature flag service
   */
  isHealthy(): boolean {
    return this.isReady;
  }

  /**
   * Set a fallback flag value (for testing or emergency overrides)
   */
  setFallbackFlag(flagKey: string, value: boolean): void {
    this.fallbackFlags.set(flagKey, value);
    this.logger.info(`Set fallback flag ${flagKey}: ${value}`);
  }

  /**
   * Emergency kill switch - disable a feature immediately
   */
  emergencyDisable(flagKey: string): void {
    this.setFallbackFlag(flagKey, false);
    this.logger.warn(`EMERGENCY: Disabled feature flag ${flagKey}`);
  }

  /**
   * Get service status and metrics
   */
  getStatus() {
    return {
      ready: this.isReady,
      offlineMode: this.config.offlineMode || false,
      fallbackFlagsCount: this.fallbackFlags.size,
      sdkVersion: LaunchDarkly.version,
    };
  }
}

// Singleton instance
let featureFlagServiceInstance: FeatureFlagService | null = null;

/**
 * Get or create the feature flag service instance
 */
export function getFeatureFlagService(
  config?: FeatureFlagConfig,
): FeatureFlagService {
  if (!featureFlagServiceInstance && config) {
    featureFlagServiceInstance = new FeatureFlagService(config);
  }

  if (!featureFlagServiceInstance) {
    throw new Error(
      "Feature flag service not initialized. Call with config first.",
    );
  }

  return featureFlagServiceInstance;
}

/**
 * Helper function to check if a feature is enabled
 */
export async function isFeatureEnabled(
  flagKey: string,
  userId: string,
  defaultValue: boolean = false,
): Promise<boolean> {
  const service = getFeatureFlagService();
  return service.isEnabled(flagKey, { key: userId }, defaultValue);
}
