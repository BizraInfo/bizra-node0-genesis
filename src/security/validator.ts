/**
 * Input Validation with Joi Schemas
 * Comprehensive validation for all API endpoints
 */

import Joi from "joi";
import { Request, Response, NextFunction } from "express";

/**
 * Validation options
 */
export interface ValidationOptions {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
  abortEarly?: boolean;
  stripUnknown?: boolean;
}

/**
 * Validation middleware factory
 */
export function validate(options: ValidationOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const validationOptions = {
      abortEarly: options.abortEarly ?? false,
      stripUnknown: options.stripUnknown ?? true,
      errors: {
        wrap: {
          label: "",
        },
      },
    };

    try {
      // Validate body
      if (options.body) {
        const { error, value } = options.body.validate(
          req.body,
          validationOptions,
        );
        if (error) {
          res.status(400).json({
            error: "Validation Error",
            message: "Invalid request body",
            details: error.details.map((d) => ({
              field: d.path.join("."),
              message: d.message,
              type: d.type,
            })),
          });
          return;
        }
        req.body = value;
      }

      // Validate query
      if (options.query) {
        const { error, value } = options.query.validate(
          req.query,
          validationOptions,
        );
        if (error) {
          res.status(400).json({
            error: "Validation Error",
            message: "Invalid query parameters",
            details: error.details.map((d) => ({
              field: d.path.join("."),
              message: d.message,
              type: d.type,
            })),
          });
          return;
        }
        req.query = value;
      }

      // Validate params
      if (options.params) {
        const { error, value } = options.params.validate(
          req.params,
          validationOptions,
        );
        if (error) {
          res.status(400).json({
            error: "Validation Error",
            message: "Invalid URL parameters",
            details: error.details.map((d) => ({
              field: d.path.join("."),
              message: d.message,
              type: d.type,
            })),
          });
          return;
        }
        req.params = value;
      }

      // Validate headers
      if (options.headers) {
        const { error, value } = options.headers.validate(
          req.headers,
          validationOptions,
        );
        if (error) {
          res.status(400).json({
            error: "Validation Error",
            message: "Invalid headers",
            details: error.details.map((d) => ({
              field: d.path.join("."),
              message: d.message,
              type: d.type,
            })),
          });
          return;
        }
        req.headers = value;
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Validation processing failed",
      });
    }
  };
}

/**
 * Common validation schemas
 */

// Email validation
export const emailSchema = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(255)
  .required();

// Password validation (strong password requirements)
export const passwordSchema = Joi.string()
  .min(12)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  });

// UUID validation
export const uuidSchema = Joi.string().uuid({ version: "uuidv4" }).required();

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

// Date range schema
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
});

/**
 * User validation schemas
 */

export const registerUserSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be in E.164 format",
    }),
  acceptTerms: Joi.boolean().valid(true).required(),
});

export const loginUserSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional(),
  lastName: Joi.string().trim().min(1).max(50).optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  bio: Joi.string().max(500).optional(),
  avatar: Joi.string().uri().optional(),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
    }),
});

/**
 * API key validation schemas
 */

export const createApiKeySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  permissions: Joi.array().items(Joi.string()).min(1).required(),
  expiresAt: Joi.date().iso().min("now").optional(),
});

/**
 * Content validation schemas
 */

export const createContentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().min(1).max(50000).required(),
  summary: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
  categoryId: uuidSchema,
  status: Joi.string().valid("draft", "published", "archived").default("draft"),
  metadata: Joi.object().optional(),
});

export const updateContentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  body: Joi.string().min(1).max(50000).optional(),
  summary: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
  categoryId: uuidSchema.optional(),
  status: Joi.string().valid("draft", "published", "archived").optional(),
  metadata: Joi.object().optional(),
}).min(1);

/**
 * Search validation schema
 */

export const searchSchema = Joi.object({
  q: Joi.string().trim().min(1).max(200).required(),
  filters: Joi.object().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * File upload validation schema
 */

export const fileUploadSchema = Joi.object({
  filename: Joi.string().trim().min(1).max(255).required(),
  mimetype: Joi.string()
    .valid(
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/json",
    )
    .required(),
  size: Joi.number()
    .integer()
    .min(1)
    .max(10 * 1024 * 1024)
    .required(), // 10MB max
});

/**
 * Webhook validation schema
 */

export const webhookSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
  events: Joi.array().items(Joi.string()).min(1).required(),
  secret: Joi.string().min(32).max(128).required(),
  active: Joi.boolean().default(true),
});

/**
 * Sanitization helpers
 */

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - use a library like DOMPurify for production
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return sanitizeHtml(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

/**
 * SQL injection prevention helper
 */

export function escapeSQL(input: string): string {
  return input.replace(/'/g, "''");
}

/**
 * XSS prevention helper
 */

export function stripScripts(input: string): string {
  return input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
}

/**
 * Validation error handler middleware
 */

export function validationErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err && err.error && err.error.isJoi) {
    res.status(400).json({
      error: "Validation Error",
      message: err.error.message,
      details: err.error.details,
    });
    return;
  }
  next(err);
}
