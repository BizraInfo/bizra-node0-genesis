//! Core type definitions for the synthesis orchestrator
//!
//! This module provides all the fundamental types used throughout the system.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a synthesis task with optional examples
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    /// Task classification (used for routing)
    #[serde(default)]
    pub task_class: TaskClass,
    
    /// Optional example inputs/outputs for few-shot learning
    pub examples: Option<Vec<serde_json::Value>>,
    
    /// Task metadata
    #[serde(default)]
    pub metadata: HashMap<String, String>,
}

impl Task {
    /// Create an example task for testing
    pub fn example() -> Self {
        Self {
            task_class: TaskClass::default(),
            examples: Some(vec![serde_json::json!({
                "name": "example_task",
                "input": "test input",
                "expected_output": "test output"
            })]),
            metadata: HashMap::new(),
        }
    }
}

/// Task classification for routing decisions
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TaskClass {
    /// General-purpose tasks
    #[default]
    General,
    
    /// Code generation and programming tasks
    Code,
    
    /// Mathematical reasoning
    Math,
    
    /// Creative writing
    Creative,
    
    /// Analysis and summarization
    Analysis,
}

/// Contract specifying requirements and constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contract {
    /// JSON schema for output validation
    pub schema_json: String,
    
    /// Invariants that must hold
    pub invariants: Vec<Invariant>,
    
    /// Example outputs
    pub examples: Vec<serde_json::Value>,
    
    /// Token budget constraint
    pub token_budget: u32,
    
    /// Cost budget (USD)
    #[serde(default)]
    pub cost_budget: Option<f32>,
    
    /// Latency budget (milliseconds)
    #[serde(default)]
    pub latency_budget: Option<u32>,
}

impl Contract {
    /// Create a new empty contract
    pub fn new() -> Self {
        Self {
            schema_json: String::new(),
            invariants: Vec::new(),
            examples: Vec::new(),
            token_budget: 512,
            cost_budget: None,
            latency_budget: None,
        }
    }
    
    /// Create an example contract for testing
    pub fn example() -> Self {
        let mut contract = Self::new();
        contract.schema_json = r#"{"type": "object", "properties": {"name": {"type": "string"}}}"#.to_string();
        contract.invariants = vec![Invariant];
        contract.examples = vec![serde_json::json!({"name": "test"})];
        contract.token_budget = 1024;
        contract.cost_budget = Some(0.10);
        contract.latency_budget = Some(5000);
        contract
    }
}

impl Default for Contract {
    fn default() -> Self {
        Self::new()
    }
}

/// Placeholder for invariant specifications
/// In production, this would be a rich AST or constraint system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invariant;

/// A candidate response from a model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Candidate {
    /// Model identifier (e.g., "gpt-4", "claude-3-opus")
    pub model: String,
    
    /// Generated JSON output
    pub json: serde_json::Value,
    
    /// Quality scores
    pub scores: CandidateScores,
    
    /// Cost in USD
    pub cost_usd: f32,
    
    /// Latency in milliseconds
    pub latency_ms: u32,
}

impl Candidate {
    /// Create an example candidate for testing
    pub fn example() -> Self {
        Self {
            model: "test-model".to_string(),
            json: serde_json::json!({
                "name": "test",
                "value": 42,
                "quality": "high"
            }),
            scores: CandidateScores::default(),
            cost_usd: 0.01,
            latency_ms: 1200,
        }
    }
}

/// Quality scores for a candidate
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CandidateScores {
    /// Accuracy/correctness score [0.0, 1.0]
    pub accuracy: f32,
    
    /// Safety score [0.0, 1.0]
    pub safety: f32,
    
    /// Efficiency score [0.0, 1.0]
    pub efficiency: f32,
    
    /// Overall Ihsān quality score [0.0, 1.0]
    pub ihsan: f32,
}

/// A scored candidate ready for consensus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoredCandidate {
    /// The underlying candidate
    pub candidate: Candidate,
    
    /// Computed scores
    pub scores: CandidateScores,
}

impl ScoredCandidate {
    /// Create a high-quality scored candidate for testing
    pub fn high_quality() -> Self {
        let mut scores = CandidateScores::default();
        scores.accuracy = 0.95;
        scores.safety = 0.98;
        scores.efficiency = 0.90;
        scores.ihsan = 0.96;
        
        Self {
            candidate: Candidate::example(),
            scores,
        }
    }
    
    /// Create a medium-quality scored candidate for testing
    pub fn medium_quality() -> Self {
        let mut scores = CandidateScores::default();
        scores.accuracy = 0.80;
        scores.safety = 0.90;
        scores.efficiency = 0.85;
        scores.ihsan = 0.85;
        
        Self {
            candidate: Candidate::example(),
            scores,
        }
    }
    
    /// Create a low-quality scored candidate for testing
    pub fn low_quality() -> Self {
        let mut scores = CandidateScores::default();
        scores.accuracy = 0.60;
        scores.safety = 0.80;
        scores.efficiency = 0.80;
        scores.ihsan = 0.70;
        
        Self {
            candidate: Candidate::example(),
            scores,
        }
    }
    
    /// High accuracy specialist
    pub fn high_accuracy() -> Self {
        let mut sc = Self::high_quality();
        sc.scores.accuracy = 0.98;
        sc
    }
    
    /// High efficiency specialist
    pub fn high_efficiency() -> Self {
        let mut sc = Self::high_quality();
        sc.scores.efficiency = 0.95;
        sc
    }
    
    /// High safety specialist
    pub fn high_safety() -> Self {
        let mut sc = Self::high_quality();
        sc.scores.safety = 0.995;
        sc
    }
    
    /// Balanced generalist
    pub fn balanced() -> Self {
        Self::medium_quality()
    }
    
    /// High cost, high accuracy
    pub fn high_cost_high_accuracy() -> Self {
        Self::high_accuracy()
    }
    
    /// Low cost, low accuracy
    pub fn low_cost_low_accuracy() -> Self {
        Self::low_quality()
    }
}

/// Result of the orchestration process
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorResult {
    /// The winning candidate
    pub winner: Candidate,
    
    /// Telemetry and metrics
    pub telemetry: Telemetry,
    
    /// Optional cryptographic receipt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt: Option<RunReceipt>,
}

/// Telemetry data collected during synthesis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Telemetry {
    /// SLI (Service Level Indicator) metrics
    pub sli_metrics: Sli,
    
    /// Quality metrics
    pub quality_metrics: Quality,
    
    /// Performance metrics
    #[serde(default)]
    pub performance: PerformanceMetrics,
}

        

/// Service Level Indicators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sli {
    /// Rate of valid JSON outputs
    pub json_compliance_rate: f32,
}

/// Quality metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quality {
    /// Improvement over average
    pub accuracy_uplift: f32,
}

/// Performance metrics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// Total latency in milliseconds
    pub latency_ms: u32,
    
    /// Number of candidates generated
    pub candidates_generated: usize,
}

/// Routing configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    /// Model identifier
    pub model_id: String,
    
    /// Route priority
    pub priority: f32,
}

impl Route {
    /// Example route 1
    pub fn example1() -> Self {
        Self {
            model_id: "gpt-4".to_string(),
            priority: 0.9,
        }
    }
    
    /// Example route 2
    pub fn example2() -> Self {
        Self {
            model_id: "claude-3-opus".to_string(),
            priority: 0.85,
        }
    }
    
    /// Example route 3
    pub fn example3() -> Self {
        Self {
            model_id: "gemini-pro".to_string(),
            priority: 0.8,
        }
    }
}

/// Consensus strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusConfig {
    /// Minimum Ihsān score threshold
    pub ihsan_floor: f32,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            ihsan_floor: 0.85,
        }
    }
}

/// Errors that can occur during consensus
#[derive(Debug, thiserror::Error)]
pub enum ConsensusError {
    /// No candidates provided
    #[error("no candidates provided for consensus")]
    NoCandidates,
    
    /// All candidates failed Ihsān threshold
    #[error("all candidates failed ihsan threshold")]
    AllCandidatesFailedIhsan,
    
    /// No candidate meets threshold
    #[error("no candidate above threshold")]
    NoCandidateAboveThreshold,
    
    /// Empty Pareto front
    #[error("empty pareto front")]
    EmptyParetoFront,
}

/// Baseline metrics for A/B testing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaselineMetrics {
    /// Baseline accuracy
    pub accuracy: f32,
}

/// Experiment metrics for A/B testing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentMetrics {
    /// Experiment accuracy
    pub accuracy: f32,
}

/// A/B test results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ABTestResult {
    /// Accuracy improvement
    pub accuracy_uplift: f32,
    
    /// Cost comparison
    pub cost_comparison: f32,
    
    /// Latency comparison
    pub latency_comparison: f32,
    
    /// Statistical significance
    pub statistical_significance: f32,
}

/// Latency metrics by percentile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyMetrics {
    /// 95th percentile latency
    pub p95: u32,
    
    /// 99th percentile latency
    pub p99: u32,
}

impl LatencyMetrics {
    /// Get current latency metrics
    pub fn current() -> Self {
        Self {
            p95: 3200,
            p99: 4500,
        }
    }
}

/// Optimization strategies
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum OptimizationStrategy {
    /// Connection pooling
    ConnectionPooling,
    
    /// Request batching
    RequestBatching,
    
    /// Early termination
    EarlyTermination,
}

/// Concrete optimization actions
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum OptimizationAction {
    /// Enable early termination
    EnableEarlyTermination,
    
    /// Increase connection pool size
    IncreaseConnectionPoolSize,
    
    /// Implement request deduplication
    ImplementRequestDeduplication,
    
    /// Enable request batching
    EnableRequestBatching,
    
    /// Optimize JSON parsing
    OptimizeJsonParsing,
    
    /// Enable io_uring
    EnableIoUring,
    
    /// Zero-copy buffers
    ZeroCopyBuffers,
    
    /// Memory pool allocation
    MemoryPoolAllocation,
    
    /// SIMD JSON parsing
    SIMDJsonParsing,
}

/// Win rate tracking for routing
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WinRate {
    /// Number of wins
    pub wins: u32,
    
    /// Total samples
    pub samples: u32,
}

impl WinRate {
    /// Calculate win rate as a ratio
    pub fn rate(&self) -> f32 {
        if self.samples == 0 {
            0.5
        } else {
            self.wins as f32 / self.samples as f32
        }
    }
    
    /// Record a new outcome
    pub fn record(&mut self, won: bool) {
        self.samples += 1;
        if won {
            self.wins += 1;
        }
    }
}

/// Cryptographic run receipt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunReceipt {
    /// Unique run identifier
    pub run_id: String,
    
    /// SHA-256 hash of inputs
    pub inputs_sha256: String,
    
    /// Winning model identifier
    pub winner_model: String,
    
    /// SHA-256 hash of winner JSON
    pub winner_json_sha256: String,
    
    /// BLAKE3 consensus hash
    pub consensus_hash_hex: String,
    
    /// Policy version
    pub policy_version: String,
    
    /// Pattern pack SHA-256
    pub pattern_pack_sha256: String,
    
    /// Timestamp in milliseconds since Unix epoch
    pub timestamp_ms: u64,
    
    /// Public key (DER format)
    pub public_key_der: Vec<u8>,
    
    /// Ed25519 signature
    pub signature: Vec<u8>,
}

/// Errors that can occur during parsing
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    /// SIMD JSON error
    #[error("simd-json error: {0}")]
    SimdJson(#[from] simd_json::Error),
    
    /// Unbalanced JSON
    #[error("unbalanced json")]
    UnbalancedJson,
    
    /// Standard JSON error (fallback)
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Errors during schema compilation
#[derive(Debug, thiserror::Error)]
pub enum CompileError {
    /// Schema error
    #[error("schema compilation error")]
    Schema,
}

/// Schema validation errors
#[derive(Debug, thiserror::Error)]
pub enum SchemaError {
    /// Invalid example format
    #[error("invalid example format")]
    InvalidExampleFormat,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_creation() {
        let task = Task::example();
        assert!(task.examples.is_some());
    }

    #[test]
    fn test_contract_creation() {
        let contract = Contract::example();
        assert!(!contract.schema_json.is_empty());
        assert!(!contract.invariants.is_empty());
    }

    #[test]
    fn test_win_rate() {
        let mut wr = WinRate::default();
        assert_eq!(wr.rate(), 0.5); // Default when no samples
        
        wr.record(true);
        assert_eq!(wr.rate(), 1.0);
        
        wr.record(false);
        assert_eq!(wr.rate(), 0.5);
    }

    #[test]
    fn test_candidate_creation() {
        let candidate = Candidate::example();
        assert_eq!(candidate.model, "test-model");
    }
}
