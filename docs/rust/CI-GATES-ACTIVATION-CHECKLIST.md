# Rust CI Gates Activation Checklist

**Philosophy:** احسان (Ihsan) - Excellence enforced through measurement

**Purpose:** Step-by-step validation before activating BLOCKING CI gates

---

## Pre-Day 2 Setup ✅

### Infrastructure Preparation

- [x] **CI Pipeline Configured**
  - File: `.github/workflows/rust-ci.yml`
  - Jobs: 9 (check, test, coverage, audit, bench, perf gates, unsafe, TS compare, summary)
  - Status: ✅ Production-ready

- [x] **Gate Enablement File Created**
  - File: `.ci/RUST_GATES_ENABLED`
  - Documentation: Complete with all 7 gates defined
  - Status: ✅ Ready (not yet committed)

- [x] **Documentation Complete**
  - Activation procedure: `docs/rust/CI-GATES-ACTIVATION-PROCEDURE.md`
  - Pre-flight report: `docs/rust/CI-GATES-PREFLIGHT-REPORT.md`
  - This checklist: `docs/rust/CI-GATES-ACTIVATION-CHECKLIST.md`
  - Status: ✅ All docs written

- [x] **Security Tools Installed**
  - `cargo-audit v0.21.2`: ✅ Installed
  - Audit database: ✅ 822 advisories loaded
  - Status: ✅ CVE scanning ready

- [x] **Baseline Security Validation**
  - CVEs found: ✅ 0
  - Unsafe code blocks: ✅ 0 (except justified FFI)
  - Status: ✅ Clean security posture

---

## Day 2 Critical Fixes ⚠️

### BLOCKER #1: Fix Benchmark Infrastructure

- [ ] **Fix `panic=abort` Issue**

  ```toml
  # Add to rust/Cargo.toml
  [profile.dev.package."*"]
  panic = "unwind"

  [profile.bench]
  inherits = "release"
  panic = "unwind"
  ```

  - **Validation:** `cargo bench --no-run` should compile
  - **Priority:** 🔥 CRITICAL (blocks all performance gates)
  - **Time:** 5 minutes

- [ ] **Verify Benchmark Compilation**
  ```bash
  cd rust
  cargo bench --no-run --all
  ```

  - Expected: ✅ All benchmarks compile
  - **Priority:** 🔥 CRITICAL

---

### BLOCKER #2: Implement Core Features

- [ ] **BlockGraph Implementation**
  - Target: O(1) finality check via HashMap
  - Performance: p99 latency <1ms
  - File: `rust/consensus/src/lib.rs`
  - Tests: Comprehensive edge cases
  - **Priority:** 🔥 CRITICAL

- [ ] **PoI Attestation Implementation**
  - Target: ≥100K attestations/second
  - Algorithm: Ed25519 signature generation
  - File: `rust/poi/src/lib.rs`
  - Tests: Throughput + correctness
  - **Priority:** 🔥 CRITICAL

- [ ] **Comprehensive Test Suite**
  - Target: ≥95% code coverage
  - Unit tests: All public APIs
  - Integration tests: End-to-end flows
  - Edge cases: Error handling, boundaries
  - **Priority:** 🔥 CRITICAL

---

## Day 2 Development Validation 🟡

### Code Quality Gates

- [ ] **Compilation Check**

  ```bash
  cargo check --all-features --verbose
  ```

  - Expected: ✅ All crates compile
  - No warnings except documented deprecations
  - **Gate:** Blocks PR if fails

- [ ] **Formatting Check**

  ```bash
  cargo fmt -- --check
  ```

  - Expected: ✅ All code formatted
  - **Gate:** Blocks PR if fails

- [ ] **Clippy Lints**
  ```bash
  cargo clippy --all-features -- -D warnings
  ```

  - Expected: ✅ No warnings
  - **Gate:** Blocks PR if fails

---

### Security Gates

- [ ] **CVE Audit (Re-check)**

  ```bash
  cargo audit --deny warnings
  ```

  - Expected: ✅ 0 CVEs
  - Dependencies: All up to date
  - **Gate:** ❌ BLOCKING if CVEs found

- [ ] **Unsafe Code Detection**

  ```bash
  grep -r "\bunsafe\b" rust/*/src/*.rs
  ```

  - Expected: ✅ 0 unsafe blocks (except documented FFI)
  - **Gate:** ❌ BLOCKING if unsafe added

- [ ] **Dependency Review**
  ```bash
  cargo tree --duplicates
  ```

  - Expected: ✅ No duplicate dependencies
  - Minimize dependency count
  - **Best Practice:** Not a blocking gate

---

### Performance Gates

- [ ] **Finality Benchmark (Gate #1)**

  ```bash
  cargo bench --bench finality
  ```

  - Target: Mean <500μs, p99 <1ms
  - Measurement: Run 3x, take median
  - **Gate:** ❌ BLOCKING if p99 ≥1ms

- [ ] **PoI Throughput Benchmark (Gate #2)**

  ```bash
  cargo bench --bench attestation
  ```

  - Target: ≥100K attestations/second
  - Measurement: Criterion `iter_per_second`
  - **Gate:** ❌ BLOCKING if <100K/s

- [ ] **Record Baseline Metrics**
  ```bash
  cargo bench -- --save-baseline master
  mkdir -p .github/bench-results
  cargo bench --message-format=json > .github/bench-results/baseline-$(date +%Y%m%d).json
  ```

  - Purpose: Future regression detection
  - **Gate:** Required for Gate #6 (regression check)

---

### Test Coverage Gates

- [ ] **Install Coverage Tool**

  ```bash
  cargo install cargo-llvm-cov
  ```

  - Version: Latest stable
  - **Prerequisite:** Needed for Gate #3

- [ ] **Run Coverage Analysis (Gate #3)**

  ```bash
  cargo llvm-cov --all-features --workspace
  ```

  - Target: ≥95% line coverage
  - **Gate:** ❌ BLOCKING if <95%

- [ ] **Generate HTML Coverage Report**
  ```bash
  cargo llvm-cov --all-features --workspace --html
  # Open target/llvm-cov/html/index.html
  ```

  - Review: Identify uncovered edge cases
  - Add tests for all uncovered paths
  - **Best Practice:** Aim for 97%+

---

### Regression Detection

- [ ] **Run Regression Check (Gate #6)**

  ```bash
  cargo bench -- --baseline master
  ```

  - Target: <10% regression on any benchmark
  - **Gate:** ❌ BLOCKING if ≥10% slower

- [ ] **Analyze Performance Trends**
  ```bash
  cargo criterion --message-format=json | jq '.change'
  ```

  - Review: Any unexpected changes?
  - Document: Intentional optimizations
  - **Best Practice:** <5% variance ideal

---

### TypeScript Comparison

- [ ] **Record TypeScript Baseline (Gate #7)**

  ```bash
  cd .. && npm run bench
  # Record circuit breaker RPS from artifacts/peak-performance-report.json
  ```

  - Metric: Circuit breaker requests/second
  - **Prerequisite:** Needed for TS comparison

- [ ] **Run Rust vs TypeScript Comparison**

  ```bash
  cd rust && cargo bench --bench circuit_breaker
  # Compare with TS baseline
  ```

  - Target: Rust ≥1.5x faster than TypeScript
  - **Gate:** ❌ BLOCKING if <1.5x speedup

- [ ] **Document Speedup**
  - Calculate: `speedup = rust_rps / ts_rps`
  - Expected: ≥1.5x (ideally 2x+)
  - Commit results to `docs/rust/PERFORMANCE-COMPARISON.md`
  - **Best Practice:** Justify migration cost

---

## Final Pre-Activation Validation ✅

### Local Validation (All Gates)

- [ ] **Run Full Test Suite**

  ```bash
  cargo test --all --verbose
  ```

  - Expected: ✅ All tests pass
  - No flaky tests
  - **Critical:** Must be 100% reliable

- [ ] **Run All Benchmarks**

  ```bash
  cargo bench
  ```

  - Expected: ✅ All benchmarks pass gates
  - Finality: <1ms ✅
  - PoI: ≥100K/s ✅
  - Regression: <10% ✅
  - TS speedup: ≥1.5x ✅
  - **Critical:** Dry run before activation

- [ ] **Final Security Scan**

  ```bash
  cargo audit && grep -r "unsafe" rust/*/src/
  ```

  - Expected: ✅ 0 CVEs, 0 unsafe
  - **Critical:** Last-minute check

- [ ] **Final Coverage Check**
  ```bash
  cargo llvm-cov --all-features --workspace
  ```

  - Expected: ✅ ≥95% (ideally ≥97%)
  - **Critical:** Ensure safety net

---

### Team Readiness

- [ ] **Team Briefing Complete**
  - Reviewed: Activation procedure doc
  - Reviewed: Gate definitions in `.ci/RUST_GATES_ENABLED`
  - Reviewed: Remediation procedures
  - **Time:** 30 min standup

- [ ] **Rollback Procedure Tested**

  ```bash
  # Test emergency disable
  git rm .ci/RUST_GATES_ENABLED
  git commit -m "test: disable gates"
  git revert HEAD
  # Verify file restored
  ```

  - **Critical:** Ensure quick rollback capability

- [ ] **Escalation Path Defined**
  - Primary: Engineering team Slack channel
  - Secondary: Senior engineer review
  - Emergency: 2-approval bypass procedure
  - **Critical:** Clear communication

---

## Activation (Post-Validation) 🚀

### Commit Gate Enablement

- [ ] **Update Activation Metadata**

  ```bash
  # Edit .ci/RUST_GATES_ENABLED
  # Set:
  # - Activated: $(date +%Y-%m-%d)
  # - Engineer: [Your name]
  # - Approved By: [Senior engineer]
  ```

  - **Required:** Audit trail

- [ ] **Commit to Master**

  ```bash
  git add .ci/RUST_GATES_ENABLED
  git add .github/bench-results/
  git add docs/rust/

  git commit -m "chore(ci): activate Rust performance gates
  ```

Gates activated:

- Finality: <1ms (p99) ✅ measured 487μs
- PoI: ≥100K/s ✅ measured 143K/s
- Coverage: ≥95% ✅ measured 97.2%
- CVEs: 0 ✅
- Unsafe: 0 ✅
- Regression: <10% ✅
- TS speedup: ≥1.5x ✅ measured 2.1x

Philosophy: احسان (Ihsan) - Excellence enforced through measurement

Pre-flight report: docs/rust/CI-GATES-PREFLIGHT-REPORT.md
Activation procedure: docs/rust/CI-GATES-ACTIVATION-PROCEDURE.md

Validated by: [Engineer name]
Approved by: [Senior engineer name]"

git push origin master

```
- **Critical:** Descriptive commit with metrics

---

### Soft Launch Monitoring (48 hours)

- [ ] **Monitor First PR**
- Check: All gates run successfully
- Check: No false positives
- Check: Clear failure messages if any gate fails
- **Action:** Fix infrastructure issues immediately

- [ ] **Monitor Next 2-5 PRs**
- Track: Gate pass/fail rates
- Track: Time to remediate failures
- Collect: Team feedback
- **Action:** Adjust thresholds if systematic issues

- [ ] **Review Metrics After 48h**
- False positive rate: <5% acceptable
- Mean time to fix: <2 hours acceptable
- Team satisfaction: Positive feedback
- **Decision:** Proceed to full enforcement or adjust

---

### Full Enforcement (Post Soft Launch)

- [ ] **Lock Gate File with Branch Protection**
```

GitHub Settings → Branches → master

- Require review for .ci/ changes
- Require 2 approvals for gate bypass

```
- **Critical:** Prevent accidental disabling

- [ ] **Document Lessons Learned**
- What worked well?
- What caused friction?
- How to improve?
- **Action:** Update procedures based on feedback

- [ ] **Schedule Weekly Gate Review**
- When: Every Monday 10 AM
- Who: Engineering team
- What: Review metrics, adjust if needed
- **Continuous Improvement:** Tune quarterly

---

## Emergency Procedures 🚨

### If False Positive Detected

1. ✅ Verify it's truly a false positive (not a real issue)
2. ✅ Document the scenario in issue tracker
3. ✅ Quick fix gate threshold if needed
4. ✅ Update tests to prevent recurrence

### If Infrastructure Fails

1. ✅ Check CI logs for root cause
2. ✅ Temporary disable if blocking all PRs
3. ✅ Fix infrastructure ASAP
4. ✅ Re-enable gates after validation

### If Gate Too Strict

1. ✅ Collect data over 30+ PRs
2. ✅ Team consensus (80%+ agreement)
3. ✅ Adjust threshold gradually (±10% max)
4. ✅ Document justification

### If Emergency Bypass Needed

1. ✅ Get 2 senior engineer approvals
2. ✅ Document reason in PR description
3. ✅ Create follow-up issue for proper fix
4. ✅ Re-enable gates within 48 hours

---

## Success Criteria

### Short-term (First Week)

- ✅ 0 regressions merged to master
- ✅ <5% false positive rate
- ✅ <2 hour mean time to remediate
- ✅ Positive team feedback

### Medium-term (First Month)

- ✅ All gates consistently passing
- ✅ Performance improvements tracked
- ✅ Coverage maintained ≥95%
- ✅ Team confident in gates

### Long-term (First Quarter)

- ✅ Gates tightened based on data
- ✅ Zero security incidents
- ✅ Demonstrable quality improvement
- ✅ Gates viewed as helpful, not burdensome

---

## Signature

**Checklist Completed By:**
- Name: _________________________
- Date: _________________________
- Signature: ____________________

**Activation Approved By:**
- Senior Engineer: _______________
- Date: _________________________
- Signature: ____________________

---

**احسان (Ihsan)** - We measure what matters, we enforce what we measure.

---

*Checklist Version: 1.0*
*Created: 2025-10-18*
*Next Review: Post Day 2 completion*
```
