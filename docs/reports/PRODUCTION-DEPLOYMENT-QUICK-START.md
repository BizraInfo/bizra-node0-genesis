# BIZRA NODE-0 Production Deployment Quick Start

**Version**: v2.2.0-rc1 | **Status**: Elite Production Ready ✅ | **احسان**: 100/100

---

## 🚀 One-Command Elite Deployment

```bash
./scripts/deploy-production-elite.sh v2.2.0-rc1
```

**This script executes**:

- ✅ Pre-deployment validation (احسان Ground Truth, kubectl access, namespace)
- ✅ Docker build with احسان metadata
- ✅ Container push to registry
- ✅ Zero-downtime blue-green deployment
- ✅ **5 احسان gates** (pre-deployment, health, 10%, 50%, 100% traffic)
- ✅ Automatic rollback on ANY failure
- ✅ Post-deployment verification

**Duration**: ~25 minutes (includes 15min gradual traffic shift with monitoring)

---

## 📋 Pre-Requisites (30-Second Check)

```bash
# 1. Kubernetes cluster accessible
kubectl cluster-info

# 2. Namespace exists
kubectl get namespace bizra-testnet

# 3. احسان Ground Truth Database (209 facts)
cat bizra-ihsan-enforcement/ground_truth_data/bizra_facts.json | grep -o '"id":' | wc -l
# Expected: 209

# 4. Docker running
docker --version

# 5. Script executable
ls -lh scripts/deploy-production-elite.sh
# Expected: -rwxr-xr-x
```

**If ALL checks pass** → Proceed to deployment 🚀

---

## 🎯 Deployment Sequence

### Step 1: Pre-Flight Validation (2 minutes)

```bash
# Navigate to project root
cd /c/BIZRA-NODE0

# Create backup
mkdir -p backups
tar -czf backups/pre-deployment-$(date +%Y%m%d-%H%M%S).tar.gz .hive-mind/hive.db

# Verify current cluster state
kubectl get all -n bizra-testnet
```

### Step 2: Execute Elite Deployment (25 minutes)

```bash
# Run with احسان threshold (default: 95%)
export AHSAN_THRESHOLD=95
export NAMESPACE=bizra-testnet

# Execute deployment
./scripts/deploy-production-elite.sh v2.2.0-rc1
```

**The script will automatically**:

1. Validate احسان Ground Truth Database (min 200 facts)
2. Build Docker image with احsان metadata
3. Push to ghcr.io/bizra/node:v2.2.0-rc1
4. Deploy green environment (kubectl rollout)
5. Health check (احسān Gate #2): Must be ≥95%
6. **Traffic shift 10%** → Monitor احسān 5min (Gate #3)
7. **Traffic shift 50%** → Monitor احسān 5min (Gate #4)
8. **Traffic shift 100%** → Monitor احسān 5min (Gate #5)
9. Post-deployment smoke tests
10. Final احسان certification

**Automatic rollback if**:

- احسان score drops below 95% at ANY gate
- Health check fails
- Pod readiness fails
- Any deployment stage errors

### Step 3: Verify Deployment (3 minutes)

```bash
# Check pods running
kubectl get pods -n bizra-testnet
# Expected: 3+ pods in Running state

# Test health endpoint
kubectl port-forward -n bizra-testnet svc/bizra-apex 8080:8080 &
curl http://localhost:8080/health
# Expected: {"status":"healthy","version":"v2.2.0-rc1","rustEnabled":true}

# Verify احسان score
kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 &
curl http://localhost:9464/metrics | grep ahsan_score
# Expected: ahsan_score 95+ (e.g., 98.5)

# Kill port forwards
pkill -f "port-forward"
```

**Success Criteria**:

- ✅ All pods Running
- ✅ Health endpoint returns 200 OK
- ✅ احسان score ≥95%
- ✅ No errors in logs

---

## 🔥 Quick Troubleshooting

### Issue: Deployment script not executable

```bash
chmod +x scripts/deploy-production-elite.sh
```

### Issue: احسان score below 95%

```bash
# Check recent احsān violations
kubectl logs -n bizra-testnet -l app=bizra-apex --tail=50 | grep -i ahsan

# Rollback immediately
kubectl rollout undo deployment/bizra-apex -n bizra-testnet

# See detailed procedures in PRODUCTION-OPERATIONS-RUNBOOK.md Section 5.1
```

### Issue: Pods not starting

```bash
# Diagnose pod issues
kubectl describe pod -n bizra-testnet <pod-name>
kubectl logs -n bizra-testnet <pod-name>

# Check init container (Rust verification)
kubectl logs -n bizra-testnet <pod-name> -c init-verify-rust
```

### Issue: Image pull errors

```bash
# Option A: Use local images (for local Kubernetes)
# Edit k8s/testnet/deployment.yaml: imagePullPolicy: Never

# Option B: Create registry secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --namespace bizra-testnet
```

---

## 📊 Post-Deployment Monitoring

### Real-Time احسان Monitoring

```bash
# Watch احسان score (refresh every 5s)
watch -n 5 'kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 >/dev/null 2>&1 & sleep 2; curl -s http://localhost:9464/metrics | grep ahsan_score; pkill -f "port-forward"'
```

### Stream Application Logs

```bash
kubectl logs -n bizra-testnet -l app=bizra-apex -f --tail=100
```

### Monitor HPA Scaling

```bash
watch -n 10 'kubectl get hpa -n bizra-testnet'
# Expected: 3-20 pods based on load
```

### Monitor Pod Status

```bash
watch -n 5 'kubectl get pods -n bizra-testnet'
```

---

## 🎯 Next Steps After Deployment

### 1. Deploy Advanced Monitoring (Optional - Requires Prometheus Operator)

```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace bizra-testnet \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false

# Deploy monitoring stack
kubectl apply -f monitoring/advanced-monitoring-stack.yaml

# Deploy autoscaling infrastructure
kubectl apply -f k8s/production/hpa-autoscaling.yaml
```

### 2. Access Grafana Dashboards

```bash
# Port forward Grafana
kubectl port-forward -n bizra-testnet svc/prometheus-grafana 3000:80

# Open: http://localhost:3000
# Default credentials: admin / prom-operator

# Dashboard: "BIZRA Advanced Monitoring - Elite Observability"
```

### 3. Run 24-Hour Stress Test

```bash
# Ensure k6 installed
k6 version

# Execute 24-hour production validation
k6 run tests/performance/stress-test-24h.js

# Expected:
# - Duration: 24 hours
# - Peak load: 500 VUs
# - احسان compliance: ≥95% average
# - P99 latency: <500ms
# - Error rate: <1%
```

---

## 🔄 Rollback Procedure

### Automatic Rollback

**Automatically triggered by deployment script if**:

- احسان score <95% at any gate
- Health check fails
- Deployment errors

### Manual Rollback

```bash
# Step 1: Rollback deployment
kubectl rollout undo deployment/bizra-apex -n bizra-testnet

# Step 2: Wait for rollback completion (max 5min)
kubectl rollout status deployment/bizra-apex -n bizra-testnet --timeout=300s

# Step 3: Verify احسان score recovery
watch -n 5 'curl -s http://localhost:9464/metrics | grep ahsan_score'

# Step 4: Restore database from backup (if needed)
tar -xzf backups/pre-deployment-TIMESTAMP.tar.gz
sqlite3 .hive-mind/hive.db "PRAGMA integrity_check;"
# Expected: "ok"
```

**RTO (Recovery Time Objective)**: <5 minutes

---

## 📖 Documentation References

**For detailed information, see**:

1. **PRODUCTION-DEPLOYMENT-PREFLIGHT.md** (800+ lines)
   - Complete pre-flight checklist (35+ items)
   - Infrastructure validation procedures
   - Troubleshooting guide
   - احسان compliance sign-off

2. **docs/PRODUCTION-OPERATIONS-RUNBOOK.md** (800+ lines)
   - P0/P1/P2 incident response procedures
   - احسان score <95% recovery steps
   - Performance optimization guides
   - Daily/weekly maintenance tasks

3. **scripts/deploy-production-elite.sh** (600+ lines)
   - 6-stage automated deployment
   - 5 احسان gates implementation
   - Automatic rollback logic
   - Blue-green zero-downtime strategy

4. **PHASE-6-ELITE-PRODUCTION-COMPLETE-2025-10-24.md**
   - Phase 6 achievement summary
   - Technical innovations documented
   - Competitive positioning analysis

---

## ✅ Deployment Success Checklist

After deployment completes, verify:

```bash
□ Deployment script completed without errors
□ All pods in Running state (3+ replicas)
□ Health endpoint returns 200 OK
□ احسان score ≥95% (verified via metrics)
□ All 5 احسān gates passed during deployment
□ No critical errors in logs
□ Metrics endpoint accessible
□ HPA configured and active (3-20 pod range)
□ Zero downtime achieved (no 5xx errors)
□ Automatic rollback NOT triggered
```

**If ALL items checked** → ✅ **Deployment Successful!**

---

## 🏆 Professional Standards Achieved

**DevOps Maturity**: Level 5 (Elite Practitioner)
**SLA Target**: 99.99% availability
**احسان Compliance**: ≥95% (non-negotiable)
**Performance**: P99 <500ms
**Reliability**: Error rate <1%
**Scalability**: 3-20 pod autoscaling
**Observability**: 26+ alert rules
**Automation**: Fully automated deployment with 5 احسان gates

---

## 🚨 Emergency Contacts

**P0 (Critical - احسان <95% or System Down)**:

- RTO: <5 minutes
- Action: Immediate rollback + root cause analysis
- Runbook: PRODUCTION-OPERATIONS-RUNBOOK.md Section 5.1

**P1 (High - Performance Degradation)**:

- RTO: <15 minutes
- Action: Investigate + mitigation
- Runbook: PRODUCTION-OPERATIONS-RUNBOOK.md Section 5.2

**P2 (Medium - Predictive Alerts)**:

- RTO: <1 hour
- Action: Proactive investigation
- Runbook: PRODUCTION-OPERATIONS-RUNBOOK.md Section 5.4

---

**احسان Declaration**: This deployment embodies the FUNDAMENTAL RULE - No assumptions without احسان.

**End of Quick Start Guide**

🚀 **Ready to deploy?** → `./scripts/deploy-production-elite.sh v2.2.0-rc1`
