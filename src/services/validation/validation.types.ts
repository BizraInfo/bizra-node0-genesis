/**
 * BIZRA Validation Service Types
 */

import { z } from "zod";

// ============= Validation Schemas =============

export const validateTransactionSchema = z.object({
  txHash: z
    .string()
    .min(1, "Transaction hash is required")
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
  networkId: z.string().optional(),
});

export const validateBlockSchema = z.object({
  blockNumber: z.number().positive("Block number must be positive"),
  networkId: z.string().optional(),
});

export const validateAddressSchema = z.object({
  address: z
    .string()
    .min(1, "Address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address format"),
  networkId: z.string().optional(),
});

// ============= Type Exports =============

export type ValidateTransactionInput = z.infer<
  typeof validateTransactionSchema
>;
export type ValidateBlockInput = z.infer<typeof validateBlockSchema>;
export type ValidateAddressInput = z.infer<typeof validateAddressSchema>;

// ============= BIZRA Types =============

export interface BizraTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: number;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  data?: string;
}

export interface BizraBlock {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: string[];
  miner: string;
  difficulty: string;
  gasLimit: string;
  gasUsed: string;
  size: number;
}

export interface BizraAccount {
  address: string;
  balance: string;
  nonce: number;
  code?: string;
  isContract: boolean;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
  validatedAt: Date;
  networkId: string;
}
