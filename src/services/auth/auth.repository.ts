/**
 * Authentication Repository
 * Database operations for authentication
 */

import { database } from "../../config/database.config";
import { User, RefreshTokenData } from "../../types";
import {
  CreateUserData,
  CreateRefreshTokenData,
  PasswordResetToken,
  EmailVerificationToken,
  OAuthAccount,
} from "./auth.types";
import { logger } from "../../middleware/logger";

export class AuthRepository {
  /**
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (email, username, password_hash, role, status, email_verified)
      VALUES ($1, $2, $3, $4, 'pending_verification', false)
      RETURNING *
    `;

    const [user] = await database.query<User>(query, [
      data.email,
      data.username,
      data.password_hash,
      data.role || "user",
    ]);

    logger.info("User created", { userId: user.id, email: user.email });
    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1";
    const [user] = await database.query<User>(query, [email]);
    return user || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = $1";
    const [user] = await database.query<User>(query, [id]);
    return user || null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE username = $1";
    const [user] = await database.query<User>(query, [username]);
    return user || null;
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(userId: string): Promise<void> {
    const query = "UPDATE users SET last_login = NOW() WHERE id = $1";
    await database.query(query, [userId]);
  }

  /**
   * Update user's password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query =
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $1";
    await database.query(query, [passwordHash, userId]);
    logger.info("Password updated", { userId });
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET email_verified = true, status = 'active', updated_at = NOW()
      WHERE id = $1
    `;
    await database.query(query, [userId]);
    logger.info("Email verified", { userId });
  }

  /**
   * Create refresh token
   */
  async createRefreshToken(
    data: CreateRefreshTokenData,
  ): Promise<RefreshTokenData> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const [token] = await database.query<RefreshTokenData>(query, [
      data.user_id,
      data.token_hash,
      data.expires_at,
      data.device_info,
    ]);

    return token;
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(tokenHash: string): Promise<RefreshTokenData | null> {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token_hash = $1 AND expires_at > NOW()
    `;
    const [token] = await database.query<RefreshTokenData>(query, [tokenHash]);
    return token || null;
  }

  /**
   * Delete refresh token
   */
  async deleteRefreshToken(tokenHash: string): Promise<void> {
    const query = "DELETE FROM refresh_tokens WHERE token_hash = $1";
    await database.query(query, [tokenHash]);
  }

  /**
   * Delete all user's refresh tokens
   */
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    const query = "DELETE FROM refresh_tokens WHERE user_id = $1";
    await database.query(query, [userId]);
    logger.info("All refresh tokens deleted", { userId });
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const query = `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const [token] = await database.query<PasswordResetToken>(query, [
      userId,
      tokenHash,
      expiresAt,
    ]);

    return token;
  }

  /**
   * Find password reset token
   */
  async findPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    const query = `
      SELECT * FROM password_reset_tokens
      WHERE token_hash = $1 AND expires_at > NOW() AND used = false
    `;
    const [token] = await database.query<PasswordResetToken>(query, [
      tokenHash,
    ]);
    return token || null;
  }

  /**
   * Mark password reset token as used
   */
  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    const query = "UPDATE password_reset_tokens SET used = true WHERE id = $1";
    await database.query(query, [tokenId]);
  }

  /**
   * Create email verification token
   */
  async createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationToken> {
    const query = `
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const [token] = await database.query<EmailVerificationToken>(query, [
      userId,
      tokenHash,
      expiresAt,
    ]);

    return token;
  }

  /**
   * Find email verification token
   */
  async findEmailVerificationToken(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    const query = `
      SELECT * FROM email_verification_tokens
      WHERE token_hash = $1 AND expires_at > NOW() AND used = false
    `;
    const [token] = await database.query<EmailVerificationToken>(query, [
      tokenHash,
    ]);
    return token || null;
  }

  /**
   * Mark email verification token as used
   */
  async markEmailVerificationTokenUsed(tokenId: string): Promise<void> {
    const query =
      "UPDATE email_verification_tokens SET used = true WHERE id = $1";
    await database.query(query, [tokenId]);
  }

  /**
   * Create OAuth account link
   */
  async createOAuthAccount(
    data: Omit<OAuthAccount, "id" | "created_at" | "updated_at">,
  ): Promise<OAuthAccount> {
    const query = `
      INSERT INTO oauth_accounts (
        user_id, provider, provider_account_id, access_token, refresh_token, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const [account] = await database.query<OAuthAccount>(query, [
      data.user_id,
      data.provider,
      data.provider_account_id,
      data.access_token,
      data.refresh_token,
      data.expires_at,
    ]);

    logger.info("OAuth account linked", {
      userId: data.user_id,
      provider: data.provider,
    });

    return account;
  }

  /**
   * Find OAuth account
   */
  async findOAuthAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    const query = `
      SELECT * FROM oauth_accounts
      WHERE provider = $1 AND provider_account_id = $2
    `;
    const [account] = await database.query<OAuthAccount>(query, [
      provider,
      providerAccountId,
    ]);
    return account || null;
  }

  /**
   * Find user by OAuth account
   */
  async findUserByOAuthAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<User | null> {
    const query = `
      SELECT u.* FROM users u
      INNER JOIN oauth_accounts oa ON u.id = oa.user_id
      WHERE oa.provider = $1 AND oa.provider_account_id = $2
    `;
    const [user] = await database.query<User>(query, [
      provider,
      providerAccountId,
    ]);
    return user || null;
  }
}
