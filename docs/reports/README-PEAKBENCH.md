# BIZRA-NODE0 PeakBench Fix Kit

## Overview

Cross-platform benchmark execution toolkit that eliminates Linux-only dependencies (`| head -n N` pipes and `shell:true` spawning) to enable seamless performance testing on Windows.

## The Problem

Original benchmark scripts used Linux-specific patterns that fail on Windows:

- **Unix pipes**: `| head -n 100` doesn't exist in PowerShell
- **Shell spawning**: `child_process` with `shell:true` causes DEP0190 warnings on Windows
- **Output flooding**: Long-running benchmarks produce thousands of lines

## The Solution

### 1. Cross-Platform Output Truncation

**File**: `scripts/run-with-truncation.js`

Pure Node.js replacement for `| head -n N` that works on all platforms:

```bash
# Instead of (Linux only):
npm run benchmark | head -n 100

# Use (cross-platform):
node scripts/run-with-truncation.js --lines 120 -- npm run benchmark
```

**Features**:

- ✅ No shell required (`shell: false`)
- ✅ Handles both stdout and stderr
- ✅ Clean truncation message
- ✅ Preserves exit codes

### 2. Windows Performance Environment

**File**: `scripts/bench-env.ps1`

PowerShell script that configures optimal Node.js settings:

```powershell
./scripts/bench-env.ps1
npm run bench:cb-quick
```

**Configures**:

- `NODE_OPTIONS`: 4GB heap + source maps
- `UV_THREADPOOL_SIZE`: 64 threads for I/O
- `TS_NODE_TRANSPILE_ONLY`: Skip type checking for speed
- `FORCE_COLOR`: Color output in terminals

### 3. New Package Scripts

**Quick Benchmarks** (concise output, 120 lines):

```json
{
  "bench:cb-quick": "node scripts/run-with-truncation.js --lines 120 -- npx tsx scripts/benchmark-circuit-breaker.ts",
  "bench:validation-quick": "node scripts/run-with-truncation.js --lines 120 -- npx tsx scripts/benchmark-validation.ts",
  "bench:all-quick": "npm run bench:cb-quick && npm run bench:validation-quick"
}
```

**Full Benchmarks** (unchanged, complete output):

```json
{
  "bench:cb-full": "tsx scripts/benchmark-circuit-breaker.ts",
  "benchmark:validation": "ts-node scripts/benchmark-validation.ts",
  "stress:cb": "tsx scripts/stress-test-circuit-breaker.ts"
}
```

## Quick Start

### Windows PowerShell

```powershell
# 1. Set up environment
./scripts/bench-env.ps1

# 2. Run quick benchmarks (concise output)
npm run bench:cb-quick
npm run bench:validation-quick
npm run bench:all-quick

# 3. Run full benchmarks (complete output)
npm run bench:cb-full
npm run benchmark:validation
```

### Linux/macOS

```bash
# Quick benchmarks work identically
npm run bench:cb-quick
npm run bench:validation-quick

# Full benchmarks also work
npm run bench:cb-full
npm run benchmark:validation
```

## Usage Examples

### Circuit Breaker Benchmark

```bash
# Quick (120 lines)
npm run bench:cb-quick

# Full output
npm run bench:cb-full
```

**Expected Output** (quick):

```
🔬 Circuit Breaker Performance Benchmark
========================================

📊 Sequential Throughput Test
  Total Requests: 10000
  Duration: 342ms
  Throughput: 29,239 req/s
  P50 Latency: 0.32ms
  P95 Latency: 0.89ms
  P99 Latency: 1.15ms

⚡ Concurrent Throughput Test (100 concurrent)
  Total Requests: 50000
  Duration: 1,824ms
  Throughput: 27,412 req/s
  P50 Latency: 3.21ms
  P95 Latency: 4.56ms
  P99 Latency: 5.12ms

🎯 Target Validation
  ✅ Throughput >= 25K req/s
  ✅ P50 Latency <= 0.4ms
  ✅ P99 Latency <= 1.2ms
  ✅ Memory stable at 400KB

[truncated output at 120 lines]
```

### Validation Service Benchmark

```bash
# Quick (120 lines)
npm run bench:validation-quick

# Full output
npm run benchmark:validation
```

**Expected Metrics**:

- Transaction validation: 10s → 3s (-70%)
- Cache hit rate: 10% → 35-40% (+250%)
- Error rate: 8% → <2% (-75%)

## Advanced Usage

### Custom Line Limits

```bash
# Show only first 50 lines
node scripts/run-with-truncation.js --lines 50 -- npm run bench:cb-full

# Show 200 lines
node scripts/run-with-truncation.js --lines 200 -- npm run benchmark:validation
```

### Integration with CI/CD

```yaml
# .github/workflows/performance.yml
- name: Run Performance Benchmarks
  shell: pwsh
  run: |
    ./scripts/bench-env.ps1
    npm run bench:all-quick
```

### Custom Commands

```bash
# Any Node.js command
node scripts/run-with-truncation.js --lines 100 -- npx vitest bench

# Even non-npm commands
node scripts/run-with-truncation.js --lines 150 -- node your-script.js
```

## Performance Targets

Based on PEAK-PERFORMANCE-REPORT-20251018.md:

### Circuit Breaker (WORLD-CLASS)

- **Throughput**: 25,000-35,000 req/s
- **P50 Latency**: 0.2-0.4ms
- **P95 Latency**: 0.6-0.9ms
- **P99 Latency**: 0.8-1.2ms
- **Memory**: 400KB fixed allocation
- **Operations**: O(1) for all operations

### Cache Service (ELITE-GRADE)

- **L1 Cache (Memory)**: <2ms latency
- **L2 Cache (Redis)**: <15ms latency
- **Hit Rate Target**: 90-95%
- **Eviction**: LRU with lazy deletion
- **Compression**: Smart algorithm selection

### Validation Service (70% FASTER)

- **Transaction Validation**: 10s → 3s (-70%)
- **Cache Hit Rate**: 10% → 35-40% (+250%)
- **Error Rate**: 8% → <2% (-75%)
- **HTTP Pool**: 512 maxSockets with keep-alive
- **Retry Strategy**: Exponential backoff (50ms, 200ms, 800ms)

## Troubleshooting

### PowerShell Execution Policy

If you see "cannot be loaded because running scripts is disabled":

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### NPM Script Shell (Optional)

To make PowerShell the default for npm scripts:

```bash
npm config set script-shell "powershell.exe"
```

### Missing tsx Package

If `tsx` is not found:

```bash
npm install --save-dev tsx
```

### Redis Connection Errors

Start Redis for cache benchmarks:

```bash
npm run db:test:up
```

## Migration Guide

### From Linux Pipes to Truncation Script

**Before** (Linux only):

```json
{
  "bench:quick": "npm run benchmark | head -n 100"
}
```

**After** (cross-platform):

```json
{
  "bench:quick": "node scripts/run-with-truncation.js --lines 120 -- npm run benchmark"
}
```

### From shell:true to shell:false

**Before** (causes warnings):

```javascript
spawn("npm", ["run", "test"], { shell: true });
```

**After** (safe):

```javascript
// Use run-with-truncation.js instead
spawn(
  "node",
  [
    "scripts/run-with-truncation.js",
    "--lines",
    "100",
    "--",
    "npm",
    "run",
    "test",
  ],
  { shell: false },
);
```

## Files in This Kit

```
scripts/
├── run-with-truncation.js     # Cross-platform output truncation
├── bench-env.ps1              # Windows environment setup
├── benchmark-circuit-breaker.ts   # Circuit breaker benchmarks
├── benchmark-validation.ts        # Validation service benchmarks
└── stress-test-circuit-breaker.ts # Stress testing

docs/
└── PEAK-PERFORMANCE-REPORT-20251018.md  # 98/100 grade analysis

package.json
└── New scripts: bench:*-quick, bench:all-quick
```

## Support

- **Performance Report**: See `docs/PEAK-PERFORMANCE-REPORT-20251018.md`
- **Circuit Breaker Docs**: See `src/service-mesh/circuit-breaker/README.md`
- **Issues**: GitHub Issues for BIZRA-NODE0 repository

## Credits

**Fix Kit Design**: Surgical solution for Windows/Linux benchmark compatibility
**Performance Targets**: Based on WORLD-CLASS implementations in BIZRA-NODE0
**Overall System Grade**: 98/100 (PEAK-PERFORMANCE-REPORT-20251018.md)

---

**Status**: ✅ PRODUCTION-READY | Windows + Linux + macOS Compatible
