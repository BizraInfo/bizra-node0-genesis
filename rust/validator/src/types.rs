//! Core validator types
//!
//! Implements ValidatorRecord and related types as specified in
//! BIZRA_Validator_Set_and_PoI_Weighting_Spec_v1.0.md section 4.1

use serde::{Deserialize, Serialize};
use std::fmt;

/// Validator identifier (hash of Ed25519 public key)
pub type ValidatorId = [u8; 32];

/// Ed25519 public key (32 bytes)
pub type Ed25519PublicKey = [u8; 32];

/// BLS12-381 public key (48 bytes, optional for aggregated refs)
/// Note: Using Vec<u8> for serde compatibility (serde doesn't support [u8; 48] by default)
/// Runtime validation ensures exactly 48 bytes
pub type Bls12381PublicKey = Vec<u8>;

/// Validator lifecycle status
///
/// States: Pending → Active → Exiting → Exited (or Slashed)
///
/// ## احسان Principle
/// Explicit state machine prevents ambiguous validator states
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ValidatorStatus {
    /// Join request submitted, awaiting activation
    /// - Eligibility checks in progress
    /// - Bond locked if provided
    /// - Cannot produce blocks or WQ-refs
    Pending,

    /// Fully active validator
    /// - Participating in consensus
    /// - Producing blocks and WQ-refs
    /// - Weight actively counted
    /// - Earning rewards
    Active,

    /// Voluntary exit initiated
    /// - Still participating in consensus
    /// - Unbonding period started
    /// - Cannot rejoin until fully exited
    Exiting,

    /// Exited from active set
    /// - No longer producing blocks
    /// - Bond returned after unbonding delay
    /// - Can rejoin by submitting new JoinTx
    Exited,

    /// Slashed for misbehavior
    /// - Removed from active set immediately
    /// - Bond partially/fully burned
    /// - Reputation severely reduced
    /// - Quarantine period before rejoining
    Slashed,
}

impl fmt::Display for ValidatorStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ValidatorStatus::Pending => write!(f, "Pending"),
            ValidatorStatus::Active => write!(f, "Active"),
            ValidatorStatus::Exiting => write!(f, "Exiting"),
            ValidatorStatus::Exited => write!(f, "Exited"),
            ValidatorStatus::Slashed => write!(f, "Slashed"),
        }
    }
}

impl ValidatorStatus {
    /// Check if validator can produce blocks
    pub fn can_produce_blocks(&self) -> bool {
        matches!(self, ValidatorStatus::Active | ValidatorStatus::Exiting)
    }

    /// Check if validator weight counts toward finality
    pub fn weight_counts(&self) -> bool {
        matches!(self, ValidatorStatus::Active | ValidatorStatus::Exiting)
    }

    /// Check if validator is in active set
    pub fn is_active_set(&self) -> bool {
        matches!(self, ValidatorStatus::Active | ValidatorStatus::Exiting)
    }
}

/// Validator record
///
/// Implements ValidatorRecord from spec section 4.1:
/// ```text
/// ValidatorRecord {
///   validator_id: Bytes32,
///   pk_ed25519: Bytes32,
///   pk_bls: Bytes48?,
///   network_address: String,
///   epoch_join: u64,
///   epoch_exit: u64?,
///   status: ValidatorStatus,
///   poi_weight: u128,
///   rep_score: u64,
///   stake_bond: u128,
///   last_seen_slot: u64
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorRecord {
    /// Validator identifier (hash of Ed25519 public key)
    pub validator_id: ValidatorId,

    /// Ed25519 public key for block/WQ-ref signing
    pub pk_ed25519: Ed25519PublicKey,

    /// BLS12-381 public key for aggregated signatures (optional)
    pub pk_bls: Option<Bls12381PublicKey>,

    /// Network address (libp2p multiaddr format)
    pub network_address: String,

    /// Epoch when validator joined
    pub epoch_join: u64,

    /// Epoch when validator exited (None if still active)
    pub epoch_exit: Option<u64>,

    /// Current lifecycle status
    pub status: ValidatorStatus,

    /// Current effective consensus weight (from PoI attestations)
    pub poi_weight: u128,

    /// Long-term reputation score (0..100,000 scale)
    pub rep_score: u64,

    /// Optional stake bond for Sybil resistance
    pub stake_bond: u128,

    /// Last slot where validator was seen (liveness tracking)
    pub last_seen_slot: u64,

    /// Timestamp when record was created/updated (Unix timestamp in seconds)
    pub updated_at: u64,
}

impl ValidatorRecord {
    /// Create new pending validator
    ///
    /// # Arguments
    /// * `validator_id` - Hash of Ed25519 public key
    /// * `pk_ed25519` - Ed25519 public key
    /// * `network_address` - libp2p multiaddr
    /// * `epoch` - Current epoch
    ///
    /// # Returns
    /// ValidatorRecord in Pending state with default values
    pub fn new_pending(
        validator_id: ValidatorId,
        pk_ed25519: Ed25519PublicKey,
        network_address: String,
        epoch: u64,
    ) -> Self {
        Self {
            validator_id,
            pk_ed25519,
            pk_bls: None,
            network_address,
            epoch_join: epoch,
            epoch_exit: None,
            status: ValidatorStatus::Pending,
            poi_weight: 0,
            rep_score: MIN_REPUTATION_SCORE, // Start with minimum
            stake_bond: 0,
            last_seen_slot: 0,
            updated_at: current_timestamp(),
        }
    }

    /// Activate validator (Pending → Active)
    ///
    /// # Requirements
    /// - Must be in Pending status
    /// - Reputation >= MIN_REPUTATION_FOR_ACTIVATION
    /// - Churn limit not exceeded
    pub fn activate(&mut self, current_epoch: u64) -> Result<(), String> {
        if self.status != ValidatorStatus::Pending {
            return Err(format!(
                "Cannot activate validator in status: {}",
                self.status
            ));
        }

        if self.rep_score < MIN_REPUTATION_FOR_ACTIVATION {
            return Err(format!(
                "Insufficient reputation: {} < {}",
                self.rep_score, MIN_REPUTATION_FOR_ACTIVATION
            ));
        }

        self.status = ValidatorStatus::Active;
        self.epoch_join = current_epoch;
        self.updated_at = current_timestamp();

        Ok(())
    }

    /// Initiate voluntary exit (Active → Exiting)
    pub fn initiate_exit(&mut self, current_epoch: u64) -> Result<(), String> {
        if self.status != ValidatorStatus::Active {
            return Err(format!(
                "Cannot exit validator in status: {}",
                self.status
            ));
        }

        self.status = ValidatorStatus::Exiting;
        self.epoch_exit = Some(current_epoch + UNBONDING_DELAY_EPOCHS);
        self.updated_at = current_timestamp();

        Ok(())
    }

    /// Complete exit (Exiting → Exited)
    pub fn complete_exit(&mut self, current_epoch: u64) -> Result<(), String> {
        if self.status != ValidatorStatus::Exiting {
            return Err(format!(
                "Cannot complete exit for validator in status: {}",
                self.status
            ));
        }

        let exit_epoch = self.epoch_exit.ok_or("No exit epoch set")?;
        if current_epoch < exit_epoch {
            return Err(format!(
                "Unbonding period not complete: current={}, exit={}",
                current_epoch, exit_epoch
            ));
        }

        self.status = ValidatorStatus::Exited;
        self.updated_at = current_timestamp();

        Ok(())
    }

    /// Slash validator for misbehavior
    ///
    /// # Arguments
    /// * `weight_slash_factor` - Factor to reduce weight (0.0-1.0)
    /// * `bond_slash_factor` - Factor to burn bond (0.0-1.0)
    /// * `rep_penalty` - Reputation reduction amount
    pub fn slash(
        &mut self,
        weight_slash_factor: f64,
        bond_slash_factor: f64,
        rep_penalty: u64,
    ) -> Result<(), String> {
        // Can slash any validator except already slashed
        if self.status == ValidatorStatus::Slashed {
            return Err("Validator already slashed".to_string());
        }

        // Reduce PoI weight
        let weight_reduction = (self.poi_weight as f64 * weight_slash_factor) as u128;
        self.poi_weight = self.poi_weight.saturating_sub(weight_reduction);

        // Burn stake bond
        let bond_burn = (self.stake_bond as f64 * bond_slash_factor) as u128;
        self.stake_bond = self.stake_bond.saturating_sub(bond_burn);

        // Reduce reputation (floored at 0)
        self.rep_score = self.rep_score.saturating_sub(rep_penalty);

        // Update status
        self.status = ValidatorStatus::Slashed;
        self.updated_at = current_timestamp();

        Ok(())
    }

    /// Update liveness tracking
    pub fn mark_seen(&mut self, slot: u64) {
        if slot > self.last_seen_slot {
            self.last_seen_slot = slot;
            self.updated_at = current_timestamp();
        }
    }

    /// Check if validator is offline
    pub fn is_offline(&self, current_slot: u64) -> bool {
        if self.last_seen_slot == 0 {
            return false; // Never seen yet
        }
        current_slot.saturating_sub(self.last_seen_slot) > OFFLINE_THRESHOLD
    }

    /// Check if validator missed liveness threshold
    pub fn missed_liveness(&self, current_slot: u64) -> bool {
        if self.last_seen_slot == 0 {
            return false;
        }
        let missed = current_slot.saturating_sub(self.last_seen_slot);
        missed > LIVENESS_MISS_THRESHOLD && missed <= OFFLINE_THRESHOLD
    }
}

/// Get current Unix timestamp in seconds
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

// Re-export constants from lib.rs for convenience
use crate::{
    UNBONDING_DELAY_EPOCHS, LIVENESS_MISS_THRESHOLD, OFFLINE_THRESHOLD,
    MIN_REPUTATION_FOR_ACTIVATION,
};
const MIN_REPUTATION_SCORE: u64 = 500; // Minimum starting reputation

#[cfg(test)]
mod tests {
    use super::*;

    fn test_validator_id() -> ValidatorId {
        [1u8; 32]
    }

    fn test_ed25519_key() -> Ed25519PublicKey {
        [2u8; 32]
    }

    #[test]
    fn test_validator_status_transitions() {
        // Can produce blocks
        assert!(ValidatorStatus::Active.can_produce_blocks());
        assert!(ValidatorStatus::Exiting.can_produce_blocks());
        assert!(!ValidatorStatus::Pending.can_produce_blocks());
        assert!(!ValidatorStatus::Exited.can_produce_blocks());
        assert!(!ValidatorStatus::Slashed.can_produce_blocks());

        // Weight counts
        assert!(ValidatorStatus::Active.weight_counts());
        assert!(ValidatorStatus::Exiting.weight_counts());
        assert!(!ValidatorStatus::Pending.weight_counts());
        assert!(!ValidatorStatus::Exited.weight_counts());
        assert!(!ValidatorStatus::Slashed.weight_counts());

        // Active set
        assert!(ValidatorStatus::Active.is_active_set());
        assert!(ValidatorStatus::Exiting.is_active_set());
        assert!(!ValidatorStatus::Pending.is_active_set());
    }

    #[test]
    fn test_new_pending_validator() {
        let vid = test_validator_id();
        let pk = test_ed25519_key();
        let addr = "/ip4/127.0.0.1/tcp/9944".to_string();

        let validator = ValidatorRecord::new_pending(vid, pk, addr.clone(), 0);

        assert_eq!(validator.validator_id, vid);
        assert_eq!(validator.pk_ed25519, pk);
        assert_eq!(validator.network_address, addr);
        assert_eq!(validator.epoch_join, 0);
        assert_eq!(validator.status, ValidatorStatus::Pending);
        assert_eq!(validator.poi_weight, 0);
        assert_eq!(validator.rep_score, MIN_REPUTATION_SCORE);
        assert_eq!(validator.stake_bond, 0);
    }

    #[test]
    fn test_activate_validator() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        // Should succeed with sufficient reputation
        assert!(validator.activate(1).is_ok());
        assert_eq!(validator.status, ValidatorStatus::Active);
        assert_eq!(validator.epoch_join, 1);
    }

    #[test]
    fn test_activate_insufficient_reputation() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        // Reduce reputation below threshold
        validator.rep_score = 400;

        // Should fail
        let result = validator.activate(1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Insufficient reputation"));
        assert_eq!(validator.status, ValidatorStatus::Pending); // Status unchanged
    }

    #[test]
    fn test_initiate_exit() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        validator.activate(0).unwrap();
        assert_eq!(validator.status, ValidatorStatus::Active);

        // Initiate exit at epoch 5
        assert!(validator.initiate_exit(5).is_ok());
        assert_eq!(validator.status, ValidatorStatus::Exiting);
        assert_eq!(validator.epoch_exit, Some(5 + UNBONDING_DELAY_EPOCHS));
    }

    #[test]
    fn test_complete_exit() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        validator.activate(0).unwrap();
        validator.initiate_exit(5).unwrap();

        // Try to complete before unbonding period
        let result = validator.complete_exit(6);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unbonding period not complete"));

        // Complete after unbonding period (5 + 2 = 7)
        assert!(validator.complete_exit(7).is_ok());
        assert_eq!(validator.status, ValidatorStatus::Exited);
    }

    #[test]
    fn test_slash_validator() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        validator.activate(0).unwrap();
        validator.poi_weight = 1000;
        validator.stake_bond = 5000;
        validator.rep_score = 10000;

        // Slash: 50% weight, 30% bond, 2000 rep
        assert!(validator.slash(0.5, 0.3, 2000).is_ok());

        assert_eq!(validator.status, ValidatorStatus::Slashed);
        assert_eq!(validator.poi_weight, 500); // 1000 - 50%
        assert_eq!(validator.stake_bond, 3500); // 5000 - 30%
        assert_eq!(validator.rep_score, 8000); // 10000 - 2000
    }

    #[test]
    fn test_liveness_tracking() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        validator.activate(0).unwrap();

        // Mark seen at slot 100
        validator.mark_seen(100);
        assert_eq!(validator.last_seen_slot, 100);
        assert!(!validator.is_offline(164)); // 100 + 64 = 164 (threshold)
        assert!(validator.missed_liveness(165)); // 100 + 65 = missed

        // Mark seen at later slot
        validator.mark_seen(200);
        assert_eq!(validator.last_seen_slot, 200);
        assert!(!validator.missed_liveness(260)); // Within threshold
    }

    #[test]
    fn test_is_offline() {
        let mut validator = ValidatorRecord::new_pending(
            test_validator_id(),
            test_ed25519_key(),
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        validator.activate(0).unwrap();
        validator.mark_seen(100);

        // Not offline within threshold
        assert!(!validator.is_offline(100 + LIVENESS_MISS_THRESHOLD));

        // Offline after threshold
        assert!(validator.is_offline(100 + OFFLINE_THRESHOLD + 1));
    }
}
