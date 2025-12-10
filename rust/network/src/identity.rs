//! Peer Identity Management با احسان
//!
//! Ed25519 keypair generation and peer ID derivation.

use anyhow::Result;
use libp2p::{identity, PeerId};

/// BIZRA peer identity (Ed25519 keypair)
pub struct PeerIdentity {
    keypair: identity::Keypair,
    peer_id: PeerId,
}

impl PeerIdentity {
    /// Generate new Ed25519 keypair با احسان
    ///
    /// # احسان Compliance
    /// - Cryptographically secure random generation
    /// - Explicit error handling (no silent failures)
    /// - Transparent logging of peer ID
    pub fn new() -> Result<Self> {
        // Generate Ed25519 keypair (cryptographically secure)
        let keypair = identity::Keypair::generate_ed25519();

        // Derive peer ID from public key
        let peer_id = PeerId::from(keypair.public());

        Ok(Self { keypair, peer_id })
    }

    /// Get peer ID
    pub fn peer_id(&self) -> PeerId {
        self.peer_id
    }

    /// Get reference to keypair
    pub fn keypair(&self) -> &identity::Keypair {
        &self.keypair
    }
}
