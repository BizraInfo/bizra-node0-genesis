//! Trust Bridge - Cryptographic provenance and receipts
//!
//! Provides:
//! - Ed25519 key generation
//! - Receipt signing with BLAKE3 hashing
//! - Receipt verification
//! - Provenance tracking
//!
//! Week-4 implementation: Complete signing + verification + storage hooks

use crate::types::{Candidate, Contract, RunReceipt, ScoredCandidate, Task};
use anyhow::Result;
use blake3::Hasher;
use ring::signature::{Ed25519KeyPair, KeyPair, UnparsedPublicKey, ED25519};
use ring::rand::SystemRandom;
use serde::Serialize;

/// Trust bridge for cryptographic operations
#[derive(Debug)]
pub struct TrustBridge {
    key_pair: Ed25519KeyPair,
    rng: SystemRandom,
}

impl TrustBridge {
    /// Create new trust bridge with generated keypair
    ///
    /// # Errors
    ///
    /// Returns an error if key generation fails
    pub fn new() -> Result<Self> {
        let rng = SystemRandom::new();
        let pkcs8_bytes = Ed25519KeyPair::generate_pkcs8(&rng)?;
        let key_pair = Ed25519KeyPair::from_pkcs8(pkcs8_bytes.as_ref())?;

        Ok(Self { key_pair, rng })
    }

    /// Create receipt for a synthesis run
    ///
    /// # Errors
    ///
    /// Returns an error if hashing or signing fails
    pub fn create_receipt(
        &self,
        winner: &Candidate,
        task: &Task,
        contract: &Contract,
        all_candidates: &[ScoredCandidate],
    ) -> Result<RunReceipt> {
        // Generate unique run ID
        let run_id = Self::generate_run_id();

        // Hash inputs
        let inputs_sha256 = Self::hash_inputs(task, contract)?;

        // Hash winner JSON
        let winner_json_sha256 = Self::hash_value(&winner.json)?;

        // Compute consensus hash with BLAKE3
        let consensus_hash_hex = Self::compute_consensus_hash(winner, all_candidates)?;

        // Pattern pack hash (placeholder for now)
        let pattern_pack_sha256 = Self::hash_string("pattern-pack-v1.0");

        // Create unsigned receipt
        let mut receipt = RunReceipt {
            run_id,
            inputs_sha256,
            winner_model: winner.model.clone(),
            winner_json_sha256,
            consensus_hash_hex,
            policy_version: "1.0.0".to_string(),
            pattern_pack_sha256,
            timestamp_ms: Self::current_timestamp_ms(),
            public_key_der: Vec::new(),
            signature: Vec::new(),
        };

        // Sign receipt
        self.sign_receipt(&mut receipt)?;

        Ok(receipt)
    }

    /// Sign a receipt
    ///
    /// # Errors
    ///
    /// Returns an error if serialization or signing fails
    pub fn sign_receipt(&self, receipt: &mut RunReceipt) -> Result<()> {
        // Serialize receipt payload (excluding signature fields)
        #[derive(Serialize)]
        struct ReceiptPayload<'a> {
            run_id: &'a str,
            inputs_sha256: &'a str,
            winner_model: &'a str,
            winner_json_sha256: &'a str,
            consensus_hash_hex: &'a str,
            policy_version: &'a str,
            pattern_pack_sha256: &'a str,
            timestamp_ms: u64,
        }

        let payload = ReceiptPayload {
            run_id: &receipt.run_id,
            inputs_sha256: &receipt.inputs_sha256,
            winner_model: &receipt.winner_model,
            winner_json_sha256: &receipt.winner_json_sha256,
            consensus_hash_hex: &receipt.consensus_hash_hex,
            policy_version: &receipt.policy_version,
            pattern_pack_sha256: &receipt.pattern_pack_sha256,
            timestamp_ms: receipt.timestamp_ms,
        };

        let payload_bytes = serde_json::to_vec(&payload)?;

        // Sign with Ed25519
        let signature = self.key_pair.sign(&payload_bytes);

        // Attach public key and signature
        receipt.public_key_der = self.key_pair.public_key().as_ref().to_vec();
        receipt.signature = signature.as_ref().to_vec();

        Ok(())
    }

    /// Verify a receipt's signature
    pub fn verify_receipt(&self, receipt: &RunReceipt) -> bool {
        // Reconstruct payload
        #[derive(Serialize)]
        struct ReceiptPayload<'a> {
            run_id: &'a str,
            inputs_sha256: &'a str,
            winner_model: &'a str,
            winner_json_sha256: &'a str,
            consensus_hash_hex: &'a str,
            policy_version: &'a str,
            pattern_pack_sha256: &'a str,
            timestamp_ms: u64,
        }

        let payload = ReceiptPayload {
            run_id: &receipt.run_id,
            inputs_sha256: &receipt.inputs_sha256,
            winner_model: &receipt.winner_model,
            winner_json_sha256: &receipt.winner_json_sha256,
            consensus_hash_hex: &receipt.consensus_hash_hex,
            policy_version: &receipt.policy_version,
            pattern_pack_sha256: &receipt.pattern_pack_sha256,
            timestamp_ms: receipt.timestamp_ms,
        };

        let payload_bytes = match serde_json::to_vec(&payload) {
            Ok(bytes) => bytes,
            Err(_) => return false,
        };

        // Verify signature
        let public_key = UnparsedPublicKey::new(&ED25519, &receipt.public_key_der);
        public_key.verify(&payload_bytes, &receipt.signature).is_ok()
    }

    /// Generate unique run ID
    fn generate_run_id() -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let random_bytes: [u8; 16] = rng.gen();
        hex::encode(random_bytes)
    }

    /// Hash task and contract inputs
    fn hash_inputs(task: &Task, contract: &Contract) -> Result<String> {
        let task_json = serde_json::to_string(task)?;
        let contract_json = serde_json::to_string(contract)?;
        let combined = format!("{}{}", task_json, contract_json);
        Ok(Self::hash_string(&combined))
    }

    /// Hash a JSON value
    fn hash_value(value: &serde_json::Value) -> Result<String> {
        let json_str = serde_json::to_string(value)?;
        Ok(Self::hash_string(&json_str))
    }

    /// Hash a string with SHA-256
    fn hash_string(s: &str) -> String {
        use ring::digest::{Context, SHA256};
        let mut context = Context::new(&SHA256);
        context.update(s.as_bytes());
        let digest = context.finish();
        hex::encode(digest.as_ref())
    }

    /// Compute consensus hash with BLAKE3
    fn compute_consensus_hash(winner: &Candidate, all_candidates: &[ScoredCandidate]) -> Result<String> {
        let mut hasher = Hasher::new();

        // Hash winner
        let winner_json = serde_json::to_vec(&winner.json)?;
        hasher.update(&winner_json);

        // Hash all candidate scores
        for candidate in all_candidates {
            let scores_json = serde_json::to_vec(&candidate.scores)?;
            hasher.update(&scores_json);
        }

        let hash = hasher.finalize();
        Ok(hash.to_hex().to_string())
    }

    /// Get current timestamp in milliseconds
    fn current_timestamp_ms() -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time went backwards")
            .as_millis() as u64
    }

    /// Store receipt (hook for external storage)
    ///
    /// In production, this would write to:
    /// - Database
    /// - Blockchain
    /// - IPFS
    /// - Local audit log
    pub fn store_receipt(&self, _receipt: &RunReceipt) -> Result<()> {
        // TODO: Implement storage backend
        // For now, just log
        tracing::info!("Receipt stored (placeholder)");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Candidate, Contract, Task};

    #[test]
    fn test_trust_bridge_creation() {
        let bridge = TrustBridge::new();
        assert!(bridge.is_ok());
    }

    #[test]
    fn test_create_receipt() {
        let bridge = TrustBridge::new().unwrap();
        let winner = Candidate::example();
        let task = Task::example();
        let contract = Contract::example();
        let candidates = vec![ScoredCandidate::high_quality()];

        let receipt = bridge.create_receipt(&winner, &task, &contract, &candidates);
        assert!(receipt.is_ok());

        let receipt = receipt.unwrap();
        assert!(!receipt.run_id.is_empty());
        assert!(!receipt.public_key_der.is_empty());
        assert!(!receipt.signature.is_empty());
    }

    #[test]
    fn test_sign_and_verify_receipt() {
        let bridge = TrustBridge::new().unwrap();
        let winner = Candidate::example();
        let task = Task::example();
        let contract = Contract::example();
        let candidates = vec![ScoredCandidate::high_quality()];

        let receipt = bridge.create_receipt(&winner, &task, &contract, &candidates).unwrap();

        // Verify the receipt
        assert!(bridge.verify_receipt(&receipt));
    }

    #[test]
    fn test_tampered_receipt_fails_verification() {
        let bridge = TrustBridge::new().unwrap();
        let winner = Candidate::example();
        let task = Task::example();
        let contract = Contract::example();
        let candidates = vec![ScoredCandidate::high_quality()];

        let mut receipt = bridge.create_receipt(&winner, &task, &contract, &candidates).unwrap();

        // Tamper with receipt
        receipt.winner_model = "tampered-model".to_string();

        // Verification should fail
        assert!(!bridge.verify_receipt(&receipt));
    }

    #[test]
    fn test_hash_string() {
        let hash1 = TrustBridge::hash_string("test");
        let hash2 = TrustBridge::hash_string("test");
        let hash3 = TrustBridge::hash_string("different");

        // Same input produces same hash
        assert_eq!(hash1, hash2);

        // Different input produces different hash
        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_consensus_hash() {
        let winner = Candidate::example();
        let candidates = vec![
            ScoredCandidate::high_quality(),
            ScoredCandidate::medium_quality(),
        ];

        let hash = TrustBridge::compute_consensus_hash(&winner, &candidates);
        assert!(hash.is_ok());

        let hash = hash.unwrap();
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64); // BLAKE3 produces 256-bit hash
    }

    #[test]
    fn test_timestamp_generation() {
        let ts1 = TrustBridge::current_timestamp_ms();
        std::thread::sleep(std::time::Duration::from_millis(10));
        let ts2 = TrustBridge::current_timestamp_ms();

        assert!(ts2 > ts1);
    }

    #[test]
    fn test_run_id_uniqueness() {
        let id1 = TrustBridge::generate_run_id();
        let id2 = TrustBridge::generate_run_id();

        assert_ne!(id1, id2);
        assert_eq!(id1.len(), 32); // 16 bytes = 32 hex chars
    }
}
