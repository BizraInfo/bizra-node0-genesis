# Rollback Procedures

## Table of Contents

1. [Overview](#overview)
2. [When to Rollback](#when-to-rollback)
3. [Rollback Strategies](#rollback-strategies)
4. [Automated Rollback](#automated-rollback)
5. [Manual Rollback](#manual-rollback)
6. [Post-Rollback Verification](#post-rollback-verification)
7. [Rollback Decision Matrix](#rollback-decision-matrix)

## Overview

This document provides comprehensive procedures for rolling back deployments in case of failures or issues.

### Rollback Philosophy

- **Fast > Perfect**: Rollback quickly, investigate later
- **Automate rollback detection**: Use metrics and health checks
- **Practice rollbacks**: Test rollback procedures regularly
- **Document everything**: Track all rollbacks for learning

## When to Rollback

### Automatic Rollback Triggers

The system automatically rolls back if:

1. **Health checks fail** for 5 consecutive minutes
2. **Error rate increases** by >50% compared to baseline
3. **Pod crash loops** detected
4. **Deployment timeout** (10 minutes without becoming ready)

### Manual Rollback Indicators

Consider manual rollback if:

1. **Critical bug** discovered in production
2. **Performance degradation** (P95 latency >2x baseline)
3. **Data corruption** detected
4. **Third-party integration failure**
5. **Unexpected user-facing errors**

## Rollback Strategies

### 1. Kubernetes Native Rollback

Fastest method using Kubernetes built-in rollback.

```bash
# Automatic rollback to previous version
./scripts/rollback.sh production myapp-deployment

# Or manually
kubectl rollout undo deployment/myapp-deployment -n production

# Rollback to specific revision
kubectl rollout undo deployment/myapp-deployment \
  --to-revision=3 -n production
```

**Timeline**: 2-5 minutes

### 2. Blue-Green Rollback

Instant traffic switch back to previous environment.

```bash
# Automated blue-green rollback
ROLLBACK_STRATEGY=blue-green \
./scripts/rollback.sh production myapp-deployment

# Manual switch
kubectl patch service myapp-service -n production \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

**Timeline**: <30 seconds

### 3. Canary Rollback

Remove canary deployment and keep stable version.

```bash
# Remove canary
ROLLBACK_STRATEGY=canary \
./scripts/rollback.sh production myapp-deployment

# Manual deletion
kubectl delete deployment myapp-deployment-canary -n production
kubectl delete ingress myapp-ingress-canary -n production
```

**Timeline**: <1 minute

### 4. Helm Rollback

Rollback using Helm release history.

```bash
# List releases
helm history myapp -n production

# Rollback to previous
helm rollback myapp -n production

# Rollback to specific revision
helm rollback myapp 5 -n production --wait
```

**Timeline**: 3-7 minutes

## Automated Rollback

### GitHub Actions Automatic Rollback

The CI/CD pipeline automatically rolls back if:

1. Post-deployment health checks fail
2. Smoke tests fail
3. Integration tests fail

```yaml
# Configured in .github/workflows/deploy.yml
- name: Rollback on failure
  if: failure()
  run: ./scripts/rollback.sh production myapp-deployment
```

### Script-Based Automatic Rollback

```bash
# Deploy with automatic rollback on failure
./scripts/deploy.sh || ./scripts/rollback.sh production myapp-deployment
```

### Monitoring-Triggered Rollback

Set up alerts that trigger automatic rollback:

```yaml
# Prometheus AlertManager rule
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  annotations:
    summary: "High error rate detected"
  labels:
    severity: critical
    action: rollback
```

## Manual Rollback

### Step-by-Step Rollback Process

#### 1. Assess the Situation

```bash
# Check current deployment status
kubectl get deployments -n production

# View recent events
kubectl get events -n production --sort-by='.lastTimestamp' | tail -20

# Check error logs
kubectl logs -l app=myapp -n production --tail=100 | grep ERROR

# Review metrics dashboard
# - Error rate
# - Response time
# - Resource usage
```

#### 2. Notify Team

```bash
# Send Slack notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🚨 ROLLBACK INITIATED: Production deployment"}'
```

#### 3. Create Incident Record

```bash
# Document the incident
INCIDENT_ID=$(date +%Y%m%d-%H%M%S)
echo "INCIDENT: $INCIDENT_ID" >> /var/log/incidents.log
echo "Reason: [describe issue]" >> /var/log/incidents.log
```

#### 4. Execute Rollback

```bash
# Run rollback script
./scripts/rollback.sh production myapp-deployment

# Monitor rollback progress
watch kubectl get pods -n production
```

#### 5. Verify Rollback

```bash
# Wait for pods to be ready
./scripts/health-check.sh wait

# Run smoke tests
./scripts/smoke-test.sh

# Check metrics
# - Error rate back to baseline
# - Response time within SLA
# - All pods healthy
```

#### 6. Post-Rollback Actions

```bash
# Update deployment tracking
echo "ROLLBACK COMPLETED: $INCIDENT_ID" >> /var/log/incidents.log

# Notify stakeholders
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"✅ Rollback completed successfully"}'

# Schedule post-mortem
# - Document what went wrong
# - Identify root cause
# - Create action items
```

## Database Rollback

### Rollback Database Migrations

```bash
# List migration backups
ls -la backups/

# Rollback to specific backup
./scripts/migrate-database.sh rollback myapp-backup-20231215_143022

# Verify database state
./scripts/migrate-database.sh verify
```

### Database Rollback Best Practices

1. **Always create backup** before migration
2. **Test rollback** in staging first
3. **Verify data integrity** after rollback
4. **Document data loss** (if any)
5. **Notify users** if downtime required

### Zero-Downtime Database Rollback

For migrations that can't be rolled back without downtime:

```bash
# 1. Deploy old application version (compatible with new schema)
./scripts/rollback.sh production myapp-deployment

# 2. Run data migration rollback in background
./scripts/migrate-database.sh rollback-async

# 3. Monitor data migration progress
kubectl logs job/migration-rollback -n production -f
```

## Post-Rollback Verification

### Health Checks

```bash
# Comprehensive health check
./scripts/health-check.sh comprehensive

# Specific verifications
./scripts/health-check.sh pods
./scripts/health-check.sh endpoints
./scripts/health-check.sh resources
```

### Smoke Tests

```bash
# Run full smoke test suite
./scripts/smoke-test.sh

# Critical path tests
curl https://myapp.example.com/health
curl https://myapp.example.com/api/status
```

### Metrics Verification

Monitor for 15-30 minutes after rollback:

- **Error Rate**: <0.1% (baseline)
- **P95 Latency**: <500ms
- **Pod Restarts**: 0
- **Traffic Distribution**: Even across pods

### User Verification

```bash
# Check user-facing endpoints
curl https://myapp.example.com/

# Verify authentication
curl https://myapp.example.com/api/protected \
  -H "Authorization: Bearer $TOKEN"

# Test critical user flows
npm run test:e2e:critical
```

## Rollback Decision Matrix

| Issue               | Severity | Rollback Strategy  | Timeline | Action                |
| ------------------- | -------- | ------------------ | -------- | --------------------- |
| 5xx errors >10%     | Critical | Blue-Green         | <1 min   | Immediate rollback    |
| Pod crash loops     | Critical | Kubernetes         | 2-5 min  | Immediate rollback    |
| P95 >2x baseline    | High     | Canary removal     | 1-2 min  | Rollback canary first |
| Minor UI bug        | Low      | Feature flag       | <10 sec  | Disable via flag      |
| Database issue      | Critical | Full rollback + DB | 5-15 min | Coordinate with DBA   |
| Integration failure | Medium   | Feature flag       | <1 min   | Disable integration   |

## Rollback Checklist

### Pre-Rollback

- [ ] Confirm issue requires rollback
- [ ] Identify affected systems
- [ ] Notify team via Slack/PagerDuty
- [ ] Create incident record
- [ ] Check for active users (if downtime needed)

### During Rollback

- [ ] Execute rollback script
- [ ] Monitor rollback progress
- [ ] Watch error rates and metrics
- [ ] Verify pods becoming healthy
- [ ] Check database connectivity

### Post-Rollback

- [ ] Run health checks
- [ ] Run smoke tests
- [ ] Verify user-facing functionality
- [ ] Monitor for 30 minutes
- [ ] Update incident record
- [ ] Notify stakeholders
- [ ] Schedule post-mortem

## Troubleshooting Rollback Issues

### Rollback Fails

```bash
# Check rollout history
kubectl rollout history deployment/myapp-deployment -n production

# Force delete stuck pods
kubectl delete pod <pod-name> -n production --force --grace-period=0

# Manual pod restart
kubectl rollout restart deployment/myapp-deployment -n production
```

### Database Rollback Fails

```bash
# Check backup integrity
pg_restore --list backups/myapp-backup-*.dump

# Manual restore
psql -h $DB_HOST -U $DB_USER -d myapp < backups/backup.sql

# Verify data
psql -h $DB_HOST -U $DB_USER -d myapp -c "SELECT COUNT(*) FROM users;"
```

### Helm Rollback Fails

```bash
# Force Helm rollback
helm rollback myapp --force -n production

# Delete and reinstall
helm uninstall myapp -n production
helm install myapp infrastructure/helm \
  --values infrastructure/helm/values-prod.yaml
```

## Prevention Strategies

1. **Comprehensive Testing**
   - Unit tests (>80% coverage)
   - Integration tests
   - E2E tests for critical paths
   - Load testing in staging

2. **Gradual Rollouts**
   - Use canary deployments
   - Monitor metrics closely
   - Increase traffic gradually

3. **Feature Flags**
   - Wrap risky features in flags
   - Test with internal users first
   - Easy instant disable

4. **Staging Parity**
   - Keep staging identical to production
   - Test all changes in staging
   - Run production-like load tests

5. **Monitoring**
   - Set up comprehensive alerts
   - Monitor business metrics
   - Track error rates and latency
   - Use distributed tracing

## Additional Resources

- [Deployment Guide](./deployment-guide.md)
- [Database Migration Guide](./database-migrations.md)
- [Incident Response Playbook](../operations/incident-response.md)
- [Post-Mortem Template](../operations/post-mortem-template.md)
