//! Telemetry and metrics collection
//!
//! Tracks performance and quality metrics during synthesis.

use crate::types::{Candidate, PerformanceMetrics, Quality, Sli, ScoredCandidate, Telemetry};

impl Telemetry {
    /// Create telemetry from synthesis results
    pub fn new(
        winner: &Candidate,
        candidates: &[ScoredCandidate],
        elapsed: std::time::Duration,
    ) -> Self {
        let json_compliance_rate = candidates
            .iter()
            .filter(|c| c.scores.accuracy > 0.8)
            .count() as f32
            / candidates.len() as f32;

        let avg_accuracy: f32 = candidates
            .iter()
            .map(|c| c.scores.accuracy)
            .sum::<f32>()
            / candidates.len() as f32;

        Self {
            sli_metrics: Sli {
                json_compliance_rate,
            },
            quality_metrics: Quality {
                accuracy_uplift: winner.scores.accuracy - avg_accuracy,
            },
            performance: PerformanceMetrics {
                latency_ms: elapsed.as_millis() as u32,
                candidates_generated: candidates.len(),
            },
        }
    }

    /// Export telemetry as JSON
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "sli": {
                "json_compliance_rate": self.sli_metrics.json_compliance_rate,
            },
            "quality": {
                "accuracy_uplift": self.quality_metrics.accuracy_uplift,
            },
            "performance": {
                "latency_ms": self.performance.latency_ms,
                "candidates_generated": self.performance.candidates_generated,
            },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_telemetry_creation() {
        let winner = Candidate::example();
        let candidates = vec![
            ScoredCandidate::high_quality(),
            ScoredCandidate::medium_quality(),
        ];
        let elapsed = Duration::from_millis(1500);

        let telemetry = Telemetry::new(&winner, &candidates, elapsed);

        assert!(telemetry.sli_metrics.json_compliance_rate > 0.0);
        assert_eq!(telemetry.performance.latency_ms, 1500);
        assert_eq!(telemetry.performance.candidates_generated, 2);
    }

    #[test]
    fn test_telemetry_json_export() {
        let winner = Candidate::example();
        let candidates = vec![ScoredCandidate::high_quality()];
        let elapsed = Duration::from_secs(2);

        let telemetry = Telemetry::new(&winner, &candidates, elapsed);
        let json = telemetry.to_json();

        assert!(json.is_object());
        assert!(json.get("sli").is_some());
        assert!(json.get("quality").is_some());
        assert!(json.get("performance").is_some());
    }
}
