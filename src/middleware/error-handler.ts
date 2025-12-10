/**
 * Error Handler Middleware
 * Centralized error handling with proper logging and responses
 */

import { Request, Response, NextFunction } from "express";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ApiResponse,
} from "../types";
import { logger } from "./logger";
import { config } from "../config/app.config";
import { ZodError } from "zod";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = (req as any).requestId;

  // Log error
  logger.error("Request error", {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: config.app.isDevelopment ? err.stack : undefined,
    },
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(
      "Request validation failed",
      err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    );

    sendErrorResponse(res, validationError, requestId);
    return;
  }

  // Handle known application errors
  if (err instanceof AppError) {
    sendErrorResponse(res, err, requestId);
    return;
  }

  // Handle specific error types
  if (err.name === "UnauthorizedError") {
    const authError = new AuthenticationError("Invalid or expired token");
    sendErrorResponse(res, authError, requestId);
    return;
  }

  if (err.name === "JsonWebTokenError") {
    const authError = new AuthenticationError("Invalid token");
    sendErrorResponse(res, authError, requestId);
    return;
  }

  if (err.name === "TokenExpiredError") {
    const authError = new AuthenticationError("Token expired");
    sendErrorResponse(res, authError, requestId);
    return;
  }

  // Database errors
  if (err.name === "QueryFailedError" || (err as any).code?.startsWith("23")) {
    const dbError = new ConflictError("Database constraint violation");
    sendErrorResponse(res, dbError, requestId);
    return;
  }

  // Default to internal server error
  const internalError = new InternalServerError(
    config.app.isDevelopment ? err.message : "An unexpected error occurred",
  );

  sendErrorResponse(res, internalError, requestId);
};

/**
 * Send formatted error response
 */
const sendErrorResponse = (
  res: Response,
  error: AppError,
  requestId?: string,
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: config.app.isDevelopment ? error.details : undefined,
      stack: config.app.isDevelopment ? error.stack : undefined,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(error.statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const error = new NotFoundError("Route");
  next(error);
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error helper
 */
export const throwValidationError = (message: string, details?: any): never => {
  throw new ValidationError(message, details);
};

/**
 * Not found error helper
 */
export const throwNotFoundError = (resource: string = "Resource"): never => {
  throw new NotFoundError(resource);
};

/**
 * Authorization error helper
 */
export const throwAuthorizationError = (message?: string): never => {
  throw new AuthorizationError(message);
};

/**
 * Authentication error helper
 */
export const throwAuthenticationError = (message?: string): never => {
  throw new AuthenticationError(message);
};

/**
 * Conflict error helper
 */
export const throwConflictError = (message?: string): never => {
  throw new ConflictError(message);
};

/**
 * Process-level error handlers
 */
export const setupProcessErrorHandlers = (): void => {
  // Unhandled promise rejections
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("Unhandled Promise Rejection", {
      reason: reason?.message || reason,
      stack: reason?.stack,
    });

    if (!config.app.isDevelopment) {
      process.exit(1);
    }
  });

  // Uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    process.exit(1);
  });

  // SIGTERM signal
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
  });

  // SIGINT signal (Ctrl+C)
  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
  });
};
