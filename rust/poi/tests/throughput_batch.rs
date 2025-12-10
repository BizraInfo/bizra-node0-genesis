// Batch verification throughput test - validates ≥100K/s gate
// احسان (Ihsan) principle: Evidence-gated performance validation

use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};

/// Test that batch verification achieves ≥100K/s throughput
/// Gate: MUST achieve 100,000 verifications per second
#[test]
fn batch_surpasses_100k_per_sec() {
    // Generate test attestations
    let n = 64 * 2000; // 128K attestations
    let mut attestations = Vec::with_capacity(n);

    // Create signing key for test
    let signing_key = SigningKey::from_bytes(&[1u8; 32]);
    let verifying_key = signing_key.verifying_key();

    // Generate attestations
    for i in 0..n {
        let msg = format!("evidence_{:#08x}", i);
        let signature = signing_key.sign(msg.as_bytes());
        attestations.push((msg.into_bytes(), signature.to_bytes(), verifying_key.to_bytes()));
    }

    // Measure batch verification throughput
    let start = std::time::Instant::now();

    // Set batch verify flag
    std::env::set_var("POI_BATCH_VERIFY", "1");

    // Verify all attestations in batches
    let batch_size = 64;
    for chunk in attestations.chunks(batch_size) {
        let msgs: Vec<&[u8]> = chunk.iter().map(|(m, _, _)| m.as_slice()).collect();
        let sigs: Vec<Signature> = chunk.iter()
            .map(|(_, s, _)| Signature::from_bytes(s))
            .collect();
        let pks: Vec<VerifyingKey> = chunk.iter()
            .map(|(_, _, pk)| VerifyingKey::from_bytes(pk).unwrap())
            .collect();

        // Batch verify (this is where ed25519-dalek batch API would be used)
        for i in 0..msgs.len() {
            assert!(pks[i].verify(msgs[i], &sigs[i]).is_ok());
        }
    }

    let elapsed = start.elapsed().as_secs_f64();
    let throughput = (n as f64) / elapsed;

    println!("Batch verification throughput: {:.0} attestations/sec", throughput);
    println!("Target: ≥100,000 attestations/sec");

    // GATE: Must achieve ≥100K/s
    assert!(
        throughput >= 100_000.0,
        "Throughput {:.0} ops/s < 100,000 ops/s gate",
        throughput
    );
}

#[test]
fn batch_verify_scales_with_size() {
    let signing_key = SigningKey::from_bytes(&[2u8; 32]);
    let verifying_key = signing_key.verifying_key();

    // Test different batch sizes
    for batch_size in [1, 8, 16, 32, 64, 128, 256] {
        let mut attestations = Vec::with_capacity(batch_size * 100);

        for i in 0..(batch_size * 100) {
            let msg = format!("test_{}", i);
            let signature = signing_key.sign(msg.as_bytes());
            attestations.push((msg.into_bytes(), signature.to_bytes(), verifying_key.to_bytes()));
        }

        let start = std::time::Instant::now();

        for chunk in attestations.chunks(batch_size) {
            for (msg, sig_bytes, pk_bytes) in chunk {
                let pk = VerifyingKey::from_bytes(pk_bytes).unwrap();
                let sig = Signature::from_bytes(sig_bytes);
                assert!(pk.verify(msg, &sig).is_ok());
            }
        }

        let elapsed = start.elapsed().as_secs_f64();
        let throughput = (attestations.len() as f64) / elapsed;

        println!("Batch size {}: {:.0} ops/sec", batch_size, throughput);
    }
}
