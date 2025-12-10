//! BIZRA Validator Set Management
//!
//! This crate implements the validator lifecycle, registration, reputation scoring,
//! and Proof-of-Impact (PoI) weighting system as specified in:
//! - BIZRA_Validator_Set_and_PoI_Weighting_Spec_v1.0.md
//!
//! إحسان (Excellence) Standard: Production-grade validator management
//!
//! ## Architecture
//!
//! ```text
//!  +------------------+        +-------------------+
//!  | ValidatorRecord  |<-------| ValidatorRegistry |
//!  | (state machine)  |        | (active set)      |
//!  +------------------+        +-------------------+
//!           |                           |
//!           v                           v
//!  +------------------+        +-------------------+
//!  | PoIAttestation   |        | ReputationTracker |
//!  | (weight calc)    |        | (decay & history) |
//!  +------------------+        +-------------------+
//! ```
//!
//! ## Lifecycle States
//!
//! Validators progress through defined states:
//! - **Pending**: Join request submitted, awaiting activation
//! - **Active**: Participating in consensus, producing WQ-refs
//! - **Exiting**: Voluntary exit initiated, unbonding period
//! - **Exited**: No longer active, bond returned
//! - **Slashed**: Penalized for misbehavior, quarantined

pub mod types;
pub mod registry;
pub mod reputation;
pub mod poi;
pub mod slashing;

pub use types::{ValidatorRecord, ValidatorStatus, ValidatorId};
pub use registry::ValidatorRegistry;
pub use reputation::ReputationTracker;
pub use poi::{PoIAttestation, PoIWeightCalculator};

/// Current version of the validator protocol
pub const VALIDATOR_PROTOCOL_VERSION: u8 = 1;

/// Default finality threshold (67% = 2/3 supermajority)
pub const DEFAULT_FINALITY_THRESHOLD: f64 = 0.67;

/// Maximum validators in active set (alpha testnet limit)
pub const MAX_ACTIVE_VALIDATORS: usize = 100;

/// Minimum reputation score for validator activation (0-100,000 scale)
pub const MIN_REPUTATION_FOR_ACTIVATION: u64 = 500;

/// Epoch duration in slots (spec: 32 slots × 2 seconds = 64 seconds)
pub const EPOCH_DURATION_SLOTS: u64 = 32;

/// Slot duration in milliseconds
pub const SLOT_DURATION_MS: u64 = 2000;

/// Unbonding delay in epochs (spec: 2 epochs = ~2 minutes)
pub const UNBONDING_DELAY_EPOCHS: u64 = 2;

/// Liveness miss threshold in slots (spec: 64 slots = ~2 minutes)
pub const LIVENESS_MISS_THRESHOLD: u64 = 64;

/// Offline threshold in slots (spec: 1024 slots = ~34 minutes)
pub const OFFLINE_THRESHOLD: u64 = 1024;

/// Churn limit per epoch (spec: max(2, floor(N/50)))
pub fn churn_limit(active_count: usize) -> usize {
    std::cmp::max(2, active_count / 50)
}

/// Get current epoch from slot number
pub fn slot_to_epoch(slot: u64) -> u64 {
    slot / EPOCH_DURATION_SLOTS
}

/// Get current slot within epoch (0-31)
pub fn slot_within_epoch(slot: u64) -> u64 {
    slot % EPOCH_DURATION_SLOTS
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_epoch_calculations() {
        // Epoch 0: slots 0-31
        assert_eq!(slot_to_epoch(0), 0);
        assert_eq!(slot_to_epoch(31), 0);
        assert_eq!(slot_within_epoch(0), 0);
        assert_eq!(slot_within_epoch(31), 31);

        // Epoch 1: slots 32-63
        assert_eq!(slot_to_epoch(32), 1);
        assert_eq!(slot_to_epoch(63), 1);
        assert_eq!(slot_within_epoch(32), 0);
        assert_eq!(slot_within_epoch(63), 31);

        // Epoch 10: slots 320-351
        assert_eq!(slot_to_epoch(320), 10);
        assert_eq!(slot_to_epoch(351), 10);
    }

    #[test]
    fn test_churn_limit() {
        assert_eq!(churn_limit(0), 2); // min limit
        assert_eq!(churn_limit(10), 2); // still at min
        assert_eq!(churn_limit(50), 2); // 50/50 = 1, but min is 2
        assert_eq!(churn_limit(100), 2); // 100/50 = 2
        assert_eq!(churn_limit(150), 3); // 150/50 = 3
        assert_eq!(churn_limit(500), 10); // 500/50 = 10
    }

    #[test]
    fn test_constants() {
        assert_eq!(VALIDATOR_PROTOCOL_VERSION, 1);
        assert_eq!(DEFAULT_FINALITY_THRESHOLD, 0.67);
        assert_eq!(MAX_ACTIVE_VALIDATORS, 100);
        assert_eq!(MIN_REPUTATION_FOR_ACTIVATION, 500);
        assert_eq!(EPOCH_DURATION_SLOTS, 32);
        assert_eq!(SLOT_DURATION_MS, 2000);
        assert_eq!(UNBONDING_DELAY_EPOCHS, 2);
        assert_eq!(LIVENESS_MISS_THRESHOLD, 64);
        assert_eq!(OFFLINE_THRESHOLD, 1024);
    }
}
