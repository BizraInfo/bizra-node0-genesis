# Rust CI Gates - Quick Reference Card

**احسان (Ihsan)** - Excellence through measurement

---

## 🚨 Critical Blocker (Fix First!)

```toml
# rust/Cargo.toml - Add these 3 lines to fix benchmarks
[profile.dev.package."*"]
panic = "unwind"

[profile.bench]
inherits = "release"
panic = "unwind"
```

**Validate:** `cargo bench --no-run` should compile ✅

---

## 7 Blocking Gates

| #   | Gate           | Target     | Command                           | Status   |
| --- | -------------- | ---------- | --------------------------------- | -------- |
| 1   | **Finality**   | <1ms (p99) | `cargo bench --bench finality`    | 🟡 Day 2 |
| 2   | **PoI**        | ≥100K/s    | `cargo bench --bench attestation` | 🟡 Day 2 |
| 3   | **Coverage**   | ≥95%       | `cargo llvm-cov --workspace`      | 🟡 Day 2 |
| 4   | **CVEs**       | 0          | `cargo audit`                     | ✅ PASS  |
| 5   | **Unsafe**     | 0          | `grep -r "unsafe" */src/`         | ✅ PASS  |
| 6   | **Regression** | <10%       | `cargo bench --baseline master`   | 🟡 Day 2 |
| 7   | **TS Speedup** | ≥1.5x      | Compare Rust vs TS                | 🟡 Day 2 |

---

## One-Command Validation

```bash
cd rust

# Fix blocker
edit Cargo.toml  # Add panic=unwind lines above

# Validate all gates
cargo check --all-features && \
cargo test --all && \
cargo bench && \
cargo llvm-cov --all-features --workspace && \
cargo audit && \
! grep -r "unsafe" */src/

# Expected: All ✅
```

---

## Activation (Post Day 2)

```bash
# 1. Update metadata in .ci/RUST_GATES_ENABLED
# 2. Commit with metrics
git add .ci/RUST_GATES_ENABLED .github/bench-results/
git commit -m "chore(ci): activate Rust gates

- Finality <1ms ✅ [actual]
- PoI ≥100K/s ✅ [actual]
- Coverage ≥95% ✅ [actual]
- CVEs: 0 ✅
- Unsafe: 0 ✅

احسان (Ihsan) - Excellence enforced"

git push origin master
```

---

## Emergency Disable

```bash
# Requires 2 approvals
git rm .ci/RUST_GATES_ENABLED
git commit -m "chore(ci): emergency disable - [REASON]"
git push origin master
```

---

## Day 2 Checklist

- [ ] Fix `panic=abort` (5 min)
- [ ] Implement BlockGraph (<1ms)
- [ ] Implement PoI (≥100K/s)
- [ ] Write tests (≥95%)
- [ ] Run benchmarks
- [ ] Record baselines
- [ ] Activate gates

---

## Documentation

| File                               | Purpose             |
| ---------------------------------- | ------------------- |
| `CI-GATES-SUMMARY.md`              | Executive summary   |
| `CI-GATES-PREFLIGHT-REPORT.md`     | Detailed assessment |
| `CI-GATES-ACTIVATION-PROCEDURE.md` | Full procedure      |
| `CI-GATES-ACTIVATION-CHECKLIST.md` | 50+ items           |
| `CI-GATES-STATUS-REPORT.md`        | Complete status     |

**Total:** 42 pages

---

## Key Contacts

- Day 2 Engineer: [TBD]
- Senior Approver: [TBD]
- On-call: [TBD]

---

**Generated:** 2025-10-18
**Status:** ✅ Ready for Day 2
