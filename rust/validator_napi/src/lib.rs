//! NAPI-RS bindings for BIZRA validator system
//!
//! Exposes Rust validator functionality to Node.js via native bindings.
//! Implements 3 main classes:
//! - ValidatorRegistryNapi: Validator lifecycle management
//! - PoIAttestationNapi: Attestation validation and weight calculation
//! - ValidatorRecordNapi: Individual validator data
//!
//! ## Architecture
//!
//! ```text
//! Node.js (Express) → NAPI-RS → Rust (validator crate) → Tokio async
//! ```
//!
//! ## Usage (Node.js)
//!
//! ```javascript
//! const { ValidatorRegistryNapi } = require('@bizra/validator-napi');
//!
//! const registry = new ValidatorRegistryNapi();
//! await registry.register({
//!   validator_id: "hex32",
//!   pk_ed25519: "hex32",
//!   network_address: "/ip4/127.0.0.1/tcp/9944",
//!   epoch: 0
//! });
//!
//! const stats = await registry.getStats();
//! console.log(stats); // { active_validators: 1, total_weight: 100, ... }
//! ```

use napi::bindgen_prelude::*;
use napi_derive::napi;
use validator::{
    ValidatorRegistry, ValidatorRecord, ValidatorStatus,
    PoIAttestation, PoIWeightCalculator,
};
use serde_json;

/// NAPI wrapper for ValidatorRegistry
///
/// Thread-safe validator registry with async Tokio runtime
#[napi]
pub struct ValidatorRegistryNapi {
    registry: ValidatorRegistry,
    calculator: PoIWeightCalculator,
}

#[napi]
impl ValidatorRegistryNapi {
    /// Create new validator registry
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self {
            registry: ValidatorRegistry::new(),
            calculator: PoIWeightCalculator::new(),
        })
    }

    /// Register new validator (Pending state)
    ///
    /// # Arguments
    /// * `validator_id` - Hex-encoded 32-byte validator ID
    /// * `pk_ed25519` - Hex-encoded 32-byte Ed25519 public key
    /// * `network_address` - Multiaddr format (e.g., "/ip4/127.0.0.1/tcp/9944")
    /// * `epoch` - Current epoch number
    ///
    /// # Returns
    /// Object with success status and validator details
    #[napi]
    pub async fn register(
        &self,
        validator_id: String,
        pk_ed25519: String,
        network_address: String,
        epoch: u32,
    ) -> Result<serde_json::Value> {
        // Parse hex validator_id
        let id_bytes = hex::decode(&validator_id)
            .map_err(|e| Error::from_reason(format!("Invalid validator_id hex: {}", e)))?;

        if id_bytes.len() != 32 {
            return Err(Error::from_reason("validator_id must be 32 bytes"));
        }

        let mut id = [0u8; 32];
        id.copy_from_slice(&id_bytes);

        // Parse hex pubkey
        let pk_bytes = hex::decode(&pk_ed25519)
            .map_err(|e| Error::from_reason(format!("Invalid pk_ed25519 hex: {}", e)))?;

        if pk_bytes.len() != 32 {
            return Err(Error::from_reason("pk_ed25519 must be 32 bytes"));
        }

        let mut pk = [0u8; 32];
        pk.copy_from_slice(&pk_bytes);

        // Create validator record
        let validator = ValidatorRecord::new_pending(
            id,
            pk,
            network_address,
            epoch as u64,
        );

        // Register
        self.registry.register(validator.clone()).await
            .map_err(|e| Error::from_reason(format!("Registration failed: {}", e)))?;

        // Return response
        Ok(serde_json::json!({
            "success": true,
            "validator_id": validator_id,
            "status": "Pending",
            "epoch_join": epoch,
            "poi_weight": validator.poi_weight,
            "message": "Validator registered successfully"
        }))
    }

    /// Get validator by ID
    ///
    /// # Arguments
    /// * `validator_id` - Hex-encoded 32-byte validator ID
    ///
    /// # Returns
    /// Validator details or null if not found
    #[napi]
    pub async fn get_validator(&self, validator_id: String) -> Result<Option<serde_json::Value>> {
        let id_bytes = hex::decode(&validator_id)
            .map_err(|e| Error::from_reason(format!("Invalid validator_id hex: {}", e)))?;

        if id_bytes.len() != 32 {
            return Err(Error::from_reason("validator_id must be 32 bytes"));
        }

        let mut id = [0u8; 32];
        id.copy_from_slice(&id_bytes);

        match self.registry.get(&id).await {
            Some(validator) => {
                let status_str = match validator.status {
                    ValidatorStatus::Pending => "Pending",
                    ValidatorStatus::Active => "Active",
                    ValidatorStatus::Exiting { .. } => "Exiting",
                    ValidatorStatus::Exited => "Exited",
                    ValidatorStatus::Slashed { .. } => "Slashed",
                };

                Ok(Some(serde_json::json!({
                    "validator_id": hex::encode(validator.validator_id),
                    "pk_ed25519": hex::encode(validator.pk_ed25519),
                    "status": status_str,
                    "poi_weight": validator.poi_weight,
                    "rep_score": validator.rep_score,
                    "stake_bond": validator.stake_bond.to_string(),
                    "epoch_join": validator.epoch_join,
                    "last_seen_slot": validator.last_seen_slot,
                    "network_address": validator.network_address,
                })))
            }
            None => Ok(None)
        }
    }

    /// List active validators
    ///
    /// # Returns
    /// Array of active validator records
    #[napi]
    pub async fn list_active(&self) -> Result<serde_json::Value> {
        let active_validators = self.registry.list_active().await;

        let validators_json: Vec<serde_json::Value> = active_validators.iter().map(|v| {
            let status_str = match v.status {
                ValidatorStatus::Pending => "Pending",
                ValidatorStatus::Active => "Active",
                ValidatorStatus::Exiting { .. } => "Exiting",
                ValidatorStatus::Exited => "Exited",
                ValidatorStatus::Slashed { .. } => "Slashed",
            };

            serde_json::json!({
                "validator_id": hex::encode(v.validator_id),
                "status": status_str,
                "poi_weight": v.poi_weight,
                "rep_score": v.rep_score,
            })
        }).collect();

        Ok(serde_json::json!({
            "validators": validators_json,
            "total": active_validators.len(),
            "active_count": active_validators.len(),
        }))
    }

    /// Get registry statistics
    ///
    /// # Returns
    /// Stats including active count, total weight, current epoch
    #[napi]
    pub async fn get_stats(&self) -> Result<serde_json::Value> {
        let active_count = self.registry.active_count().await;
        let total_weight = self.registry.total_active_weight().await;
        let current_epoch = self.registry.get_epoch().await;

        Ok(serde_json::json!({
            "current_epoch": current_epoch,
            "active_validators": active_count,
            "total_active_weight": total_weight,
            "finality_threshold": validator::DEFAULT_FINALITY_THRESHOLD,
            "rust_enabled": true,
        }))
    }

    /// Submit PoI attestation
    ///
    /// # Arguments
    /// * `attestation_json` - Complete PoI attestation as JSON string
    ///
    /// # Returns
    /// Acceptance status with computed digest
    #[napi]
    pub async fn submit_attestation(&self, attestation_json: String) -> Result<serde_json::Value> {
        // Parse attestation
        let attestation: PoIAttestation = serde_json::from_str(&attestation_json)
            .map_err(|e| Error::from_reason(format!("Invalid attestation JSON: {}", e)))?;

        // Validate attestation
        attestation.validate("bizra-testnet-001", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f")
            .map_err(|e| Error::from_reason(format!("Attestation validation failed: {}", e)))?;

        // Compute digest
        let digest = attestation.compute_digest()
            .map_err(|e| Error::from_reason(format!("Digest computation failed: {}", e)))?;

        // TODO: Store attestation in database (Day 13+)
        // For now, just accept it

        Ok(serde_json::json!({
            "success": true,
            "attestation_id": format!("attest-{}", &digest[0..16]),
            "digest": digest,
            "status": "accepted",
            "impact_score": attestation.measurement.impact_score,
            "message": "Attestation accepted and verified"
        }))
    }

    /// Verify PoI attestation
    ///
    /// # Arguments
    /// * `attestation_json` - Complete PoI attestation as JSON string
    ///
    /// # Returns
    /// Verification result with computed metrics
    #[napi]
    pub async fn verify_attestation(&self, attestation_json: String) -> Result<serde_json::Value> {
        // Parse attestation
        let attestation: PoIAttestation = serde_json::from_str(&attestation_json)
            .map_err(|e| Error::from_reason(format!("Invalid attestation JSON: {}", e)))?;

        // Validate attestation
        let validation_result = attestation.validate(
            "bizra-testnet-001",
            "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f"
        );

        let (valid, reasons) = match validation_result {
            Ok(_) => (true, Vec::new()),
            Err(e) => (false, vec![e.to_string()])
        };

        // Compute digest
        let digest = attestation.compute_digest()
            .map_err(|e| Error::from_reason(format!("Digest computation failed: {}", e)))?;

        // Calculate weight (assuming default rep_score and stake_bond)
        let weight = self.calculator.calculate_weight_from_attestation(&attestation, 500, 0);

        Ok(serde_json::json!({
            "valid": valid,
            "reasons": reasons,
            "computed": {
                "digest": digest,
                "impact_score": attestation.measurement.impact_score,
                "poi_weight": weight,
                "delta": attestation.benchmarks.as_ref().map(|b| b.delta).unwrap_or(0.0)
            }
        }))
    }

    /// Get epoch rewards summary
    ///
    /// # Arguments
    /// * `epoch` - Epoch number
    ///
    /// # Returns
    /// Epoch summary with attestation count, rewards, top contributors
    #[napi]
    pub async fn get_epoch_summary(&self, epoch: u32) -> Result<serde_json::Value> {
        // TODO: Implement epoch tracking in Day 13+
        // For now, return placeholder

        Ok(serde_json::json!({
            "epoch": epoch,
            "attestation_count": 0,
            "total_impact_score": 0.0,
            "rewards": {
                "bloom_minted": 0,
                "seed_distributed": 0
            },
            "top_contributors": [],
            "message": "Epoch tracking coming in Day 13+"
        }))
    }
}

/// Module initialization for NAPI
#[napi]
pub fn get_version() -> String {
    format!("validator-napi v{}", env!("CARGO_PKG_VERSION"))
}

#[napi]
pub fn get_constants() -> serde_json::Value {
    serde_json::json!({
        "VALIDATOR_PROTOCOL_VERSION": validator::VALIDATOR_PROTOCOL_VERSION,
        "DEFAULT_FINALITY_THRESHOLD": validator::DEFAULT_FINALITY_THRESHOLD,
        "MAX_ACTIVE_VALIDATORS": validator::MAX_ACTIVE_VALIDATORS,
        "EPOCH_DURATION_SLOTS": validator::EPOCH_DURATION_SLOTS,
        "SLOT_DURATION_MS": validator::SLOT_DURATION_MS,
    })
}
