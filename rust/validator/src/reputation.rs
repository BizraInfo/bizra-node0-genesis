//! Reputation tracking with decay and historical performance
//!
//! Implements reputation scoring as specified in spec section 5.8

/// Reputation tracker with decay
pub struct ReputationTracker {
    /// Decay factor per epoch (spec: 0.95)
    decay_factor: f64,
}

impl ReputationTracker {
    /// Create new reputation tracker
    pub fn new() -> Self {
        Self {
            decay_factor: 0.95,
        }
    }

    /// Calculate reputation decay for given epochs
    pub fn apply_decay(&self, current_score: u64, epochs_passed: u64) -> u64 {
        let mut score = current_score as f64;
        for _ in 0..epochs_passed {
            score *= self.decay_factor;
        }
        score as u64
    }
}

impl Default for ReputationTracker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reputation_decay() {
        let tracker = ReputationTracker::new();

        // 1 epoch: 10000 * 0.95 = 9500
        assert_eq!(tracker.apply_decay(10000, 1), 9500);

        // 2 epochs: 10000 * 0.95^2 = 9025
        assert_eq!(tracker.apply_decay(10000, 2), 9025);

        // 10 epochs: significant decay
        let decayed = tracker.apply_decay(10000, 10);
        assert!(decayed < 6000); // ~5987
    }
}
