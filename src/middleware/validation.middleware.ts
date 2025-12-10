/**
 * Validation Middleware
 * Zod-based request validation
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../types";

/**
 * Validate request body
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError("Invalid request body", formatZodErrors(error)),
        );
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request query parameters
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            "Invalid query parameters",
            formatZodErrors(error),
          ),
        );
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request params
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError("Invalid URL parameters", formatZodErrors(error)),
        );
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate entire request (body, query, params)
 */
export const validateRequest = <T>(schemas: {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            "Request validation failed",
            formatZodErrors(error),
          ),
        );
      } else {
        next(error);
      }
    }
  };
};

/**
 * Format Zod errors into readable format
 */
const formatZodErrors = (error: ZodError) => {
  return error.errors.map((err) => ({
    field: err.path.join(".") || "root",
    message: err.message,
    code: err.code,
  }));
};

/**
 * Sanitize input
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Remove any potential XSS vectors
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query) as any;
  }
  next();
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj: any): any => {
  if (typeof obj === "string") {
    return obj
      .replace(/[<>]/g, "") // Remove < and > to prevent basic XSS
      .trim();
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};
