// Criterion benchmark for PoI attestation performance
// احسان (Ihsan) principle: Evidence-gated engineering
//
// PERFORMANCE GATE: ≥100K ops/sec (or p99 < 10µs)
//
// Expected results (contract-first stub):
// - Small messages (32 bytes): p99 < 5µs, throughput ≥200K/s
// - Medium messages (128 bytes): p99 < 8µs, throughput ≥150K/s
// - Large messages (256 bytes): p99 < 10µs, throughput ≥100K/s
//
// Validates ed25519 signature generation/verification performance

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use poi::{generate_attestation, verify_attestation};
use ed25519_dalek::{SigningKey, Signature, Signer, SECRET_KEY_LENGTH};
use rand::Rng;

/// Generate realistic test message
fn generate_message(size: usize) -> Vec<u8> {
    (0..size).map(|i| (i % 256) as u8).collect()
}

/// Generate random signing key for benchmarks
fn generate_signing_key() -> SigningKey {
    let mut rng = rand::thread_rng();
    let secret_bytes: [u8; SECRET_KEY_LENGTH] = rng.gen();
    SigningKey::from_bytes(&secret_bytes)
}

/// Benchmark attestation generation with various message sizes
fn bench_attestation_generation(c: &mut Criterion) {
    let mut group = c.benchmark_group("attestation_generation");

    // Configure for microsecond precision
    group.significance_level(0.05).sample_size(1000);

    // Test with different message sizes (realistic for blockchain attestations)
    for size in [32, 128, 256] {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_bytes", size)),
            &size,
            |b, &size| {
                let message = generate_message(size);
                let signing_key = generate_signing_key();

                // Benchmark real signature generation using production API
                b.iter(|| {
                    let signature: Signature = signing_key.sign(black_box(&message));
                    black_box(signature);
                });
            },
        );
    }

    group.finish();
}

/// Benchmark attestation verification
fn bench_attestation_verification(c: &mut Criterion) {
    let mut group = c.benchmark_group("attestation_verification");

    // Configure for microsecond precision
    group.significance_level(0.05).sample_size(1000);

    for size in [32, 128, 256] {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_bytes", size)),
            &size,
            |b, &size| {
                let message = generate_message(size);
                let signing_key = generate_signing_key();
                let signature = signing_key.sign(&message);
                let public_key = signing_key.verifying_key().to_bytes();
                let sig_bytes = signature.to_bytes();

                // Benchmark verification
                b.iter(|| {
                    black_box(verify_attestation(
                        black_box(&message),
                        black_box(&public_key),
                        black_box(&sig_bytes)
                    ));
                });
            },
        );
    }

    group.finish();
}

/// Benchmark single operation for latency measurement
fn bench_attestation_single_op(c: &mut Criterion) {
    let mut group = c.benchmark_group("attestation_single_op");

    // High precision measurement for <10µs target
    group.significance_level(0.01).sample_size(10000);

    let message = generate_message(128);
    let signing_key = generate_signing_key();

    group.bench_function("single_signature_generation", |b| {
        b.iter(|| {
            let signature: Signature = signing_key.sign(black_box(&message));
            black_box(signature);
        });
    });

    group.finish();
}

/// Benchmark throughput (ops/sec) - must achieve ≥100K/s
fn bench_attestation_throughput(c: &mut Criterion) {
    let mut group = c.benchmark_group("attestation_throughput");

    group.throughput(criterion::Throughput::Elements(1));

    let message = generate_message(128);
    let signing_key = generate_signing_key();

    group.bench_function("attestation_ops_per_sec", |b| {
        b.iter(|| {
            let signature: Signature = signing_key.sign(black_box(&message));
            black_box(signature);
        });
    });

    group.finish();
}

/// Benchmark using production generate_attestation API
fn bench_generate_attestation_api(c: &mut Criterion) {
    let mut group = c.benchmark_group("attestation_generate_api");

    let message = generate_message(128);
    let secret_key = [0u8; 32]; // Deterministic test key

    group.bench_function("generate_attestation_api", |b| {
        b.iter(|| {
            let result = generate_attestation(black_box(&message), black_box(&secret_key));
            black_box(result.unwrap());
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_attestation_generation,
    bench_attestation_verification,
    bench_attestation_single_op,
    bench_attestation_throughput,
    bench_generate_attestation_api
);
criterion_main!(benches);
