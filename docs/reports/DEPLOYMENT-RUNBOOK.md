# BIZRA NODE0 - Production Deployment Runbook

## احسان Standard: World-Class DevOps Practices

**Version**: v2.2.0-rc1
**Last Updated**: 2025-10-21
**Owner**: DevOps Team
**On-Call**: See PagerDuty rotation

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Validation Procedures](#validation-procedures)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Troubleshooting](#troubleshooting)
7. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

### Infrastructure Validation

- [ ] Docker Desktop / Kubernetes cluster operational
- [ ] Registry credentials configured (`ghcr.io`)
- [ ] Secrets loaded (PostgreSQL, Redis, Neo4j credentials)
- [ ] Storage volumes provisioned (Sled DB)
- [ ] Network policies applied

### Code Quality Gates

- [ ] All CI/CD pipelines passing (GitHub Actions)
- [ ] Code review approved (minimum 2 reviewers)
- [ ] Security scans passed (Trivy, npm audit)
- [ ] Performance benchmarks meet احسان SLA (p95 < 200ms)
- [ ] Rust tests passing (100% pass rate)
- [ ] Integration tests passing

### Monitoring & Observability

- [ ] Prometheus scraping configured
- [ ] Grafana dashboards imported
- [ ] Alert rules applied (`k8s/monitoring/prometheus-alerts-production.yaml`)
- [ ] PagerDuty integration tested
- [ ] Slack notifications configured

---

## Deployment Steps

### Step 1: Build & Tag Docker Image

```bash
# احسان Standard: Reproducible builds with metadata
export GIT_COMMIT=$(git rev-parse HEAD)
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export VERSION="v2.2.0-rc1"

# Multi-arch build with BuildKit
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg GIT_COMMIT=$GIT_COMMIT \
  --build-arg BUILD_DATE=$BUILD_DATE \
  --build-arg BIZRA_USE_RUST=true \
  --cache-from ghcr.io/bizra/node:cache \
  --cache-to type=inline \
  -t ghcr.io/bizra/node:$VERSION \
  -t ghcr.io/bizra/node:latest \
  --push \
  .
```

**احسان Validation**: Image SHA must be recorded in deployment manifest.

### Step 2: Update Kubernetes Manifests

```bash
# Update image tag in deployment
kubectl set image deployment/bizra-apex \
  bizra-node=ghcr.io/bizra/node:$VERSION \
  -n bizra-testnet \
  --record

# Verify manifest update
kubectl get deployment bizra-apex -n bizra-testnet -o yaml | grep image
```

### Step 3: Execute Rolling Update

```bash
# احسان Standard: Zero-downtime deployment
kubectl rollout status deployment/bizra-apex -n bizra-testnet --timeout=10m

# Monitor pod transitions
watch kubectl get pods -n bizra-testnet -l app=bizra-apex
```

**احسان Checkpoint**: Monitor pod health during rollout. Stop if > 10% error rate.

### Step 4: Health Check Validation

```bash
# Wait for all replicas to be ready
kubectl wait --for=condition=available --timeout=5m \
  deployment/bizra-apex -n bizra-testnet

# Test health endpoint
kubectl port-forward -n bizra-testnet svc/bizra-apex 8080:8080 &
curl -f http://localhost:8080/health || exit 1
```

---

## Validation Procedures

### Functional Validation

```bash
# 1. Health check (MUST return 200)
curl -f http://localhost:8080/health
# Expected: {"status":"healthy","version":"v2.2.0-rc1","rustEnabled":true}

# 2. Root endpoint
curl -f http://localhost:8080/
# Expected: {"chainId":"bizra-testnet-001","status":"running"}

# 3. Metrics endpoint
curl -f http://localhost:9464/metrics | grep -c "^rust_"
# Expected: > 0 (Rust metrics present)
```

### Performance Validation (احسان SLA)

```bash
# Run k6 load test (احسان SLA: p95 < 200ms)
k6 run --vus 100 --duration 2m tests/performance/comprehensive-load-test.js

# احسان Validation: Check results
# - http_req_duration p95 < 200ms ✅
# - http_req_failed rate < 1% ✅
# - health_check_duration p95 < 100ms ✅
```

### Rust PoI Core Validation

```bash
# Verify Rust module loaded
docker exec bizra-founder-node \
  node -e "console.log(process.env.BIZRA_USE_RUST === 'true' ? '✅ Rust enabled' : '❌ Rust disabled')"

# Test attestation generation (احسان SLA: < 10ms)
# (Requires custom test endpoint - see CLAUDE.md)
```

---

## Rollback Procedures

### Immediate Rollback (Critical Failure)

```bash
# احسان Standard: Safety first - rollback immediately if:
# - Error rate > 5%
# - p95 latency > 500ms
# - Health checks failing
# - Rust PoI verification failures

# Rollback to previous revision
kubectl rollout undo deployment/bizra-apex -n bizra-testnet

# Monitor rollback
kubectl rollout status deployment/bizra-apex -n bizra-testnet --timeout=5m

# Verify health
curl -f http://localhost:8080/health
```

### Targeted Rollback (Specific Revision)

```bash
# List deployment history
kubectl rollout history deployment/bizra-apex -n bizra-testnet

# Rollback to specific revision
kubectl rollout undo deployment/bizra-apex -n bizra-testnet --to-revision=5
```

**احسان Post-Rollback**:

1. Create incident report in GitHub Issues
2. Schedule post-mortem within 24 hours
3. Update runbook with lessons learned

---

## Monitoring & Alerts

### Prometheus Metrics

Key metrics to monitor (احسان SLA):

- `http_request_duration_seconds{quantile="0.95"}` < 0.2 (200ms)
- `http_requests_total{status=~"5.."}` rate < 0.01 (1% error rate)
- `rust_poi_attestation_duration_seconds{quantile="0.95"}` < 0.01 (10ms)
- `up{job="bizra-node"}` == 1 (node availability)

### Grafana Dashboards

1. **BIZRA Overview**: http://grafana.bizra.ai/d/bizra-overview
2. **Rust PoI Metrics**: http://grafana.bizra.ai/d/bizra-rust-poi
3. **Kubernetes Resources**: http://grafana.bizra.ai/d/bizra-k8s

### Critical Alerts

Configured in `k8s/monitoring/prometheus-alerts-production.yaml`:

- `BizraNodeDown` (Severity: Critical)
- `BizraHighLatency` (Severity: Warning, SLA: احسان-p95-200ms)
- `BizraPoIVerificationFailures` (Severity: Critical, Security: High)

---

## Troubleshooting

### Issue: Pods Not Starting

```bash
# Check pod events
kubectl describe pod -n bizra-testnet -l app=bizra-apex

# Common causes:
# 1. Image pull failure → Check registry credentials
# 2. Resource limits → Increase CPU/memory requests
# 3. Init container failure → Check Rust binary availability
```

### Issue: High Latency

```bash
# Check current latency
kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464
curl -s http://localhost:9464/metrics | grep http_request_duration_seconds

# احسان Debug Steps:
# 1. Check pod CPU/memory utilization
# 2. Review Rust PoI benchmark metrics
# 3. Verify database connection pool settings
# 4. Scale horizontally (increase replicas)
```

### Issue: Rust Module Not Loading

```bash
# Check BIZRA_USE_RUST environment variable
kubectl get deployment bizra-apex -n bizra-testnet -o yaml | grep BIZRA_USE_RUST

# Verify native module exists in image
docker run --rm ghcr.io/bizra/node:v2.2.0-rc1 \
  ls -lh /app/node_modules/@bizra/native/

# احسان Fix: Rebuild image with Rust binaries
```

---

## Post-Deployment

### Evidence Collection (احسان Standard)

```bash
# 1. Screenshot Grafana dashboards
# Save to: founder-node/evidence/deployment-v2.2.0-rc1-grafana.png

# 2. Export Prometheus metrics
curl -s http://localhost:9464/metrics > founder-node/evidence/metrics-snapshot.txt

# 3. Capture deployment manifest
kubectl get deployment bizra-apex -n bizra-testnet -o yaml \
  > founder-node/evidence/deployment-manifest.yaml

# 4. Record container logs (first 500 lines)
kubectl logs -n bizra-testnet -l app=bizra-apex --tail=500 \
  > founder-node/evidence/container-logs.txt
```

### Deployment Report Template

Create `founder-node/evidence/DEPLOYMENT-REPORT-[DATE].md`:

```markdown
# BIZRA NODE0 Deployment Report

**Version**: v2.2.0-rc1
**Deployed**: 2025-10-21 17:40 UTC
**Deployer**: [Your Name]
**Duration**: [X minutes]

## احسان Validation Checklist

- [ ] All pods healthy
- [ ] Health checks passing
- [ ] احسان SLA met (p95 < 200ms)
- [ ] No alerts firing
- [ ] Rust PoI operational
- [ ] Metrics collected

## Performance Results

- P50 latency: [X ms]
- P95 latency: [X ms] (SLA: 200ms)
- P99 latency: [X ms]
- Error rate: [X%] (SLA: < 1%)

## Issues Encountered

[None / List issues]

## احسان Assessment

[Excellence achieved / Improvements needed]
```

---

## Emergency Contacts

- **On-Call Engineer**: See PagerDuty rotation
- **DevOps Lead**: [Contact]
- **Security Team**: #bizra-security-alerts (Slack)
- **احسان Principle**: When in doubt, rollback and investigate

---

## Appendix: Useful Commands

```bash
# View all BIZRA resources
kubectl get all -n bizra-testnet -l app=bizra-apex

# Tail logs from all pods
kubectl logs -n bizra-testnet -l app=bizra-apex -f --tail=100

# Execute command in pod
kubectl exec -n bizra-testnet -it bizra-apex-[pod-id] -- /bin/sh

# Port forward for local testing
kubectl port-forward -n bizra-testnet svc/bizra-apex 8080:8080 9464:9464

# Scale deployment
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=5

# Force pod restart
kubectl delete pod -n bizra-testnet -l app=bizra-apex
```

---

**احسان Reminder**: Excellence is achieved through preparation, execution, and verification. Follow this runbook precisely.
