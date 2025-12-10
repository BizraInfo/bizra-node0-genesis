//! # BIZRA Synthesis Orchestrator
//!
//! Production-grade multi-model consensus system with Ihsān quality enforcement.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                  Synthesis Orchestrator                     │
//! ├─────────────────────────────────────────────────────────────┤
//! │                                                             │
//! │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
//! │  │ Routing  │  │ IhsānGate│  │ Consensus│  │  Trust   │  │
//! │  │  Engine  │─>│  Scoring │─>│  Engine  │─>│  Bridge  │  │
//! │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
//! │       ↑             ↑             ↑             ↑         │
//! │       └─────────────┴─────────────┴─────────────┘         │
//! │                   SIMD Kernel (feature-gated)             │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Features
//!
//! - **Memory Safety**: Zero `unsafe` code, enforced by lints
//! - **Performance**: SIMD-accelerated JSON parsing and scoring
//! - **Portability**: Feature gates for platform-specific optimizations
//! - **Trust**: Cryptographic receipts with Ed25519 signatures
//! - **Quality**: Ihsān-grade enforcement (>95% accuracy threshold)
//!
//! ## Usage
//!
//! ```rust,no_run
//! use synthesis_orchestrator::{Orchestrator, Task, Contract};
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     let orchestrator = Orchestrator::new()?;
//!     
//!     let task = Task::example();
//!     let contract = Contract::example();
//!     
//!     let result = orchestrator.synthesize(task, contract).await?;
//!     
//!     println!("Winner: {}", result.winner.model);
//!     println!("Ihsān Score: {:.3}", result.winner.scores.ihsan);
//!     
//!     Ok(())
//! }
//! ```

#![forbid(unsafe_code)]
#![warn(
    clippy::all,
    clippy::pedantic,
    clippy::nursery,
    missing_docs,
    missing_debug_implementations
)]
#![allow(
    clippy::module_name_repetitions,
    clippy::similar_names,
    clippy::must_use_candidate
)]

// Core modules
pub mod types;
pub mod parser;
pub mod ihsan_gate;
pub mod routing;
pub mod consensus;
pub mod trust_bridge;
pub mod telemetry;

// Feature-gated kernel
#[cfg(any(feature = "simd", feature = "avx2", feature = "avx512"))]
pub mod kernel;

// Re-exports for convenience
pub use types::*;
pub use parser::EarlyCloseJsonParser;
pub use ihsan_gate::IhsanGate;
pub use routing::{RoutingEngine, RoutingStrategy};
pub use consensus::{ConsensusEngine, ConsensusStrategy};
pub use trust_bridge::TrustBridge;
pub use telemetry::Telemetry;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Main orchestrator for multi-model synthesis with consensus
///
/// This is the primary entry point for running the synthesis process.
/// It coordinates between routing, scoring, consensus, and trust verification.
#[derive(Debug, Clone)]
pub struct Orchestrator {
    routing_engine: Arc<RwLock<RoutingEngine>>,
    ihsan_gate: Arc<IhsanGate>,
    consensus_engine: Arc<ConsensusEngine>,
    trust_bridge: Arc<TrustBridge>,
}

impl Orchestrator {
    /// Create a new orchestrator with default configuration
    ///
    /// # Errors
    ///
    /// Returns an error if cryptographic key generation fails
    pub fn new() -> Result<Self> {
        Ok(Self {
            routing_engine: Arc::new(RwLock::new(RoutingEngine::new())),
            ihsan_gate: Arc::new(IhsanGate::new()),
            consensus_engine: Arc::new(ConsensusEngine::new(ConsensusConfig::default())),
            trust_bridge: Arc::new(TrustBridge::new()?),
        })
    }

    /// Create orchestrator with custom configuration
    ///
    /// # Errors
    ///
    /// Returns an error if configuration is invalid or key generation fails
    pub fn with_config(config: OrchestratorConfig) -> Result<Self> {
        Ok(Self {
            routing_engine: Arc::new(RwLock::new(RoutingEngine::new())),
            ihsan_gate: Arc::new(IhsanGate::new()),
            consensus_engine: Arc::new(ConsensusEngine::new(config.consensus)),
            trust_bridge: Arc::new(TrustBridge::new()?),
        })
    }

    /// Main synthesis method - orchestrates the entire pipeline
    ///
    /// # Process Flow
    ///
    /// 1. **Routing**: Select optimal model routes based on task classification
    /// 2. **Generation**: Generate candidates from selected models (mocked here)
    /// 3. **Scoring**: Apply Ihsān Gate quality enforcement
    /// 4. **Consensus**: Select winner via consensus strategy
    /// 5. **Trust**: Generate cryptographic receipt
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - No valid candidates are generated
    /// - All candidates fail Ihsān threshold
    /// - Consensus fails to converge
    /// - Trust bridge signing fails
    pub async fn synthesize(&self, task: Task, contract: Contract) -> Result<OrchestratorResult> {
        let start_time = std::time::Instant::now();

        // 1. Routing: Select best models for this task
        let routes = {
            let mut engine = self.routing_engine.write().await;
            engine.select_routes(&task, 3)?
        };

        // 2. Generate candidates (in production, this would call actual LLM APIs)
        let raw_candidates = self.mock_generate_candidates(&routes, &contract).await?;

        // 3. Score candidates with Ihsān Gate
        let scored_candidates = self.ihsan_gate.score_candidates(&raw_candidates, &contract)?;

        // 4. Apply consensus strategy
        let winner = self.consensus_engine.select_winner(&scored_candidates)?;

        // 5. Generate cryptographic receipt
        let receipt = self.trust_bridge.create_receipt(
            &winner,
            &task,
            &contract,
            &scored_candidates,
        )?;

        // 6. Collect telemetry
        let elapsed = start_time.elapsed();
        let telemetry = Telemetry::new(
            &winner,
            &scored_candidates,
            elapsed,
        );

        // 7. Update routing engine with feedback
        {
            let mut engine = self.routing_engine.write().await;
            engine.update_win_rates(&winner.model, winner.scores.ihsan);
        }

        Ok(OrchestratorResult {
            winner,
            telemetry,
            receipt: Some(receipt),
        })
    }

    /// Mock candidate generation (replace with actual LLM API calls in production)
    async fn mock_generate_candidates(
        &self,
        routes: &[Route],
        contract: &Contract,
    ) -> Result<Vec<Candidate>> {
        // In production, this would make parallel API calls to LLM providers
        // For now, we generate mock candidates for testing
        
        let mut candidates = Vec::new();
        
        for route in routes {
            let candidate = Candidate {
                model: format!("model-{}", candidates.len() + 1),
                json: serde_json::json!({
                    "name": "synthesized_result",
                    "value": 42 + candidates.len(),
                    "quality": "high",
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                }),
                scores: CandidateScores::default(),
                cost_usd: 0.01 * (candidates.len() + 1) as f32,
                latency_ms: 1200 + (candidates.len() as u32 * 100),
            };
            candidates.push(candidate);
        }
        
        Ok(candidates)
    }

    /// Get current routing statistics
    pub async fn get_routing_stats(&self) -> Vec<(String, WinRate)> {
        let engine = self.routing_engine.read().await;
        engine.get_win_rates()
    }

    /// Verify a previously generated receipt
    pub fn verify_receipt(&self, receipt: &RunReceipt) -> bool {
        self.trust_bridge.verify_receipt(receipt)
    }
}

/// Configuration for the orchestrator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorConfig {
    /// Consensus strategy configuration
    pub consensus: ConsensusConfig,
    
    /// Enable/disable telemetry collection
    #[serde(default = "default_true")]
    pub enable_telemetry: bool,
    
    /// Enable/disable cryptographic receipts
    #[serde(default = "default_true")]
    pub enable_receipts: bool,
}

impl Default for OrchestratorConfig {
    fn default() -> Self {
        Self {
            consensus: ConsensusConfig::default(),
            enable_telemetry: true,
            enable_receipts: true,
        }
    }
}

fn default_true() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_orchestrator_creation() {
        let orchestrator = Orchestrator::new();
        assert!(orchestrator.is_ok());
    }

    #[tokio::test]
    async fn test_basic_synthesis() {
        let orchestrator = Orchestrator::new().unwrap();
        let task = Task::example();
        let contract = Contract::example();
        
        let result = orchestrator.synthesize(task, contract).await;
        assert!(result.is_ok());
        
        let result = result.unwrap();
        assert!(result.winner.scores.ihsan >= 0.85);
        assert!(result.telemetry.sli_metrics.json_compliance_rate > 0.0);
    }

    #[tokio::test]
    async fn test_receipt_verification() {
        let orchestrator = Orchestrator::new().unwrap();
        let task = Task::example();
        let contract = Contract::example();
        
        let result = orchestrator.synthesize(task, contract).await.unwrap();
        
        if let Some(receipt) = result.receipt {
            assert!(orchestrator.verify_receipt(&receipt));
        }
    }

    #[tokio::test]
    async fn test_routing_stats() {
        let orchestrator = Orchestrator::new().unwrap();
        let task = Task::example();
        let contract = Contract::example();
        
        // Run synthesis to generate some stats
        let _ = orchestrator.synthesize(task, contract).await;
        
        let stats = orchestrator.get_routing_stats().await;
        assert!(!stats.is_empty());
    }
}
