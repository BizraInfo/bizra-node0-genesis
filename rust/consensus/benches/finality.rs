// Criterion benchmark for BlockGraph finality performance
// احسان (Ihsan) principle: Evidence-gated engineering
//
// PERFORMANCE GATE: p99 < 1ms (1000µs)
//
// Expected results (contract-first stub):
// - Small graph (10 blocks): p99 < 100µs
// - Medium graph (100 blocks): p99 < 500µs
// - Large graph (1000 blocks): p99 < 1000µs
//
// Validates O(1) WQ-ref finality check with realistic 32-byte Blake3 hashes

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use consensus::{finalize_block_bytes, create_block_graph, Block, BlockHash};
use blake3::hash;

/// Generate realistic 32-byte block hash using Blake3 (as bytes)
fn generate_block_hash_bytes(block_num: u64) -> Vec<u8> {
    hash(block_num.to_le_bytes().as_slice()).as_bytes().to_vec()
}

/// Generate realistic BlockHash (32-byte array) for BlockGraph operations
fn generate_block_hash(block_num: u64) -> BlockHash {
    *hash(block_num.to_le_bytes().as_slice()).as_bytes()
}

/// Benchmark finality check with various graph sizes (FFI version)
fn bench_finality_ffi(c: &mut Criterion) {
    let mut group = c.benchmark_group("finality_ffi");

    // Configure for microsecond precision
    group.significance_level(0.05).sample_size(1000);

    // Test with different graph sizes to validate O(1) behavior
    for size in [10, 100, 1000] {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_blocks", size)),
            &size,
            |b, &size| {
                // Pre-generate block hashes (realistic 32-byte Blake3)
                let blocks: Vec<Vec<u8>> = (0..size)
                    .map(|i| generate_block_hash_bytes(i as u64))
                    .collect();

                // Benchmark finality check (should be O(1) regardless of size)
                b.iter(|| {
                    for block_hash in &blocks {
                        black_box(finalize_block_bytes(black_box(block_hash)));
                    }
                });
            },
        );
    }

    group.finish();
}

/// Benchmark BlockGraph is_finalized() - production O(1) check
fn bench_blockgraph_finality(c: &mut Criterion) {
    let mut group = c.benchmark_group("blockgraph_finality");

    // Configure for microsecond precision
    group.significance_level(0.05).sample_size(1000);

    // Test with different graph sizes
    for size in [10, 100, 1000] {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_blocks", size)),
            &size,
            |b, &size| {
                // Create BlockGraph and populate with blocks
                let graph = create_block_graph(10000, 6667);

                // Add genesis
                let genesis = Block::genesis(generate_block_hash(0));
                let genesis_hash = genesis.hash;
                graph.add_block(genesis).unwrap();

                // Add chain of blocks
                let mut hashes = vec![genesis_hash];
                for i in 1..size {
                    let parent = hashes[i - 1];
                    let hash = generate_block_hash(i as u64);
                    let block = Block::new(hash, Some(parent), i as u64);
                    graph.add_block(block).unwrap();
                    hashes.push(hash);
                }

                // Finalize some blocks (67% threshold)
                for hash in &hashes[0..size.min(7)] {
                    graph.update_weight(hash, 7000).unwrap();
                }

                // Benchmark O(1) finality check
                b.iter(|| {
                    for hash in &hashes {
                        black_box(graph.is_finalized(black_box(hash)));
                    }
                });
            },
        );
    }

    group.finish();
}

/// Benchmark single finality operation for latency measurement
fn bench_finality_single_op(c: &mut Criterion) {
    let mut group = c.benchmark_group("finality_single_op");

    // High precision measurement for <1ms target
    group.significance_level(0.01).sample_size(10000);

    let block_hash = generate_block_hash_bytes(42);

    group.bench_function("single_finality_check_ffi", |b| {
        b.iter(|| {
            black_box(finalize_block_bytes(black_box(&block_hash)))
        });
    });

    // BlockGraph version (production)
    let graph = create_block_graph(10000, 6667);
    let genesis = Block::genesis(generate_block_hash(0));
    let genesis_hash = genesis.hash;
    graph.add_block(genesis).unwrap();
    graph.update_weight(&genesis_hash, 7000).unwrap();

    group.bench_function("single_finality_check_blockgraph", |b| {
        b.iter(|| {
            black_box(graph.is_finalized(black_box(&genesis_hash)))
        });
    });

    group.finish();
}

/// Benchmark throughput (ops/sec)
fn bench_finality_throughput(c: &mut Criterion) {
    let mut group = c.benchmark_group("finality_throughput");

    group.throughput(criterion::Throughput::Elements(1));

    let block_hash = generate_block_hash_bytes(123);

    // BlockGraph version (production)
    let graph = create_block_graph(10000, 6667);
    let genesis = Block::genesis(generate_block_hash(0));
    let genesis_hash = genesis.hash;
    graph.add_block(genesis).unwrap();
    graph.update_weight(&genesis_hash, 7000).unwrap();

    group.bench_function("finality_ops_per_sec_ffi", |b| {
        b.iter(|| {
            black_box(finalize_block_bytes(black_box(&block_hash)))
        });
    });

    group.bench_function("finality_ops_per_sec_blockgraph", |b| {
        b.iter(|| {
            black_box(graph.is_finalized(black_box(&genesis_hash)))
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_finality_ffi,
    bench_blockgraph_finality,
    bench_finality_single_op,
    bench_finality_throughput
);
criterion_main!(benches);
