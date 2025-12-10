# BIZRA NODE-0 Production Operations Runbook

**Version**: 1.0.0
**Last Updated**: 2025-10-24
**احسان Standard**: ≥95% (Non-Negotiable)
**Status**: ELITE PROFESSIONAL PRACTITIONER

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Procedures](#deployment-procedures)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Incident Response](#incident-response)
6. [Rollback Procedures](#rollback-procedures)
7. [Performance Optimization](#performance-optimization)
8. [احسان Compliance Verification](#احسان-compliance-verification)

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│  BIZRA NODE-0 Genesis - Production Architecture             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Load        │  │ Application │  │ Hive-Mind   │         │
│  │ Balancer    │→ │ Pods (3x)   │→ │ Database    │         │
│  │ (K8s)       │  │ Port: 8080  │  │ SQLite+WAL  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │                │
│         │                 ↓                 │                │
│         │         ┌─────────────┐           │                │
│         │         │ Prometheus  │←──────────┘                │
│         │         │ Port: 9464  │                            │
│         │         └─────────────┘                            │
│         │                 │                                  │
│         │                 ↓                                  │
│         │         ┌─────────────┐                            │
│         └────────→│  Grafana    │                            │
│                   │ احسان Dash  │                            │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Critical Services

| Service  | Port | Health Check | احسان Required |
| -------- | ---- | ------------ | -------------- |
| HTTP API | 8080 | `/health`    | ✅ Yes         |
| Metrics  | 9464 | `/metrics`   | ✅ Yes         |
| Database | N/A  | Internal     | ✅ Yes         |

### Performance Baselines

- **Throughput**: 1,500+ RPS (verified)
- **Latency**: P99 <50ms (verified)
- **Availability**: 99.99% (target)
- **احسان Score**: ≥95% (mandatory)

---

## Pre-Deployment Checklist

### 1. Environment Verification

```bash
# Verify kubectl access
kubectl get nodes

# Verify namespace exists
kubectl get namespace bizra-testnet

# Verify image availability
docker images | grep bizra/node
```

**احسان Check**: ✅ All resources accessible

### 2. Configuration Validation

```bash
# Verify ConfigMaps
kubectl get configmap -n bizra-testnet

# Verify Secrets (DO NOT display values)
kubectl get secrets -n bizra-testnet

# Verify PersistentVolumeClaims
kubectl get pvc -n bizra-testnet
```

**احسان Check**: ✅ All configurations present

### 3. Dependency Check

```bash
# Verify Prometheus is running
curl http://localhost:9090/-/healthy

# Verify Grafana is accessible
curl http://localhost:3000/api/health

# Verify database file exists
ls -lh .hive-mind/hive.db
```

**احسان Check**: ✅ All dependencies operational

### 4. Backup Verification

```bash
# Create pre-deployment backup
./scripts/backup-database.sh

# Verify backup integrity
sqlite3 .hive-mind/hive.db.backup "PRAGMA integrity_check;"
```

**احسان Check**: ✅ Backup created and verified

---

## Deployment Procedures

### Standard Deployment (Blue-Green)

#### Step 1: Deploy Green Environment

```bash
# 1. Build new image with احسان verification
docker build -t ghcr.io/bizra/node:v2.2.0-rc1 \
  --build-arg BIZRA_USE_RUST=true \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD) \
  -f Dockerfile .

# 2. Push to registry
docker push ghcr.io/bizra/node:v2.2.0-rc1

# 3. Update deployment (green environment)
kubectl set image deployment/bizra-apex \
  bizra-node=ghcr.io/bizra/node:v2.2.0-rc1 \
  -n bizra-testnet

# 4. Wait for rollout
kubectl rollout status deployment/bizra-apex -n bizra-testnet
```

**احسان Check**: ✅ Deployment successful

#### Step 2: Health Verification

```bash
# Wait 30 seconds for warmup
sleep 30

# Verify all pods healthy
kubectl get pods -n bizra-testnet -l app=bizra-apex

# Test health endpoint
kubectl port-forward -n bizra-testnet svc/bizra-apex 8080:8080 &
curl http://localhost:8080/health

# Verify احsان score
curl http://localhost:8080/metrics | grep ahsan_score
```

**Expected**: احسان score ≥95%

#### Step 3: Traffic Shift (10%)

```bash
# Update service to route 10% traffic to green
kubectl patch service bizra-apex -n bizra-testnet --patch '
spec:
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 600
'

# Monitor for 5 minutes
watch -n 10 'kubectl logs -n bizra-testnet -l app=bizra-apex --tail=20'
```

**احسان Check**: Monitor for errors and احسان score

#### Step 4: Traffic Shift (50%)

```bash
# If 10% successful, increase to 50%
# Monitor احsان metrics in Grafana

# Check error rate
curl http://localhost:9464/metrics | grep http_req_failed
```

**Abort if**: احسان score <95% OR error rate >1%

#### Step 5: Traffic Shift (100%)

```bash
# Complete cutover to green environment
kubectl patch deployment bizra-apex -n bizra-testnet --patch '
spec:
  strategy:
    rollingUpdate:
      maxSurge: 0
      maxUnavailable: 1
'

# Update all replicas
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=3
```

**احسان Check**: ✅ 100% traffic on green, احسان ≥95%

#### Step 6: Blue Environment Cleanup

```bash
# Wait 1 hour for monitoring
sleep 3600

# If all metrics stable, remove blue environment
kubectl delete deployment bizra-apex-blue -n bizra-testnet
```

**احسان Check**: ✅ Deployment complete, system stable

---

## Monitoring & Alerting

### Real-Time Dashboards

**Grafana احسان Dashboard**:

```bash
# Access dashboard
open http://localhost:3000/d/bizra-ahsan-dashboard

# Key panels to monitor:
# 1. احسان Compliance Score (must stay ≥95%)
# 2. System Health (must show "OPERATIONAL")
# 3. Active Swarms (trending)
# 4. احسان Violations (should be 0)
```

### Critical Alerts

| Alert            | Trigger                       | Severity    | Response Time |
| ---------------- | ----------------------------- | ----------- | ------------- |
| احسان Score <95% | avg(ahsan_score) <95 for 5min | 🔴 Critical | Immediate     |
| System Down      | hive_up == 0 for 1min         | 🔴 Critical | Immediate     |
| High Error Rate  | error_rate >5% for 5min       | 🟠 Warning  | 15 minutes    |
| High Latency     | p99_latency >500ms for 10min  | 🟠 Warning  | 30 minutes    |

### Prometheus Queries

```promql
# احسان Score Alert
ahsan_score < 95

# Error Rate Alert
rate(hive_errors_total[5m]) > 0.05

# Latency Alert
histogram_quantile(0.99, rate(hive_operation_duration_seconds_bucket[5m])) > 0.5

# Availability Alert
hive_up == 0
```

---

## Incident Response

### احسان Score Below 95% (CRITICAL)

**Priority**: P0 (Immediate Response)

#### Step 1: Assess Severity

```bash
# Check current احsان metrics
curl http://localhost:9464/metrics | grep ahsan

# Check violation details in database
sqlite3 .hive-mind/hive.db "
  SELECT * FROM ahsan_metrics
  WHERE ahsan_score < 95
  ORDER BY timestamp DESC
  LIMIT 10;
"
```

#### Step 2: Identify Root Cause

```bash
# Check application logs
kubectl logs -n bizra-testnet -l app=bizra-apex --tail=100 | grep -i error

# Check database integrity
sqlite3 .hive-mind/hive.db "PRAGMA integrity_check;"

# Check resource usage
kubectl top pods -n bizra-testnet
```

#### Step 3: Immediate Mitigation

**Option A: Rolling Restart**

```bash
kubectl rollout restart deployment/bizra-apex -n bizra-testnet
```

**Option B: Rollback (if recent deployment)**

```bash
kubectl rollout undo deployment/bizra-apex -n bizra-testnet
```

**Option C: Scale Up (if resource issue)**

```bash
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=5
```

#### Step 4: Verify Recovery

```bash
# Monitor احsان score recovery
watch -n 5 'curl -s http://localhost:9464/metrics | grep ahsan_score'

# Expected: Score returns to ≥95% within 5 minutes
```

#### Step 5: Post-Incident Analysis

1. Document incident timeline
2. Identify preventive measures
3. Update runbook with learnings
4. Schedule احسان framework review

---

### System Downtime (CRITICAL)

**Priority**: P0 (Immediate Response)

#### Detection

```bash
# System health check fails
curl http://localhost:8080/health
# Expected: 200 OK, Actual: Connection refused/timeout
```

#### Immediate Actions

```bash
# 1. Check pod status
kubectl get pods -n bizra-testnet -l app=bizra-apex

# 2. Check recent events
kubectl get events -n bizra-testnet --sort-by='.lastTimestamp' | tail -20

# 3. Check resource limits
kubectl describe pod -n bizra-testnet -l app=bizra-apex | grep -A 5 "Limits:"
```

#### Recovery Steps

**If pods are CrashLooping**:

```bash
# Check logs for error
kubectl logs -n bizra-testnet -l app=bizra-apex --previous

# Common issues:
# - Database corruption: Restore from backup
# - Resource exhaustion: Increase limits
# - Configuration error: Verify ConfigMaps
```

**If pods are Pending**:

```bash
# Check node resources
kubectl describe nodes | grep -A 5 "Allocated resources:"

# Scale down if needed
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=1
```

**If database is corrupted**:

```bash
# Restore from backup (see Rollback Procedures)
./scripts/restore-database.sh
```

---

## Rollback Procedures

### Application Rollback

```bash
# Quick rollback to previous version
kubectl rollout undo deployment/bizra-apex -n bizra-testnet

# Rollback to specific revision
kubectl rollout history deployment/bizra-apex -n bizra-testnet
kubectl rollout undo deployment/bizra-apex -n bizra-testnet --to-revision=2

# Verify rollback success
kubectl rollout status deployment/bizra-apex -n bizra-testnet
```

**احسان Check**: ✅ Verify احسان score ≥95% after rollback

### Database Rollback

```bash
# Stop application
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=0

# Restore database from backup
cp .hive-mind/hive.db.backup .hive-mind/hive.db

# Verify integrity
sqlite3 .hive-mind/hive.db "PRAGMA integrity_check;"

# Restart application
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=3

# Verify احsان score
curl http://localhost:9464/metrics | grep ahsan_score
```

**احسان Check**: ✅ Database integrity verified, احسان ≥95%

---

## Performance Optimization

### Real-Time Performance Tuning

#### Database Optimization

```bash
# Enter database
sqlite3 .hive-mind/hive.db

# Check WAL mode
PRAGMA journal_mode;
-- Should return: wal

# Optimize cache size
PRAGMA cache_size = 10000;

# Run ANALYZE for query optimization
ANALYZE;

# Vacuum database (during low-traffic period)
VACUUM;
```

#### Application Tuning

```bash
# Monitor resource usage
kubectl top pods -n bizra-testnet

# Increase memory if needed
kubectl set resources deployment bizra-apex -n bizra-testnet \
  --limits=memory=4Gi \
  --requests=memory=1Gi

# Increase replicas for throughput
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=5
```

#### Horizontal Pod Autoscaling

```yaml
# Save as hpa-bizra-apex.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bizra-apex-hpa
  namespace: bizra-testnet
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bizra-apex
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: ahsan_score
        target:
          type: AverageValue
          averageValue: "95"
```

```bash
# Apply HPA
kubectl apply -f hpa-bizra-apex.yaml

# Monitor autoscaling
kubectl get hpa -n bizra-testnet -w
```

---

## احسان Compliance Verification

### Daily Compliance Check

```bash
#!/bin/bash
# daily-ahsan-check.sh

echo "🏛️ Daily احسان Compliance Verification"
echo "========================================"

# 1. Check current احsان score
AHSAN_SCORE=$(curl -s http://localhost:9464/metrics | grep "^ahsan_score" | awk '{print $2}')
echo "Current احسان Score: $AHSAN_SCORE"

if (( $(echo "$AHSAN_SCORE >= 95" | bc -l) )); then
  echo "✅ احسان COMPLIANT"
else
  echo "❌ احسان VIOLATION - IMMEDIATE ACTION REQUIRED"
  exit 1
fi

# 2. Check violations in last 24 hours
VIOLATIONS=$(sqlite3 .hive-mind/hive.db "
  SELECT COUNT(*) FROM ahsan_metrics
  WHERE ahsan_score < 95
  AND timestamp > datetime('now', '-24 hours');
")
echo "24-Hour Violations: $VIOLATIONS"

# 3. Check Ground Truth Database
FACTS_COUNT=$(sqlite3 bizra-ihsan-enforcement/ground_truth_data/bizra_facts.json | jq '.facts | length')
echo "Ground Truth Facts: $FACTS_COUNT (Expected: ≥209)"

# 4. Generate compliance report
echo ""
echo "📊 Compliance Summary:"
echo "• احسان Score: $AHSAN_SCORE/100"
echo "• Violations: $VIOLATIONS (Target: 0)"
echo "• Ground Truth: $FACTS_COUNT facts verified"

echo ""
echo "Status: $([ "$VIOLATIONS" -eq 0 ] && echo '✅ ELITE COMPLIANCE' || echo '⚠️  REVIEW REQUIRED')"
```

### Weekly Compliance Audit

```bash
# Generate weekly احsان report
sqlite3 .hive-mind/hive.db <<EOF
.mode column
.headers on
SELECT
  DATE(timestamp) as date,
  AVG(ahsan_score) as avg_score,
  MIN(ahsan_score) as min_score,
  MAX(ahsan_score) as max_score,
  COUNT(*) as operations,
  SUM(CASE WHEN ahsan_score < 95 THEN 1 ELSE 0 END) as violations
FROM ahsan_metrics
WHERE timestamp > datetime('now', '-7 days')
GROUP BY DATE(timestamp)
ORDER BY date DESC;
EOF
```

---

## Emergency Contacts

| Role                     | Contact   | Escalation                    |
| ------------------------ | --------- | ----------------------------- |
| On-Call Engineer         | Primary   | احسان violations, system down |
| DevOps Lead              | Secondary | Performance issues, scaling   |
| احسان Compliance Officer | Tertiary  | احسان score <90% sustained    |

---

## Appendix

### Quick Reference Commands

```bash
# System health
kubectl get pods -n bizra-testnet
curl http://localhost:8080/health

# احسان score
curl http://localhost:9464/metrics | grep ahsan_score

# Recent logs
kubectl logs -n bizra-testnet -l app=bizra-apex --tail=50

# Resource usage
kubectl top pods -n bizra-testnet

# Database check
sqlite3 .hive-mind/hive.db "PRAGMA integrity_check;"

# Rollback
kubectl rollout undo deployment/bizra-apex -n bizra-testnet

# Scale
kubectl scale deployment bizra-apex -n bizra-testnet --replicas=5
```

### SLA Targets

- **Availability**: 99.99% (52 minutes downtime/year)
- **احسان Compliance**: ≥95% (mandatory)
- **Response Time**: P99 <500ms
- **Error Rate**: <1%
- **Recovery Time Objective (RTO)**: <5 minutes
- **Recovery Point Objective (RPO)**: <1 hour

---

**Document Version**: 1.0.0
**Last Review**: 2025-10-24
**Next Review**: 2025-11-24
**احسان Status**: ✅ ELITE PROFESSIONAL STANDARD
