/**
 * BIZRA Validator NAPI Module Type Definitions
 *
 * TypeScript definitions for Rust validator NAPI bindings
 *
 * @module @bizra/validator-napi
 */

/**
 * Validator registry with lifecycle management
 */
export class ValidatorRegistryNapi {
  /**
   * Create new validator registry
   */
  constructor();

  /**
   * Register new validator (Pending state)
   *
   * @param validator_id - Hex-encoded 32-byte validator ID
   * @param pk_ed25519 - Hex-encoded 32-byte Ed25519 public key
   * @param network_address - Multiaddr format (e.g., "/ip4/127.0.0.1/tcp/9944")
   * @param epoch - Current epoch number
   * @returns Registration result
   */
  register(
    validator_id: string,
    pk_ed25519: string,
    network_address: string,
    epoch: number
  ): Promise<{
    success: boolean;
    validator_id: string;
    status: string;
    epoch_join: number;
    poi_weight: number;
    message: string;
  }>;

  /**
   * Get validator by ID
   *
   * @param validator_id - Hex-encoded 32-byte validator ID
   * @returns Validator details or null if not found
   */
  getValidator(validator_id: string): Promise<{
    validator_id: string;
    pk_ed25519: string;
    status: 'Pending' | 'Active' | 'Exiting' | 'Exited' | 'Slashed';
    poi_weight: number;
    rep_score: number;
    stake_bond: string;
    epoch_join: number;
    last_seen_slot: number;
    network_address: string;
  } | null>;

  /**
   * List active validators
   *
   * @returns Array of active validator records
   */
  listActive(): Promise<{
    validators: Array<{
      validator_id: string;
      status: string;
      poi_weight: number;
      rep_score: number;
    }>;
    total: number;
    active_count: number;
  }>;

  /**
   * Get registry statistics
   *
   * @returns Stats including active count, total weight, current epoch
   */
  getStats(): Promise<{
    current_epoch: number;
    active_validators: number;
    total_active_weight: number;
    finality_threshold: number;
    rust_enabled: boolean;
  }>;

  /**
   * Submit PoI attestation
   *
   * @param attestation_json - Complete PoI attestation as JSON string
   * @returns Acceptance status with computed digest
   */
  submitAttestation(attestation_json: string): Promise<{
    success: boolean;
    attestation_id: string;
    digest: string;
    status: string;
    impact_score: number;
    message: string;
  }>;

  /**
   * Verify PoI attestation
   *
   * @param attestation_json - Complete PoI attestation as JSON string
   * @returns Verification result with computed metrics
   */
  verifyAttestation(attestation_json: string): Promise<{
    valid: boolean;
    reasons: string[];
    computed: {
      digest: string;
      impact_score: number;
      poi_weight: number;
      delta: number;
    };
  }>;

  /**
   * Get epoch rewards summary
   *
   * @param epoch - Epoch number
   * @returns Epoch summary with attestation count, rewards, top contributors
   */
  getEpochSummary(epoch: number): Promise<{
    epoch: number;
    attestation_count: number;
    total_impact_score: number;
    rewards: {
      bloom_minted: number;
      seed_distributed: number;
    };
    top_contributors: any[];
    message?: string;
  }>;
}

/**
 * Get NAPI module version
 */
export function getVersion(): string;

/**
 * Get validator system constants
 */
export function getConstants(): {
  VALIDATOR_PROTOCOL_VERSION: number;
  DEFAULT_FINALITY_THRESHOLD: number;
  MAX_ACTIVE_VALIDATORS: number;
  EPOCH_DURATION_SLOTS: number;
  SLOT_DURATION_MS: number;
};
