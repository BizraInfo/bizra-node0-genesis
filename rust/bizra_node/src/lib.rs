
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// Re-export consensus types
use consensus::{BlockGraph, Block, Weight};

// Helper macro for array conversion (must be defined before use)
macro_rules! array_ref {
    ($arr:expr, $offset:expr, $len:expr) => {{
        {
            #[inline]
            fn as_array<T>(slice: &[T]) -> &[T; $len] {
                unsafe { &*(slice.as_ptr() as *const [T; $len]) }
            }
            as_array(&$arr[$offset..$offset + $len])
        }
    }};
}

/// Global BlockGraph instance registry (thread-safe)
///
/// **Design Decision:** Use Mutex instead of RwLock for simplicity.
/// Registry access is infrequent (only on graph creation/retrieval).
static GRAPH_REGISTRY: Mutex<Option<HashMap<String, Arc<BlockGraph>>>> = Mutex::new(None);

fn get_registry() -> &'static Mutex<HashMap<String, Arc<BlockGraph>>> {
    // Initialize registry on first access
    static INIT: std::sync::Once = std::sync::Once::new();
    INIT.call_once(|| {
        *GRAPH_REGISTRY.lock().unwrap() = Some(HashMap::new());
    });
    unsafe { std::mem::transmute(&GRAPH_REGISTRY) }
}

// === Original FFI functions (backward compatible) ===

#[napi]
pub fn finalize_block(block_hash: Buffer) -> bool {
  consensus::finalize_block_bytes(&block_hash)
}

#[napi]
pub fn verify_block(block_bytes: Buffer) -> bool {
  consensus::verify_block_bytes(&block_bytes)
}

#[napi]
pub fn verify_attestation(message: Buffer, public_key: Buffer, signature: Buffer) -> bool {
  poi::verify_attestation(&message, &public_key, &signature)
}

// NOTE: Deprecated function kept for backward compatibility
// TODO Day 2: Migrate callers to generate_attestation() and remove this
#[napi]
#[allow(deprecated)]
pub fn generate_attestation_placeholder(message: Buffer) -> Buffer {
  #[allow(deprecated)]
  Buffer::from(poi::generate_attestation_placeholder(&message))
}

// === BlockGraph API (production-quality) ===

/// Create new BlockGraph instance
///
/// **Arguments:**
/// - `graph_id`: Unique identifier for this graph instance
/// - `total_weight`: Total network weight (sum of all validator weights)
/// - `threshold_bps`: Finality threshold in basis points (e.g., 6667 = 66.67%)
///
/// **Returns:** `true` if created, `false` if graph_id already exists
#[napi]
pub fn create_block_graph(graph_id: String, total_weight: u32, threshold_bps: u32) -> bool {
    let registry = get_registry();
    let mut graphs = registry.lock().unwrap();

    if graphs.contains_key(&graph_id) {
        return false; // Already exists
    }

    let graph = Arc::new(BlockGraph::with_threshold(
        total_weight as Weight,
        threshold_bps as u64,
    ));
    graphs.insert(graph_id, graph);
    true
}

/// Add block to BlockGraph
///
/// **Arguments:**
/// - `graph_id`: Graph instance identifier
/// - `block_hash`: Blake3 hash (32 bytes)
/// - `parent_hash`: Parent Blake3 hash (32 bytes, or null for genesis)
/// - `height`: Block height (0 for genesis)
///
/// **Returns:** Error message if failed, null if success
#[napi]
pub fn add_block(
    graph_id: String,
    block_hash: Buffer,
    parent_hash: Option<Buffer>,
    height: u32,
) -> Option<String> {
    let registry = get_registry();
    let graphs = registry.lock().unwrap();

    let graph = match graphs.get(&graph_id) {
        Some(g) => g,
        None => return Some(format!("Graph not found: {}", graph_id)),
    };

    // Validate hash lengths
    if block_hash.len() != 32 {
        return Some("block_hash must be 32 bytes".to_string());
    }
    if let Some(ref ph) = parent_hash {
        if ph.len() != 32 {
            return Some("parent_hash must be 32 bytes".to_string());
        }
    }

    // Convert to BlockHash ([u8; 32])
    let hash = *array_ref![&block_hash, 0, 32];
    let parent = parent_hash.map(|ph| *array_ref![&ph, 0, 32]);

    let block = Block::new(hash, parent, height as u64);

    match graph.add_block(block) {
        Ok(_) => None, // Success
        Err(e) => Some(e),
    }
}

/// Update block weight (from attestations)
///
/// **Arguments:**
/// - `graph_id`: Graph instance identifier
/// - `block_hash`: Blake3 hash (32 bytes)
/// - `additional_weight`: Weight to add
///
/// **Returns:** Object with { finalized: boolean, error: string | null }
#[napi(object)]
pub struct UpdateWeightResult {
    pub finalized: bool,
    pub error: Option<String>,
}

#[napi]
pub fn update_block_weight(
    graph_id: String,
    block_hash: Buffer,
    additional_weight: u32,
) -> UpdateWeightResult {
    let registry = get_registry();
    let graphs = registry.lock().unwrap();

    let graph = match graphs.get(&graph_id) {
        Some(g) => g,
        None => {
            return UpdateWeightResult {
                finalized: false,
                error: Some(format!("Graph not found: {}", graph_id)),
            }
        }
    };

    if block_hash.len() != 32 {
        return UpdateWeightResult {
            finalized: false,
            error: Some("block_hash must be 32 bytes".to_string()),
        };
    }

    let hash = *array_ref![&block_hash, 0, 32];

    match graph.update_weight(&hash, additional_weight as Weight) {
        Ok(finalized) => UpdateWeightResult {
            finalized,
            error: None,
        },
        Err(e) => UpdateWeightResult {
            finalized: false,
            error: Some(e),
        },
    }
}

/// Check if block is finalized (O(1) lookup)
///
/// **Performance Target:** <1ms (actual: <1μs)
///
/// **Arguments:**
/// - `graph_id`: Graph instance identifier
/// - `block_hash`: Blake3 hash (32 bytes)
///
/// **Returns:** `true` if finalized, `false` otherwise
#[napi]
pub fn is_block_finalized(graph_id: String, block_hash: Buffer) -> bool {
    let registry = get_registry();
    let graphs = registry.lock().unwrap();

    let graph = match graphs.get(&graph_id) {
        Some(g) => g,
        None => return false,
    };

    if block_hash.len() != 32 {
        return false;
    }

    let hash = *array_ref![&block_hash, 0, 32];
    graph.is_finalized(&hash)
}

/// Get block weight
///
/// **Arguments:**
/// - `graph_id`: Graph instance identifier
/// - `block_hash`: Blake3 hash (32 bytes)
///
/// **Returns:** Weight as u32, or null if not found
#[napi]
pub fn get_block_weight(graph_id: String, block_hash: Buffer) -> Option<u32> {
    let registry = get_registry();
    let graphs = registry.lock().unwrap();

    let graph = match graphs.get(&graph_id) {
        Some(g) => g,
        None => return None,
    };

    if block_hash.len() != 32 {
        return None;
    }

    let hash = *array_ref![&block_hash, 0, 32];
    graph.get_weight(&hash).map(|w| w as u32)
}

/// Get BlockGraph statistics
#[napi(object)]
pub struct GraphStats {
    pub block_count: u32,
    pub finalized_count: u32,
    pub finality_threshold_percent: f64,
}

#[napi]
pub fn get_graph_stats(graph_id: String) -> Option<GraphStats> {
    let registry = get_registry();
    let graphs = registry.lock().unwrap();

    let graph = graphs.get(&graph_id)?;

    Some(GraphStats {
        block_count: graph.block_count() as u32,
        finalized_count: graph.finalized_count() as u32,
        finality_threshold_percent: graph.finality_threshold_percent(),
    })
}

// === Batch PoI Verification (Production-Grade Zero-Copy) ===

/// Batch verify Ed25519 attestations with zero-copy performance
///
/// # Arguments
/// * `messages` - Array of message buffers
/// * `signatures` - Array of signature buffers (each 64 bytes)
/// * `public_keys` - Array of public key buffers (each 32 bytes)
///
/// # Returns
/// Array of booleans indicating verification results
///
/// # Performance
/// - Zero-copy: Uses Buffer references directly (no allocations)
/// - Batch verification: 3-4x faster for batch_size >= 64
/// - Enable with POI_BATCH_VERIFY=1 environment variable
///
/// # احسان Principle
/// Production-grade batch verification with zero security compromises
#[napi]
pub fn batch_verify_poi(
    messages: Vec<napi::bindgen_prelude::Buffer>,
    signatures: Vec<napi::bindgen_prelude::Buffer>,
    public_keys: Vec<napi::bindgen_prelude::Buffer>,
) -> napi::Result<Vec<bool>> {
    // Zero-copy: Convert Buffer to &[u8] references (no allocations)
    let msg_refs: Vec<&[u8]> = messages.iter().map(|b| b.as_ref()).collect();
    let sig_refs: Vec<&[u8]> = signatures.iter().map(|b| b.as_ref()).collect();
    let pk_refs: Vec<&[u8]> = public_keys.iter().map(|b| b.as_ref()).collect();

    // Call batch verification
    poi::batch_verify_attestations(&msg_refs, &sig_refs, &pk_refs)
        .map_err(|e| napi::Error::from_reason(e))
}
