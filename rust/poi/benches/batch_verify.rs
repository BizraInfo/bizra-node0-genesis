// احسان (Ihsan) principle: Production-grade batch verification benchmarks
// Measures batch Ed25519 signature verification performance

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use ed25519_dalek::{Signer, SigningKey};

// Import batch verification function
use poi::batch_verify_attestations;

/// Benchmark batch verification with different batch sizes
fn bench_batch_sizes(c: &mut Criterion) {
  let mut group = c.benchmark_group("poi_batch_verify");

  // Test batch sizes: 8, 16, 32, 64, 128, 256
  // Batch verification becomes efficient at batch_size >= 64
  for batch_size in [8, 16, 32, 64, 128, 256] {
    // Generate test data once per batch size
    let signing_key = SigningKey::from_bytes(&[1u8; 32]);
    let public_key = signing_key.verifying_key().to_bytes();

    let mut messages = Vec::new();
    let mut signatures = Vec::new();
    let mut public_keys = Vec::new();

    for i in 0..batch_size {
      let msg = format!("evidence_block_{}", i);
      let sig = signing_key.sign(msg.as_bytes());
      messages.push(msg.into_bytes());
      signatures.push(sig.to_bytes().to_vec());
      public_keys.push(public_key.to_vec());
    }

    // Benchmark batch verification (POI_BATCH_VERIFY=1)
    group.bench_with_input(
      BenchmarkId::new("batch_enabled", batch_size),
      &batch_size,
      |b, _| {
        std::env::set_var("POI_BATCH_VERIFY", "1");

        let msg_refs: Vec<&[u8]> = messages.iter().map(|m| m.as_slice()).collect();
        let sig_refs: Vec<&[u8]> = signatures.iter().map(|s| s.as_slice()).collect();
        let pk_refs: Vec<&[u8]> = public_keys.iter().map(|pk| pk.as_slice()).collect();

        b.iter(|| {
          black_box(
            batch_verify_attestations(&msg_refs, &sig_refs, &pk_refs)
              .expect("Batch verification failed"),
          )
        });
      },
    );

    // Benchmark individual verification (POI_BATCH_VERIFY=0) for comparison
    group.bench_with_input(
      BenchmarkId::new("individual", batch_size),
      &batch_size,
      |b, _| {
        std::env::set_var("POI_BATCH_VERIFY", "0");

        let msg_refs: Vec<&[u8]> = messages.iter().map(|m| m.as_slice()).collect();
        let sig_refs: Vec<&[u8]> = signatures.iter().map(|s| s.as_slice()).collect();
        let pk_refs: Vec<&[u8]> = public_keys.iter().map(|pk| pk.as_slice()).collect();

        b.iter(|| {
          black_box(
            batch_verify_attestations(&msg_refs, &sig_refs, &pk_refs)
              .expect("Individual verification failed"),
          )
        });
      },
    );
  }

  group.finish();
}

/// Benchmark throughput (signatures per second)
fn bench_throughput(c: &mut Criterion) {
  let mut group = c.benchmark_group("poi_throughput");

  // Target: ≥100K/s throughput with batch verification
  let batch_size = 256;

  let signing_key = SigningKey::from_bytes(&[1u8; 32]);
  let public_key = signing_key.verifying_key().to_bytes();

  let mut messages = Vec::new();
  let mut signatures = Vec::new();
  let mut public_keys = Vec::new();

  for i in 0..batch_size {
    let msg = format!("attestation_{}", i);
    let sig = signing_key.sign(msg.as_bytes());
    messages.push(msg.into_bytes());
    signatures.push(sig.to_bytes().to_vec());
    public_keys.push(public_key.to_vec());
  }

  std::env::set_var("POI_BATCH_VERIFY", "1");

  let msg_refs: Vec<&[u8]> = messages.iter().map(|m| m.as_slice()).collect();
  let sig_refs: Vec<&[u8]> = signatures.iter().map(|s| s.as_slice()).collect();
  let pk_refs: Vec<&[u8]> = public_keys.iter().map(|pk| pk.as_slice()).collect();

  group.bench_function("batch_256_throughput", |b| {
    b.iter(|| {
      black_box(
        batch_verify_attestations(&msg_refs, &sig_refs, &pk_refs)
          .expect("Batch verification failed"),
      )
    });
  });

  group.finish();
}

/// Benchmark edge cases
fn bench_edge_cases(c: &mut Criterion) {
  let mut group = c.benchmark_group("poi_edge_cases");

  let signing_key = SigningKey::from_bytes(&[1u8; 32]);
  let public_key = signing_key.verifying_key().to_bytes();

  // Edge case: single signature
  {
    let msg = b"single message";
    let sig = signing_key.sign(msg);
    let signature = sig.to_bytes();

    group.bench_function("batch_size_1", |b| {
      std::env::set_var("POI_BATCH_VERIFY", "1");
      b.iter(|| {
        black_box(
          batch_verify_attestations(&[msg.as_slice()], &[&signature], &[&public_key])
            .expect("Verification failed"),
        )
      });
    });
  }

  // Edge case: batch_size = 7 (below threshold of 8)
  {
    let mut messages = Vec::new();
    let mut signatures = Vec::new();
    let mut public_keys_vec = Vec::new();

    for i in 0..7 {
      let msg = format!("msg_{}", i);
      let sig = signing_key.sign(msg.as_bytes());
      messages.push(msg.into_bytes());
      signatures.push(sig.to_bytes().to_vec());
      public_keys_vec.push(public_key.to_vec());
    }

    group.bench_function("batch_size_7", |b| {
      std::env::set_var("POI_BATCH_VERIFY", "1");

      let msg_refs: Vec<&[u8]> = messages.iter().map(|m| m.as_slice()).collect();
      let sig_refs: Vec<&[u8]> = signatures.iter().map(|s| s.as_slice()).collect();
      let pk_refs: Vec<&[u8]> = public_keys_vec.iter().map(|pk| pk.as_slice()).collect();

      b.iter(|| {
        black_box(
          batch_verify_attestations(&msg_refs, &sig_refs, &pk_refs)
            .expect("Verification failed"),
        )
      });
    });
  }

  group.finish();
}

criterion_group!(benches, bench_batch_sizes, bench_throughput, bench_edge_cases);
criterion_main!(benches);
