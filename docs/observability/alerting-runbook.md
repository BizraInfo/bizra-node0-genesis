# Alerting Runbook

## Overview

This runbook provides step-by-step procedures for responding to alerts from the BIZRA platform.

## Table of Contents

1. [Critical Alerts](#critical-alerts)
2. [High Severity Alerts](#high-severity-alerts)
3. [Warning Alerts](#warning-alerts)
4. [SLO Breach Response](#slo-breach-response)
5. [Escalation Procedures](#escalation-procedures)

---

## Critical Alerts

### APIServiceDown

**Alert**: API service is down
**Severity**: Critical
**Impact**: Complete service outage

#### Investigation Steps

1. **Check service status**:

   ```bash
   kubectl get pods -n production
   docker ps | grep api
   systemctl status bizra-api
   ```

2. **Check recent deployments**:

   ```bash
   kubectl rollout history deployment/api -n production
   git log --oneline -10
   ```

3. **Check logs**:

   ```bash
   kubectl logs -n production deployment/api --tail=100
   tail -f /var/log/bizra/error.log
   ```

4. **Check dependencies**:
   - Database connectivity
   - Redis availability
   - External API status

#### Remediation

1. **Immediate**: Rollback recent deployment

   ```bash
   kubectl rollout undo deployment/api -n production
   ```

2. **If rollback fails**: Scale up backup instances

   ```bash
   kubectl scale deployment/api-backup --replicas=5 -n production
   ```

3. **Update status page**: Notify users of outage

4. **Post-incident**: Schedule root cause analysis meeting

### CriticalErrorRate

**Alert**: Error rate > 10%
**Severity**: Critical
**Impact**: Significant user impact

#### Investigation

1. **Identify error patterns**:

   ```promql
   sum by (route, status_code) (rate(http_requests_total{status_code=~"5.."}[5m]))
   ```

2. **Check error logs**:

   ```bash
   grep "ERROR" /var/log/bizra/combined.log | tail -100
   ```

3. **Check Sentry**: Review recent error spikes

4. **Database health**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state != 'idle';
   ```

#### Remediation

1. **Rate limiting**: Enable aggressive rate limiting
2. **Circuit breaker**: Enable circuit breaker for failing dependencies
3. **Database**: Check connection pool, add replicas if needed
4. **Rollback**: If caused by deployment, rollback immediately

### ErrorBudgetExhausted

**Alert**: 30-day error budget exhausted
**Severity**: Critical
**Impact**: SLO breach, deployment freeze

#### Response

1. **Freeze deployments**: No new releases until budget recovers
2. **Incident response**: Form incident response team
3. **Root cause analysis**: Identify and fix underlying issues
4. **Communication**: Update stakeholders on action plan

---

## High Severity Alerts

### HighAPILatency

**Alert**: p95 latency > 1s
**Severity**: High
**Impact**: Degraded user experience

#### Investigation

1. **Identify slow endpoints**:

   ```promql
   histogram_quantile(0.95, sum by (route) (rate(http_request_duration_seconds_bucket[5m]))) > 1
   ```

2. **Check database queries**:

   ```promql
   histogram_quantile(0.95, sum by (operation, table) (rate(db_query_duration_seconds_bucket[5m])))
   ```

3. **Check APM traces**: Review OpenTelemetry/Jaeger traces

#### Remediation

1. **Caching**: Increase cache TTL for slow queries
2. **Database**: Add indexes, optimize queries
3. **Scaling**: Scale up API instances
4. **Rate limiting**: Throttle non-critical endpoints

### DatabasePoolSaturation

**Alert**: Connection pool > 95% utilized
**Severity**: High
**Impact**: Risk of connection exhaustion

#### Investigation

1. **Check pool stats**:

   ```promql
   db_pool_size{state="active"} / (db_pool_size{state="active"} + db_pool_size{state="idle"})
   ```

2. **Identify connection leaks**:

   ```sql
   SELECT pid, state, query_start, query FROM pg_stat_activity WHERE state != 'idle';
   ```

3. **Check long-running queries**:
   ```sql
   SELECT pid, now() - query_start AS duration, query
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY duration DESC;
   ```

#### Remediation

1. **Immediate**: Increase pool size

   ```typescript
   poolConfig.max = 50; // Increase from 20
   ```

2. **Kill long-running queries**:

   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != 'idle' AND now() - query_start > interval '5 minutes';
   ```

3. **Code review**: Check for connection leaks in application code

### HighDatabaseErrorRate

**Alert**: Database error rate > 5%
**Severity**: High
**Impact**: Data access issues

#### Investigation

1. **Check error types**:

   ```promql
   sum by (error_type) (rate(db_query_errors_total[5m]))
   ```

2. **Database logs**:

   ```bash
   tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **Check disk space**: `df -h`

#### Remediation

1. **Connection errors**: Scale database replicas
2. **Timeout errors**: Increase query timeout
3. **Lock errors**: Optimize queries, reduce transaction scope
4. **Disk full**: Expand storage, archive old data

---

## Warning Alerts

### LowValidationThroughput

**Alert**: Validation requests < 1 req/sec
**Severity**: Warning
**Impact**: Possible service degradation

#### Investigation

1. **Check upstream traffic**: Verify CDN/load balancer metrics
2. **Check authentication**: Verify auth service health
3. **Check validation service**: Review validation service logs

#### Remediation

1. Monitor for 15 minutes to confirm trend
2. If persistent, check for:
   - Marketing campaigns ended
   - DNS issues
   - Rate limiting issues

### HighLoginFailureRate

**Alert**: Login failure rate > 20%
**Severity**: Warning
**Impact**: Possible security incident

#### Investigation

1. **Check failure patterns**:

   ```promql
   sum by (user_id) (rate(business_user_logins_total{status="failure"}[5m]))
   ```

2. **Check for brute force**: Look for IP patterns
   ```bash
   grep "login_failure" /var/log/bizra/security.log | awk '{print $5}' | sort | uniq -c | sort -rn | head -20
   ```

#### Remediation

1. **Rate limiting**: Enable aggressive rate limiting per IP
2. **CAPTCHA**: Enable CAPTCHA for login
3. **Block IPs**: Block malicious IPs at firewall
4. **Notify users**: Alert users of potential breach

---

## SLO Breach Response

### 99.9% Availability Breach

**Procedure**:

1. **Form incident team**: Page on-call SRE and engineering lead
2. **Create incident channel**: Slack #incident-YYYY-MM-DD
3. **Assess impact**: Determine scope and user impact
4. **Immediate mitigation**: Implement quick fixes
5. **Communication**: Update status page every 30 minutes
6. **Resolution**: Fix root cause
7. **Post-mortem**: Schedule within 48 hours

### Error Budget Management

**When error budget < 10%**:

- Reduce deployment frequency
- Increase testing rigor
- Focus on reliability improvements

**When error budget exhausted**:

- Freeze all deployments
- Emergency fixes only
- Executive approval required for changes

---

## Escalation Procedures

### Level 1: On-Call Engineer

- Initial response (5 minutes)
- Basic troubleshooting (15 minutes)
- Escalate if not resolved in 30 minutes

### Level 2: Senior SRE

- Advanced troubleshooting
- Infrastructure changes
- Escalate if not resolved in 1 hour

### Level 3: Engineering Lead

- Architecture decisions
- Major infrastructure changes
- Vendor escalation

### Level 4: VP Engineering

- Executive decisions
- Customer communication
- PR/legal involvement

---

## Communication Templates

### Status Page Update (Investigating)

```
[INVESTIGATING] We are currently investigating elevated error rates affecting API performance. Updates will be provided every 30 minutes.
```

### Status Page Update (Identified)

```
[IDENTIFIED] We have identified a database connection issue causing API errors. Our team is implementing a fix.
```

### Status Page Update (Resolved)

```
[RESOLVED] The issue has been resolved. All systems are operating normally. We apologize for any inconvenience.
```

---

## Tools and Resources

- **Monitoring**: https://grafana.example.com
- **Logs**: https://kibana.example.com
- **Traces**: https://jaeger.example.com
- **Status Page**: https://status.example.com
- **PagerDuty**: https://bizra.pagerduty.com
- **Runbook Repository**: https://github.com/bizra/runbooks

---

## Post-Incident

After every incident:

1. **Write post-mortem** (within 48 hours)
2. **Identify action items**
3. **Update runbooks**
4. **Improve monitoring**
5. **Share learnings** (all-hands or eng meeting)

**Post-mortem template**: `/docs/templates/post-mortem-template.md`
