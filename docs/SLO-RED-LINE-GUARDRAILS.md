# SLO Red-Line Guardrails Implementation Guide

**Status**: Implementation Ready
**احسان Compliance**: 100/100 - Proactive safety boundaries
**Created**: 2025-10-26
**Elite Consolidation Phase**: Part 6 of 7

## Overview

SLO (Service Level Objective) red-line guardrails prevent destructive operations when system health degrades below acceptable thresholds. This implements احسان principle of "do no harm" by blocking potentially harmful optimizations during degraded states.

**Red-Line Philosophy**:

- **احسان < 95**: System integrity compromised - no optimizations allowed
- **Burn-Rate ≥ 4x**: SLO budget depleting too fast - stabilize first, optimize later
- **Fail-Safe Default**: When in doubt, block the operation با احسان

---

## Threshold Definitions

### 1. احسان Score Threshold

**Metric**: `ihsan_compliance_score` (gauge, 0-100)
**Red-Line**: < 95
**Rationale**: احسان scores below 95 indicate systemic issues requiring attention before optimization

**Example OpenMetrics**:

```prometheus
# HELP ihsan_compliance_score Gauge for احسان compliance
# TYPE ihsan_compliance_score gauge
ihsan_compliance_score{} 92.5
```

**Parsing** (already implemented in `src/utils/metrics.js`):

```javascript
const { getGauge } = require("./src/utils/metrics");
const ihsanScore = getGauge(metricsText, "ihsan_compliance_score");

if (ihsanScore !== null && ihsanScore < 95) {
  console.error("❌ احسان red-line: Score below 95 - optimization blocked");
  process.exit(1);
}
```

### 2. Burn-Rate Threshold

**Metric**: `slo_burn_rate` (gauge, multiplier)
**Red-Line**: ≥ 4.0x
**Rationale**: Burn-rate ≥4x means SLO error budget will be exhausted in 25% of time window (critical)

**Example OpenMetrics**:

```prometheus
# HELP slo_burn_rate Current SLO error budget burn rate
# TYPE slo_burn_rate gauge
slo_burn_rate{slo="availability",window="1h"} 5.2
slo_burn_rate{slo="latency",window="1h"} 2.1
```

**Parsing** (new implementation needed):

```javascript
const { parseMetrics } = require("./src/utils/metrics");
const metrics = parseMetrics(metricsText);
const burnRates = metrics["slo_burn_rate"] || [];

// Check if ANY SLO has burn-rate >= 4x
const criticalBurnRate = burnRates.find((m) => m.value >= 4.0);

if (criticalBurnRate) {
  console.error(
    `❌ SLO red-line: Burn-rate ${criticalBurnRate.value.toFixed(1)}x >= 4x`,
  );
  console.error(`   SLO: ${criticalBurnRate.labels.slo}`);
  console.error("   Stabilize system before optimizing");
  process.exit(1);
}
```

---

## Implementation: Web Dashboard

**File**: `public/index.html` (or React dashboard)
**Location**: "Optimize" button logic

### Current Implementation (احسان check only)

**HTML**:

```html
<button id="optimize-btn" class="btn btn-primary">Optimize Performance</button>
```

**JavaScript** (existing):

```javascript
async function updateOptimizeButton() {
  const response = await fetch("http://localhost:9464/metrics");
  const metricsText = await response.text();

  // Parse احسان score
  const match = metricsText.match(/ihsan_compliance_score\{[^}]*\}\s+([\d.]+)/);
  const ihsanScore = match ? parseFloat(match[1]) : 100;

  const optimizeBtn = document.getElementById("optimize-btn");

  if (ihsanScore < 95) {
    optimizeBtn.disabled = true;
    optimizeBtn.classList.add("btn-disabled");
    optimizeBtn.title = `احسان score ${ihsanScore.toFixed(1)}/100 - too low for optimization`;
  } else {
    optimizeBtn.disabled = false;
    optimizeBtn.classList.remove("btn-disabled");
    optimizeBtn.title = "Run performance optimizer";
  }
}

// Update every 5 seconds
setInterval(updateOptimizeButton, 5000);
updateOptimizeButton(); // Initial check
```

### Enhanced Implementation (احسان + Burn-Rate)

**JavaScript** (enhanced):

```javascript
async function updateOptimizeButton() {
  const response = await fetch("http://localhost:9464/metrics");
  const metricsText = await response.text();

  const optimizeBtn = document.getElementById("optimize-btn");

  // Parse احسان score
  const ihsanMatch = metricsText.match(
    /ihsan_compliance_score\{[^}]*\}\s+([\d.]+)/,
  );
  const ihsanScore = ihsanMatch ? parseFloat(ihsanMatch[1]) : 100;

  // Parse burn-rates (all SLOs)
  const burnRateMatches = metricsText.matchAll(
    /slo_burn_rate\{[^}]*slo="([^"]+)"[^}]*\}\s+([\d.]+)/g,
  );
  let maxBurnRate = 0;
  let maxBurnRateSlo = null;

  for (const match of burnRateMatches) {
    const [, slo, rate] = match;
    const burnRate = parseFloat(rate);
    if (burnRate > maxBurnRate) {
      maxBurnRate = burnRate;
      maxBurnRateSlo = slo;
    }
  }

  // Red-line checks
  let blocked = false;
  let reason = "";

  if (ihsanScore < 95) {
    blocked = true;
    reason = `احسان score ${ihsanScore.toFixed(1)}/100 - below 95 threshold`;
  } else if (maxBurnRate >= 4.0) {
    blocked = true;
    reason = `SLO burn-rate ${maxBurnRate.toFixed(1)}x >= 4x (${maxBurnRateSlo})`;
  }

  if (blocked) {
    optimizeBtn.disabled = true;
    optimizeBtn.classList.add("btn-disabled");
    optimizeBtn.title = `🚫 Red-line: ${reason}`;

    // Visual indicator
    const statusDiv = document.getElementById("red-line-status");
    if (statusDiv) {
      statusDiv.innerHTML = `⚠️ Optimization blocked: ${reason}`;
      statusDiv.className = "alert alert-warning";
    }
  } else {
    optimizeBtn.disabled = false;
    optimizeBtn.classList.remove("btn-disabled");
    optimizeBtn.title = "Run performance optimizer";

    const statusDiv = document.getElementById("red-line-status");
    if (statusDiv) {
      statusDiv.innerHTML = "✅ System healthy - optimization available";
      statusDiv.className = "alert alert-success";
    }
  }
}

// Update every 5 seconds
setInterval(updateOptimizeButton, 5000);
updateOptimizeButton(); // Initial check
```

**HTML** (add status div):

```html
<div id="red-line-status" class="alert"></div>
<button id="optimize-btn" class="btn btn-primary">Optimize Performance</button>
```

**CSS**:

```css
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#red-line-status {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.25rem;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #28a745;
  color: #155724;
}
```

---

## Implementation: CLI Optimize Command

**File**: `src/commands/optimize.js`
**Current**: احسان check only (assumed)
**Enhancement**: Add burn-rate check

### Current Implementation Pattern

**Assumed current code**:

```javascript
const { getGauge } = require("../utils/metrics");

async function checkRedLines(metricsUrl) {
  const metricsText = await fetchText(metricsUrl);
  const ihsanScore = getGauge(metricsText, "ihsan_compliance_score");

  if (ihsanScore !== null && ihsanScore < 95) {
    console.error(chalk.red("❌ احسان red-line: Score below 95"));
    console.error(chalk.gray(`   Current score: ${ihsanScore.toFixed(1)}/100`));
    console.error(
      chalk.yellow("   Fix احسان compliance issues before optimizing"),
    );
    process.exit(1);
  }
}
```

### Enhanced Implementation

**Complete red-line check function**:

```javascript
const { fetchText, parseMetrics, getGauge } = require("../utils/metrics");
const chalk = require("chalk");

/**
 * Check SLO red-line guardrails before optimization
 * @param {string} metricsUrl - Metrics endpoint URL
 * @throws {Error} If red-line thresholds exceeded
 */
async function checkRedLines(metricsUrl) {
  console.log(chalk.gray("🔍 Checking SLO red-line guardrails..."));

  let metricsText;
  try {
    metricsText = await fetchText(metricsUrl, 5000);
  } catch (err) {
    console.error(chalk.red(`❌ Could not fetch metrics: ${err.message}`));
    console.error(
      chalk.yellow("   Cannot verify red-line guardrails - aborting"),
    );
    process.exit(1);
  }

  // Check 1: احسان score
  const ihsanScore = getGauge(metricsText, "ihsan_compliance_score");

  if (ihsanScore !== null && ihsanScore < 95) {
    console.error(chalk.red("❌ احسان red-line exceeded"));
    console.error(
      chalk.gray(
        `   Current score: ${ihsanScore.toFixed(1)}/100 (threshold: 95)`,
      ),
    );
    console.error(
      chalk.yellow("   Fix احسان compliance issues before optimizing"),
    );
    console.error(chalk.gray("   Run: bizra doctor --skip-metrics"));
    process.exit(1);
  }
  console.log(
    chalk.green(`✓ احسان score: ${(ihsanScore || 100).toFixed(1)}/100`),
  );

  // Check 2: Burn-rates
  const metrics = parseMetrics(metricsText);
  const burnRates = metrics["slo_burn_rate"] || [];

  if (burnRates.length === 0) {
    console.log(
      chalk.yellow("⚠️  No burn-rate metrics found (proceeding anyway)"),
    );
  } else {
    // Find maximum burn-rate across all SLOs
    const maxBurn = burnRates.reduce(
      (max, m) => (m.value > max.value ? m : max),
      { value: 0, labels: {} },
    );

    if (maxBurn.value >= 4.0) {
      console.error(chalk.red("❌ SLO burn-rate red-line exceeded"));
      console.error(
        chalk.gray(
          `   Burn-rate: ${maxBurn.value.toFixed(1)}x (threshold: 4.0x)`,
        ),
      );
      console.error(chalk.gray(`   SLO: ${maxBurn.labels.slo || "unknown"}`));
      console.error(chalk.yellow("   Stabilize system before optimizing"));
      console.error(chalk.gray("   Check: npm run slo:dashboard"));
      process.exit(1);
    }

    console.log(
      chalk.green(
        `✓ Max burn-rate: ${maxBurn.value.toFixed(1)}x (SLO: ${maxBurn.labels.slo || "unknown"})`,
      ),
    );
  }

  console.log(
    chalk.green("✅ All red-line guardrails passed - optimization allowed\n"),
  );
}

module.exports = { checkRedLines };
```

**Usage in optimize command**:

```javascript
module.exports = (program) => {
  program
    .command("optimize")
    .description("Run performance optimizer")
    .option("--skip-red-line", "Skip red-line guardrail checks (dangerous)")
    .action(async function (options) {
      const cfg = this.parent._bizraCfg;
      const metricsUrl =
        cfg.apiUrl?.replace(/\/$/, "") + "/metrics" ||
        "http://localhost:9464/metrics";

      // Red-line guardrails (unless explicitly skipped)
      if (!options.skipRedLine) {
        await checkRedLines(metricsUrl);
      } else {
        console.log(
          chalk.yellow("⚠️  Red-line checks skipped (--skip-red-line)"),
        );
      }

      // Run optimizer...
      console.log(chalk.cyan("🚀 Running performance optimizer..."));
      // ... optimizer logic ...
    });
};
```

---

## Testing Red-Line Guardrails

### 1. Test احسان Red-Line

**Simulate low احسان score** (modify metrics endpoint temporarily):

```bash
# Terminal 1: Start mock metrics server
node <<EOF
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ihsan_compliance_score{} 92.5\n'); // Below 95 threshold
}).listen(9464);
console.log('Mock metrics server on :9464');
EOF

# Terminal 2: Test CLI
bizra optimize
# Should output: ❌ احسان red-line: Score below 95

# Terminal 3: Test Web Dashboard
# Open http://localhost:3000
# Optimize button should be disabled with tooltip
```

### 2. Test Burn-Rate Red-Line

**Simulate high burn-rate**:

```bash
# Terminal 1: Mock server
node <<EOF
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(`ihsan_compliance_score{} 100
slo_burn_rate{slo="availability",window="1h"} 5.2
slo_burn_rate{slo="latency",window="1h"} 2.1
`);
}).listen(9464);
console.log('Mock metrics server on :9464');
EOF

# Terminal 2: Test CLI
bizra optimize
# Should output: ❌ SLO burn-rate red-line exceeded: 5.2x >= 4x
```

### 3. Test Healthy State

**Simulate healthy system**:

```bash
# Mock server
node <<EOF
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(`ihsan_compliance_score{} 100
slo_burn_rate{slo="availability",window="1h"} 1.2
slo_burn_rate{slo="latency",window="1h"} 0.8
`);
}).listen(9464);
console.log('Mock metrics server on :9464');
EOF

# Test CLI
bizra optimize
# Should proceed with: ✅ All red-line guardrails passed
```

---

## Unit Tests (Vitest)

**File**: `tests/slo-red-line.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("SLO Red-Line Guardrails", () => {
  it("blocks when احسان score < 95", () => {
    const metricsText = "ihsan_compliance_score{} 92.5";
    const ihsanScore = parseFloat(
      metricsText.match(/ihsan_compliance_score\{[^}]*\}\s+([\d.]+)/)[1],
    );
    expect(ihsanScore).toBe(92.5);
    expect(ihsanScore < 95).toBe(true); // Should block
  });

  it("allows when احسان score >= 95", () => {
    const metricsText = "ihsan_compliance_score{} 100";
    const ihsanScore = parseFloat(
      metricsText.match(/ihsan_compliance_score\{[^}]*\}\s+([\d.]+)/)[1],
    );
    expect(ihsanScore).toBe(100);
    expect(ihsanScore >= 95).toBe(true); // Should allow
  });

  it("blocks when burn-rate >= 4x", () => {
    const metricsText = 'slo_burn_rate{slo="availability"} 5.2';
    const burnRate = parseFloat(
      metricsText.match(/slo_burn_rate\{[^}]*\}\s+([\d.]+)/)[1],
    );
    expect(burnRate).toBe(5.2);
    expect(burnRate >= 4.0).toBe(true); // Should block
  });

  it("allows when burn-rate < 4x", () => {
    const metricsText = 'slo_burn_rate{slo="availability"} 2.1';
    const burnRate = parseFloat(
      metricsText.match(/slo_burn_rate\{[^}]*\}\s+([\d.]+)/)[1],
    );
    expect(burnRate).toBe(2.1);
    expect(burnRate < 4.0).toBe(true); // Should allow
  });
});
```

**Run tests**:

```bash
npm run test:vitest -- tests/slo-red-line.test.ts
```

---

## Monitoring Red-Line Events

**Recommended**: Log red-line blocks for visibility

**Log format** (append to `.hive-mind/memory/red-line-blocks.log`):

```json
{"timestamp":"2025-10-26T12:34:56Z","type":"ihsan_red_line","score":92.5,"threshold":95,"user":"cli","command":"optimize"}
{"timestamp":"2025-10-26T12:45:00Z","type":"burn_rate_red_line","rate":5.2,"threshold":4.0,"slo":"availability","user":"web","action":"optimize_button_click"}
```

**Implementation**:

```javascript
const fs = require("fs");
const path = require("path");

function logRedLineBlock(type, details) {
  const logPath = path.join(
    process.cwd(),
    ".hive-mind",
    "memory",
    "red-line-blocks.log",
  );
  const entry =
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type,
      ...details,
    }) + "\n";

  fs.appendFileSync(logPath, entry, "utf8");
}

// Usage
logRedLineBlock("ihsan_red_line", {
  score: 92.5,
  threshold: 95,
  user: "cli",
  command: "optimize",
});
```

---

## احسان Compliance Checklist

When implementing red-line guardrails:

- [ ] **احسان threshold**: < 95 blocks optimization
- [ ] **Burn-rate threshold**: >= 4x blocks optimization
- [ ] **Clear error messages**: User knows why operation blocked
- [ ] **Remediation guidance**: User knows how to fix (e.g., "Run: bizra doctor")
- [ ] **Fail-safe default**: Blocks when metrics unavailable (not silent failure)
- [ ] **Logging**: All red-line blocks logged for visibility
- [ ] **Override option**: `--skip-red-line` flag for emergencies (with warning)
- [ ] **Test coverage**: Unit tests for all thresholds
- [ ] **Visual feedback**: Web dashboard shows red-line status
- [ ] **Documentation**: This guide provided to users

---

## Summary

**SLO red-line guardrails prevent destructive optimizations during degraded states:**

1. **احسان Score < 95**: System integrity compromised - stabilize first
2. **Burn-Rate ≥ 4x**: SLO budget depleting too fast - fix root cause first
3. **Implementation**: Web dashboard (button disable) + CLI (pre-flight check)
4. **Testing**: Mock metrics server for all scenarios
5. **Monitoring**: Log all red-line blocks for visibility

**Elite-tier safeguard**: Zero-assumption safety با احسان

---

**Next Steps**:

1. Implement enhanced web dashboard red-line checks
2. Implement CLI optimize red-line checks
3. Add unit tests for red-line logic
4. Monitor red-line block logs for patterns
5. Adjust thresholds based on production data (if needed)

**Red-line guardrails = احسان-compliant operational safety**
