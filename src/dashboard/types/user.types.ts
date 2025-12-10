export enum UserRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
  VIEWER = "viewer",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  permissions?: string[];
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "username" | "email" | "lastLogin";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
