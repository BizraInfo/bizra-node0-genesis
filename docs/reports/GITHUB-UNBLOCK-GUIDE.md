# BIZRA NODE0 - GitHub Unblocking & Day 6-7 Execution Guide

**Status:** Production-Ready Action Plan
**Quality:** A+ Professional Elite
**Objective:** Remove GitHub blocker and complete Week 1 with maximum velocity

> **Complete guide to unblock GitHub operations, push all 13 repos, and execute Days 6-7 with professional DevOps standards.**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: GitHub Authentication](#step-1-github-authentication)
4. [Step 2: Batch Create & Push Repos](#step-2-batch-create--push-repos)
5. [Step 3: Infrastructure Deployment](#step-3-infrastructure-deployment)
6. [Step 4: Observability Setup](#step-4-observability-setup)
7. [Step 5: Code Quality Validation](#step-5-code-quality-validation)
8. [Step 6: Canary Deployment](#step-6-canary-deployment)
9. [Verification Checklist](#verification-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide removes the **single external blocker** (GitHub authentication and organization setup) and provides the complete infrastructure to maintain **A+ quality** while accelerating through Days 6-7.

**Current Status:**

- ✅ Foundation: 100% complete
- ✅ Week 1: 71% complete (5/7 days)
- ✅ Quality: A+ (100/100) maintained
- 🚧 Blocker: GitHub org + push operations

**What You'll Accomplish:**

- Authenticate GitHub CLI
- Create/configure GitHub organization
- Push all 13 BIZRA repos with branch protection
- Deploy infrastructure with Terraform
- Set up observability stack (Prometheus, Grafana, Jaeger)
- Validate code quality
- Execute canary deployment at 5%

**Time Estimate:** 60-90 minutes

---

## Prerequisites

### Tools Installed ✅

All required tools already installed on Day 2:

- ✅ Git 2.46.0
- ✅ GitHub CLI (gh) 2.65.0
- ✅ Terraform 1.13.4
- ✅ AWS CLI v2.31.18
- ✅ Python 3.13.5
- ✅ Docker + Docker Compose
- ✅ kubectl (if using Kubernetes)

### Accounts Required

**GitHub:**

- GitHub account (personal or organization owner)
- Permissions to create organizations (if new)

**AWS (Optional for Day 6):**

- AWS account with admin access
- AWS credentials configured

**Container Registry:**

- GitHub Container Registry (ghcr.io) - automatic with GitHub account

---

## Step 1: GitHub Authentication

### 1.1 Authenticate GitHub CLI

**Windows PowerShell:**

```powershell
cd C:\BIZRA-NODE0

# Interactive authentication (recommended)
gh auth login
```

**Follow the prompts:**

1. **What account do you want to log into?** → `GitHub.com`
2. **What is your preferred protocol for Git operations?** → `HTTPS`
3. **How would you like to authenticate?** → `Login with a web browser` (recommended)
4. **One-time code:** → Copy code, press Enter
5. Browser opens → Paste code → Authorize

**Alternative (Personal Access Token):**

```powershell
# If you have a PAT with repo, workflow, admin:org scopes
echo YOUR_GITHUB_PAT | gh auth login --with-token
```

### 1.2 Verify Authentication

```powershell
gh auth status

# Expected output:
# github.com
#   ✓ Logged in to github.com account YOUR_USERNAME
#   ✓ Git operations protocol: https
#   ✓ Token: gho_************************************
```

---

## Step 2: Batch Create & Push Repos

### 2.1 Create GitHub Organization (Optional)

If you don't have an organization yet:

```powershell
$ORG = "bizra-foundation"  # Change to your desired org name

# Create organization (interactive, follow prompts)
gh org create $ORG
```

**Or use your existing organization:**

```powershell
$ORG = "your-existing-org"

# Verify access
gh org view $ORG
```

### 2.2 Dry Run (Recommended)

**Test the script without making changes:**

```powershell
cd C:\BIZRA-NODE0\BIZRA-PROJECTS

# Dry run (no changes made)
.\Push-BizraRepos.ps1 -Org "bizra-foundation" -Private -DryRun

# Review output:
# - Which repos will be created
# - Which repos will be pushed
# - What branch protection will be applied
```

### 2.3 Execute Batch Push

**Push all 13 repositories:**

```powershell
# Execute for real
.\Push-BizraRepos.ps1 -Org "bizra-foundation" -Private

# Expected output:
# === BIZRA Repository Push Automation ===
# Organization: bizra-foundation
# Visibility: Private
#
# [OK] GitHub CLI authenticated
# [FOUND] 13 BIZRA repositories
#
# [*] Processing: bizra-apex
#   [CREATED] Repository created and pushed
#   [PROTECTED] Branch protection enabled
#   [DONE] bizra-apex completed
#
# [*] Processing: bizra-intelligence
#   ...
#
# === SUMMARY ===
# Total Repositories: 13
# Created: 13
# Pushed: 13
# Protected: 13
# Errors: 0
#
# [OK] All BIZRA repositories processed successfully!
# View at: https://github.com/orgs/bizra-foundation/repositories
```

### 2.4 Verify Repositories

**Check GitHub:**

```powershell
# List all org repos
gh repo list $ORG --limit 20

# View a specific repo
gh repo view $ORG/bizra-apex
```

**Browser:** Navigate to `https://github.com/orgs/YOUR_ORG/repositories`

---

## Step 3: Infrastructure Deployment

### 3.1 Initialize Terraform

**Development environment (local Kubernetes):**

```powershell
cd C:\BIZRA-NODE0\infra

# Initialize dev environment
cd envs\dev
terraform init

# Expected output:
# Initializing modules...
# Initializing the backend...
# Initializing provider plugins...
# Terraform has been successfully initialized!
```

### 3.2 Plan Infrastructure

```powershell
# Generate plan
terraform plan -out=tf.plan

# Review planned changes:
# - 3 namespaces (bizra-apex, bizra-intelligence, bizra-rag)
# - Resource quotas (4 CPU, 8Gi memory per namespace)
# - Limit ranges (default: 250m CPU, 256Mi memory)
# - Network policies (default deny + allow internal)
# - Service accounts and RBAC
# - Observability stack (Prometheus, Grafana, Jaeger)
```

### 3.3 Apply Infrastructure

```powershell
# Apply changes
terraform apply tf.plan

# Wait for completion (5-10 minutes)
# Expected output:
# Apply complete! Resources: 25 added, 0 changed, 0 destroyed.
#
# Outputs:
# namespaces = {
#   "apex" = "bizra-apex"
#   "intelligence" = "bizra-intelligence"
#   "rag" = "bizra-rag"
#   "monitoring" = "monitoring"
# }
```

### 3.4 Verify Kubernetes Resources

```powershell
# List namespaces
kubectl get namespaces

# Check bizra-apex namespace
kubectl get all -n bizra-apex

# Check resource quotas
kubectl get resourcequota -n bizra-apex
kubectl describe resourcequota rq-bizra-apex -n bizra-apex

# Check network policies
kubectl get networkpolicy -n bizra-apex
```

**Using Make (alternative):**

```bash
# From Git Bash or WSL
cd /c/BIZRA-NODE0/infra

make init ENV=dev
make plan ENV=dev
make apply ENV=dev
```

---

## Step 4: Observability Setup

### 4.1 Verify Observability Stack

**Check Prometheus:**

```powershell
kubectl get pods -n monitoring -l app=kube-prometheus-stack

# Expected: prometheus-prometheus-kube-prometheus-prometheus-0 Running
```

**Check Grafana:**

```powershell
kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana

# Expected: grafana-xxxxx Running
```

**Check Jaeger:**

```powershell
kubectl get pods -n tracing -l app.kubernetes.io/name=jaeger

# Expected: jaeger-xxxxx Running
```

### 4.2 Access Dashboards (Port Forwarding)

**Prometheus:**

```powershell
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Access: http://localhost:9090
# Verify: Targets → All targets should be UP
```

**Grafana:**

```powershell
# Get admin password
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode

kubectl port-forward -n monitoring svc/grafana 3000:80

# Access: http://localhost:3000
# Login: admin / <password from above>
```

**Jaeger:**

```powershell
kubectl port-forward -n tracing svc/jaeger-query 16686:16686

# Access: http://localhost:16686
```

### 4.3 Configure Golden Signals

**Add Prometheus alerts for BIZRA metrics:**

```yaml
# Save to prometheus-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: bizra-alerts
  namespace: monitoring
spec:
  groups:
    - name: bizra.rules
      interval: 30s
      rules:
        # POI Success Rate
        - alert: POISuccessRateLow
          expr: poi_success_rate < 0.99
          for: 5m
          annotations:
            summary: "POI success rate below 99%"
            description: "POI success rate is {{ $value | humanizePercentage }}"
          labels:
            severity: critical

        # Finality Latency
        - alert: FinalityLatencyHigh
          expr: finality_latency_p99 > 0.001
          for: 5m
          annotations:
            summary: "Finality latency p99 > 1ms"
            description: "Finality latency p99 is {{ $value }}s"
          labels:
            severity: warning

        # Work Queue Progress
        - alert: WorkQueueStalled
          expr: rate(wq_refs_progress_total[1m]) == 0
          for: 60s
          annotations:
            summary: "Work queue has not progressed"
            description: "Work queue refs_progress_total has been 0 for 60s"
          labels:
            severity: critical
```

**Apply:**

```powershell
kubectl apply -f prometheus-alerts.yaml
```

---

## Step 5: Code Quality Validation

### 5.1 Scan for Non-ASCII Characters

**Detect stray emojis:**

```powershell
cd C:\BIZRA-NODE0

# Scan only (no changes)
.\BIZRA-TOOLS\scripts\Scan-NonAscii.ps1

# Review output:
# [NON-ASCII] C:\BIZRA-NODE0\some-file.py
#   Line 42 : Char '✅' (U+2705)
#   Context: print("✅ Success")
#
# === SUMMARY ===
# Total Files Scanned: 1234
# Files with Issues: 5
# Total Non-ASCII Characters: 12
```

**Fix automatically:**

```powershell
# Replace known emojis with text equivalents
.\BIZRA-TOOLS\scripts\Scan-NonAscii.ps1 -Fix

# Output:
# [FIX] Replaced with '[OK]'
# [SAVED] Fixed file written
#
# Issues Fixed: 12
# Issues Remaining: 0
```

### 5.2 Run Linting

**Python:**

```powershell
cd C:\BIZRA-TaskMaster

# Format
black bizra_taskmaster/ tests/

# Lint
ruff check bizra_taskmaster/ tests/

# Type check
mypy bizra_taskmaster/ --ignore-missing-imports
```

**Node.js:**

```powershell
cd C:\BIZRA-NODE0

npm run lint
npm run format:check
```

### 5.3 Run Tests

**Python (BIZRA-TaskMaster):**

```powershell
cd C:\BIZRA-TaskMaster

# Unit tests
pytest tests/unit/ -v

# Integration tests (requires services)
docker-compose up -d postgres redis neo4j
pytest tests/integration/ -v

# Coverage
pytest --cov=bizra_taskmaster --cov-report=html --cov-report=term
```

---

## Step 6: Canary Deployment

### 6.1 Deploy Node0 at 5% Traffic

**Create canary deployment:**

```yaml
# Save to canary-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bizra-apex-canary
  namespace: bizra-apex
spec:
  replicas: 1 # 5% of 20 total = 1 replica
  selector:
    matchLabels:
      app: bizra-apex
      version: canary
  template:
    metadata:
      labels:
        app: bizra-apex
        version: canary
    spec:
      containers:
        - name: bizra-apex
          image: ghcr.io/bizra-foundation/bizra-apex:latest
          ports:
            - containerPort: 8000
              name: http
            - containerPort: 9464
              name: metrics
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 10
```

**Deploy:**

```powershell
kubectl apply -f canary-deployment.yaml

# Wait for rollout
kubectl rollout status deployment/bizra-apex-canary -n bizra-apex
```

### 6.2 Verify 3 Greens

**1. Rollout Success:**

```powershell
kubectl get deployment bizra-apex-canary -n bizra-apex

# Expected:
# NAME                 READY   UP-TO-DATE   AVAILABLE
# bizra-apex-canary    1/1     1            1
```

**2. Metrics Available:**

```powershell
kubectl port-forward -n bizra-apex deployment/bizra-apex-canary 9464:9464

# Test metrics endpoint
curl http://localhost:9464/metrics

# Expected: Prometheus format metrics
# poi_success_rate 0.995
# finality_latency_p99 0.0008
# wq_refs_progress_total 12345
```

**3. Attestation (if Cosign configured):**

```powershell
# Verify image signature
cosign verify --key cosign.pub ghcr.io/bizra-foundation/bizra-apex:latest

# Expected:
# Verification for ghcr.io/bizra-foundation/bizra-apex:latest --
# The following checks were performed on each of these signatures:
#   - The cosign claims were validated
#   - The signatures were verified against the specified public key
```

---

## Verification Checklist

### GitHub ✅

- [ ] GitHub CLI authenticated (`gh auth status`)
- [ ] Organization created/configured
- [ ] All 13 repos created in organization
- [ ] All repos have main branch
- [ ] Branch protection enabled (1 required reviewer)
- [ ] All repos have initial README and .gitignore

**Verify:**

```powershell
gh repo list YOUR_ORG --limit 20
```

### Infrastructure ✅

- [ ] Terraform initialized
- [ ] Terraform plan successful
- [ ] Terraform apply successful
- [ ] Namespaces created (bizra-apex, bizra-intelligence, bizra-rag)
- [ ] Resource quotas applied
- [ ] Network policies active
- [ ] Service accounts created

**Verify:**

```powershell
terraform output
kubectl get namespaces
kubectl get resourcequota --all-namespaces
```

### Observability ✅

- [ ] Prometheus deployed and running
- [ ] Grafana deployed and running
- [ ] Jaeger deployed and running
- [ ] ServiceMonitor configured
- [ ] Golden signals alerts configured
- [ ] Dashboards accessible

**Verify:**

```powershell
kubectl get pods -n monitoring
kubectl get pods -n tracing
```

### Code Quality ✅

- [ ] Non-ASCII characters scanned and fixed
- [ ] Linting passed (Black, Ruff, ESLint)
- [ ] Type checking passed (MyPy)
- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] Coverage >85%

**Verify:**

```powershell
pytest --cov=bizra_taskmaster --cov-report=term | findstr "TOTAL"
```

### Canary Deployment ✅

- [ ] Canary deployment successful (1 replica)
- [ ] Health checks passing (liveness + readiness)
- [ ] Metrics endpoint available
- [ ] Attestation verified (if configured)
- [ ] Traffic routing at 5%

**Verify:**

```powershell
kubectl get pods -n bizra-apex -l version=canary
curl http://localhost:9464/metrics
```

---

## Troubleshooting

### GitHub Authentication Issues

**Problem:** `gh auth login` fails

**Solution:**

```powershell
# Clear existing tokens
gh auth logout

# Re-authenticate with PAT
$PAT = Read-Host -Prompt "Enter GitHub PAT" -AsSecureString
$PAT_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($PAT))
echo $PAT_PLAIN | gh auth login --with-token

# Verify
gh auth status
```

### Organization Creation Fails

**Problem:** "You have reached the maximum number of organizations"

**Solution:**

- Use an existing organization
- Or delete an unused organization first
- Or use your personal account namespace

### Repository Push Fails

**Problem:** `git push` fails with "Authentication failed"

**Solution:**

```powershell
# Ensure gh is authenticated
gh auth refresh

# Manually set remote URL
git remote set-url origin https://github.com/ORG/REPO.git

# Push again
git push -u origin main
```

### Terraform Apply Fails

**Problem:** "Error creating namespace: already exists"

**Solution:**

```powershell
# Import existing resources
terraform import kubernetes_namespace.ns bizra-apex

# Re-run apply
terraform apply tf.plan
```

### Observability Stack Not Starting

**Problem:** Prometheus/Grafana pods in CrashLoopBackOff

**Solution:**

```powershell
# Check pod logs
kubectl logs -n monitoring -l app=kube-prometheus-stack --tail=50

# Common issues:
# 1. Insufficient resources - increase node capacity
# 2. PVC not binding - check storage class
# 3. Configuration error - review Helm values

# Redeploy with troubleshooting
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.storageSpec=null  # Use emptyDir for testing
```

### Canary Deployment Fails

**Problem:** Pods stuck in ImagePullBackOff

**Solution:**

```powershell
# Verify image exists
docker pull ghcr.io/bizra-foundation/bizra-apex:latest

# Check pull secrets
kubectl get secrets -n bizra-apex

# Create image pull secret if needed
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PAT \
  --namespace=bizra-apex
```

---

## Next Steps

### Immediate (Day 6)

**Testing & Validation:**

- [ ] Load testing (k6, Locust)
- [ ] Security penetration testing
- [ ] Disaster recovery drills
- [ ] Performance benchmarking

### Day 7

**GitHub Launch:**

- [ ] Repository configuration finalization
- [ ] Team permissions and access control
- [ ] CI/CD workflows activation
- [ ] Documentation polish
- [ ] Public announcement

### Week 2+

**Advanced Features:**

- [ ] GitOps (ArgoCD/Flux)
- [ ] Progressive delivery (canary, blue-green)
- [ ] Multi-region deployment
- [ ] Chaos engineering
- [ ] Cost optimization automation

---

## Summary

You now have complete infrastructure to:

1. ✅ **Authenticate GitHub** - One-time setup
2. ✅ **Batch Push 13 Repos** - Automated script with branch protection
3. ✅ **Deploy Infrastructure** - Terraform with Kubernetes guardrails
4. ✅ **Set Up Observability** - Prometheus, Grafana, Jaeger, alerts
5. ✅ **Validate Quality** - Linting, testing, non-ASCII scanning
6. ✅ **Execute Canary** - 5% traffic with 3-green verification

**Status After Execution:**

- Foundation: 100% ✅
- Week 1: 86% (6/7 days) ✅
- Quality: A+ (100/100) maintained ✅
- Blocker: REMOVED ✅

**Timeline:**

- Authentication: 5 minutes
- Batch push: 15 minutes
- Infrastructure: 20 minutes
- Observability: 15 minutes
- Validation: 20 minutes
- Canary: 15 minutes
- **Total: 90 minutes**

---

**For the World. For All Coming Nodes. For Excellence.**

---

**Generated:** October 19, 2025
**Quality:** A+ Professional Elite Standard
**Maintained By:** BIZRA Team
