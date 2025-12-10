/**
 * Logging Middleware
 * Winston-based structured logging with request tracking
 */

import winston from "winston";
import { Request, Response, NextFunction } from "express";
import { config } from "../config/app.config";
import { v4 as uuidv4 } from "uuid";

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log level colors
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// Format for development (pretty)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} [${info.level}]: ${info.message} ${
        Object.keys(info).length > 3 ? JSON.stringify(info, null, 2) : ""
      }`,
  ),
);

// Format for production (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: config.logging.format === "pretty" ? devFormat : prodFormat,
  defaultMeta: { service: "bizra-backend" },
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

// Add file transports in production
if (config.app.isProduction) {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );

  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

/**
 * Request ID middleware
 * Assigns unique ID to each request
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
};

/**
 * HTTP Request Logger Middleware
 * Logs all incoming requests with timing
 */
export const httpLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  const requestId = (req as any).requestId;

  // Log request
  logger.http("Incoming request", {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - start;

    logger.http("Request completed", {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Create child logger with context
 */
export const createContextLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

/**
 * Log async errors
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error("Error occurred", {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

/**
 * Performance logging wrapper
 */
export const logPerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>,
): Promise<T> => {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    logger.debug("Operation completed", {
      operation,
      duration: `${duration}ms`,
      ...context,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    logger.error("Operation failed", {
      operation,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
      ...context,
    });

    throw error;
  }
};

/**
 * Stream for Morgan HTTP logger (if needed)
 */
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
