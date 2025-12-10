/**
 * Shared TypeScript Types and Interfaces
 */

import { Request } from "express";

// ============= User Types =============

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator",
  GUEST = "guest",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  created_at: Date;
  last_login?: Date;
}

// ============= Authentication Types =============

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenData {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  last_used_at?: Date;
  device_info?: string;
}

export interface OAuthProfile {
  provider: "google" | "github";
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

// ============= Request Types =============

export interface AuthRequest extends Request {
  user?: TokenPayload;
  requestId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============= BIZRA Blockchain Types =============

export interface BizraTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  status: "pending" | "confirmed" | "failed";
}

export interface ValidationRequest {
  txHash: string;
  networkId?: string;
}

export interface ValidationResult {
  valid: boolean;
  transaction?: BizraTransaction;
  error?: string;
  validatedAt: Date;
}

// ============= API Response Types =============

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// ============= Error Types =============

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(401, "AUTHENTICATION_ERROR", message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(403, "AUTHORIZATION_ERROR", message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(429, "RATE_LIMIT_EXCEEDED", "Too many requests", { retryAfter });
    this.name = "RateLimitError";
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(500, "INTERNAL_ERROR", message);
    this.name = "InternalServerError";
  }
}

// ============= Service Response Types =============

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============= Health Check Types =============

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    bizra: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: "up" | "down";
  responseTime?: number;
  error?: string;
}

// ============= Configuration Types =============

export interface DatabaseConfig {
  url: string;
  pool: {
    min: number;
    max: number;
  };
}

export interface RedisConfig {
  url: string;
  password?: string;
  db: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}
