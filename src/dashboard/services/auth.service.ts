import { jwtDecode } from "jwt-decode";
import apiService from "./api.service";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AuthTokens,
  User,
  PasswordChangeRequest,
} from "../types/user.types";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

class AuthServiceClass {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      "/auth/login",
      credentials,
    );
    this.setTokens(response.tokens);
    this.setUser(response.user);
    return response;
  }

  // Register
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      "/auth/register",
      data,
    );
    this.setTokens(response.tokens);
    this.setUser(response.user);
    return response;
  }

  // Logout
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Call logout endpoint to invalidate refresh token
    apiService.post("/auth/logout").catch(() => {
      // Silent fail on logout endpoint
    });
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await apiService.post<AuthTokens>("/auth/refresh", {
        refreshToken,
      });

      this.setTokens(response);
      return response.accessToken;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }

  // Update current user in storage
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Set tokens
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  // Decode JWT token
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwtDecode<JWTPayload>(token);
    } catch {
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    return new Date(decoded.exp * 1000);
  }

  // Change password
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    await apiService.post("/auth/change-password", data);
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    await apiService.post("/auth/forgot-password", { email });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiService.post("/auth/reset-password", { token, newPassword });
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    await apiService.post("/auth/verify-email", { token });
  }

  // Check permissions
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  // Check role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

export const AuthService = new AuthServiceClass();
export default AuthService;
