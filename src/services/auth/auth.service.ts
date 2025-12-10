/**
 * Authentication Service
 * Business logic for authentication operations
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../../config/app.config";
import { redis, cacheKeys } from "../../config/redis.config";
import { AuthRepository } from "./auth.repository";
import {
  User,
  AuthTokens,
  TokenPayload,
  UserRole,
  OAuthProfile,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../types";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from "./auth.types";
import { logger } from "../../middleware/logger";

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  /**
   * Register new user
   */
  async register(
    input: RegisterInput,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if email already exists
    const existingEmail = await this.repository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError("Email already registered");
    }

    // Check if username already exists
    const existingUsername = await this.repository.findByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new ConflictError("Username already taken");
    }

    // Hash password
    const passwordHash = await this.hashPassword(input.password);

    // Create user
    const user = await this.repository.createUser({
      email: input.email,
      username: input.username,
      password_hash: passwordHash,
    });

    // Generate email verification token
    await this.generateEmailVerificationToken(user.id);

    // Generate auth tokens
    const tokens = await this.generateTokens(user);

    logger.info("User registered", { userId: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = await this.repository.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(
      input.password,
      user.password_hash,
    );
    if (!isValidPassword) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if user is active
    if (user.status === "suspended") {
      throw new AuthenticationError("Account suspended");
    }

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Generate auth tokens
    const tokens = await this.generateTokens(user, input.deviceInfo);

    logger.info("User logged in", { userId: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        config.security.refreshToken.secret,
      ) as TokenPayload;
    } catch (error) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Check if token exists in cache
    const tokenHash = this.hashToken(refreshToken);
    const cachedToken = await redis.get(cacheKeys.refreshToken(tokenHash));

    if (!cachedToken) {
      throw new AuthenticationError("Refresh token not found or expired");
    }

    // Get user
    const user = await this.repository.findById(decoded.userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Delete old refresh token
    await redis.del(cacheKeys.refreshToken(tokenHash));

    logger.info("Access token refreshed", { userId: user.id });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    // Blacklist access token
    const decoded = jwt.decode(accessToken) as TokenPayload;
    const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

    if (ttl > 0) {
      await redis.set(`blacklist:${accessToken}`, "1", ttl);
    }

    // Delete refresh token if provided
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await redis.del(cacheKeys.refreshToken(tokenHash));
    }

    logger.info("User logged out", { userId: decoded.userId });
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    // Delete all refresh tokens from database
    await this.repository.deleteUserRefreshTokens(userId);

    // Clear user cache
    await redis.del(cacheKeys.user(userId));

    logger.info("User logged out from all devices", { userId });
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Verify current password
    const isValid = await this.verifyPassword(
      input.currentPassword,
      user.password_hash,
    );
    if (!isValid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(input.newPassword);

    // Update password
    await this.repository.updatePassword(userId, newPasswordHash);

    // Logout from all devices
    await this.logoutAll(userId);

    logger.info("Password changed", { userId });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.repository.createPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    // TODO: Send reset email with resetToken
    logger.info("Password reset requested", { userId: user.id, email });
  }

  /**
   * Reset password
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = this.hashToken(input.token);
    const resetToken = await this.repository.findPasswordResetToken(tokenHash);

    if (!resetToken) {
      throw new AuthenticationError("Invalid or expired reset token");
    }

    // Hash new password
    const passwordHash = await this.hashPassword(input.newPassword);

    // Update password
    await this.repository.updatePassword(resetToken.user_id, passwordHash);

    // Mark token as used
    await this.repository.markPasswordResetTokenUsed(resetToken.id);

    // Logout from all devices
    await this.logoutAll(resetToken.user_id);

    logger.info("Password reset", { userId: resetToken.user_id });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const verificationToken =
      await this.repository.findEmailVerificationToken(tokenHash);

    if (!verificationToken) {
      throw new AuthenticationError("Invalid or expired verification token");
    }

    // Verify email
    await this.repository.verifyEmail(verificationToken.user_id);

    // Mark token as used
    await this.repository.markEmailVerificationTokenUsed(verificationToken.id);

    logger.info("Email verified", { userId: verificationToken.user_id });
  }

  /**
   * OAuth login/register
   */
  async oauthLogin(
    profile: OAuthProfile,
  ): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
    // Check if OAuth account exists
    let user = await this.repository.findUserByOAuthAccount(
      profile.provider,
      profile.providerId,
    );
    let isNewUser = false;

    if (!user) {
      // Check if user exists with this email
      user = await this.repository.findByEmail(profile.email);

      if (!user) {
        // Create new user
        const username =
          profile.email.split("@")[0] +
          "_" +
          crypto.randomBytes(4).toString("hex");
        const randomPassword = crypto.randomBytes(32).toString("hex");

        user = await this.repository.createUser({
          email: profile.email,
          username,
          password_hash: await this.hashPassword(randomPassword),
        });

        // Auto-verify email for OAuth users
        await this.repository.verifyEmail(user.id);

        isNewUser = true;
      }

      // Link OAuth account
      await this.repository.createOAuthAccount({
        user_id: user.id,
        provider: profile.provider,
        provider_account_id: profile.providerId,
      });
    }

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    logger.info("OAuth login", {
      userId: user.id,
      provider: profile.provider,
      isNewUser,
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      isNewUser,
    };
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    user: User,
    deviceInfo?: string,
  ): Promise<AuthTokens> {
    const payload: Omit<TokenPayload, "iat" | "exp"> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: "access",
    };

    // Generate access token
    const accessToken = jwt.sign(
      { ...payload, type: "access" },
      config.security.jwt.secret,
      { expiresIn: config.security.jwt.expiresIn },
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { ...payload, type: "refresh" },
      config.security.refreshToken.secret,
      { expiresIn: config.security.refreshToken.expiresIn },
    );

    // Store refresh token in cache and database
    const tokenHash = this.hashToken(refreshToken);
    const expiresIn = this.parseExpiry(config.security.refreshToken.expiresIn);

    await redis.set(cacheKeys.refreshToken(tokenHash), user.id, expiresIn);

    await this.repository.createRefreshToken({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + expiresIn * 1000),
      device_info: deviceInfo,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(config.security.jwt.expiresIn),
    };
  }

  /**
   * Generate email verification token
   */
  private async generateEmailVerificationToken(
    userId: string,
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours

    await this.repository.createEmailVerificationToken(
      userId,
      tokenHash,
      expiresAt,
    );

    // TODO: Send verification email with token
    return token;
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, config.security.bcryptRounds);
  }

  /**
   * Verify password
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        return 900; // 15 minutes default
    }
  }

  /**
   * Sanitize user data
   */
  private sanitizeUser(user: User): User {
    const { password_hash, ...sanitized } = user as any;
    return sanitized;
  }
}
