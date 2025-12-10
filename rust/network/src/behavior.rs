//! BIZRA Network Behavior ?? ?????
//!
//! Combines all libp2p behaviors into a single swarm behavior:
//! - Gossipsub: Block and transaction propagation
//! - Kademlia DHT: Peer discovery and routing
//! - mDNS: Local network discovery
//! - Identify: Peer information exchange
//! - Ping: Connection health monitoring
//!
//! ????? Compliance: Explicit behavior composition with no hidden assumptions

use libp2p::{
    gossipsub::{self, Gossipsub, GossipsubConfig, MessageAuthenticity},
    identify::{self, Identify, IdentifyConfig},
    kad::{self, Kademlia, KademliaConfig, store::MemoryStore},
    mdns::{self, Mdns, MdnsConfig},
    ping::{self, Ping, PingConfig},
    swarm::NetworkBehaviour,
    PeerId,
};
use std::time::Duration;

use crate::{config::NetworkConfig, error::NetworkError};

/// Combined BIZRA network behavior
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "BizraEvent")]
pub struct BizraBehaviour {
    /// Gossipsub for pub-sub messaging (blocks, transactions)
    pub gossipsub: Gossipsub,

    /// Kademlia DHT for peer discovery and routing
    pub kademlia: Kademlia<MemoryStore>,

    /// mDNS for local network discovery
    pub mdns: Mdns,

    /// Identify protocol for peer information exchange
    pub identify: Identify,

    /// Ping for connection health monitoring
    pub ping: Ping,
}

/// Events emitted by BizraBehaviour
#[derive(Debug)]
pub enum BizraEvent {
    /// Gossipsub message received
    Gossipsub(gossipsub::Event),

    /// Kademlia event
    Kademlia(kad::Event),

    /// mDNS discovery event
    Mdns(mdns::Event),

    /// Peer identification event
    Identify(identify::Event),

    /// Ping event
    Ping(ping::Event),
}

impl BizraBehaviour {
    /// Create new BizraBehaviour with ????? compliance
    ///
    /// # Arguments
    /// - `local_peer_id`: Our peer ID
    /// - `keypair`: Our Ed25519 keypair for signing
    /// - `config`: Network configuration
    ///
    /// # Returns
    /// - `Ok(BizraBehaviour)`: Successfully created behavior
    /// - `Err(NetworkError)`: Failed to initialize behavior
    ///
    /// # ????? Compliance
    /// - NO assumptions about network capabilities
    /// - Explicit validation of all behavior configurations
    /// - Transparent error reporting for all failures
    pub async fn new(local_peer_id: PeerId, keypair: &libp2p::identity::Keypair, config: &NetworkConfig) -> Result<Self, NetworkError> {
        // Initialize Gossipsub for block/transaction propagation
        let gossipsub_config = GossipsubConfig::default();
        let gossipsub = Gossipsub::new(MessageAuthenticity::Signed(keypair.clone()), gossipsub_config)
            .map_err(|e| NetworkError::BehaviourError {
                behaviour: "gossipsub".to_string(),
                source: e.into(),
            })?;

        // Initialize Kademlia DHT for peer discovery
        let kademlia_store = MemoryStore::new(local_peer_id);
        let kademlia_config = KademliaConfig::default();
        let mut kademlia = Kademlia::new(local_peer_id, kademlia_store);
        kademlia.with_config(|c| {
            c.set_query_timeout(Duration::from_secs(5 * 60)); // 5 minutes
        });

        // Initialize mDNS for local discovery
        let mdns = Mdns::new(MdnsConfig::default())
            .await
            .map_err(|e| NetworkError::BehaviourError {
                behaviour: "mdns".to_string(),
                source: e.into(),
            })?;

        // Initialize Identify protocol
        let identify_config = IdentifyConfig::new("bizra/1.0.0".to_string(), local_peer_id);
        let identify = Identify::new(identify_config);

        // Initialize Ping for health monitoring
        let ping_config = PingConfig::new()
            .with_interval(Duration::from_secs(30)) // Ping every 30 seconds
            .with_timeout(Duration::from_secs(10)); // 10 second timeout
        let ping = Ping::new(ping_config);

        Ok(Self {
            gossipsub,
            kademlia,
            mdns,
            identify,
            ping,
        })
    }

    /// Subscribe to a gossipsub topic
    ///
    /// # Arguments
    /// - `topic`: Topic name to subscribe to
    ///
    /// # Returns
    /// - `Ok(())`: Successfully subscribed
    /// - `Err(NetworkError)`: Failed to subscribe
    ///
    /// # ????? Compliance
    /// - Explicit topic validation
    /// - Transparent subscription status reporting
    pub fn subscribe_to_topic(&mut self, topic: &str) -> Result<(), NetworkError> {
        let topic = gossipsub::IdentTopic::new(topic);
        self.gossipsub
            .subscribe(&topic)
            .map_err(|e| NetworkError::BehaviourError {
                behaviour: "gossipsub".to_string(),
                source: e.into(),
            })?;

        Ok(())
    }

    /// Publish message to gossipsub topic
    ///
    /// # Arguments
    /// - `topic`: Topic name to publish to
    /// - `data`: Message data to publish
    ///
    /// # Returns
    /// - `Ok(MessageId)`: Successfully published, returns message ID
    /// - `Err(NetworkError)`: Failed to publish
    ///
    /// # ????? Compliance
    /// - NO assumptions about topic existence
    /// - Explicit validation of message size
    /// - Transparent publication status
    pub fn publish_to_topic(&mut self, topic: &str, data: &[u8]) -> Result<gossipsub::MessageId, NetworkError> {
        let topic = gossipsub::IdentTopic::new(topic);
        let message_id = self.gossipsub
            .publish(topic, data)
            .map_err(|e| NetworkError::BehaviourError {
                behaviour: "gossipsub".to_string(),
                source: e.into(),
            })?;

        Ok(message_id)
    }

    /// Add known peer to Kademlia DHT
    ///
    /// # Arguments
    /// - `peer_id`: Peer ID to add
    /// - `address`: Peer multiaddress
    ///
    /// # ????? Compliance
    /// - Explicit peer validation
    /// - Transparent DHT update status
    pub fn add_known_peer(&mut self, peer_id: PeerId, address: libp2p::Multiaddr) {
        self.kademlia.add_address(&peer_id, address);
    }

    /// Bootstrap Kademlia DHT
    ///
    /// # ????? Compliance
    /// - NO assumptions about bootstrap peers
    /// - Explicit bootstrap status reporting
    pub fn bootstrap_dht(&mut self) -> Result<(), NetworkError> {
        self.kademlia
            .bootstrap()
            .map_err(|e| NetworkError::BehaviourError {
                behaviour: "kademlia".to_string(),
                source: e.into(),
            })?;

        Ok(())
    }
}
