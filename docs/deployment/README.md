# Zero-Downtime Deployment System

## Quick Links

- [Deployment Guide](./deployment-guide.md) - Complete deployment procedures
- [Rollback Procedures](./rollback-procedures.md) - Emergency rollback instructions
- [Database Migrations](./database-migrations.md) - Zero-downtime database changes

## Overview

Enterprise-grade zero-downtime deployment automation for Kubernetes with support for:

- **Rolling Updates** - Gradual pod replacement
- **Blue-Green Deployments** - Instant traffic switching
- **Canary Releases** - Gradual traffic shifting
- **Feature Flags** - Runtime feature control
- **Automatic Rollback** - Auto-recovery from failures

## Quick Start

### Deploy to Development

```bash
ENVIRONMENT=dev IMAGE_TAG=dev-latest ./scripts/deploy.sh
```

### Deploy to Staging

```bash
ENVIRONMENT=staging IMAGE_TAG=v1.0.0 ./scripts/deploy.sh
```

### Deploy to Production

```bash
ENVIRONMENT=production \
DEPLOYMENT_STRATEGY=blue-green \
IMAGE_TAG=v1.0.0 \
./scripts/deploy.sh
```

## Project Structure

```
.
├── infrastructure/
│   ├── k8s/                    # Kubernetes manifests
│   │   ├── base/               # Base configurations
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── configmap.yaml
│   │   │   ├── secret.yaml
│   │   │   ├── hpa.yaml
│   │   │   └── ingress.yaml
│   │   └── overlays/           # Environment-specific
│   │       ├── dev/
│   │       ├── staging/
│   │       └── production/
│   └── helm/                   # Helm charts
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-staging.yaml
│       ├── values-prod.yaml
│       └── templates/
├── scripts/                    # Automation scripts
│   ├── deploy.sh              # Main deployment script
│   ├── rollback.sh            # Rollback automation
│   ├── health-check.sh        # Health verification
│   ├── smoke-test.sh          # Post-deployment tests
│   └── migrate-database.sh    # Database migrations
├── src/feature-flags/         # Feature flag system
│   ├── feature-flag.service.ts
│   └── feature-flag.middleware.ts
├── .github/workflows/         # CI/CD pipelines
│   └── deploy.yml
└── docs/deployment/           # Documentation
    ├── deployment-guide.md
    ├── rollback-procedures.md
    └── database-migrations.md
```

## Deployment Strategies

### 1. Rolling Update (Default)

Best for: Standard releases with minimal risk

```bash
DEPLOYMENT_STRATEGY=rolling ./scripts/deploy.sh
```

- Gradually replaces pods
- Zero downtime
- Automatic rollback on failure
- **Timeline**: 2-5 minutes

### 2. Blue-Green

Best for: Critical releases requiring instant rollback

```bash
DEPLOYMENT_STRATEGY=blue-green ./scripts/deploy.sh
```

- Two complete environments
- Instant traffic switch
- Easy rollback
- **Timeline**: 5-10 minutes

### 3. Canary

Best for: High-risk deployments requiring validation

```bash
DEPLOYMENT_STRATEGY=canary CANARY_WEIGHT=10 ./scripts/deploy.sh
```

- Gradual traffic shift (10% initially)
- Real-time monitoring
- Automatic rollback on errors
- **Timeline**: 15-30 minutes

## Key Features

### Automatic Health Checks

All deployments include:

- Liveness probes (application running)
- Readiness probes (ready for traffic)
- Startup probes (initialization complete)

### Database Migrations

Zero-downtime database changes:

```bash
./scripts/migrate-database.sh migrate
```

Features:

- Automatic backups
- Rollback capability
- Multi-phase migrations
- Data verification

### Feature Flags

Runtime feature control with LaunchDarkly:

```typescript
// Check if feature is enabled
const isEnabled = await featureFlagService.isEnabled("new-feature", {
  key: userId,
});

// Get A/B test variation
const variant = await featureFlagService.getVariation(
  "button-color",
  { key: userId },
  "blue",
);
```

### Monitoring Integration

Built-in monitoring with:

- Prometheus metrics
- Health check endpoints
- Performance tracking
- Error rate monitoring

## Emergency Procedures

### Quick Rollback

```bash
./scripts/rollback.sh production myapp-deployment
```

### Emergency Feature Disable

```bash
# Via LaunchDarkly dashboard or API
curl -X PATCH https://app.launchdarkly.com/api/v2/flags/PROJECT/FEATURE \
  -H "Authorization: $LD_API_KEY" \
  -d '{"enabled": false}'
```

### Database Rollback

```bash
./scripts/migrate-database.sh rollback myapp-backup-20231215_143022
```

## CI/CD Integration

### GitHub Actions

Automatic deployment on push:

- `develop` → Development
- `staging` → Staging
- `main` → Production

Manual workflow dispatch available for custom deployments.

### Required Secrets

Set these in GitHub repository settings:

```bash
KUBE_CONFIG_DEV         # Base64 encoded kubeconfig for dev
KUBE_CONFIG_STAGING     # Base64 encoded kubeconfig for staging
KUBE_CONFIG_PROD        # Base64 encoded kubeconfig for production
DATABASE_URL_DEV        # Development database URL
DATABASE_URL_STAGING    # Staging database URL
DATABASE_URL_PROD       # Production database URL
SLACK_WEBHOOK_URL       # Slack notifications
```

## Best Practices

1. **Always test in staging first**
2. **Use feature flags for risky changes**
3. **Monitor metrics during deployment**
4. **Keep rollback plan ready**
5. **Document all changes**
6. **Run smoke tests after deployment**
7. **Practice rollback procedures**

## Support and Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [LaunchDarkly SDK](https://docs.launchdarkly.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Troubleshooting

Common issues and solutions:

| Issue                     | Solution                                              |
| ------------------------- | ----------------------------------------------------- |
| Pods not starting         | Check logs: `kubectl logs <pod-name>`                 |
| Health checks failing     | Verify endpoints: `curl http://pod-ip:8080/health`    |
| Rollout stuck             | Rollback: `./scripts/rollback.sh`                     |
| Database migration failed | Rollback DB: `./scripts/migrate-database.sh rollback` |

For detailed troubleshooting, see [Deployment Guide](./deployment-guide.md#troubleshooting).
