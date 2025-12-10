//! Network Configuration با احسان
//!
//! Defines all configuration parameters for BIZRA P2P network.

use anyhow::{bail, Result};
use libp2p::Multiaddr;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// BIZRA Network Configuration
///
/// احسان-compliant configuration with explicit validation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Addresses to listen on for incoming connections
    pub listen_addresses: Vec<Multiaddr>,

    /// Maximum number of peers to connect to
    pub max_peers: usize,

    /// Connection timeout duration
    pub connection_timeout: Duration,

    /// Heartbeat interval for peer health checks
    pub heartbeat_interval: Duration,

    /// Gossipsub configuration
    pub gossip_config: GossipConfig,

    /// Kademlia DHT configuration
    pub kad_config: KademliaConfig,
}

/// Gossipsub Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GossipConfig {
    /// Topic for block propagation
    pub block_topic: String,

    /// Topic for transaction propagation
    pub tx_topic: String,

    /// Message validation mode
    pub validation_mode: ValidationMode,

    /// Heartbeat interval (seconds)
    pub heartbeat_interval_secs: u64,
}

/// Kademlia DHT Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KademliaConfig {
    /// Enable automatic bootstrap
    pub auto_bootstrap: bool,

    /// Query timeout (seconds)
    pub query_timeout_secs: u64,
}

/// Gossipsub validation mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ValidationMode {
    /// No validation (fast but insecure)
    None,
    /// Strict validation (احسان principle - verify everything)
    Strict,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addresses: vec![
                "/ip4/0.0.0.0/udp/9944/quic-v1".parse().unwrap(),
                "/ip6/::/udp/9944/quic-v1".parse().unwrap(),
            ],
            max_peers: 50,
            connection_timeout: Duration::from_secs(30),
            heartbeat_interval: Duration::from_secs(10),
            gossip_config: GossipConfig::default(),
            kad_config: KademliaConfig::default(),
        }
    }
}

impl Default for GossipConfig {
    fn default() -> Self {
        Self {
            block_topic: "bizra/blocks".to_string(),
            tx_topic: "bizra/transactions".to_string(),
            validation_mode: ValidationMode::Strict, // احسان principle
            heartbeat_interval_secs: 10,
        }
    }
}

impl Default for KademliaConfig {
    fn default() -> Self {
        Self {
            auto_bootstrap: true,
            query_timeout_secs: 60,
        }
    }
}

impl NetworkConfig {
    /// Validate configuration parameters (احسان compliance)
    ///
    /// # Returns
    /// - `Ok(())`: Configuration is valid
    /// - `Err(...)`: Configuration has errors (explicit failures)
    ///
    /// # احسان Principle
    /// NO silent failures - all validation errors are explicit
    pub fn validate(&self) -> Result<()> {
        // Validate listen addresses
        if self.listen_addresses.is_empty() {
            bail!("احسان violation: At least one listen address required");
        }

        // Validate max peers
        if self.max_peers == 0 {
            bail!("احسان violation: max_peers must be > 0");
        }

        if self.max_peers > 1000 {
            bail!("احسان violation: max_peers > 1000 may cause performance issues");
        }

        // Validate timeouts
        if self.connection_timeout.as_secs() < 5 {
            bail!("احسان violation: connection_timeout < 5s is too aggressive");
        }

        if self.heartbeat_interval.as_secs() < 5 {
            bail!("احسان violation: heartbeat_interval < 5s causes excessive overhead");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config_valid() {
        let config = NetworkConfig::default();
        assert!(config.validate().is_ok(), "Default config should be valid");
    }

    #[test]
    fn test_empty_listen_addresses_fails() {
        let mut config = NetworkConfig::default();
        config.listen_addresses.clear();
        assert!(config.validate().is_err(), "Empty listen addresses should fail");
    }

    #[test]
    fn test_zero_max_peers_fails() {
        let mut config = NetworkConfig::default();
        config.max_peers = 0;
        assert!(config.validate().is_err(), "Zero max_peers should fail");
    }

    #[test]
    fn test_excessive_max_peers_fails() {
        let mut config = NetworkConfig::default();
        config.max_peers = 2000;
        assert!(config.validate().is_err(), "Excessive max_peers should fail");
    }

    #[test]
    fn test_short_timeout_fails() {
        let mut config = NetworkConfig::default();
        config.connection_timeout = Duration::from_secs(2);
        assert!(config.validate().is_err(), "Short timeout should fail");
    }
}
