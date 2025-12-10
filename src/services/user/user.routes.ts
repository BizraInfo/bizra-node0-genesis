/**
 * User Routes
 * Route definitions for user management endpoints
 */

import { Router } from "express";
import { UserController } from "./user.controller";
import {
  authenticate,
  requireAdmin,
  requireModerator,
  selfOrAdmin,
} from "../../middleware/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import {
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from "./user.types";

const router = Router();
const controller = new UserController();

/**
 * Current user routes
 */

// Get current user profile
router.get("/me", authenticate, controller.getMyProfile);

// Update current user profile
router.patch(
  "/me",
  authenticate,
  validateBody(updateUserSchema),
  controller.updateMyProfile,
);

/**
 * Admin/Moderator routes
 */

// Get user statistics (admin only)
router.get("/stats", authenticate, requireAdmin, controller.getStatistics);

// Get recently active users (moderator+)
router.get(
  "/recent",
  authenticate,
  requireModerator,
  controller.getRecentlyActive,
);

// Get all users (moderator+)
router.get(
  "/",
  authenticate,
  requireModerator,
  validateQuery(getUsersQuerySchema),
  controller.getUsers,
);

/**
 * User-specific routes
 */

// Get user by ID (self or moderator+)
router.get(
  "/:userId",
  authenticate,
  validateParams(userIdParamSchema),
  controller.getUserById,
);

// Update user role (admin only)
router.patch(
  "/:userId/role",
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  controller.updateUserRole,
);

// Update user status (admin only)
router.patch(
  "/:userId/status",
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  controller.updateUserStatus,
);

// Delete user (admin only)
router.delete(
  "/:userId",
  authenticate,
  requireAdmin,
  validateParams(userIdParamSchema),
  controller.deleteUser,
);

export default router;
