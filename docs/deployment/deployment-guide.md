# Zero-Downtime Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Deployment Strategies](#deployment-strategies)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Deployment Methods](#deployment-methods)
6. [Monitoring and Verification](#monitoring-and-verification)
7. [Troubleshooting](#troubleshooting)

## Overview

This deployment system provides enterprise-grade zero-downtime deployment capabilities with support for multiple deployment strategies:

- **Rolling Updates**: Gradual replacement of old pods with new ones
- **Blue-Green**: Complete environment swap with instant rollback
- **Canary**: Gradual traffic shifting for risk mitigation

### Key Features

- Zero-downtime deployments
- Automatic health checks and validation
- Database migration management
- Feature flag integration
- Automatic rollback on failure
- Multi-environment support (dev/staging/production)

## Deployment Strategies

### Rolling Update (Default)

Gradually replaces pods with zero downtime.

**Characteristics:**

- maxSurge: 1 (one extra pod during rollout)
- maxUnavailable: 0 (no pods go down before new ones are ready)
- Best for: Standard deployments with minimal risk

```bash
DEPLOYMENT_STRATEGY=rolling ./scripts/deploy.sh
```

### Blue-Green Deployment

Creates a complete new environment and switches traffic instantly.

**Characteristics:**

- Two complete environments (blue and green)
- Instant traffic switch
- Easy rollback by switching back
- Best for: Critical releases requiring instant rollback capability

```bash
DEPLOYMENT_STRATEGY=blue-green ./scripts/deploy.sh
```

### Canary Deployment

Gradually shifts traffic to the new version.

**Characteristics:**

- Initial deployment to small percentage of traffic
- Gradual increase based on metrics
- Automatic rollback on errors
- Best for: High-risk deployments requiring validation

```bash
DEPLOYMENT_STRATEGY=canary CANARY_WEIGHT=10 ./scripts/deploy.sh
```

## Prerequisites

### Required Tools

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
```

### Kubernetes Cluster

- Kubernetes 1.24+
- kubectl configured with cluster access
- Namespace created for each environment

### Required Secrets

```bash
# Database credentials
kubectl create secret generic app-secrets \
  --from-literal=database_url=$DATABASE_URL \
  --from-literal=api_key=$API_KEY \
  -n production

# Feature flag SDK key
kubectl create secret generic app-secrets \
  --from-literal=feature_flag_sdk_key=$LAUNCHDARKLY_SDK_KEY \
  -n production
```

## Quick Start

### 1. Configure Environment

```bash
export ENVIRONMENT=production
export NAMESPACE=production
export APP_NAME=myapp
export IMAGE_TAG=v1.0.0
```

### 2. Deploy

```bash
# Using deployment script
./scripts/deploy.sh

# Using Helm
helm upgrade --install myapp infrastructure/helm \
  --namespace production \
  --values infrastructure/helm/values-prod.yaml \
  --set image.tag=v1.0.0
```

### 3. Verify Deployment

```bash
# Check deployment status
kubectl rollout status deployment/myapp-deployment -n production

# Run health checks
./scripts/health-check.sh

# Run smoke tests
./scripts/smoke-test.sh
```

## Deployment Methods

### Method 1: Automated Script

```bash
# Development
ENVIRONMENT=dev \
NAMESPACE=dev \
IMAGE_TAG=dev-latest \
./scripts/deploy.sh

# Staging
ENVIRONMENT=staging \
NAMESPACE=staging \
IMAGE_TAG=staging-v1.0.0 \
DEPLOYMENT_STRATEGY=rolling \
./scripts/deploy.sh

# Production
ENVIRONMENT=production \
NAMESPACE=production \
IMAGE_TAG=v1.0.0 \
DEPLOYMENT_STRATEGY=blue-green \
./scripts/deploy.sh
```

### Method 2: Kustomize

```bash
# Development
kubectl apply -k infrastructure/k8s/overlays/dev

# Staging
kubectl apply -k infrastructure/k8s/overlays/staging

# Production
kubectl apply -k infrastructure/k8s/overlays/production
```

### Method 3: Helm

```bash
# Development
helm upgrade --install myapp infrastructure/helm \
  --namespace dev \
  --values infrastructure/helm/values-dev.yaml \
  --set image.tag=dev-latest

# Staging
helm upgrade --install myapp infrastructure/helm \
  --namespace staging \
  --values infrastructure/helm/values-staging.yaml \
  --set image.tag=staging-v1.0.0

# Production
helm upgrade --install myapp infrastructure/helm \
  --namespace production \
  --values infrastructure/helm/values-prod.yaml \
  --set image.tag=v1.0.0 \
  --wait \
  --timeout 10m
```

### Method 4: GitHub Actions

Push to the corresponding branch:

```bash
# Development
git push origin develop

# Staging
git push origin staging

# Production
git push origin main
```

Or use manual workflow dispatch:

1. Go to GitHub Actions
2. Select "Zero-Downtime Deployment" workflow
3. Click "Run workflow"
4. Select environment and strategy
5. Click "Run workflow"

## Database Migrations

### Zero-Downtime Migration

```bash
# Run migrations
./scripts/migrate-database.sh migrate

# Verify migrations
./scripts/migrate-database.sh verify

# Rollback migrations
./scripts/migrate-database.sh rollback <backup-name>
```

### Migration Best Practices

1. **Backward Compatible Changes**
   - Add new columns with default values
   - Never remove columns immediately
   - Use feature flags to toggle new schema

2. **Multi-Step Migrations**
   - Step 1: Add new column
   - Step 2: Deploy code using both columns
   - Step 3: Migrate data
   - Step 4: Remove old column

3. **Migration Testing**
   - Test migrations on staging first
   - Create database backup before migration
   - Verify data integrity after migration

## Monitoring and Verification

### Health Checks

```bash
# Comprehensive health check
./scripts/health-check.sh comprehensive

# Specific checks
./scripts/health-check.sh pods
./scripts/health-check.sh deployment
./scripts/health-check.sh endpoints

# Wait for readiness
./scripts/health-check.sh wait
```

### Smoke Tests

```bash
# Run all smoke tests
./scripts/smoke-test.sh

# Environment-specific tests
ENVIRONMENT=production ./scripts/smoke-test.sh
```

### Monitoring Metrics

Monitor these key metrics during deployment:

- **Pod Status**: All pods running and ready
- **Error Rate**: No increase in 5xx errors
- **Response Time**: P95 latency within SLA
- **Traffic**: Even distribution across pods
- **Resource Usage**: CPU and memory within limits

### Kubernetes Commands

```bash
# Watch deployment progress
kubectl rollout status deployment/myapp-deployment -n production

# View pod status
kubectl get pods -n production -l app=myapp -w

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# View logs
kubectl logs -f deployment/myapp-deployment -n production

# Get deployment history
kubectl rollout history deployment/myapp-deployment -n production
```

## Rollback Procedures

See [Rollback Procedures](./rollback-procedures.md) for detailed rollback instructions.

### Quick Rollback

```bash
# Automatic rollback
./scripts/rollback.sh production myapp-deployment

# Manual Kubernetes rollback
kubectl rollout undo deployment/myapp-deployment -n production

# Helm rollback
helm rollback myapp -n production
```

## Canary Deployment Workflow

### 1. Deploy Canary

```bash
DEPLOYMENT_STRATEGY=canary \
CANARY_WEIGHT=10 \
./scripts/deploy.sh
```

### 2. Monitor Canary

Monitor for 10-15 minutes:

```bash
# Watch metrics
kubectl top pods -n production -l version=canary

# Check error rates
kubectl logs -l version=canary -n production --tail=100

# Compare with stable
kubectl logs -l version=stable -n production --tail=100
```

### 3. Promote or Rollback

```bash
# Promote canary to production
DEPLOYMENT_STRATEGY=promote-canary ./scripts/deploy.sh

# Or rollback canary
./scripts/rollback.sh production myapp-deployment-canary
```

## Feature Flags

Feature flags enable safe deployments with instant rollback capability.

### Configuration

```typescript
import { getFeatureFlagService } from "./src/feature-flags/feature-flag.service";

// Initialize
const service = getFeatureFlagService({
  sdkKey: process.env.LAUNCHDARKLY_SDK_KEY,
  streamingEnabled: true,
});

await service.initialize();
```

### Usage

```typescript
// Check if feature is enabled
const isEnabled = await service.isEnabled("new-feature", { key: userId });

// Get variation (A/B testing)
const variant = await service.getVariation(
  "button-color",
  { key: userId },
  "blue",
);

// Track event
await service.track("feature-used", { key: userId }, { action: "click" });
```

### Emergency Kill Switch

```bash
# Disable feature immediately
curl -X POST https://api.launchdarkly.com/flags/new-feature \
  -H "Authorization: $LD_API_KEY" \
  -d '{"enabled": false}'
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n production

# Check logs
kubectl logs <pod-name> -n production

# Check events
kubectl get events -n production
```

### Health Checks Failing

```bash
# Test health endpoint
kubectl port-forward pod/<pod-name> 8080:8080 -n production
curl http://localhost:8080/health/ready

# Check readiness probe
kubectl describe pod <pod-name> -n production | grep -A5 Readiness
```

### Rollout Stuck

```bash
# Check rollout status
kubectl rollout status deployment/myapp-deployment -n production

# Rollback
kubectl rollout undo deployment/myapp-deployment -n production

# Force restart
kubectl rollout restart deployment/myapp-deployment -n production
```

### Database Migration Failure

```bash
# Check migration logs
kubectl logs job/myapp-migration-<timestamp> -n production

# Rollback migration
./scripts/migrate-database.sh rollback <backup-name>

# Verify database state
./scripts/migrate-database.sh verify
```

## Best Practices

1. **Always test in staging first**
2. **Use feature flags for risky changes**
3. **Monitor metrics during and after deployment**
4. **Keep rollback plan ready**
5. **Document all deployment changes**
6. **Run smoke tests after every deployment**
7. **Use automated deployment pipelines**
8. **Implement proper health checks**
9. **Version all configuration changes**
10. **Practice disaster recovery procedures**

## Additional Resources

- [Rollback Procedures](./rollback-procedures.md)
- [Database Migration Guide](./database-migrations.md)
- [Monitoring Setup](../monitoring/setup.md)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
