/**
 * Structured Logging Configuration
 * Production-grade logging with Winston and Pino integration
 * @module observability/logger
 */

import winston from "winston";
import { trace, context } from "@opentelemetry/api";

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
  trace: "gray",
};

winston.addColors(colors);

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const span = trace.getSpan(context.active());
    const spanContext = span?.spanContext();

    const baseLog = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: process.env.SERVICE_NAME || "bizra-api",
      environment: process.env.NODE_ENV || "development",
      ...(spanContext && {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
        trace_flags: spanContext.traceFlags,
      }),
      ...info,
    };

    // Remove duplicate fields
    delete baseLog.timestamp;

    return JSON.stringify(baseLog);
  }),
);

// Development format with colors
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : "";
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  }),
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === "production"
        ? productionFormat
        : developmentFormat,
  }),
];

// Production transports
if (process.env.NODE_ENV === "production") {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: productionFormat,
    }),
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: productionFormat,
    }),
  );

  // HTTP log file
  transports.push(
    new winston.transports.File({
      filename: "logs/http.log",
      level: "http",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: productionFormat,
    }),
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  transports,
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log with structured context
 */
export function logWithContext(
  level: keyof typeof levels,
  message: string,
  context?: Record<string, any>,
) {
  const span = trace.getSpan(
    trace.setSpan(context.active(), trace.getActiveSpan()),
  );

  logger.log(level, message, {
    ...context,
    span_id: span?.spanContext().spanId,
    trace_id: span?.spanContext().traceId,
  });
}

/**
 * Express middleware for HTTP logging
 */
export function httpLogger(req: any, res: any, next: any) {
  const startTime = Date.now();

  // Log request
  logger.http("Incoming request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    user_agent: req.get("user-agent"),
    correlation_id: req.headers["x-correlation-id"],
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.http("Request completed", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration_ms: duration,
      correlation_id: req.headers["x-correlation-id"],
    });
  });

  next();
}

/**
 * Error logger middleware
 */
export function errorLogger(err: Error, req: any, res: any, next: any) {
  logger.error("Request error", {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    },
  });

  next(err);
}

/**
 * Performance logger
 */
export class PerformanceLogger {
  private startTime: number;
  private checkpoints: Map<string, number>;

  constructor(private operation: string) {
    this.startTime = Date.now();
    this.checkpoints = new Map();
  }

  checkpoint(name: string) {
    this.checkpoints.set(name, Date.now());
  }

  end(context?: Record<string, any>) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const checkpoints: Record<string, number> = {};
    this.checkpoints.forEach((time, name) => {
      checkpoints[name] = time - this.startTime;
    });

    logger.info(`Performance: ${this.operation}`, {
      duration_ms: duration,
      checkpoints,
      ...context,
    });

    return duration;
  }
}

/**
 * Business event logger
 */
export function logBusinessEvent(
  event: string,
  data: Record<string, any>,
  userId?: string,
) {
  logger.info("Business event", {
    event_type: "business",
    event_name: event,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Security event logger
 */
export function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  data: Record<string, any>,
) {
  logger.warn("Security event", {
    event_type: "security",
    event_name: event,
    severity,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export default logger;
