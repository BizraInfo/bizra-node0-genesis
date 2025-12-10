/**
 * Validation Routes
 * Route definitions for BIZRA blockchain validation endpoints
 */

import { Router } from "express";
import { ValidationController } from "./validation.controller";
import {
  authenticate,
  optionalAuthenticate,
} from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import {
  validateTransactionSchema,
  validateBlockSchema,
  validateAddressSchema,
} from "./validation.types";

const router = Router();
const controller = new ValidationController();

/**
 * Public routes (optional auth for rate limiting)
 */

// Validate transaction
router.post(
  "/transaction",
  optionalAuthenticate,
  validateBody(validateTransactionSchema),
  controller.validateTransaction,
);

// Validate block
router.post(
  "/block",
  optionalAuthenticate,
  validateBody(validateBlockSchema),
  controller.validateBlock,
);

// Validate address
router.post(
  "/address",
  optionalAuthenticate,
  validateBody(validateAddressSchema),
  controller.validateAddress,
);

// Get current block number
router.get(
  "/block-number",
  optionalAuthenticate,
  controller.getCurrentBlockNumber,
);

export default router;
