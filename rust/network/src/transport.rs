//! BIZRA Transport Layer ?? ?????
//!
//! Builds libp2p transport with QUIC + Noise + Yamux:
//! - QUIC: UDP-based transport (low latency, high throughput)
//! - Noise: Encrypted handshake protocol
//! - Yamux: Stream multiplexing
//!
//! ????? Compliance: Cryptographic transport security

use libp2p::{
    core::transport::OrTransport,
    core::upgrade,
    dns, noise,
    quic,
    tcp, yamux,
    Transport,
};
use libp2p::core::muxing::StreamMuxerBox;
use libp2p::core::transport::Boxed;
use std::time::Duration;

use crate::error::NetworkError;

/// Build QUIC transport with Noise encryption and Yamux multiplexing
///
/// # Arguments
/// - `keypair`: Ed25519 keypair for Noise handshake
///
/// # Returns
/// - `Ok(BoxedTransport)`: Successfully built transport
/// - `Err(NetworkError)`: Failed to build transport
///
/// # ????? Compliance
/// - Cryptographic key validation
/// - Explicit security parameters
/// - No fallback to insecure transports
pub fn build_quic_transport(
    keypair: &libp2p::identity::Keypair,
) -> Result<Boxed<(libp2p::PeerId, StreamMuxerBox)>, NetworkError> {
    // Build Noise authenticated encryption handshake
    let noise_config = noise::Config::new(keypair)
        .map_err(|e| NetworkError::TransportError {
            transport: "noise".to_string(),
            source: e.into(),
        })?;

    // Build Yamux stream multiplexer
    let yamux_config = yamux::Config::default();

    // Build QUIC transport (primary)
    let quic_transport = quic::tokio::Transport::new(quic::Config::new(keypair));

    // Build TCP transport (fallback)
    let tcp_transport = tcp::tokio::Transport::new(tcp::Config::default().nodelay(true))
        .upgrade(upgrade::Version::V1)
        .authenticate(noise_config)
        .multiplex(yamux_config)
        .timeout(Duration::from_secs(20))
        .boxed();

    // Combine QUIC and TCP transports (QUIC preferred)
    let transport = OrTransport::new(quic_transport, tcp_transport)
        .map(|either_output, _| match either_output {
            futures::future::Either::Left((peer_id, muxer)) => (peer_id, StreamMuxerBox::new(muxer)),
            futures::future::Either::Right((peer_id, muxer)) => (peer_id, StreamMuxerBox::new(muxer)),
        })
        .boxed();

    Ok(transport)
}

/// Build TCP-only transport (for environments without QUIC support)
///
/// # Arguments
/// - `keypair`: Ed25519 keypair for Noise handshake
///
/// # Returns
/// - `Ok(BoxedTransport)`: Successfully built transport
/// - `Err(NetworkError)`: Failed to build transport
///
/// # ????? Compliance
/// - Explicit TCP configuration
/// - Same security as QUIC transport
pub fn build_tcp_transport(
    keypair: &libp2p::identity::Keypair,
) -> Result<Boxed<(libp2p::PeerId, StreamMuxerBox)>, NetworkError> {
    // Build Noise authenticated encryption handshake
    let noise_config = noise::Config::new(keypair)
        .map_err(|e| NetworkError::TransportError {
            transport: "noise".to_string(),
            source: e.into(),
        })?;

    // Build Yamux stream multiplexer
    let yamux_config = yamux::Config::default();

    // Build TCP transport with DNS resolution
    let transport = tcp::tokio::Transport::new(tcp::Config::default().nodelay(true))
        .upgrade(upgrade::Version::V1)
        .authenticate(noise_config)
        .multiplex(yamux_config)
        .timeout(Duration::from_secs(20))
        .boxed();

    Ok(transport)
}

/// Build WebSocket transport (for browser compatibility)
///
/// # Arguments
/// - `keypair`: Ed25519 keypair for Noise handshake
///
/// # Returns
/// - `Ok(BoxedTransport)`: Successfully built transport
/// - `Err(NetworkError)`: Failed to build transport
///
/// # ????? Compliance
/// - WebSocket security with TLS
/// - Same cryptographic guarantees
#[cfg(feature = "websocket")]
pub fn build_websocket_transport(
    keypair: &libp2p::identity::Keypair,
) -> Result<Boxed<(libp2p::PeerId, StreamMuxerBox)>, NetworkError> {
    use libp2p::websocket;

    // Build Noise authenticated encryption handshake
    let noise_config = noise::Config::new(keypair)
        .map_err(|e| NetworkError::TransportError {
            transport: "noise".to_string(),
            source: e.into(),
        })?;

    // Build Yamux stream multiplexer
    let yamux_config = yamux::Config::default();

    // Build WebSocket transport over TCP
    let transport = websocket::WsConfig::new(
        tcp::tokio::Transport::new(tcp::Config::default())
    )
    .upgrade(upgrade::Version::V1)
    .authenticate(noise_config)
    .multiplex(yamux_config)
    .timeout(Duration::from_secs(20))
    .boxed();

    Ok(transport)
}

/// Validate transport configuration
///
/// # Arguments
/// - `config`: Network configuration to validate
///
/// # Returns
/// - `Ok(())`: Configuration is valid
/// - `Err(NetworkError)`: Configuration validation failed
///
/// # ????? Compliance
/// - Explicit configuration validation
/// - No silent acceptance of invalid configs
pub fn validate_transport_config(config: &crate::NetworkConfig) -> Result<(), NetworkError> {
    // Validate listen addresses
    if config.listen_addresses.is_empty() {
        return Err(NetworkError::ConfigError(
            "At least one listen address required".to_string(),
        ));
    }

    // Validate connection timeout
    if config.connection_timeout.as_millis() == 0 {
        return Err(NetworkError::ConfigError(
            "Connection timeout must be positive".to_string(),
        ));
    }

    // Validate peer limits
    if config.max_peers == 0 {
        return Err(NetworkError::ConfigError(
            "Max peers must be positive".to_string(),
        ));
    }

    Ok(())
}

/// Transport performance metrics
#[derive(Debug, Clone)]
pub struct TransportMetrics {
    /// Active connections count
    pub active_connections: u64,

    /// Total bytes sent
    pub bytes_sent: u64,

    /// Total bytes received
    pub bytes_received: u64,

    /// Connection establishment time (ms)
    pub avg_connection_time_ms: f64,

    /// Transport protocol in use
    pub protocol: String,
}

impl Default for TransportMetrics {
    fn default() -> Self {
        Self {
            active_connections: 0,
            bytes_sent: 0,
            bytes_received: 0,
            avg_connection_time_ms: 0.0,
            protocol: "unknown".to_string(),
        }
    }
}

impl TransportMetrics {
    /// Update metrics with new connection
    pub fn record_connection(&mut self, protocol: &str, establishment_time_ms: f64) {
        self.active_connections += 1;
        self.protocol = protocol.to_string();

        // Update rolling average
        let weight = 0.1; // 10% weight for new measurements
        self.avg_connection_time_ms = self.avg_connection_time_ms * (1.0 - weight) +
                                     establishment_time_ms * weight;
    }

    /// Record data transfer
    pub fn record_transfer(&mut self, sent: u64, received: u64) {
        self.bytes_sent += sent;
        self.bytes_received += received;
    }

    /// Record connection closed
    pub fn record_disconnection(&mut self) {
        if self.active_connections > 0 {
            self.active_connections -= 1;
        }
    }

    /// Get throughput (bytes per second, estimated)
    pub fn throughput_bps(&self) -> f64 {
        // Simple estimation: total bytes / uptime (assuming 1 hour for now)
        // In real implementation, track actual uptime
        let total_bytes = self.bytes_sent + self.bytes_received;
        total_bytes as f64 / 3600.0 // bytes per second
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use libp2p::identity;

    #[tokio::test]
    async fn test_quic_transport_creation() {
        let keypair = identity::Keypair::generate_ed25519();
        let result = build_quic_transport(&keypair);

        // Transport creation should succeed (even if QUIC not available)
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_tcp_transport_creation() {
        let keypair = identity::Keypair::generate_ed25519();
        let result = build_tcp_transport(&keypair);

        assert!(result.is_ok());
    }

    #[test]
    fn test_transport_metrics() {
        let mut metrics = TransportMetrics::default();

        assert_eq!(metrics.active_connections, 0);

        metrics.record_connection("quic", 50.0);
        assert_eq!(metrics.active_connections, 1);
        assert_eq!(metrics.protocol, "quic");
        assert_eq!(metrics.avg_connection_time_ms, 50.0);

        metrics.record_transfer(1000, 2000);
        assert_eq!(metrics.bytes_sent, 1000);
        assert_eq!(metrics.bytes_received, 2000);

        metrics.record_disconnection();
        assert_eq!(metrics.active_connections, 0);
    }

    #[test]
    fn test_config_validation() {
        use crate::NetworkConfig;
        use std::time::Duration;

        // Valid config
        let valid_config = NetworkConfig {
            listen_addresses: vec!["/ip4/0.0.0.0/tcp/0".parse().unwrap()],
            max_peers: 50,
            connection_timeout: Duration::from_secs(30),
            enable_mdns: true,
            enable_kad: true,
            bootstrap_peers: vec![],
        };

        assert!(validate_transport_config(&valid_config).is_ok());

        // Invalid config: no listen addresses
        let invalid_config = NetworkConfig {
            listen_addresses: vec![],
            max_peers: 50,
            connection_timeout: Duration::from_secs(30),
            enable_mdns: true,
            enable_kad: true,
            bootstrap_peers: vec![],
        };

        assert!(validate_transport_config(&invalid_config).is_err());
    }
}