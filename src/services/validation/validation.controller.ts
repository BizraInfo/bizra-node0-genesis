/**
 * Validation Controller
 * Request handlers for BIZRA blockchain validation endpoints
 */

import { Response } from "express";
import { ValidationService } from "./validation.service";
import { AuthRequest, ApiResponse } from "../../types";
import { asyncHandler } from "../../middleware/error-handler";

export class ValidationController {
  private service: ValidationService;

  constructor() {
    this.service = new ValidationService();
  }

  /**
   * Validate transaction
   * POST /api/v1/validate/transaction
   */
  validateTransaction = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result = await this.service.validateTransaction(req.body);

      const response: ApiResponse = {
        success: result.valid,
        data: result,
        meta: { requestId: req.requestId },
      };

      res.json(response);
    },
  );

  /**
   * Validate block
   * POST /api/v1/validate/block
   */
  validateBlock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.service.validateBlock(req.body);

    const response: ApiResponse = {
      success: result.valid,
      data: result,
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Validate address
   * POST /api/v1/validate/address
   */
  validateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.service.validateAddress(req.body);

    const response: ApiResponse = {
      success: result.valid,
      data: result,
      meta: { requestId: req.requestId },
    };

    res.json(response);
  });

  /**
   * Get current block number
   * GET /api/v1/validate/block-number
   */
  getCurrentBlockNumber = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const blockNumber = await this.service.getCurrentBlockNumber();

      const response: ApiResponse = {
        success: true,
        data: { blockNumber },
        meta: { requestId: req.requestId },
      };

      res.json(response);
    },
  );
}
