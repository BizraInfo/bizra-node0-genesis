/**
 * JWT Authentication Strategy with RS256
 * Implements military-grade authentication with token rotation
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  tokenId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  refreshId: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface TokenMetadata {
  tokenId: string;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
  refreshTokenId?: string;
  revoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

/**
 * JWT Authentication Strategy
 * Zero-trust implementation with RS256 asymmetric encryption
 */
export class AuthStrategy {
  private privateKey: Buffer;
  private publicKey: Buffer;
  private tokenStore: Map<string, TokenMetadata> = new Map();
  private revokedTokens: Set<string> = new Set();
  private readonly algorithm = "RS256";
  private readonly accessTokenExpiry = "15m"; // 15 minutes
  private readonly refreshTokenExpiry = "7d"; // 7 days
  private readonly issuer = "bizra-secure-api";
  private readonly audience = "bizra-clients";

  constructor() {
    this.loadOrGenerateKeyPair();
  }

  /**
   * Load or generate RSA key pair for JWT signing
   */
  private loadOrGenerateKeyPair(): void {
    const keyDir = path.join(process.cwd(), "config", "security", "keys");
    const privateKeyPath = path.join(keyDir, "private.pem");
    const publicKeyPath = path.join(keyDir, "public.pem");

    try {
      // Try to load existing keys
      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        this.privateKey = fs.readFileSync(privateKeyPath);
        this.publicKey = fs.readFileSync(publicKeyPath);
        console.log("✅ Loaded existing RSA key pair");
      } else {
        // Generate new key pair
        this.generateKeyPair(keyDir, privateKeyPath, publicKeyPath);
      }
    } catch (error) {
      console.error("❌ Error loading keys:", error);
      throw new Error("Failed to initialize authentication keys");
    }
  }

  /**
   * Generate new RSA key pair
   */
  private generateKeyPair(
    keyDir: string,
    privateKeyPath: string,
    publicKeyPath: string,
  ): void {
    console.log("🔐 Generating new RSA key pair (4096-bit)...");

    // Create directory if it doesn't exist
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
    }

    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase:
          process.env.KEY_PASSPHRASE || "default-passphrase-change-me",
      },
    });

    this.privateKey = Buffer.from(privateKey);
    this.publicKey = Buffer.from(publicKey);

    // Save keys with restricted permissions
    fs.writeFileSync(privateKeyPath, this.privateKey, { mode: 0o600 });
    fs.writeFileSync(publicKeyPath, this.publicKey, { mode: 0o644 });

    console.log("✅ Generated and saved new RSA key pair");
  }

  /**
   * Generate access and refresh token pair
   */
  public async generateTokenPair(
    userId: string,
    email: string,
    roles: string[],
    permissions: string[],
  ): Promise<TokenPair> {
    const tokenId = crypto.randomUUID();
    const refreshId = crypto.randomUUID();

    // Generate access token
    const accessPayload: Partial<JWTPayload> = {
      userId,
      email,
      roles,
      permissions,
      tokenId,
      iss: this.issuer,
      aud: this.audience,
    };

    const accessToken = jwt.sign(accessPayload, this.privateKey, {
      algorithm: this.algorithm,
      expiresIn: this.accessTokenExpiry,
    });

    // Generate refresh token
    const refreshPayload: Partial<RefreshTokenPayload> = {
      userId,
      tokenId,
      refreshId,
    };

    const refreshToken = jwt.sign(refreshPayload, this.privateKey, {
      algorithm: this.algorithm,
      expiresIn: this.refreshTokenExpiry,
    });

    // Store token metadata
    const now = new Date();
    const accessExpiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.tokenStore.set(tokenId, {
      tokenId,
      userId,
      issuedAt: now,
      expiresAt: accessExpiry,
      refreshTokenId: refreshId,
      revoked: false,
    });

    this.tokenStore.set(refreshId, {
      tokenId: refreshId,
      userId,
      issuedAt: now,
      expiresAt: refreshExpiry,
      revoked: false,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // seconds
      refreshExpiresIn: 7 * 24 * 60 * 60, // seconds
    };
  }

  /**
   * Verify and decode JWT token
   */
  public async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience,
      }) as JWTPayload;

      // Check if token is revoked
      if (this.revokedTokens.has(decoded.tokenId)) {
        throw new Error("Token has been revoked");
      }

      // Check token metadata
      const metadata = this.tokenStore.get(decoded.tokenId);
      if (metadata && metadata.revoked) {
        throw new Error("Token has been revoked");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expired");
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, this.publicKey, {
        algorithms: [this.algorithm],
      }) as RefreshTokenPayload;

      // Check if refresh token is revoked
      if (this.revokedTokens.has(decoded.refreshId)) {
        throw new Error("Refresh token has been revoked");
      }

      // Get user info from original token
      const metadata = this.tokenStore.get(decoded.tokenId);
      if (!metadata) {
        throw new Error("Token metadata not found");
      }

      // Revoke old tokens
      this.revokeToken(decoded.tokenId, "Token rotation");
      this.revokeToken(decoded.refreshId, "Token rotation");

      // Generate new token pair
      // Note: You'll need to fetch user roles and permissions from database
      // This is a placeholder - implement based on your user model
      return await this.generateTokenPair(
        decoded.userId,
        "user@example.com", // Fetch from database
        ["user"], // Fetch from database
        [], // Fetch from database
      );
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Revoke a token
   */
  public revokeToken(
    tokenId: string,
    reason: string = "Manual revocation",
  ): void {
    this.revokedTokens.add(tokenId);

    const metadata = this.tokenStore.get(tokenId);
    if (metadata) {
      metadata.revoked = true;
      metadata.revokedAt = new Date();
      metadata.revokedReason = reason;
    }
  }

  /**
   * Revoke all tokens for a user
   */
  public revokeUserTokens(
    userId: string,
    reason: string = "User logout",
  ): void {
    for (const [tokenId, metadata] of this.tokenStore.entries()) {
      if (metadata.userId === userId && !metadata.revoked) {
        this.revokeToken(tokenId, reason);
      }
    }
  }

  /**
   * Cleanup expired tokens
   */
  public cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [tokenId, metadata] of this.tokenStore.entries()) {
      if (metadata.expiresAt < now) {
        this.tokenStore.delete(tokenId);
        this.revokedTokens.delete(tokenId);
      }
    }
  }

  /**
   * Express middleware for JWT authentication
   */
  public authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error: "Unauthorized",
          message: "No token provided",
        });
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.verifyToken(token);

      // Attach user info to request
      (req as any).user = payload;
      next();
    } catch (error) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          error instanceof Error ? error.message : "Authentication failed",
      });
    }
  };
}

// Singleton instance
export const authStrategy = new AuthStrategy();

// Cleanup interval tracking (for lifecycle management)
let cleanupInterval: NodeJS.Timeout | undefined;

/**
 * Initialize token cleanup schedule
 * Call this explicitly after authStrategy is configured
 * Returns the interval ID for cleanup in tests
 */
export function initAuthCleanup(): NodeJS.Timeout {
  if (cleanupInterval) {
    return cleanupInterval;
  }

  cleanupInterval = setInterval(
    () => {
      authStrategy.cleanupExpiredTokens();
    },
    60 * 60 * 1000,
  );

  return cleanupInterval;
}

/**
 * Stop auth cleanup (for tests and graceful shutdown)
 */
export function stopAuthCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = undefined;
  }
}
