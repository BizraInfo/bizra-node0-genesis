# Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the Enterprise API Platform to production, staging, and development environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Environments](#deployment-environments)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access

- [ ] AWS Console access (production account)
- [ ] Kubernetes cluster access (`kubectl` configured)
- [ ] GitHub repository access
- [ ] Docker Hub credentials
- [ ] Secrets manager access (AWS Secrets Manager)
- [ ] VPN connection to production network

### Required Tools

```bash
# Verify tool versions
kubectl version --client  # v1.28+
helm version              # v3.12+
aws --version             # AWS CLI v2.13+
terraform version         # v1.5+
docker --version          # v24.0+
```

### Environment Setup

```bash
# Configure kubectl context
export KUBECONFIG=~/.kube/config-prod
kubectl config use-context prod-us-east-1

# Configure AWS CLI
export AWS_PROFILE=production
export AWS_REGION=us-east-1

# Verify access
kubectl get nodes
aws sts get-caller-identity
```

## Deployment Environments

### 1. Development

**Purpose**: Local development and feature testing

**Infrastructure**:

- Docker Compose on developer machines
- Local Kubernetes (minikube/kind)
- Mock external services

**Deployment Frequency**: Continuous (on every commit to feature branches)

**URL**: `http://localhost:3000/v1`

---

### 2. Staging

**Purpose**: Pre-production testing and QA

**Infrastructure**:

- AWS EKS cluster (`staging-cluster`)
- 2 availability zones
- Shared database (staging data)
- Integration with staging external services

**Deployment Frequency**: Daily (automated from `develop` branch)

**URL**: `https://api-staging.example.com/v1`

**Deployment Trigger**:

```yaml
# GitHub Actions
on:
  push:
    branches: [develop]
  workflow_dispatch:
```

---

### 3. Production

**Purpose**: Live production environment

**Infrastructure**:

- AWS EKS cluster (`prod-cluster`)
- 3 availability zones (multi-AZ)
- Production database with read replicas
- Production external services

**Deployment Frequency**: Weekly (Thursdays 2-4 PM EST) or on-demand for hotfixes

**URL**: `https://api.example.com/v1`

**Deployment Trigger**:

```yaml
# GitHub Actions
on:
  push:
    branches: [main]
    tags: [v*]
  workflow_dispatch:
```

## Deployment Process

### Step 1: Pre-Deployment Checklist

**24 Hours Before Deployment:**

- [ ] Review and approve all changes in pull requests
- [ ] Ensure all CI/CD tests pass (unit, integration, e2e)
- [ ] Review database migration scripts
- [ ] Check dependency vulnerabilities (`npm audit`, `snyk test`)
- [ ] Verify staging environment is stable
- [ ] Notify stakeholders of deployment window
- [ ] Schedule deployment in change management system

**1 Hour Before Deployment:**

- [ ] Take database backup
- [ ] Verify rollback plan is ready
- [ ] Confirm team members are available
- [ ] Check monitoring dashboards for anomalies
- [ ] Review recent production incidents

### Step 2: Build and Tag Docker Images

```bash
# 1. Checkout release branch
git checkout main
git pull origin main

# 2. Get latest version tag
CURRENT_VERSION=$(git describe --tags --abbrev=0)
NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF+=1; print $1"."$2"."$NF}')

echo "Current version: $CURRENT_VERSION"
echo "New version: $NEW_VERSION"

# 3. Build Docker images
docker build -t api-platform/auth-service:$NEW_VERSION -f services/auth/Dockerfile .
docker build -t api-platform/user-service:$NEW_VERSION -f services/user/Dockerfile .
docker build -t api-platform/org-service:$NEW_VERSION -f services/org/Dockerfile .

# 4. Tag as latest
docker tag api-platform/auth-service:$NEW_VERSION api-platform/auth-service:latest
docker tag api-platform/user-service:$NEW_VERSION api-platform/user-service:latest
docker tag api-platform/org-service:$NEW_VERSION api-platform/org-service:latest

# 5. Push to Docker registry
docker push api-platform/auth-service:$NEW_VERSION
docker push api-platform/user-service:$NEW_VERSION
docker push api-platform/org-service:$NEW_VERSION

docker push api-platform/auth-service:latest
docker push api-platform/user-service:latest
docker push api-platform/org-service:latest
```

### Step 3: Database Migrations

**⚠️ CRITICAL: Always backup before migrations!**

```bash
# 1. Connect to production database (read-only first!)
export DATABASE_URL=postgresql://readonly_user@prod-db.example.com:5432/api_platform

# 2. Verify migration scripts
npm run migrate:status

# Output:
# ✓ 20250101_create_users_table.sql (applied)
# ✓ 20250110_add_mfa_columns.sql (applied)
# ✗ 20250117_add_webhooks_table.sql (pending)

# 3. Review pending migrations
cat migrations/20250117_add_webhooks_table.sql

# 4. Take database backup
aws rds create-db-snapshot \
  --db-instance-identifier prod-db \
  --db-snapshot-identifier prod-db-snapshot-$(date +%Y%m%d-%H%M%S)

# Wait for snapshot to complete
aws rds describe-db-snapshots \
  --db-snapshot-identifier prod-db-snapshot-20250117-140000 \
  --query 'DBSnapshots[0].Status'

# 5. Apply migrations (with write access)
export DATABASE_URL=postgresql://admin_user:$DB_PASSWORD@prod-db.example.com:5432/api_platform

npm run migrate:up

# 6. Verify migrations applied successfully
npm run migrate:status
```

### Step 4: Deploy to Kubernetes

**Using Helm (Recommended):**

```bash
# 1. Update Helm values for production
cat > helm/values-prod.yaml <<EOF
replicaCount: 5

image:
  tag: $NEW_VERSION
  pullPolicy: IfNotPresent

env:
  - name: NODE_ENV
    value: production
  - name: LOG_LEVEL
    value: info
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: api-secrets
        key: database-url

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 50
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  hosts:
    - host: api.example.com
      paths: [/v1]
  tls:
    - secretName: api-tls-cert
      hosts:
        - api.example.com
EOF

# 2. Validate Helm chart
helm lint helm/api-platform
helm template helm/api-platform -f helm/values-prod.yaml --debug

# 3. Deploy with rolling update strategy
helm upgrade --install api-platform helm/api-platform \
  -f helm/values-prod.yaml \
  --namespace production \
  --create-namespace \
  --wait \
  --timeout 10m \
  --set image.tag=$NEW_VERSION

# 4. Monitor deployment progress
kubectl rollout status deployment/auth-service -n production
kubectl rollout status deployment/user-service -n production
kubectl rollout status deployment/org-service -n production
```

**Using kubectl (Alternative):**

```bash
# 1. Apply Kubernetes manifests
kubectl apply -f k8s/production/ --namespace production

# 2. Update deployment images
kubectl set image deployment/auth-service \
  auth-service=api-platform/auth-service:$NEW_VERSION \
  -n production

kubectl set image deployment/user-service \
  user-service=api-platform/user-service:$NEW_VERSION \
  -n production

# 3. Monitor rollout
kubectl rollout status deployment/auth-service -n production --timeout=10m
```

### Step 5: Verify Deployment

```bash
# 1. Check pod status
kubectl get pods -n production

# Expected output:
# NAME                           READY   STATUS    RESTARTS   AGE
# auth-service-6d4c8f9b7-abcde   1/1     Running   0          2m
# auth-service-6d4c8f9b7-fghij   1/1     Running   0          2m
# user-service-7e5d9g0c8-klmno   1/1     Running   0          2m

# 2. Check service health endpoints
curl https://api.example.com/v1/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "1.2.3",
#   "timestamp": "2025-01-17T14:00:00Z",
#   "services": {
#     "database": "healthy",
#     "redis": "healthy",
#     "elasticsearch": "healthy"
#   }
# }

# 3. Test critical endpoints
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

curl https://api.example.com/v1/users?limit=5 \
  -H "Authorization: Bearer $TEST_TOKEN"

# 4. Check application logs
kubectl logs -f deployment/auth-service -n production --tail=100

# 5. Verify metrics in monitoring dashboard
# - Navigate to DataDog/Grafana dashboard
# - Check error rates, latency, throughput
# - Verify no spike in errors post-deployment
```

### Step 6: Smoke Tests

```bash
# Run automated smoke test suite
npm run test:smoke -- --env=production

# Manual smoke tests:
# 1. User registration
# 2. User login
# 3. List resources
# 4. Create resource
# 5. Update resource
# 6. Delete resource
# 7. Webhook delivery
# 8. Analytics event tracking
```

### Step 7: Post-Deployment Tasks

```bash
# 1. Tag release in Git
git tag -a v$NEW_VERSION -m "Release $NEW_VERSION"
git push origin v$NEW_VERSION

# 2. Create GitHub release
gh release create v$NEW_VERSION \
  --title "Release $NEW_VERSION" \
  --notes "See CHANGELOG.md for details"

# 3. Update CHANGELOG.md
cat >> CHANGELOG.md <<EOF

## [$NEW_VERSION] - $(date +%Y-%m-%d)

### Added
- Feature 1
- Feature 2

### Changed
- Update 1

### Fixed
- Bug fix 1
EOF

git add CHANGELOG.md
git commit -m "Update CHANGELOG for v$NEW_VERSION"
git push origin main

# 4. Notify stakeholders
# Send deployment notification email
# Post to Slack: #deployments channel
# Update status page (status.example.com)

# 5. Monitor for 24 hours
# Watch error rates
# Monitor user feedback
# Check support tickets
```

## Rollback Procedures

### When to Rollback

**Immediate rollback if:**

- Error rate > 5% (critical threshold)
- Database corruption detected
- Security vulnerability discovered
- Service completely unavailable

**Consider rollback if:**

- Performance degradation > 50%
- Customer complaints spike
- Critical feature broken

### Rollback Steps

**Option 1: Helm Rollback (Recommended)**

```bash
# 1. Check deployment history
helm history api-platform -n production

# Output:
# REVISION  UPDATED                   STATUS      CHART                 DESCRIPTION
# 1         Thu Jan 10 14:00:00 2025  superseded  api-platform-1.0.0   Initial install
# 2         Thu Jan 17 14:00:00 2025  deployed    api-platform-1.1.0   Upgrade complete

# 2. Rollback to previous revision
helm rollback api-platform 1 -n production --wait --timeout=10m

# 3. Verify rollback
kubectl get pods -n production
curl https://api.example.com/v1/health
```

**Option 2: kubectl Rollback**

```bash
# 1. View deployment history
kubectl rollout history deployment/auth-service -n production

# 2. Rollback deployment
kubectl rollout undo deployment/auth-service -n production
kubectl rollout undo deployment/user-service -n production
kubectl rollout undo deployment/org-service -n production

# 3. Monitor rollback
kubectl rollout status deployment/auth-service -n production
```

**Option 3: Database Rollback**

```bash
# ⚠️ Use with extreme caution!
# Only if migrations caused issues

# 1. Stop application
kubectl scale deployment --all --replicas=0 -n production

# 2. Restore database from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prod-db-restore \
  --db-snapshot-identifier prod-db-snapshot-20250117-140000

# 3. Update database endpoint
# 4. Start application
kubectl scale deployment --all --replicas=5 -n production
```

### Post-Rollback Actions

```bash
# 1. Notify stakeholders
# Subject: Rollback Notification - Production Deployment

# 2. Create incident report
# Document:
# - Reason for rollback
# - Impact assessment
# - Root cause analysis
# - Preventive measures

# 3. Update status page
# "Service restored after deployment rollback"

# 4. Schedule retrospective
# Review what went wrong and how to prevent
```

## Health Checks

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Health Endpoints

**`GET /health/live`** - Liveness check (is process running?)

```json
{
  "status": "ok",
  "timestamp": "2025-01-17T14:00:00Z"
}
```

**`GET /health/ready`** - Readiness check (can accept traffic?)

```json
{
  "status": "ready",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "elasticsearch": "connected"
  }
}
```

**`GET /health`** - Full health check

```json
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": 3600,
  "services": {
    "database": { "status": "healthy", "latency": 5 },
    "redis": { "status": "healthy", "latency": 2 },
    "elasticsearch": { "status": "healthy", "latency": 10 }
  },
  "metrics": {
    "memoryUsage": 512,
    "cpuUsage": 45
  }
}
```

## Troubleshooting

### Common Issues

#### Issue 1: Pods in CrashLoopBackOff

**Symptoms:**

```bash
kubectl get pods -n production
# auth-service-abc123  0/1  CrashLoopBackOff  5  5m
```

**Diagnosis:**

```bash
# Check pod logs
kubectl logs auth-service-abc123 -n production

# Check pod events
kubectl describe pod auth-service-abc123 -n production
```

**Common Causes:**

- Database connection failure (check credentials)
- Missing environment variables
- Port already in use
- Out of memory (OOM)

**Resolution:**

```bash
# Fix configuration and redeploy
kubectl delete pod auth-service-abc123 -n production
kubectl rollout restart deployment/auth-service -n production
```

---

#### Issue 2: High Error Rate

**Symptoms:**

- Error rate > 5% in monitoring dashboard
- 500 errors in logs

**Diagnosis:**

```bash
# Check application logs
kubectl logs -f deployment/auth-service -n production | grep ERROR

# Check database connections
kubectl exec -it auth-service-abc123 -n production -- \
  psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution:**

- If recent deployment: Rollback immediately
- If database issue: Scale up database or add read replicas
- If external service: Enable circuit breaker

---

#### Issue 3: Deployment Stuck

**Symptoms:**

```bash
kubectl rollout status deployment/auth-service -n production
# Waiting for deployment "auth-service" rollout to finish: 2 out of 5 new replicas have been updated...
```

**Diagnosis:**

```bash
# Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# Check resource constraints
kubectl describe nodes | grep -A 5 "Allocated resources"
```

**Resolution:**

```bash
# If image pull error: Check Docker credentials
# If resource constraints: Scale down or add nodes
# If timeout: Increase rollout deadline
kubectl rollout undo deployment/auth-service -n production
```

## Additional Resources

- [Rollback Runbook](./rollback.md)
- [Incident Response Runbook](./incident-response.md)
- [Scaling Runbook](./scaling.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Architecture Documentation](../architecture/)
