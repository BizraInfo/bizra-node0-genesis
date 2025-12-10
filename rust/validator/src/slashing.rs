//! Slashing logic for validator misbehavior
//!
//! Implements slashing as specified in spec section 7

use serde::{Deserialize, Serialize};

/// Slashable fault types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SlashReason {
    /// Conflicting headers/WQ-refs for same slot
    Equivocation,

    /// Attestation proven false
    FraudulentPoI,

    /// Systematic refusal to reference valid blocks
    Censorship,

    /// Detected key compromise
    KeyTheft,
}

/// Slash evidence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlashEvidence {
    pub validator_id: [u8; 32],
    pub reason: SlashReason,
    pub slot: u64,
    pub proof: Vec<u8>,
}

/// Slashing parameters
pub struct SlashingPolicy {
    /// Weight reduction factor (0.5-0.95)
    pub weight_factor: f64,

    /// Bond burn factor (0.1-1.0)
    pub bond_factor: f64,

    /// Reputation penalty
    pub rep_penalty: u64,

    /// Quarantine epochs
    pub quarantine_epochs: u64,
}

impl SlashingPolicy {
    /// Get slashing policy for fault type
    pub fn for_reason(reason: SlashReason) -> Self {
        match reason {
            SlashReason::Equivocation => Self {
                weight_factor: 0.9,  // Severe: 90% weight reduction
                bond_factor: 1.0,    // Burn entire bond
                rep_penalty: 5000,   // Large rep hit
                quarantine_epochs: 4,
            },
            SlashReason::FraudulentPoI => Self {
                weight_factor: 0.7,
                bond_factor: 0.5,
                rep_penalty: 3000,
                quarantine_epochs: 2,
            },
            SlashReason::Censorship => Self {
                weight_factor: 0.5,
                bond_factor: 0.3,
                rep_penalty: 2000,
                quarantine_epochs: 2,
            },
            SlashReason::KeyTheft => Self {
                weight_factor: 0.95,
                bond_factor: 0.1,
                rep_penalty: 500,
                quarantine_epochs: 1,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slashing_policy_equivocation() {
        let policy = SlashingPolicy::for_reason(SlashReason::Equivocation);
        assert_eq!(policy.weight_factor, 0.9);
        assert_eq!(policy.bond_factor, 1.0);
        assert_eq!(policy.rep_penalty, 5000);
        assert_eq!(policy.quarantine_epochs, 4);
    }

    #[test]
    fn test_slashing_policy_fraudulent_poi() {
        let policy = SlashingPolicy::for_reason(SlashReason::FraudulentPoI);
        assert_eq!(policy.weight_factor, 0.7);
        assert_eq!(policy.bond_factor, 0.5);
        assert_eq!(policy.rep_penalty, 3000);
    }
}
