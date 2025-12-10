/**
 * Authentication Service Types
 */

import { z } from "zod";
import { UserRole } from "../../types";

// ============= Validation Schemas =============

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  deviceInfo: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional(),
});

// ============= Type Exports =============

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

// ============= Repository Types =============

export interface CreateUserData {
  email: string;
  username: string;
  password_hash: string;
  role?: UserRole;
}

export interface CreateRefreshTokenData {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  device_info?: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: "google" | "github";
  provider_account_id: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}
