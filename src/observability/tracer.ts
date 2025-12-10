/**
 * OpenTelemetry Distributed Tracing Configuration
 * Production-grade distributed tracing with context propagation
 * @module observability/tracer
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { trace, context, SpanStatusCode, Span } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { logger } from "./logger";

// Service configuration
const serviceName = process.env.SERVICE_NAME || "bizra-api";
const serviceVersion = process.env.SERVICE_VERSION || "1.0.0";
const environment = process.env.NODE_ENV || "development";

// OpenTelemetry Collector endpoint
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://otel-collector:4318";

// Resource configuration
const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    "service.instance.id": process.env.HOSTNAME || "local",
  }),
);

// Trace exporter
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
  headers: {},
});

// Metric exporter
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
  headers: {},
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export every 60 seconds
  }),
  spanProcessor: new BatchSpanProcessor(traceExporter, {
    maxQueueSize: 1000,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable/disable specific instrumentations
      "@opentelemetry/instrumentation-fs": {
        enabled: false, // Too noisy
      },
      "@opentelemetry/instrumentation-http": {
        enabled: true,
        requestHook: (span: Span, request: any) => {
          span.setAttribute(
            "http.request.header.user-agent",
            request.headers["user-agent"],
          );
          span.setAttribute(
            "http.request.header.x-correlation-id",
            request.headers["x-correlation-id"],
          );
        },
        responseHook: (span: Span, response: any) => {
          span.setAttribute(
            "http.response.header.content-type",
            response.headers["content-type"],
          );
        },
      },
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-pg": {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
      "@opentelemetry/instrumentation-redis": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-mongodb": {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
    }),
  ],
  textMapPropagator: new W3CTraceContextPropagator(),
});

/**
 * Start OpenTelemetry SDK
 */
export function startTracing() {
  try {
    sdk.start();
    logger.info("OpenTelemetry tracing initialized", {
      service: serviceName,
      version: serviceVersion,
      environment,
      endpoint: otlpEndpoint,
    });
  } catch (error) {
    logger.error("Failed to initialize OpenTelemetry", { error });
  }
}

/**
 * Gracefully shutdown tracing
 */
export async function shutdownTracing() {
  try {
    await sdk.shutdown();
    logger.info("OpenTelemetry tracing shut down gracefully");
  } catch (error) {
    logger.error("Error shutting down OpenTelemetry", { error });
  }
}

/**
 * Get active tracer
 */
export function getTracer(name: string = serviceName) {
  return trace.getTracer(name, serviceVersion);
}

/**
 * Create a span for a function
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, any>,
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Express middleware to create trace for each request
 */
export function tracingMiddleware(req: any, res: any, next: any) {
  const tracer = getTracer();
  const span = tracer.startSpan("http.request", {
    attributes: {
      "http.method": req.method,
      "http.url": req.url,
      "http.target": req.path,
      "http.host": req.hostname,
      "http.scheme": req.protocol,
      "http.user_agent": req.get("user-agent"),
      "http.request_content_length": req.get("content-length"),
    },
  });

  // Store span in request for later use
  req.span = span;

  // Add correlation ID
  const correlationId =
    req.headers["x-correlation-id"] || span.spanContext().traceId;
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  // Set span context
  context.with(trace.setSpan(context.active(), span), () => {
    res.on("finish", () => {
      span.setAttribute("http.status_code", res.statusCode);
      span.setAttribute(
        "http.response_content_length",
        res.get("content-length"),
      );

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    });

    next();
  });
}

/**
 * Add custom event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Add custom attribute to current span
 */
export function addSpanAttribute(key: string, value: any) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

/**
 * Record exception in current span
 */
export function recordSpanException(error: Error) {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Create child span
 */
export async function createChildSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, any>,
): Promise<T> {
  const tracer = getTracer();
  const parentSpan = trace.getActiveSpan();

  if (!parentSpan) {
    return withSpan(name, fn, attributes);
  }

  return tracer.startActiveSpan(
    name,
    { attributes },
    trace.setSpan(context.active(), parentSpan),
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

/**
 * Trace database operation
 */
export async function traceDbOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withSpan(`db.${operation}`, async (span) => {
    span.setAttribute("db.operation", operation);
    span.setAttribute("db.table", table);
    span.setAttribute("db.system", "postgresql");

    return fn();
  });
}

/**
 * Trace external API call
 */
export async function traceApiCall<T>(
  service: string,
  endpoint: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withSpan(`api.${service}`, async (span) => {
    span.setAttribute("peer.service", service);
    span.setAttribute("http.url", endpoint);
    span.setAttribute("span.kind", "client");

    return fn();
  });
}

/**
 * Get current trace ID for logging correlation
 */
export function getCurrentTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

/**
 * Get current span ID
 */
export function getCurrentSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}

export default {
  startTracing,
  shutdownTracing,
  getTracer,
  withSpan,
  tracingMiddleware,
  addSpanEvent,
  addSpanAttribute,
  recordSpanException,
  createChildSpan,
  traceDbOperation,
  traceApiCall,
  getCurrentTraceId,
  getCurrentSpanId,
};
