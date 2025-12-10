/**
 * User Service Types
 */

import { z } from "zod";
import { UserRole, UserStatus } from "../../types";

// ============= Validation Schemas =============

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().optional(),
});

export const getUsersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().positive().max(100))
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "username", "email", "last_login"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

// ============= Type Exports =============

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

// ============= Repository Types =============

export interface UserFilter {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface UserSort {
  sortBy: "created_at" | "username" | "email" | "last_login";
  sortOrder: "asc" | "desc";
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingVerification: number;
  byRole: Record<UserRole, number>;
}
