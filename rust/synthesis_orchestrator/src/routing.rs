//! Routing engine with Thompson sampling
//!
//! Implements intelligent model selection using:
//! - Thompson sampling with Beta distribution
//! - Win rate tracking per model
//! - Exploration vs exploitation balance
//!
//! Week-2 fixes applied:
//! - ✓ Thompson sampling uses rand_distr::Beta with f64
//! - ✓ Proper alpha/beta parameters
//! - ✓ Exploration factor for cold-start

use crate::types::{Route, Task, TaskClass, WinRate};
use anyhow::Result;
use rand::Rng;
use rand_distr::{Beta, Distribution};
use std::collections::HashMap;

/// Routing strategies available
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoutingStrategy {
    /// Thompson sampling (default)
    Thompson,
    
    /// Epsilon-greedy
    EpsilonGreedy,
    
    /// UCB (Upper Confidence Bound)
    Ucb,
}

/// Routing engine for model selection
#[derive(Debug, Clone)]
pub struct RoutingEngine {
    /// Win rates per model
    win_rates: HashMap<String, WinRate>,
    
    /// Routing strategy
    strategy: RoutingStrategy,
    
    /// Exploration factor (for cold-start)
    exploration_factor: f32,
}

impl RoutingEngine {
    /// Create new routing engine
    pub fn new() -> Self {
        Self {
            win_rates: HashMap::new(),
            strategy: RoutingStrategy::Thompson,
            exploration_factor: 0.1,
        }
    }

    /// Create with custom strategy
    pub fn with_strategy(strategy: RoutingStrategy) -> Self {
        Self {
            win_rates: HashMap::new(),
            strategy,
            exploration_factor: 0.1,
        }
    }

    /// Select best routes for a task
    ///
    /// # Errors
    ///
    /// Returns an error if routing logic fails
    pub fn select_routes(&mut self, task: &Task, n: usize) -> Result<Vec<Route>> {
        // Get available models for this task class
        let models = self.get_models_for_task_class(task.task_class);

        // Ensure we have win rate tracking for all models
        for model in &models {
            self.win_rates.entry(model.clone()).or_default();
        }

        // Score each model based on strategy
        let mut scored_models: Vec<(String, f32)> = models
            .iter()
            .map(|model| {
                let score = match self.strategy {
                    RoutingStrategy::Thompson => self.thompson_sample(model),
                    RoutingStrategy::EpsilonGreedy => self.epsilon_greedy(model),
                    RoutingStrategy::Ucb => self.ucb_score(model),
                };
                (model.clone(), score)
            })
            .collect();

        // Sort by score descending
        scored_models.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        // Take top N
        let routes: Vec<Route> = scored_models
            .into_iter()
            .take(n)
            .map(|(model_id, priority)| Route { model_id, priority })
            .collect();

        Ok(routes)
    }

    /// Thompson sampling with Beta distribution
    ///
    /// Week-2 fix: Uses rand_distr::Beta which expects f64 parameters
    fn thompson_sample(&self, model: &str) -> f32 {
        let win_rate = self.win_rates.get(model).cloned().unwrap_or_default();

        // Cold-start: add exploration bonus if few samples
        if win_rate.samples == 0 {
            return 0.5 + self.exploration_factor;
        }

        // Beta distribution parameters (convert u32 to f64 for rand_distr)
        let alpha = (win_rate.wins as f64) + 1.0;
        let beta_param = ((win_rate.samples - win_rate.wins) as f64) + 1.0;

        // Sample from Beta(alpha, beta)
        let dist = Beta::new(alpha, beta_param).expect("valid beta parameters");
        let sample = dist.sample(&mut rand::thread_rng());

        sample as f32
    }

    /// Epsilon-greedy strategy
    fn epsilon_greedy(&self, model: &str) -> f32 {
        let win_rate = self.win_rates.get(model).cloned().unwrap_or_default();
        let epsilon = 0.1;

        let mut rng = rand::thread_rng();
        if rng.gen::<f32>() < epsilon {
            // Explore: random score
            rng.gen()
        } else {
            // Exploit: use win rate
            win_rate.rate()
        }
    }

    /// UCB (Upper Confidence Bound) score
    fn ucb_score(&self, model: &str) -> f32 {
        let win_rate = self.win_rates.get(model).cloned().unwrap_or_default();

        if win_rate.samples == 0 {
            return f32::INFINITY; // Always try untested models
        }

        let total_samples: u32 = self.win_rates.values().map(|wr| wr.samples).sum();
        let avg_reward = win_rate.rate();
        let exploration_term = (2.0 * (total_samples as f32).ln() / win_rate.samples as f32).sqrt();

        avg_reward + 1.0 * exploration_term
    }

    /// Update win rates based on outcome
    pub fn update_win_rates(&mut self, model: &str, ihsan_score: f32) {
        let win_rate = self.win_rates.entry(model.to_string()).or_default();

        // Consider it a "win" if Ihsān score > 0.85
        let won = ihsan_score > 0.85;
        win_rate.record(won);
    }

    /// Get win rates for all models
    pub fn get_win_rates(&self) -> Vec<(String, WinRate)> {
        self.win_rates
            .iter()
            .map(|(model, wr)| (model.clone(), wr.clone()))
            .collect()
    }

    /// Get available models for a task class
    fn get_models_for_task_class(&self, task_class: TaskClass) -> Vec<String> {
        // In production, this would query a model registry
        // For now, return mock models based on task class
        match task_class {
            TaskClass::General => vec![
                "gpt-4".to_string(),
                "claude-3-opus".to_string(),
                "gemini-pro".to_string(),
            ],
            TaskClass::Code => vec![
                "gpt-4".to_string(),
                "claude-3-opus".to_string(),
                "codellama-70b".to_string(),
            ],
            TaskClass::Math => vec![
                "gpt-4".to_string(),
                "claude-3-opus".to_string(),
                "minerva-540b".to_string(),
            ],
            TaskClass::Creative => vec![
                "claude-3-opus".to_string(),
                "gpt-4".to_string(),
                "palm-2".to_string(),
            ],
            TaskClass::Analysis => vec![
                "gpt-4".to_string(),
                "claude-3-opus".to_string(),
                "gemini-pro".to_string(),
            ],
        }
    }

    /// Set exploration factor
    pub fn set_exploration_factor(&mut self, factor: f32) {
        self.exploration_factor = factor.clamp(0.0, 1.0);
    }
}

impl Default for RoutingEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routing_engine_creation() {
        let engine = RoutingEngine::new();
        assert_eq!(engine.strategy, RoutingStrategy::Thompson);
    }

    #[test]
    fn test_select_routes() {
        let mut engine = RoutingEngine::new();
        let task = Task::example();

        let routes = engine.select_routes(&task, 3);
        assert!(routes.is_ok());

        let routes = routes.unwrap();
        assert_eq!(routes.len(), 3);
        assert!(routes.iter().all(|r| !r.model_id.is_empty()));
    }

    #[test]
    fn test_thompson_sampling() {
        let engine = RoutingEngine::new();
        
        // Cold-start should give exploration bonus
        let score = engine.thompson_sample("new-model");
        assert!(score > 0.5); // Has exploration factor
    }

    #[test]
    fn test_win_rate_update() {
        let mut engine = RoutingEngine::new();
        
        // Record some wins
        engine.update_win_rates("model-a", 0.95); // Win
        engine.update_win_rates("model-a", 0.90); // Win
        engine.update_win_rates("model-a", 0.75); // Loss
        
        let win_rates = engine.get_win_rates();
        let model_a = win_rates.iter().find(|(m, _)| m == "model-a").unwrap();
        
        assert_eq!(model_a.1.samples, 3);
        assert_eq!(model_a.1.wins, 2);
        assert!((model_a.1.rate() - 0.666).abs() < 0.01);
    }

    #[test]
    fn test_epsilon_greedy() {
        let mut engine = RoutingEngine::with_strategy(RoutingStrategy::EpsilonGreedy);
        
        // Add some win rate history
        engine.update_win_rates("model-a", 0.95);
        engine.update_win_rates("model-a", 0.90);
        
        let score = engine.epsilon_greedy("model-a");
        assert!(score >= 0.0 && score <= 1.0);
    }

    #[test]
    fn test_ucb_score() {
        let mut engine = RoutingEngine::with_strategy(RoutingStrategy::Ucb);
        
        // Untested model should have max score
        let score = engine.ucb_score("untested");
        assert_eq!(score, f32::INFINITY);
        
        // Tested model should have finite score
        engine.update_win_rates("tested", 0.90);
        let score = engine.ucb_score("tested");
        assert!(score.is_finite());
    }

    #[test]
    fn test_task_class_models() {
        let engine = RoutingEngine::new();
        
        let code_models = engine.get_models_for_task_class(TaskClass::Code);
        assert!(code_models.contains(&"codellama-70b".to_string()));
        
        let math_models = engine.get_models_for_task_class(TaskClass::Math);
        assert!(math_models.contains(&"minerva-540b".to_string()));
    }

    #[test]
    fn test_exploration_factor() {
        let mut engine = RoutingEngine::new();
        
        engine.set_exploration_factor(0.2);
        assert_eq!(engine.exploration_factor, 0.2);
        
        // Should clamp to valid range
        engine.set_exploration_factor(1.5);
        assert_eq!(engine.exploration_factor, 1.0);
    }

    #[test]
    fn test_multiple_routes_selection() {
        let mut engine = RoutingEngine::new();
        let task = Task::example();

        // Select different numbers of routes
        let routes_1 = engine.select_routes(&task, 1).unwrap();
        assert_eq!(routes_1.len(), 1);

        let routes_3 = engine.select_routes(&task, 3).unwrap();
        assert_eq!(routes_3.len(), 3);

        // Routes should be ordered by score
        assert!(routes_3[0].priority >= routes_3[1].priority);
        assert!(routes_3[1].priority >= routes_3[2].priority);
    }
}
