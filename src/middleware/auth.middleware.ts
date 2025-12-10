/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/app.config";
import { redis, cacheKeys } from "../config/redis.config";
import {
  AuthRequest,
  TokenPayload,
  UserRole,
  AuthenticationError,
  AuthorizationError,
} from "../types";
import { logger } from "./logger";

/**
 * Verify JWT access token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(
      token,
      config.security.jwt.secret,
    ) as TokenPayload;

    // Check token type
    if (decoded.type !== "access") {
      throw new AuthenticationError("Invalid token type");
    }

    // Check if token is blacklisted (logout)
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError("Token has been revoked");
    }

    // Attach user to request
    req.user = decoded;
    req.requestId = (req as any).requestId;

    logger.debug("User authenticated", {
      requestId: req.requestId,
      userId: decoded.userId,
      role: decoded.role,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError("Token expired"));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      config.security.jwt.secret,
    ) as TokenPayload;

    if (decoded.type === "access") {
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (!isBlacklisted) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

/**
 * Role-based authorization
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError("Not authenticated");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Requires one of roles: ${allowedRoles.join(", ")}`,
        );
      }

      logger.debug("User authorized", {
        requestId: req.requestId,
        userId: req.user.userId,
        role: req.user.role,
        allowedRoles,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require admin role
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * Require moderator or admin role
 */
export const requireModerator = authorize(UserRole.MODERATOR, UserRole.ADMIN);

/**
 * Self or admin authorization
 * Allows users to access their own resources or admins to access any
 */
export const selfOrAdmin = (userIdParam: string = "userId") => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError("Not authenticated");
      }

      const targetUserId = req.params[userIdParam];
      const isSelf = req.user.userId === targetUserId;
      const isAdmin = req.user.role === UserRole.ADMIN;

      if (!isSelf && !isAdmin) {
        throw new AuthorizationError("Cannot access other user resources");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError("Refresh token required");
    }

    // Verify token signature
    const decoded = jwt.verify(
      refreshToken,
      config.security.refreshToken.secret,
    ) as TokenPayload;

    // Check token type
    if (decoded.type !== "refresh") {
      throw new AuthenticationError("Invalid token type");
    }

    // Check if token exists in cache
    const cachedToken = await redis.get(cacheKeys.refreshToken(refreshToken));

    if (!cachedToken) {
      throw new AuthenticationError("Refresh token not found or expired");
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid refresh token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError("Refresh token expired"));
    } else {
      next(error);
    }
  }
};

/**
 * API key authentication (for service-to-service)
 */
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new AuthenticationError("API key required");
    }

    // Verify API key (implement your own logic)
    const isValid = await verifyApiKey(apiKey);

    if (!isValid) {
      throw new AuthenticationError("Invalid API key");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Verify API key
 */
const verifyApiKey = async (apiKey: string): Promise<boolean> => {
  // TODO: Implement API key verification logic
  // This could check against a database or cache
  return true;
};

/**
 * Extract user ID from request
 */
export const getUserId = (req: AuthRequest): string => {
  if (!req.user) {
    throw new AuthenticationError("Not authenticated");
  }
  return req.user.userId;
};

/**
 * Check if user has role
 */
export const hasRole = (req: AuthRequest, role: UserRole): boolean => {
  return req.user?.role === role;
};

/**
 * Check if user is admin
 */
export const isAdmin = (req: AuthRequest): boolean => {
  return hasRole(req, UserRole.ADMIN);
};
