//! Validator registry and active set management
//!
//! Manages the active validator set with epoch-based rotation and churn limits

use crate::types::{ValidatorId, ValidatorRecord};
use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Validator registry managing active set
pub struct ValidatorRegistry {
    /// All validators (active + pending + exited)
    validators: Arc<RwLock<HashMap<ValidatorId, ValidatorRecord>>>,

    /// Current epoch
    current_epoch: Arc<RwLock<u64>>,
}

impl ValidatorRegistry {
    /// Create new validator registry
    pub fn new() -> Self {
        Self {
            validators: Arc::new(RwLock::new(HashMap::new())),
            current_epoch: Arc::new(RwLock::new(0)),
        }
    }

    /// Register new validator (Pending state)
    pub async fn register(&self, validator: ValidatorRecord) -> Result<()> {
        let mut validators = self.validators.write().await;
        let validator_id = validator.validator_id;

        if validators.contains_key(&validator_id) {
            anyhow::bail!("Validator already registered: {:?}", validator_id);
        }

        validators.insert(validator_id, validator);
        Ok(())
    }

    /// Get validator by ID
    pub async fn get(&self, validator_id: &ValidatorId) -> Option<ValidatorRecord> {
        let validators = self.validators.read().await;
        validators.get(validator_id).cloned()
    }

    /// Get active validator count
    pub async fn active_count(&self) -> usize {
        let validators = self.validators.read().await;
        validators
            .values()
            .filter(|v| v.status.is_active_set())
            .count()
    }

    /// List active validators
    pub async fn list_active(&self) -> Vec<ValidatorRecord> {
        let validators = self.validators.read().await;
        validators
            .values()
            .filter(|v| v.status.is_active_set())
            .cloned()
            .collect()
    }

    /// Update current epoch
    pub async fn set_epoch(&self, epoch: u64) {
        let mut current_epoch = self.current_epoch.write().await;
        *current_epoch = epoch;
    }

    /// Get current epoch
    pub async fn get_epoch(&self) -> u64 {
        *self.current_epoch.read().await
    }

    /// Get total effective weight across active validators
    pub async fn total_active_weight(&self) -> u128 {
        let validators = self.validators.read().await;
        validators
            .values()
            .filter(|v| v.status.weight_counts())
            .map(|v| v.poi_weight)
            .sum()
    }
}

impl Default for ValidatorRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ValidatorRecord;

    #[tokio::test]
    async fn test_registry_creation() {
        let registry = ValidatorRegistry::new();
        assert_eq!(registry.active_count().await, 0);
        assert_eq!(registry.get_epoch().await, 0);
    }

    #[tokio::test]
    async fn test_register_validator() {
        let registry = ValidatorRegistry::new();

        let validator = ValidatorRecord::new_pending(
            [1u8; 32],
            [2u8; 32],
            "/ip4/127.0.0.1/tcp/9944".to_string(),
            0,
        );

        registry.register(validator.clone()).await.unwrap();

        let retrieved = registry.get(&validator.validator_id).await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().validator_id, validator.validator_id);
    }

    #[tokio::test]
    async fn test_active_count() {
        let registry = ValidatorRegistry::new();

        // Register 3 validators
        for i in 0..3 {
            let mut vid = [0u8; 32];
            vid[0] = i;
            let mut validator = ValidatorRecord::new_pending(
                vid,
                [i; 32],
                format!("/ip4/127.0.0.{}/tcp/9944", i),
                0,
            );

            if i < 2 {
                // Activate first 2
                validator.activate(0).unwrap();
            }

            registry.register(validator).await.unwrap();
        }

        assert_eq!(registry.active_count().await, 2);
    }
}
