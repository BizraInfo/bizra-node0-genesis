/**
 * Authentication Routes
 * Route definitions for authentication endpoints
 */

import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.types";

const router = Router();
const controller = new AuthController();

/**
 * Public routes
 */

// Register
router.post("/register", validateBody(registerSchema), controller.register);

// Login
router.post("/login", validateBody(loginSchema), controller.login);

// Refresh token
router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  controller.refreshToken,
);

// Request password reset
router.post(
  "/reset-password/request",
  validateBody(resetPasswordRequestSchema),
  controller.requestPasswordReset,
);

// Reset password
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  controller.resetPassword,
);

// Verify email
router.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  controller.verifyEmail,
);

// OAuth callbacks
router.get("/oauth/google/callback", controller.oauthCallback);
router.get("/oauth/github/callback", controller.oauthCallback);

/**
 * Protected routes (require authentication)
 */

// Get current user
router.get("/me", authenticate, controller.getCurrentUser);

// Logout
router.post("/logout", authenticate, controller.logout);

// Logout from all devices
router.post("/logout-all", authenticate, controller.logoutAll);

// Change password
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  controller.changePassword,
);

export default router;
