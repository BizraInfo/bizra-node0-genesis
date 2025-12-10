//! BIZRA Peer Manager ?? ?????
//!
//! Manages peer connections, reputation, and network health:
//! - Connection tracking and limits
//! - Peer reputation scoring
//! - Connection quality monitoring
//! - Automatic peer pruning
//!
//! ????? Compliance: No assumptions about peer reliability

use libp2p::PeerId;
use std::collections::{HashMap, HashSet};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, warn, error};

use crate::error::NetworkError;

/// Peer connection state
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PeerState {
    /// Peer is connected and healthy
    Connected,

    /// Peer is connecting
    Connecting,

    /// Peer is disconnected
    Disconnected,

    /// Peer is banned due to misbehavior
    Banned,
}

/// Peer information and reputation
#[derive(Debug, Clone)]
pub struct PeerInfo {
    /// Peer ID
    pub peer_id: PeerId,

    /// Current connection state
    pub state: PeerState,

    /// Connection quality score (0.0-1.0)
    pub quality_score: f64,

    /// Reputation score (0.0-1.0, based on behavior)
    pub reputation_score: f64,

    /// First seen timestamp
    pub first_seen: u64,

    /// Last seen timestamp
    pub last_seen: u64,

    /// Connection attempt count
    pub connection_attempts: u32,

    /// Successful message count
    pub messages_received: u64,

    /// Failed message count
    pub messages_failed: u64,

    /// Average latency (milliseconds)
    pub avg_latency_ms: Option<f64>,
}

impl PeerInfo {
    /// Create new peer info
    pub fn new(peer_id: PeerId) -> Self {
        let now = current_timestamp();
        Self {
            peer_id,
            state: PeerState::Disconnected,
            quality_score: 0.5, // Start neutral
            reputation_score: 0.5, // Start neutral
            first_seen: now,
            last_seen: now,
            connection_attempts: 0,
            messages_received: 0,
            messages_failed: 0,
            avg_latency_ms: None,
        }
    }

    /// Update peer as connected
    pub fn mark_connected(&mut self) {
        self.state = PeerState::Connected;
        self.last_seen = current_timestamp();
        self.connection_attempts += 1;
        self.quality_score = (self.quality_score + 1.0) / 2.0; // Improve quality
    }

    /// Update peer as disconnected
    pub fn mark_disconnected(&mut self) {
        self.state = PeerState::Disconnected;
        self.last_seen = current_timestamp();
        self.quality_score = (self.quality_score + 0.0) / 2.0; // Reduce quality
    }

    /// Record successful message
    pub fn record_message_success(&mut self, latency_ms: Option<f64>) {
        self.messages_received += 1;

        // Update average latency
        if let Some(latency) = latency_ms {
            self.avg_latency_ms = Some(match self.avg_latency_ms {
                Some(avg) => (avg + latency) / 2.0,
                None => latency,
            });
        }

        // Improve reputation for successful messages
        self.reputation_score = (self.reputation_score + 0.01).min(1.0);
    }

    /// Record failed message
    pub fn record_message_failure(&mut self) {
        self.messages_failed += 1;

        // Reduce reputation for failed messages
        self.reputation_score = (self.reputation_score - 0.05).max(0.0);
    }

    /// Check if peer should be banned (reputation too low)
    pub fn should_be_banned(&self) -> bool {
        self.reputation_score < 0.1 && self.messages_failed > 10
    }

    /// Get peer health score (combination of quality and reputation)
    pub fn health_score(&self) -> f64 {
        (self.quality_score + self.reputation_score) / 2.0
    }

    /// Check if peer is stale (not seen recently)
    pub fn is_stale(&self, max_age_seconds: u64) -> bool {
        let now = current_timestamp();
        let age_seconds = (now - self.last_seen) / 1000;
        age_seconds > max_age_seconds
    }
}

/// BIZRA Peer Manager
///
/// Manages the peer network with ????? compliance
pub struct PeerManager {
    /// All known peers
    peers: HashMap<PeerId, PeerInfo>,

    /// Connected peer IDs (for fast lookup)
    connected_peers: HashSet<PeerId>,

    /// Maximum number of peers to maintain
    max_peers: usize,

    /// Minimum peer reputation to accept connections
    min_reputation: f64,

    /// Peer staleness threshold (seconds)
    stale_threshold_seconds: u64,

    /// Last cleanup timestamp
    last_cleanup: u64,
}

impl PeerManager {
    /// Create new peer manager ?? ?????
    ///
    /// # Arguments
    /// - `max_peers`: Maximum number of peers to maintain
    ///
    /// # ????? Compliance
    /// - Explicit peer limits
    /// - Transparent peer management
    pub fn new(max_peers: usize) -> Self {
        Self {
            peers: HashMap::new(),
            connected_peers: HashSet::new(),
            max_peers,
            min_reputation: 0.3, // Minimum reputation to accept
            stale_threshold_seconds: 300, // 5 minutes
            last_cleanup: current_timestamp(),
        }
    }

    /// Add or update peer information
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID to add/update
    ///
    /// # Returns
    /// - `true` if peer was added, `false` if updated
    ///
    /// # ????? Compliance
    /// - Explicit peer tracking
    /// - No assumptions about peer existence
    pub fn add_peer(&mut self, peer_id: PeerId) -> bool {
        let is_new = !self.peers.contains_key(&peer_id);

        if is_new {
            let peer_info = PeerInfo::new(peer_id);
            self.peers.insert(peer_id, peer_info);
            info!("?? Added new peer: {}", peer_id);
        } else {
            // Update last seen
            if let Some(peer) = self.peers.get_mut(&peer_id) {
                peer.last_seen = current_timestamp();
            }
        }

        is_new
    }

    /// Mark peer as connected
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID that connected
    ///
    /// # Returns
    /// - `Ok(())`: Peer marked as connected
    /// - `Err(NetworkError)`: Peer not found or other error
    ///
    /// # ????? Compliance
    /// - Explicit state transitions
    /// - Validation of peer existence
    pub fn peer_connected(&mut self, peer_id: &PeerId) -> Result<(), NetworkError> {
        let peer = self.peers.get_mut(peer_id)
            .ok_or_else(|| NetworkError::PeerNotFound(peer_id.to_string()))?;

        // Check reputation before accepting connection
        if peer.reputation_score < self.min_reputation {
            warn!("?? Rejected connection from low-reputation peer: {} (reputation: {:.2})",
                  peer_id, peer.reputation_score);
            return Err(NetworkError::PeerRejected {
                peer_id: peer_id.to_string(),
                reason: "Low reputation score".to_string(),
            });
        }

        peer.mark_connected();
        self.connected_peers.insert(*peer_id);

        info!("?? Peer connected: {} (reputation: {:.2}, quality: {:.2})",
              peer_id, peer.reputation_score, peer.quality_score);

        // Check if we need to prune peers
        self.prune_peers_if_needed();

        Ok(())
    }

    /// Mark peer as disconnected
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID that disconnected
    ///
    /// # ????? Compliance
    /// - Explicit disconnection tracking
    /// - Graceful handling of unknown peers
    pub fn peer_disconnected(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.mark_disconnected();
            self.connected_peers.remove(peer_id);

            info!("?? Peer disconnected: {} (reputation: {:.2}, quality: {:.2})",
                  peer_id, peer.reputation_score, peer.quality_score);
        } else {
            warn!("??  Disconnection event for unknown peer: {}", peer_id);
        }
    }

    /// Record successful message from peer
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID that sent the message
    /// - `latency_ms`: Optional message latency
    ///
    /// # ????? Compliance
    /// - Explicit success tracking
    /// - Reputation improvement for good behavior
    pub fn record_message_success(&mut self, peer_id: &PeerId, latency_ms: Option<f64>) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.record_message_success(latency_ms);
        }
    }

    /// Record failed message from peer
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID that sent the message
    ///
    /// # ????? Compliance
    /// - Explicit failure tracking
    /// - Reputation reduction for bad behavior
    pub fn record_message_failure(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.record_message_failure();

            // Check if peer should be banned
            if peer.should_be_banned() {
                self.ban_peer(peer_id);
            }
        }
    }

    /// Ban a peer due to misbehavior
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID to ban
    ///
    /// # ????? Compliance
    /// - Explicit banning logic
    /// - Permanent reputation damage
    fn ban_peer(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.state = PeerState::Banned;
            peer.reputation_score = 0.0;
            self.connected_peers.remove(peer_id);

            error!("?? Banned peer due to misbehavior: {}", peer_id);
        }
    }

    /// Get peer information
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID to query
    ///
    /// # Returns
    /// - `Some(&PeerInfo)`: Peer information if found
    /// - `None`: Peer not found
    ///
    /// # ????? Compliance
    /// - Explicit peer lookup
    /// - No assumptions about peer existence
    pub fn get_peer_info(&self, peer_id: &PeerId) -> Option<&PeerInfo> {
        self.peers.get(peer_id)
    }

    /// Get all connected peers
    ///
    /// # Returns
    /// - Vector of connected peer IDs
    ///
    /// # ????? Compliance
    /// - Explicit connection state reporting
    pub fn get_connected_peers(&self) -> Vec<PeerId> {
        self.connected_peers.iter().cloned().collect()
    }

    /// Get peer count statistics
    ///
    /// # Returns
    /// - HashMap with peer statistics
    ///
    /// # ????? Compliance
    /// - Transparent peer network status
    pub fn get_peer_stats(&self) -> HashMap<String, usize> {
        let mut stats = HashMap::new();
        stats.insert("total_peers".to_string(), self.peers.len());
        stats.insert("connected_peers".to_string(), self.connected_peers.len());
        stats.insert("banned_peers".to_string(),
                    self.peers.values().filter(|p| p.state == PeerState::Banned).count());
        stats.insert("stale_peers".to_string(),
                    self.peers.values().filter(|p| p.is_stale(self.stale_threshold_seconds)).count());
        stats
    }

    /// Get top peers by health score
    ///
    /// # Arguments
    /// - `limit`: Maximum number of peers to return
    ///
    /// # Returns
    /// - Vector of peer IDs sorted by health score (highest first)
    ///
    /// # ????? Compliance
    /// - Explicit peer ranking
    /// - Health-based selection criteria
    pub fn get_top_peers_by_health(&self, limit: usize) -> Vec<PeerId> {
        let mut peers: Vec<_> = self.peers.values()
            .filter(|p| p.state == PeerState::Connected)
            .collect();

        peers.sort_by(|a, b| b.health_score().partial_cmp(&a.health_score()).unwrap());

        peers.into_iter()
            .take(limit)
            .map(|p| p.peer_id)
            .collect()
    }

    /// Prune peers if we exceed the maximum
    ///
    /// Removes lowest-health peers when we have too many connections
    ///
    /// # ????? Compliance
    /// - Explicit peer pruning logic
    /// - Health-based eviction (not random)
    fn prune_peers_if_needed(&mut self) {
        if self.connected_peers.len() <= self.max_peers {
            return;
        }

        let excess = self.connected_peers.len() - self.max_peers;
        let candidates = self.get_top_peers_by_health(self.max_peers);

        // Collect peers to disconnect (avoid borrowing issues)
        let to_disconnect: Vec<PeerId> = self.connected_peers
            .iter()
            .filter(|peer_id| !candidates.contains(peer_id))
            .take(excess)
            .cloned()
            .collect();

        // Disconnect excess peers
        for peer_id in to_disconnect {
            self.peer_disconnected(&peer_id);
            info!("???  Pruned low-health peer: {}", peer_id);
        }
    }

    /// Cleanup stale peers and banned peers
    ///
    /// Should be called periodically
    ///
    /// # ????? Compliance
    /// - Explicit cleanup scheduling
    /// - Time-based peer management
    pub fn cleanup_stale_peers(&mut self) {
        let now = current_timestamp();
        let mut to_remove = Vec::new();

        for (peer_id, peer) in &self.peers {
            // Remove banned peers after 24 hours
            if peer.state == PeerState::Banned {
                let ban_age_hours = (now - peer.last_seen) / (1000 * 60 * 60);
                if ban_age_hours > 24 {
                    to_remove.push(*peer_id);
                }
            }
            // Remove stale disconnected peers
            else if peer.state == PeerState::Disconnected && peer.is_stale(self.stale_threshold_seconds * 2) {
                to_remove.push(*peer_id);
            }
        }

        for peer_id in to_remove {
            self.peers.remove(&peer_id);
            info!("?? Cleaned up peer: {}", peer_id);
        }

        self.last_cleanup = now;
    }

    /// Get connected peer count
    ///
    /// # Returns
    /// - Number of currently connected peers
    ///
    /// # ????? Compliance
    /// - Explicit connection counting
    pub fn connected_count(&self) -> usize {
        self.connected_peers.len()
    }

    /// Check if peer is connected
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID to check
    ///
    /// # Returns
    /// - `true` if peer is connected, `false` otherwise
    ///
    /// # ????? Compliance
    /// - Explicit connection state checking
    pub fn is_connected(&self, peer_id: &PeerId) -> bool {
        self.connected_peers.contains(peer_id)
    }
}

/// Helper function to get current timestamp
fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_peer_lifecycle() {
        let mut manager = PeerManager::new(10);
        let peer_id = PeerId::from_str("12D3KooWAbc123").unwrap();

        // Add peer
        assert!(manager.add_peer(peer_id));

        // Connect peer
        assert!(manager.peer_connected(&peer_id).is_ok());
        assert!(manager.is_connected(&peer_id));
        assert_eq!(manager.connected_count(), 1);

        // Record success
        manager.record_message_success(&peer_id, Some(50.0));

        // Disconnect peer
        manager.peer_disconnected(&peer_id);
        assert!(!manager.is_connected(&peer_id));
        assert_eq!(manager.connected_count(), 0);
    }

    #[test]
    fn test_peer_reputation() {
        let mut manager = PeerManager::new(10);
        let peer_id = PeerId::from_str("12D3KooWAbc123").unwrap();

        manager.add_peer(peer_id);
        manager.peer_connected(&peer_id).unwrap();

        let peer_info = manager.get_peer_info(&peer_id).unwrap();

        // Initial reputation
        assert_eq!(peer_info.reputation_score, 0.5);

        // Record success
        manager.record_message_success(&peer_id, None);
        let peer_info = manager.get_peer_info(&peer_id).unwrap();
        assert!(peer_info.reputation_score > 0.5);

        // Record failure
        manager.record_message_failure(&peer_id);
        let peer_info = manager.get_peer_info(&peer_id).unwrap();
        assert!(peer_info.reputation_score < 0.51); // Should decrease
    }

    #[test]
    fn test_peer_limits() {
        let mut manager = PeerManager::new(2); // Only allow 2 peers

        let peer1 = PeerId::from_str("12D3KooWPeer1").unwrap();
        let peer2 = PeerId::from_str("12D3KooWPeer2").unwrap();
        let peer3 = PeerId::from_str("12D3KooWPeer3").unwrap();

        manager.add_peer(peer1);
        manager.add_peer(peer2);
        manager.add_peer(peer3);

        // Connect all peers
        manager.peer_connected(&peer1).unwrap();
        manager.peer_connected(&peer2).unwrap();
        manager.peer_connected(&peer3).unwrap();

        // Should have 3 connected (pruning happens at swarm level)
        assert_eq!(manager.connected_count(), 3);
    }
}
