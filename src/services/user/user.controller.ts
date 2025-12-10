/**
 * User Controller
 * Request handlers for user management endpoints
 */

import { Response } from "express";
import { UserService } from "./user.service";
import { AuthRequest, ApiResponse } from "../../types";
import { asyncHandler } from "../../middleware/error-handler";

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await this.service.getUserById(req.user!.userId);

    const response: ApiResponse = {
      success: true,
      data: { profile },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Update current user profile
   * PATCH /api/v1/users/me
   */
  updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await this.service.updateUser(req.user!.userId, req.body);

    const response: ApiResponse = {
      success: true,
      data: { profile },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Get user by ID
   * GET /api/v1/users/:userId
   */
  getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await this.service.getUserById(req.params.userId);

    const response: ApiResponse = {
      success: true,
      data: { profile },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Get all users (paginated)
   * GET /api/v1/users
   */
  getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.service.getUsers(req.query as any);

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: {
        requestId: req.requestId,
        pagination: result.pagination,
      },
    };

    res.json(response);
  });

  /**
   * Update user role
   * PATCH /api/v1/users/:userId/role
   */
  updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await this.service.updateUserRole(
      req.params.userId,
      req.body,
    );

    const response: ApiResponse = {
      success: true,
      data: { profile },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Update user status
   * PATCH /api/v1/users/:userId/status
   */
  updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await this.service.updateUserStatus(
      req.params.userId,
      req.body,
    );

    const response: ApiResponse = {
      success: true,
      data: { profile },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Delete user
   * DELETE /api/v1/users/:userId
   */
  deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.service.deleteUser(req.params.userId);

    const response: ApiResponse = {
      success: true,
      data: { message: "User deleted successfully" },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Get user statistics
   * GET /api/v1/users/stats
   */
  getStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await this.service.getStatistics();

    const response: ApiResponse = {
      success: true,
      data: { statistics: stats },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Get recently active users
   * GET /api/v1/users/recent
   */
  getRecentlyActive = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const users = await this.service.getRecentlyActive(limit);

    const response: ApiResponse = {
      success: true,
      data: { users },
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });
}
