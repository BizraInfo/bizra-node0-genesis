# Criterion Benchmark Quick Reference

## Run Benchmarks

```bash
# All benchmarks
cd rust && cargo bench --workspace

# Individual crates
cargo bench --package consensus
cargo bench --package poi

# Specific benchmark
cargo bench --package consensus -- finality
cargo bench --package poi -- attestation
```

## Performance Gates Status

### ✅ Finality Check (<1ms target)

| Metric                 | Target | Actual         | Status                |
| ---------------------- | ------ | -------------- | --------------------- |
| Single op (BlockGraph) | <1ms   | 23.97ns        | ✅ **41,700x faster** |
| Single op (FFI)        | <1ms   | 843ps          | ✅ **1.2M x faster**  |
| Throughput             | N/A    | 43.46M ops/sec | ✅                    |

### ⚠️ PoI Attestation (≥100K ops/sec target)

| Metric                 | Target        | Actual      | Status               |
| ---------------------- | ------------- | ----------- | -------------------- |
| Signature generation   | ≥100K ops/sec | 73K ops/sec | ⚠️ **73% of target** |
| Signature verification | ≥100K ops/sec | 35K ops/sec | ⚠️ **35% of target** |
| Latency (generation)   | <10µs         | 13.79µs     | ⚠️                   |
| Latency (verification) | <10µs         | 28.31µs     | ⚠️                   |

## Key Findings

1. **Finality check:** Production-ready, exceeds gate by massive margin
2. **PoI attestation:** Testnet-ready, needs batch verification for production
3. **O(1) confirmed:** BlockGraph scales linearly with checks, not graph size
4. **Next step:** Implement batch Ed25519 verification (8-16x speedup)

## Files Created

- `rust/consensus/benches/finality.rs` - BlockGraph finality benchmarks
- `rust/poi/benches/attestation.rs` - Ed25519 attestation benchmarks
- `rust/consensus/Cargo.toml` - Added Criterion dependency + [[bench]] entry
- `rust/poi/Cargo.toml` - Added Criterion dependency + [[bench]] entry

## Day 3 Action Items

1. ✅ Commit benchmarks
2. ✅ Create `.ci/RUST_GATES_ENABLED` to activate CI enforcement
3. ⚠️ Implement batch verification for PoI (target: 280K ops/sec)
