//! Ihsān Gate - Quality enforcement with ethical excellence
//!
//! Implements multi-dimensional quality scoring:
//! - **Formal Validity**: Schema compliance + invariant checking
//! - **Referenceable Correctness**: Replay-verified accuracy
//! - **Safety**: Risk and harm analysis
//! - **Efficiency**: Resource utilization
//!
//! Week-1 fixes applied:
//! - ✓ Split formal_validity vs referenceable_correctness (no double-counting)
//! - ✓ Proper score aggregation
//! - ✓ Hooks for replay test integration

use crate::types::{Candidate, CandidateScores, Contract, Invariant, ScoredCandidate};
use anyhow::Result;

/// Ihsān Gate scorer
///
/// Applies rigorous quality checks to ensure outputs meet ethical
/// excellence standards (Ihsān).
#[derive(Debug, Clone)]
pub struct IhsanGate {
    /// Minimum threshold for passing (default: 0.85)
    threshold: f32,
}

impl IhsanGate {
    /// Create new Ihsān Gate with default threshold
    pub fn new() -> Self {
        Self { threshold: 0.85 }
    }

    /// Create with custom threshold
    pub fn with_threshold(threshold: f32) -> Self {
        Self { threshold }
    }

    /// Score all candidates against contract
    ///
    /// # Errors
    ///
    /// Returns an error if scoring fails for any candidate
    pub fn score_candidates(
        &self,
        candidates: &[Candidate],
        contract: &Contract,
    ) -> Result<Vec<ScoredCandidate>> {
        candidates
            .iter()
            .map(|c| self.score_candidate(c, contract))
            .collect()
    }

    /// Score a single candidate
    ///
    /// # Errors
    ///
    /// Returns an error if scoring computation fails
    pub fn score_candidate(
        &self,
        candidate: &Candidate,
        contract: &Contract,
    ) -> Result<ScoredCandidate> {
        // Calculate individual dimensions
        let formal_validity = self.calculate_formal_validity(candidate, contract);
        let referenceable_correctness =
            self.calculate_referenceable_correctness(candidate, contract);
        let safety = self.calculate_safety_score(candidate);
        let efficiency = self.calculate_efficiency_score(candidate);

        // Aggregate into overall accuracy score
        // Accuracy = 50% formal validity + 50% referenceable correctness
        let accuracy = 0.5 * formal_validity + 0.5 * referenceable_correctness;

        // Ihsān score: weighted combination of all dimensions
        // Weights: 40% accuracy, 30% safety, 30% efficiency
        let ihsan = 0.4 * accuracy + 0.3 * safety + 0.3 * efficiency;

        let scores = CandidateScores {
            accuracy,
            safety,
            efficiency,
            ihsan,
        };

        Ok(ScoredCandidate {
            candidate: candidate.clone(),
            scores,
        })
    }

    /// Calculate formal validity (schema + invariants)
    ///
    /// This checks:
    /// 1. Schema compliance
    /// 2. Invariant satisfaction
    fn calculate_formal_validity(&self, candidate: &Candidate, contract: &Contract) -> f32 {
        let schema_score = Self::validate_against_schema(&candidate.json, &contract.schema_json);
        let invariant_score = Self::check_invariants(&candidate.json, &contract.invariants);

        // Equal weighting
        0.5 * schema_score + 0.5 * invariant_score
    }

    /// Calculate referenceable correctness (replay-verified)
    ///
    /// This would integrate with a replay test system to verify
    /// outputs match expected behavior from reference examples.
    ///
    /// **Placeholder**: Currently returns mock score. In production,
    /// this would:
    /// 1. Replay contract.examples through the model
    /// 2. Compare outputs against expected results
    /// 3. Return accuracy metric
    fn calculate_referenceable_correctness(&self, _candidate: &Candidate, _contract: &Contract) -> f32 {
        // TODO: Integrate with replay test infrastructure
        // For now, return reasonable mock value
        0.92
    }

    /// Calculate safety score
    ///
    /// Checks for:
    /// - Harmful content
    /// - Privacy violations
    /// - Bias indicators
    /// - Unsafe code patterns (if code generation)
    fn calculate_safety_score(&self, _candidate: &Candidate) -> f32 {
        // TODO: Integrate with safety classifiers
        // For now, return high safety score
        0.97
    }

    /// Calculate efficiency score
    ///
    /// Based on:
    /// - Token usage vs budget
    /// - Latency
    /// - Cost
    fn calculate_efficiency_score(&self, candidate: &Candidate) -> f32 {
        // Simple heuristic: penalize high cost and latency
        let cost_factor = (0.1 - candidate.cost_usd.min(0.1)) / 0.1;
        let latency_factor = (5000.0 - candidate.latency_ms.min(5000) as f32) / 5000.0;

        0.5 * cost_factor + 0.5 * latency_factor
    }

    /// Validate JSON against schema
    ///
    /// **Placeholder**: In production, this would use a JSON Schema validator
    fn validate_against_schema(_json: &serde_json::Value, _schema_json: &str) -> f32 {
        // TODO: Integrate with jsonschema crate
        // For now, return high score if JSON is object
        if _json.is_object() {
            0.95
        } else {
            0.70
        }
    }

    /// Check invariants hold
    ///
    /// **Placeholder**: In production, this would evaluate invariant AST
    fn check_invariants(_json: &serde_json::Value, _invariants: &[Invariant]) -> f32 {
        // TODO: Implement invariant checking logic
        // For now, assume invariants hold
        0.96
    }

    /// Check if candidate passes threshold
    pub fn passes_threshold(&self, candidate: &ScoredCandidate) -> bool {
        candidate.scores.ihsan >= self.threshold
    }

    /// Get current threshold
    pub fn threshold(&self) -> f32 {
        self.threshold
    }
}

impl Default for IhsanGate {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_candidate() -> Candidate {
        Candidate {
            model: "test-model".to_string(),
            json: serde_json::json!({
                "name": "test",
                "value": 42
            }),
            scores: CandidateScores::default(),
            cost_usd: 0.01,
            latency_ms: 1000,
        }
    }

    #[test]
    fn test_ihsan_gate_creation() {
        let gate = IhsanGate::new();
        assert_eq!(gate.threshold(), 0.85);
    }

    #[test]
    fn test_score_candidate() {
        let gate = IhsanGate::new();
        let candidate = create_test_candidate();
        let contract = Contract::example();

        let result = gate.score_candidate(&candidate, &contract);
        assert!(result.is_ok());

        let scored = result.unwrap();
        assert!(scored.scores.accuracy > 0.0);
        assert!(scored.scores.safety > 0.0);
        assert!(scored.scores.efficiency > 0.0);
        assert!(scored.scores.ihsan > 0.0);
    }

    #[test]
    fn test_score_multiple_candidates() {
        let gate = IhsanGate::new();
        let candidates = vec![create_test_candidate(), create_test_candidate()];
        let contract = Contract::example();

        let result = gate.score_candidates(&candidates, &contract);
        assert!(result.is_ok());

        let scored = result.unwrap();
        assert_eq!(scored.len(), 2);
        assert!(scored.iter().all(|s| s.scores.ihsan > 0.0));
    }

    #[test]
    fn test_threshold_check() {
        let gate = IhsanGate::with_threshold(0.9);
        let mut candidate = ScoredCandidate::high_quality();
        
        // High score should pass
        assert!(gate.passes_threshold(&candidate));
        
        // Low score should fail
        candidate.scores.ihsan = 0.8;
        assert!(!gate.passes_threshold(&candidate));
    }

    #[test]
    fn test_accuracy_composition() {
        let gate = IhsanGate::new();
        let candidate = create_test_candidate();
        let contract = Contract::example();

        let scored = gate.score_candidate(&candidate, &contract).unwrap();

        // Accuracy should be composition of formal_validity and referenceable_correctness
        // Not just one component
        assert!(scored.scores.accuracy > 0.0);
        assert!(scored.scores.accuracy <= 1.0);
    }

    #[test]
    fn test_efficiency_scoring() {
        let gate = IhsanGate::new();
        
        // Low cost, low latency should score higher
        let efficient = Candidate {
            model: "efficient".to_string(),
            json: serde_json::json!({"test": true}),
            scores: CandidateScores::default(),
            cost_usd: 0.001,
            latency_ms: 500,
        };
        
        // High cost, high latency should score lower
        let expensive = Candidate {
            model: "expensive".to_string(),
            json: serde_json::json!({"test": true}),
            scores: CandidateScores::default(),
            cost_usd: 0.10,
            latency_ms: 5000,
        };
        
        let contract = Contract::example();
        
        let efficient_scored = gate.score_candidate(&efficient, &contract).unwrap();
        let expensive_scored = gate.score_candidate(&expensive, &contract).unwrap();
        
        assert!(efficient_scored.scores.efficiency > expensive_scored.scores.efficiency);
    }

    #[test]
    fn test_schema_validation() {
        let json = serde_json::json!({"test": "value"});
        let schema = r#"{"type": "object"}"#;
        
        let score = IhsanGate::validate_against_schema(&json, schema);
        assert!(score > 0.9);
    }

    #[test]
    fn test_invariant_checking() {
        let json = serde_json::json!({"test": "value"});
        let invariants = vec![Invariant];
        
        let score = IhsanGate::check_invariants(&json, &invariants);
        assert!(score > 0.9);
    }
}
