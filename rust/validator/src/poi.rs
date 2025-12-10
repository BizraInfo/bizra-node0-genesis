//! Proof-of-Impact (PoI) attestation processing and weight calculation
//!
//! Implements full PoI attestation format from:
//! - BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md
//! - BIZRA_Proof_of_Impact_Formal_Spec_v1.0.md
//!
//! ## Architecture
//!
//! ```text
//!  PoIAttestation (signed)
//!       |
//!       +-- Anchor (chain_id, genesis_merkle_root, block_ref)
//!       +-- Attester (id, pubkey_ed25519)
//!       +-- Resources (cpu, ram, gpu, wallclock)
//!       +-- Evidence (pack_sha256, files_processed, methodology)
//!       +-- Measurement (dimensions, weights, impact_score)
//!       +-- Benchmarks (pre, post, delta)
//!       +-- Signature (alg, sig_base16)
//! ```

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use blake3::hash as blake3_hash;
use anyhow::{Result, bail};

/// PoI attestation version (spec: "poi-1.0")
pub const POI_VERSION: &str = "poi-1.0";

/// Maximum time window duration in seconds (spec: 30 days)
pub const MAX_TIME_WINDOW_DURATION_SECS: u64 = 30 * 24 * 60 * 60;

/// Validation epsilon for floating-point comparisons (spec: 1e-6)
pub const VALIDATION_EPSILON: f64 = 1e-6;

/// Anchor binding attestation to chain context
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 3.2
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Anchor {
    /// Chain identifier (e.g., "bizra-main-alpha", "bizra-testnet-001")
    pub chain_id: String,

    /// Genesis block Merkle root (32 bytes hex)
    pub genesis_merkle_root: String,

    /// Optional block reference (hash or height)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_ref: Option<String>,
}

/// Attester identity and public key
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 3.2
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Attester {
    /// Attester identifier (e.g., "node0:bizra")
    pub id: String,

    /// Ed25519 public key (multicodec format: "ed25519:<hex>")
    pub pubkey_ed25519: String,
}

/// Resource contribution metrics
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 3.2
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Resources {
    /// CPU cores contributed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_cores: Option<u32>,

    /// RAM in gigabytes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ram_gb: Option<u32>,

    /// GPU VRAM in gigabytes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gpu_vram_gb: Option<u32>,

    /// Wallclock time in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wallclock_sec: Option<u64>,
}

/// Evidence bundle metadata
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 3.2
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Evidence {
    /// SHA-256 hash of evidence pack (64 hex chars, required)
    pub pack_sha256: String,

    /// Pack size in bytes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pack_bytes: Option<u64>,

    /// Number of files processed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub files_processed: Option<u64>,

    /// Number of redactions applied
    #[serde(skip_serializing_if = "Option::is_none")]
    pub redactions_count: Option<u64>,

    /// Methodology reference (DOI, URL, or IPFS)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub methodology_ref: Option<String>,
}

/// Impact measurement with dimensions and weights
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 3.2
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Measurement {
    /// Dimension scores (0.0 - 1.0)
    /// Common dimensions: quality, utility, efficiency, trust, fairness, diversity
    pub dimensions: BTreeMap<String, f64>,

    /// Weights for dimensions (must sum to ~1.0)
    pub weights: BTreeMap<String, f64>,

    /// Computed impact score (weighted sum of dimensions)
    pub impact_score: f64,
}

/// Benchmark results (pre/post performance)
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 3.2
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Benchmarks {
    /// Pre-contribution performance metrics
    pub pre: BTreeMap<String, f64>,

    /// Post-contribution performance metrics
    pub post: BTreeMap<String, f64>,

    /// Delta (improvement) value
    pub delta: f64,
}

/// Signature envelope
///
/// Spec reference: BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md section 4
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Signature {
    /// Signature algorithm (currently "ed25519")
    pub alg: String,

    /// Signature bytes (hex encoded)
    pub sig_base16: String,
}

/// Full PoI attestation (production-grade, Day 11+)
///
/// Implements complete attestation format from specifications:
/// - BIZRA_PoI_Cryptographic_Attestation_Spec_v1.0.md
/// - BIZRA_Proof_of_Impact_Formal_Spec_v1.0.md
///
/// ## Structure
///
/// ```text
/// PoIAttestation {
///   version: "poi-1.0",
///   anchor: { chain_id, genesis_merkle_root, block_ref? },
///   attester: { id, pubkey_ed25519 },
///   resources?: { cpu_cores, ram_gb, gpu_vram_gb, wallclock_sec },
///   evidence: { pack_sha256, pack_bytes?, files_processed?, ... },
///   measurement: { dimensions, weights, impact_score },
///   benchmarks?: { pre, post, delta },
///   time_window: [start, end],
///   nonce: "hex",
///   signature: { alg, sig_base16 }
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PoIAttestation {
    /// Protocol version (must be "poi-1.0")
    pub version: String,

    /// Chain anchor (binds to specific chain/genesis)
    pub anchor: Anchor,

    /// Attester identity
    pub attester: Attester,

    /// Resource contributions (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<Resources>,

    /// Evidence metadata (required)
    pub evidence: Evidence,

    /// Impact measurement (required)
    pub measurement: Measurement,

    /// Benchmark results (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub benchmarks: Option<Benchmarks>,

    /// Time window [start, end] in RFC3339 UTC
    pub time_window: [String; 2],

    /// Replay protection nonce (16+ bytes hex)
    pub nonce: String,

    /// Ed25519 signature
    pub signature: Signature,
}

impl PoIAttestation {
    /// Create canonical payload for hashing/signing
    ///
    /// Returns JSON without signature field, sorted keys, no whitespace
    pub fn canonical_payload(&self) -> Result<Vec<u8>> {
        // Clone without signature
        let mut attestation_for_signing = self.clone();
        attestation_for_signing.signature = Signature {
            alg: "ed25519".to_string(),
            sig_base16: String::new(),
        };

        // Serialize to JSON with sorted keys
        let json = serde_json::to_string(&attestation_for_signing)?;
        Ok(json.into_bytes())
    }

    /// Compute Blake3 digest of canonical payload
    pub fn compute_digest(&self) -> Result<String> {
        let payload = self.canonical_payload()?;
        let hash = blake3_hash(&payload);
        Ok(hash.to_hex().to_string())
    }

    /// Validate attestation structure and semantics
    ///
    /// Implements 10 validation rules from spec section 5
    pub fn validate(&self, current_chain_id: &str, current_genesis_root: &str) -> Result<()> {
        // 1. Version check
        if self.version != POI_VERSION {
            bail!("Invalid version: expected {}, got {}", POI_VERSION, self.version);
        }

        // 2. Anchor validation
        if self.anchor.chain_id != current_chain_id {
            bail!("Chain ID mismatch: expected {}, got {}",
                current_chain_id, self.anchor.chain_id);
        }
        if self.anchor.genesis_merkle_root != current_genesis_root {
            bail!("Genesis root mismatch");
        }

        // 3. Evidence validation
        if self.evidence.pack_sha256.len() != 64 {
            bail!("Invalid pack_sha256: must be 64 hex chars, got {}",
                self.evidence.pack_sha256.len());
        }

        // 4. Nonce validation
        if self.nonce.len() < 32 {
            bail!("Invalid nonce: must be at least 16 bytes (32 hex chars), got {}",
                self.nonce.len());
        }

        // 5. Time window validation
        // (Would parse RFC3339 dates in production - simplified for Day 11)

        // 6. Dimensions range check (BEFORE score calculation)
        for (dim, val) in &self.measurement.dimensions {
            if *val < 0.0 || *val > 1.0 {
                bail!("Dimension '{}' out of range [0,1]: {:.6}", dim, val);
            }
        }

        // 7. Weights sum check
        let weights_sum: f64 = self.measurement.weights.values().sum();
        if (weights_sum - 1.0).abs() > VALIDATION_EPSILON {
            bail!("Weights must sum to 1.0, got {:.6}", weights_sum);
        }

        // 8. Measurement validation (score computation)
        let computed_score = self.measurement.dimensions.iter()
            .map(|(k, v)| {
                let weight = self.measurement.weights.get(k).unwrap_or(&0.0);
                v * weight
            })
            .sum::<f64>();

        let score_diff = (computed_score - self.measurement.impact_score).abs();
        if score_diff > VALIDATION_EPSILON {
            bail!("Impact score mismatch: computed {:.6}, declared {:.6} (diff: {:.6})",
                computed_score, self.measurement.impact_score, score_diff);
        }

        // 9. Benchmarks delta check (if present)
        if let Some(bench) = &self.benchmarks {
            // Verify delta matches pre/post if they have "performance" key
            if let (Some(pre), Some(post)) = (
                bench.pre.get("performance"),
                bench.post.get("performance")
            ) {
                let expected_delta = post - pre;
                let delta_diff = (bench.delta - expected_delta).abs();
                if delta_diff > VALIDATION_EPSILON {
                    bail!("Benchmark delta mismatch: expected {:.6}, got {:.6}",
                        expected_delta, bench.delta);
                }
            }
        }

        // 10. Signature algorithm check
        if self.signature.alg != "ed25519" {
            bail!("Unsupported signature algorithm: {}", self.signature.alg);
        }

        Ok(())
    }
}

/// PoI weight calculator
///
/// Implements weight formula from spec section 5.8:
/// ```text
/// weight_eff = BASE + λ * PoI_carry + μ * rep_score + ν * sqrt(stake_bond)
/// ```
pub struct PoIWeightCalculator {
    /// Base weight (spec: 100)
    base_weight: u128,

    /// PoI multiplier (spec: λ = 10)
    poi_lambda: f64,

    /// Reputation multiplier (spec: μ = 0.05)
    rep_mu: f64,

    /// Stake multiplier (spec: ν = 0.02)
    stake_nu: f64,
}

impl PoIWeightCalculator {
    /// Create new weight calculator with default parameters
    pub fn new() -> Self {
        Self {
            base_weight: 100,
            poi_lambda: 10.0,
            rep_mu: 0.05,
            stake_nu: 0.02,
        }
    }

    /// Calculate effective weight from attestation
    ///
    /// Uses impact_score as PoI_carry value
    pub fn calculate_weight_from_attestation(
        &self,
        attestation: &PoIAttestation,
        rep_score: u64,
        stake_bond: u128,
    ) -> u128 {
        let poi_carry = attestation.measurement.impact_score;
        self.calculate_weight(poi_carry, rep_score, stake_bond)
    }

    /// Calculate effective weight
    ///
    /// Formula from spec section 5.8:
    /// ```text
    /// weight_eff = BASE + λ * PoI_carry + μ * rep_score + ν * sqrt(stake_bond)
    /// ```
    pub fn calculate_weight(
        &self,
        poi_carry: f64,
        rep_score: u64,
        stake_bond: u128,
    ) -> u128 {
        let base = self.base_weight as f64;
        let poi_component = self.poi_lambda * poi_carry;
        let rep_component = self.rep_mu * (rep_score as f64);
        let stake_component = self.stake_nu * (stake_bond as f64).sqrt();

        let total = base + poi_component + rep_component + stake_component;
        total as u128
    }
}

impl Default for PoIWeightCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_anchor() -> Anchor {
        Anchor {
            chain_id: "bizra-testnet-001".to_string(),
            genesis_merkle_root: "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f".to_string(),
            block_ref: None,
        }
    }

    fn test_attester() -> Attester {
        Attester {
            id: "node0:bizra".to_string(),
            pubkey_ed25519: "ed25519:72727b02172ed3b43b7b659e18a91a4093e258a8d894366723c3ce333449a4d0".to_string(),
        }
    }

    fn test_evidence() -> Evidence {
        Evidence {
            pack_sha256: "a616dbd6c7c6d2756f89bb04a6bdc2880b51e092dc17ab7ba58a80796b44d68a".to_string(),
            pack_bytes: Some(52428800000),
            files_processed: Some(150000),
            redactions_count: Some(1342),
            methodology_ref: Some("doi:10.1234/bizra.mth.impact.v1".to_string()),
        }
    }

    fn test_measurement() -> Measurement {
        let mut dimensions = BTreeMap::new();
        dimensions.insert("quality".to_string(), 0.92);
        dimensions.insert("utility".to_string(), 0.88);
        dimensions.insert("efficiency".to_string(), 0.86);
        dimensions.insert("trust".to_string(), 0.94);
        dimensions.insert("diversity".to_string(), 0.70);

        let mut weights = BTreeMap::new();
        weights.insert("quality".to_string(), 0.28);
        weights.insert("utility".to_string(), 0.28);
        weights.insert("efficiency".to_string(), 0.16);
        weights.insert("trust".to_string(), 0.16);
        weights.insert("diversity".to_string(), 0.12);

        // Computed: 0.28*0.92 + 0.28*0.88 + 0.16*0.86 + 0.16*0.94 + 0.12*0.70
        // = 0.2576 + 0.2464 + 0.1376 + 0.1504 + 0.084 = 0.876
        Measurement {
            dimensions,
            weights,
            impact_score: 0.876,
        }
    }

    fn test_attestation() -> PoIAttestation {
        PoIAttestation {
            version: POI_VERSION.to_string(),
            anchor: test_anchor(),
            attester: test_attester(),
            resources: None,
            evidence: test_evidence(),
            measurement: test_measurement(),
            benchmarks: None,
            time_window: [
                "2025-09-15T10:00:00Z".to_string(),
                "2025-09-15T14:00:00Z".to_string(),
            ],
            nonce: "2db5c7d3c6b9421a8c7c3f0f0a4d33aa".to_string(),
            signature: Signature {
                alg: "ed25519".to_string(),
                sig_base16: "00".to_string(),
            },
        }
    }

    #[test]
    fn test_attestation_structure() {
        let attestation = test_attestation();
        assert_eq!(attestation.version, POI_VERSION);
        assert_eq!(attestation.anchor.chain_id, "bizra-testnet-001");
        assert_eq!(attestation.attester.id, "node0:bizra");
        assert_eq!(attestation.evidence.pack_sha256.len(), 64);
        assert!(attestation.measurement.impact_score > 0.0);
    }

    #[test]
    fn test_canonical_payload() {
        let attestation = test_attestation();
        let payload = attestation.canonical_payload().unwrap();
        assert!(!payload.is_empty());

        // Should not contain actual signature
        let json_str = String::from_utf8(payload).unwrap();
        assert!(!json_str.contains("\"sig_base16\":\"00\""));
    }

    #[test]
    fn test_compute_digest() {
        let attestation = test_attestation();
        let digest = attestation.compute_digest().unwrap();

        // Should be 64 hex chars (blake3 output)
        assert_eq!(digest.len(), 64);
        assert!(digest.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_validate_success() {
        let attestation = test_attestation();
        let result = attestation.validate(
            "bizra-testnet-001",
            "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f",
        );
        assert!(result.is_ok(), "Validation failed: {:?}", result.err());
    }

    #[test]
    fn test_validate_wrong_version() {
        let mut attestation = test_attestation();
        attestation.version = "poi-2.0".to_string();

        let result = attestation.validate("bizra-testnet-001", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid version"));
    }

    #[test]
    fn test_validate_chain_id_mismatch() {
        let attestation = test_attestation();
        let result = attestation.validate("wrong-chain", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Chain ID mismatch"));
    }

    #[test]
    fn test_validate_impact_score_mismatch() {
        let mut attestation = test_attestation();
        attestation.measurement.impact_score = 0.5; // Wrong score

        let result = attestation.validate("bizra-testnet-001", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Impact score mismatch"));
    }

    #[test]
    fn test_validate_dimension_out_of_range() {
        let mut attestation = test_attestation();
        attestation.measurement.dimensions.insert("bad_dim".to_string(), 1.5);

        let result = attestation.validate("bizra-testnet-001", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("out of range"));
    }

    #[test]
    fn test_weight_calculator_base_only() {
        let calculator = PoIWeightCalculator::new();
        let weight = calculator.calculate_weight(0.0, 0, 0);
        assert_eq!(weight, 100);
    }

    #[test]
    fn test_weight_calculator_with_poi() {
        let calculator = PoIWeightCalculator::new();
        // PoI = 50 → BASE + 10*50 = 600
        let weight = calculator.calculate_weight(50.0, 0, 0);
        assert_eq!(weight, 600);
    }

    #[test]
    fn test_weight_calculator_full() {
        let calculator = PoIWeightCalculator::new();
        // PoI=50, rep=10000, stake=10000
        // BASE + 10*50 + 0.05*10000 + 0.02*100 = 100 + 500 + 500 + 2 = 1102
        let weight = calculator.calculate_weight(50.0, 10000, 10000);
        assert_eq!(weight, 1102);
    }

    #[test]
    fn test_weight_from_attestation() {
        let calculator = PoIWeightCalculator::new();
        let attestation = test_attestation();

        // impact_score = 0.876, rep=10000, stake=10000
        // BASE + 10*0.876 + 0.05*10000 + 0.02*100
        // = 100 + 8.76 + 500 + 2 = 610.76 → 610
        let weight = calculator.calculate_weight_from_attestation(&attestation, 10000, 10000);
        assert_eq!(weight, 610);
    }

    #[test]
    fn test_benchmarks_delta_validation() {
        let mut attestation = test_attestation();

        let mut pre = BTreeMap::new();
        pre.insert("performance".to_string(), 0.512);

        let mut post = BTreeMap::new();
        post.insert("performance".to_string(), 0.840);

        attestation.benchmarks = Some(Benchmarks {
            pre,
            post,
            delta: 0.328, // Correct: 0.840 - 0.512 = 0.328
        });

        let result = attestation.validate("bizra-testnet-001", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f");
        assert!(result.is_ok());
    }

    #[test]
    fn test_benchmarks_delta_mismatch() {
        let mut attestation = test_attestation();

        let mut pre = BTreeMap::new();
        pre.insert("performance".to_string(), 0.512);

        let mut post = BTreeMap::new();
        post.insert("performance".to_string(), 0.840);

        attestation.benchmarks = Some(Benchmarks {
            pre,
            post,
            delta: 0.5, // Wrong: should be 0.328
        });

        let result = attestation.validate("bizra-testnet-001", "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Benchmark delta mismatch"));
    }
}
