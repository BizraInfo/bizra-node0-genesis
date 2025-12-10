/**
 * Sentry Error Tracking Integration
 * Production-grade error tracking and performance monitoring
 * @module observability/sentry
 */

import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { getCurrentTraceId, getCurrentSpanId } from "./tracer";

// Environment configuration
const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || "development";
const SERVICE_NAME = process.env.SERVICE_NAME || "bizra-api";
const SERVICE_VERSION = process.env.SERVICE_VERSION || "1.0.0";

/**
 * Initialize Sentry
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    logger.warn("Sentry DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `${SERVICE_NAME}@${SERVICE_VERSION}`,

    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
    profilesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Integrations
    integrations: [
      // Performance profiling
      new ProfilingIntegration(),

      // Automatic instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined }),
      new Sentry.Integrations.Postgres(),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],

    // Error filtering
    ignoreErrors: [
      // Browser errors
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",

      // Network errors that are not actionable
      "NetworkError",
      "Network request failed",

      // User-caused errors
      "ValidationError",
      "Unauthorized",
    ],

    // Sampling
    beforeSend(event, hint) {
      // Don't send errors from development
      if (ENVIRONMENT === "development" && !process.env.SENTRY_FORCE_SEND) {
        return null;
      }

      // Add custom context
      if (event.user) {
        event.user = {
          ...event.user,
          ip_address: "{{auto}}", // Let Sentry handle IP
        };
      }

      // Add trace context from OpenTelemetry
      const traceId = getCurrentTraceId();
      const spanId = getCurrentSpanId();

      if (traceId) {
        event.contexts = {
          ...event.contexts,
          trace: {
            trace_id: traceId,
            span_id: spanId,
          },
        };
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === "console" && breadcrumb.level === "log") {
        return null;
      }

      return breadcrumb;
    },
  });

  logger.info("Sentry error tracking initialized", {
    environment: ENVIRONMENT,
    release: `${SERVICE_NAME}@${SERVICE_VERSION}`,
  });
}

/**
 * Express middleware for Sentry request handling
 */
export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();

/**
 * Express middleware for Sentry tracing
 */
export const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();

/**
 * Express middleware for Sentry error handling
 */
export const sentryErrorHandler = () =>
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.statusCode && error.statusCode >= 500) {
        return true;
      }
      return false;
    },
  });

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: context,
    tags: {
      trace_id: getCurrentTraceId(),
      span_id: getCurrentSpanId(),
    },
  });

  logger.error("Exception captured by Sentry", {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  });
}

/**
 * Capture message with severity
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>,
) {
  Sentry.captureMessage(message, {
    level,
    contexts: context,
    tags: {
      trace_id: getCurrentTraceId(),
      span_id: getCurrentSpanId(),
    },
  });
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  tier?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    tier: user.tier,
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = "info",
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Create performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
    tags: {
      trace_id: getCurrentTraceId(),
    },
  });
}

/**
 * Middleware to track performance per route
 */
export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const transaction = Sentry.startTransaction({
    op: "http.server",
    name: `${req.method} ${req.route?.path || req.path}`,
    tags: {
      method: req.method,
      url: req.url,
    },
  });

  // Store transaction in request
  (req as any).sentryTransaction = transaction;

  // Finish transaction on response
  res.on("finish", () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.setTag("status_code", res.statusCode);
    transaction.finish();
  });

  next();
}

/**
 * Middleware to set user context from request
 */
export function userContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Assuming user is attached to request by auth middleware
  if ((req as any).user) {
    const user = (req as any).user;
    setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      tier: user.tier,
    });
  }

  // Clear user context after response
  res.on("finish", () => {
    if ((req as any).user) {
      clearUser();
    }
  });

  next();
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
) {
  Sentry.captureMessage(`Event: ${eventName}`, {
    level: "info",
    contexts: {
      event: {
        name: eventName,
        properties,
      },
    },
  });

  addBreadcrumb("event", eventName, properties);
}

/**
 * Gracefully shutdown Sentry
 */
export async function shutdownSentry() {
  try {
    await Sentry.close(2000);
    logger.info("Sentry shut down gracefully");
  } catch (error) {
    logger.error("Error shutting down Sentry", { error });
  }
}

export default {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  performanceMiddleware,
  userContextMiddleware,
  trackEvent,
  shutdownSentry,
};
