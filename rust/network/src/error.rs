//! Network Error Types با احسان
//!
//! Explicit error handling for all network operations.
//! احسان principle: NO silent failures.

use libp2p::Multiaddr;
use thiserror::Error;

/// Network errors with احسان-compliant explicit reporting
#[derive(Error, Debug)]
pub enum NetworkError {
    /// Failed to bind to listen address
    #[error("احسان violation: Failed to listen on {address}: {source}")]
    ListenError {
        address: Multiaddr,
        #[source]
        source: anyhow::Error,
    },

    /// Failed to connect to peer
    #[error("احسان violation: Failed to connect to peer {peer_id}: {source}")]
    ConnectionError {
        peer_id: String,
        #[source]
        source: anyhow::Error,
    },

    /// Peer disconnected unexpectedly
    #[error("احسان warning: Peer {peer_id} disconnected unexpectedly")]
    PeerDisconnected { peer_id: String },

    /// Peer not found in peer manager
    #[error("احسان violation: Peer not found: {0}")]
    PeerNotFound(String),

    /// Peer rejected due to low reputation
    #[error("احسان violation: Peer {peer_id} rejected: {reason}")]
    PeerRejected { peer_id: String, reason: String },

    /// Message validation failed
    #[error("احسان violation: Invalid message from {peer_id}: {reason}")]
    InvalidMessage { peer_id: String, reason: String },

    /// Configuration validation failed
    #[error("احسان violation: Invalid configuration: {0}")]
    ConfigError(String),

    /// Behaviour initialization failed
    #[error("احسان violation: Behaviour error in {behaviour}: {source}")]
    BehaviourError {
        behaviour: String,
        #[source]
        source: anyhow::Error,
    },

    /// Cryptographic operation failed
    #[error("احسان violation: Cryptographic error: {0}")]
    CryptoError(String),

    /// Transport error
    #[error("احسان violation: Transport error in {transport}: {source}")]
    TransportError {
        transport: String,
        #[source]
        source: anyhow::Error,
    },

    /// Generic error with explicit احسان reporting
    #[error("احسان violation: {0}")]
    Other(#[from] anyhow::Error),
}
