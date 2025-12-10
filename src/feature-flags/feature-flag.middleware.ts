import { Request, Response, NextFunction } from "express";
import { getFeatureFlagService } from "./feature-flag.service";
import { Logger } from "../utils/logger";

/**
 * Feature Flag Middleware for Express
 * Provides feature flag checking at the middleware level
 */

const logger = new Logger("FeatureFlagMiddleware");

/**
 * Add feature flags to request object
 */
declare global {
  namespace Express {
    interface Request {
      featureFlags?: Record<string, any>;
      isFeatureEnabled?: (
        flagKey: string,
        defaultValue?: boolean,
      ) => Promise<boolean>;
    }
  }
}

/**
 * Middleware to load all feature flags for the current user
 */
export function loadFeatureFlags() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureFlagService = getFeatureFlagService();

      // Get user context from request (customize based on your auth system)
      const userContext = {
        key: req.user?.id || req.ip || "anonymous",
        name: req.user?.name,
        email: req.user?.email,
        custom: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
          environment: process.env.NODE_ENV,
        },
      };

      // Load all flags for this user
      req.featureFlags = await featureFlagService.getAllFlags(userContext);

      // Add helper function to check individual flags
      req.isFeatureEnabled = async (
        flagKey: string,
        defaultValue: boolean = false,
      ) => {
        return featureFlagService.isEnabled(flagKey, userContext, defaultValue);
      };

      next();
    } catch (error) {
      logger.error("Error loading feature flags", error);
      // Continue without feature flags
      req.featureFlags = {};
      req.isFeatureEnabled = async () => false;
      next();
    }
  };
}

/**
 * Middleware to require a specific feature flag to be enabled
 */
export function requireFeature(
  flagKey: string,
  options: {
    redirectUrl?: string;
    errorMessage?: string;
    statusCode?: number;
  } = {},
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureFlagService = getFeatureFlagService();

      const userContext = {
        key: req.user?.id || req.ip || "anonymous",
        name: req.user?.name,
        email: req.user?.email,
        custom: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      };

      const isEnabled = await featureFlagService.isEnabled(
        flagKey,
        userContext,
        false,
      );

      if (!isEnabled) {
        logger.warn(
          `Feature ${flagKey} is not enabled for user ${userContext.key}`,
        );

        if (options.redirectUrl) {
          return res.redirect(options.redirectUrl);
        }

        return res.status(options.statusCode || 403).json({
          error: "Feature not available",
          message:
            options.errorMessage ||
            `The feature "${flagKey}" is not available for your account`,
          feature: flagKey,
        });
      }

      next();
    } catch (error) {
      logger.error(`Error checking feature flag ${flagKey}`, error);
      next(error);
    }
  };
}

/**
 * Middleware to block access if a feature flag is enabled (e.g., maintenance mode)
 */
export function blockIfEnabled(
  flagKey: string,
  options: {
    redirectUrl?: string;
    message?: string;
    statusCode?: number;
  } = {},
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureFlagService = getFeatureFlagService();

      const userContext = {
        key: req.user?.id || req.ip || "anonymous",
        name: req.user?.name,
        email: req.user?.email,
      };

      const isEnabled = await featureFlagService.isEnabled(
        flagKey,
        userContext,
        false,
      );

      if (isEnabled) {
        logger.info(`Request blocked by feature flag ${flagKey}`);

        if (options.redirectUrl) {
          return res.redirect(options.redirectUrl);
        }

        return res.status(options.statusCode || 503).json({
          error: "Service unavailable",
          message: options.message || "This service is temporarily unavailable",
          feature: flagKey,
        });
      }

      next();
    } catch (error) {
      logger.error(`Error checking feature flag ${flagKey}`, error);
      next(error);
    }
  };
}

/**
 * Middleware for A/B testing - route to different handlers based on variation
 */
export function abTest(flagKey: string, handlers: Record<string, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureFlagService = getFeatureFlagService();

      const userContext = {
        key: req.user?.id || req.ip || "anonymous",
        name: req.user?.name,
        email: req.user?.email,
      };

      const variation = await featureFlagService.getVariation(
        flagKey,
        userContext,
        "control",
      );

      logger.debug(
        `A/B test ${flagKey}: user ${userContext.key} in variation ${variation}`,
      );

      const handler =
        handlers[variation] || handlers["control"] || handlers["default"];

      if (!handler) {
        return next();
      }

      // Track the variation for analytics
      await featureFlagService.track(`ab-test-${flagKey}`, userContext, {
        variation,
      });

      // Execute the variation handler
      return handler(req, res, next);
    } catch (error) {
      logger.error(`Error in A/B test ${flagKey}`, error);
      next(error);
    }
  };
}

/**
 * Middleware to track feature usage events
 */
export function trackFeatureUsage(
  eventName: string,
  getData?: (req: Request) => any,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureFlagService = getFeatureFlagService();

      const userContext = {
        key: req.user?.id || req.ip || "anonymous",
        name: req.user?.name,
        email: req.user?.email,
      };

      const data = getData ? getData(req) : {};

      await featureFlagService.track(eventName, userContext, data);

      logger.debug(`Tracked event ${eventName} for user ${userContext.key}`);
    } catch (error) {
      logger.error(`Error tracking event ${eventName}`, error);
    }

    next();
  };
}

/**
 * Middleware to add feature flag information to response headers (for debugging)
 */
export function exposeFeatureFlags(flagKeys?: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (process.env.NODE_ENV !== "production") {
        const flags = req.featureFlags || {};

        if (flagKeys) {
          const selectedFlags: Record<string, any> = {};
          flagKeys.forEach((key) => {
            if (flags[key] !== undefined) {
              selectedFlags[key] = flags[key];
            }
          });
          res.setHeader("X-Feature-Flags", JSON.stringify(selectedFlags));
        } else {
          res.setHeader("X-Feature-Flags", JSON.stringify(flags));
        }
      }
    } catch (error) {
      logger.error("Error exposing feature flags", error);
    }

    next();
  };
}

/**
 * Middleware for gradual rollout - reject requests based on percentage
 */
export function gradualRollout(flagKey: string, targetPercentage: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureFlagService = getFeatureFlagService();

      const userContext = {
        key: req.user?.id || req.ip || "anonymous",
        name: req.user?.name,
        email: req.user?.email,
        custom: {
          percentage: targetPercentage,
        },
      };

      const isEnabled = await featureFlagService.isEnabled(
        flagKey,
        userContext,
        false,
      );

      if (!isEnabled) {
        return res.status(503).json({
          error: "Service temporarily unavailable",
          message: "Please try again later",
        });
      }

      next();
    } catch (error) {
      logger.error(`Error in gradual rollout ${flagKey}`, error);
      next(error);
    }
  };
}
