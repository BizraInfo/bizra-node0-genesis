# BIZRA NODE0 WEEK-1 LAUNCH PLAN

## Tight & Practical Operations Guide با احسان

**Start Date**: October 26, 2025 (Day-0 Complete)
**احسان Compliance**: 100/100
**Status**: Production-Ready
**Git Tag**: v1.0.0-node0

---

## Daily 10-Minute Routine

**Every Morning** (before coffee):

```powershell
# 1. Quick GO/NO-GO check
powershell -ExecutionPolicy Bypass -File scripts\go-no-go-verification.ps1

# 2. Check احsان compliance
curl http://localhost:8080/metrics | Select-String "ihsan_compliance_score"
# Target: 100.0 (acceptable: ≥95.0)

# 3. Check error budget
npm run dashboard
# Monitor: Error Budget gauge (should stay >50%, green zone)

# 4. Review last optimizer cycle
ls evidence\poi-attestations\ | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content | ConvertFrom-Json | Select-Object cycle_id, ahsan_score, timestamp
```

**Expected Time**: 3-5 minutes
**Red Flag**: احسان score <95, error budget <50%, or attestations stopped generating

---

## Week-1 Schedule

### Day 1 (Monday, October 26) - SECURE & BACKUP

**Morning** (30 minutes):

1. **Secure Backup**:

   ```powershell
   # Create encrypted backup bundle
   $backupPath = "E:\BIZRA-Backups\Day0-$(Get-Date -Format 'yyyyMMdd')"
   New-Item -ItemType Directory -Force $backupPath

   # Copy critical components
   Copy-Item C:\BIZRA-NODE0 $backupPath\BIZRA-NODE0 -Recurse
   Copy-Item signatures\checksums-day0.txt $backupPath\
   Copy-Item evidence\poi-attestations\* $backupPath\poi-attestations\ -Recurse

   # Encrypt (Windows: BitLocker, or 7-Zip with AES-256)
   # Store encrypted drive offline (physical security)
   ```

2. **Seal Day-0 Build**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\seal-day0-build.ps1
   ```
   Verify: `signatures\checksums-day0.txt` and `signatures\day0-seal.json` created

**Afternoon** (60 minutes):

1. **Import Grafana Dashboard**:
   - Open Grafana: http://grafana:3000
   - Import `monitoring/grafana-dashboard-bizra-apex.json`
   - Verify panels: احسان Compliance Gauge, Error Budget, Burn Rate Chart

2. **Configure Prometheus**:

   ```yaml
   # Add to prometheus.yml
   rule_files:
     - "monitoring/prometheus-rules/ahsan-slo.yml"
     - "monitoring/prometheus-rules/alerts.yml"

   scrape_configs:
     - job_name: "node0"
       static_configs:
         - targets: ["localhost:8080"]
       scrape_interval: 15s
       metrics_path: /metrics
   ```

   ```bash
   # Validate rules
   promtool check rules monitoring/prometheus-rules/ahsan-slo.yml
   promtool check rules monitoring/prometheus-rules/alerts.yml

   # Reload Prometheus
   curl -X POST http://prometheus:9090/-/reload
   ```

**Evening**:

- ✅ Monitor first hourly optimizer cycle
- ✅ Verify PoI attestation generated
- ✅ Check Grafana dashboard updates

---

### Day 2 (Tuesday) - NODE REPLICATION TEST

**Morning** (45 minutes):

1. **Node1 Smoke Test**:

   ```powershell
   # Bootstrap Node1 with different ports
   powershell -ExecutionPolicy Bypass -File templates\node-template-v1\scripts\bootstrap.ps1 `
     -Target "C:\BIZRA-NODE1" `
     -ApiPort 8180 `
     -LlmPort 3100 `
     -ToolsPort 3101
   ```

2. **Verify Node1 Health**:

   ```powershell
   # Change ports in health check temporarily
   $env:NODE_API_PORT = 8180
   curl http://localhost:8180/health
   curl http://localhost:8180/metrics | Select-String "ihsan_compliance_score"
   ```

3. **Generate First Node1 Attestation**:
   ```powershell
   cd C:\BIZRA-NODE1
   python ops\validation\generate-daily-proof.py
   ```

**Afternoon**:

- ✅ Compare Node0 vs Node1 metrics
- ✅ Verify Genesis Template replication worked
- ✅ Document any issues encountered

**Success Criteria**:

- Node1 health triad passes
- احسان score 100/100 on both nodes
- PoI attestation generated on Node1

---

### Day 3 (Wednesday) - OPTIMIZER ACTIVATION

**Morning** (15 minutes):

1. **Verify Task Scheduler Status**:

   ```batch
   scripts\verify-optimizer-task.bat
   ```

2. **Manual Trigger First Cycle** (if not auto-run yet):

   ```powershell
   schtasks /Run /TN "BIZRA-Node0-SelfOptimizer"

   # Wait 2 minutes, then check
   Get-Content logs\task-scheduler.log -Tail 50
   ```

**Afternoon** (throughout day):

- ✅ Monitor hourly cycles (expected: 9:00 AM, 10:00 AM, 11:00 AM, ...)
- ✅ Verify احسان score stays 100/100
- ✅ Check optimizer success rate (target: >90%)

**Evening**:

- ✅ Review all PoI attestations generated today
- ✅ Confirm SLSA provenance files created
- ✅ Verify SBOM updated

---

### Day 4 (Thursday) - CAPACITY BENCHMARK

**Morning** (prep):

1. **Prepare 50-Agent Fleet**:
   - Review fleet scripts (if available)
   - Verify resource availability (CPU, memory)

**Afternoon** (2 hours):

1. **Run Scaling Test**:

   ```bash
   # Example: spawn 50 agents and measure capacity
   # Track metrics: throughput, latency (P95/P99), احسان compliance
   ```

2. **Capture Benchmark PoI**:
   - Generate dedicated PoI attestation for capacity test
   - Document: agents/sec, requests/sec, احsان score maintained

**Evening**:

- ✅ Analyze capacity results
- ✅ Document scaling limits
- ✅ Update runbook with capacity guidance

---

### Day 5 (Friday) - ALERT TUNING

**Morning** (60 minutes):

1. **Review Alert History** (from Day 1-4):

   ```promql
   # Check which alerts fired
   ALERTS{alertstate="firing"}

   # Review alert history in Prometheus
   ```

2. **Tune Thresholds** (if false positives):
   - Edit `monitoring/prometheus-rules/alerts.yml`
   - Adjust `for` durations or threshold values
   - Document changes با احسان (explicit reasoning)

3. **Test Alert Suppression**:
   ```yaml
   # Example: if P95 latency alert too sensitive
   - alert: P95LatencyHigh
     expr: job:http_p95_latency:5m > 0.15 # Increased from 0.1
     for: 15m # Increased from 10m
   ```

**Afternoon**:

- ✅ Reload Prometheus rules
- ✅ Verify no spurious alerts
- ✅ Document alert tuning in runbook

---

### Day 6-7 (Weekend) - GOLDEN-PATH DEMO PREP

**Saturday** (90 minutes):

1. **Prepare Demo Script**:
   - 10-minute live demo (no slides)
   - Sequence: Dashboard → احسان gauge → PoI attestation → Live optimizer cycle → Metrics tail

2. **Practice Run**:

   ```powershell
   # 1. Open PEAK Dashboard
   npm run dashboard

   # 2. Show احسان compliance (100/100)
   # 3. Open latest PoI attestation
   ls evidence\poi-attestations\ | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content | jq .

   # 4. Trigger optimizer cycle live
   schtasks /Run /TN "BIZRA-Node0-SelfOptimizer"

   # 5. Tail metrics in real-time
   curl http://localhost:8080/metrics | Select-String "ihsan_compliance_score|error_budget|burn_rate"
   ```

**Sunday** (optional):

- ✅ Refine demo timing
- ✅ Prepare backup talking points
- ✅ Test network connectivity for demo environment

---

## GCC VIP Pipeline Prep

**Target Accounts**:
| Account | Country | Pilot | ACV | Status |
|---------|---------|-------|-----|--------|
| ADIO | UAE | $65K | $350K | Scheduled Week-2 |
| PIF | Saudi | $75K | $450K | Scheduled Week-3 |
| QIA | Qatar | $60K | $300K | Scheduled Week-4 |

**Total Pipeline**: $1.1M
**Expected ARR**: $733K (67% conversion rate)

**Demo Talking Points**:

1. **احسان Compliance**: Zero assumptions, complete transparency, cryptographic proof
2. **Autonomous Optimization**: Hourly cycles with automatic rollback on violations
3. **Evidence Chain**: PoI + SLSA + SBOM = full auditability
4. **Production-Ready**: v1.0.0-node0 tag, 607-line runbook, multi-window SLO alerting

---

## Micro-Risk Register (Mitigations Applied)

| Risk               | Mitigation                               | Status                       |
| ------------------ | ---------------------------------------- | ---------------------------- |
| Privilege Creep    | Migrated to BIZRA-SVC (least-privileged) | ✅ Script ready              |
| Template Tampering | Checksums manifest + signatures          | ✅ Automated                 |
| Runaway Optimizer  | CPU/burn rate guardrails                 | ✅ In run-self-optimizer.ps1 |
| Config Drift       | Day-0 tag + manifest + PEAK runbook      | ✅ Complete                  |
| Evidence Gaps      | Hourly PoI attestations                  | ✅ Automated                 |

---

## Week-1 Success Criteria

**By End of Week**:

- [ ] Secure backup created and encrypted
- [ ] Grafana dashboard imported and verified
- [ ] Node1 replication successful (smoke test passed)
- [ ] Optimizer running hourly with >90% success rate
- [ ] احسان compliance maintained at 100/100
- [ ] 50-agent capacity benchmark completed
- [ ] Alerts tuned (no false positives)
- [ ] Golden-path demo rehearsed and ready

**Metrics to Track**:

- احسان score: Target 100/100 (acceptable ≥95)
- Error budget: Target >70% (acceptable >50%)
- Burn rate: Target <1x (warning at 2x, critical at 14x)
- Optimizer success rate: Target >95% (acceptable >90%)
- PoI attestations: Expected 168 files (7 days × 24 hours)

---

## Emergency Contacts

**On-Call SRE**: [PagerDuty rotation]
**First Architect**: MoMo (Mahmoud Hassan)
**Escalation Path**: BIZRA Engineering Team

**Critical Links**:

- Dashboard: `npm run dashboard`
- Grafana: http://grafana:3000/d/bizra-slo
- Prometheus: http://prometheus:9090
- Runbook: `ops/runbooks/PEAK-RUNBOOK.md`

---

## Final Hardening Checklist (Do Before Week-1)

**Security**:

- [ ] Run `scripts/migrate-to-service-account.ps1` (BIZRA-SVC migration)
- [ ] Run `scripts/seal-day0-build.ps1` (checksums manifest)
- [ ] Verify guardrails in `scripts/run-self-optimizer.ps1`

**Validation**:

- [ ] Run `scripts/go-no-go-verification.ps1` (should exit 0)
- [ ] Verify Task Scheduler registered
- [ ] Confirm احsان score 100/100

---

**Status**: 🟢 READY FOR WEEK-1 با احسان

_"Excellence in the sight of Allah - operations with احسان."_
