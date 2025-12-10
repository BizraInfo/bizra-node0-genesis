/**
 * Authentication Controller
 * Request handlers for authentication endpoints
 */

import { Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { AuthRequest, ApiResponse } from "../../types";
import { asyncHandler } from "../../middleware/error-handler";
import { logger } from "../../middleware/logger";

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.service.register(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      meta: {
        requestId: req.requestId,
      },
    };

    res.status(201).json(response);
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.service.login(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await this.service.refreshAccessToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      data: { tokens },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const accessToken = req.headers.authorization?.substring(7) || "";
    const { refreshToken } = req.body;

    await this.service.logout(accessToken, refreshToken);

    const response: ApiResponse = {
      success: true,
      data: { message: "Logged out successfully" },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Logout from all devices
   * POST /api/v1/auth/logout-all
   */
  logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.service.logoutAll(req.user!.userId);

    const response: ApiResponse = {
      success: true,
      data: { message: "Logged out from all devices" },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.service.changePassword(req.user!.userId, req.body);

    const response: ApiResponse = {
      success: true,
      data: { message: "Password changed successfully" },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Request password reset
   * POST /api/v1/auth/reset-password/request
   */
  requestPasswordReset = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      await this.service.requestPasswordReset(req.body.email);

      const response: ApiResponse = {
        success: true,
        data: { message: "Password reset email sent if account exists" },
        meta: {
          requestId: req.requestId,
        },
      };

      res.json(response);
    },
  );

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.service.resetPassword(req.body);

    const response: ApiResponse = {
      success: true,
      data: { message: "Password reset successfully" },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.service.verifyEmail(req.body.token);

    const response: ApiResponse = {
      success: true,
      data: { message: "Email verified successfully" },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          userId: req.user!.userId,
          email: req.user!.email,
          role: req.user!.role,
        },
      },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });

  /**
   * OAuth callback handler
   * GET /api/v1/auth/oauth/:provider/callback
   */
  oauthCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
    // This would be implemented with OAuth provider SDKs
    // For now, it's a placeholder

    const response: ApiResponse = {
      success: true,
      data: { message: "OAuth not yet implemented" },
      meta: {
        requestId: req.requestId,
      },
    };

    res.json(response);
  });
}
