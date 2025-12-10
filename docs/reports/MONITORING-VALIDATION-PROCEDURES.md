# BIZRA NODE-0 Monitoring Validation Procedures

**Version**: v2.2.0-rc1 | **Date**: 2025-10-24 | **احسان Standard**: ≥95%

---

## Overview

This document provides **step-by-step validation procedures** for the BIZRA NODE-0 elite monitoring stack, including:

- Prometheus metrics collection
- احسان-aware alerting
- Grafana dashboard validation
- HPA (Horizontal Pod Autoscaler) monitoring
- Predictive alerts verification
- Anomaly detection validation

---

## 1. Prerequisites Validation

### 1.1 Prometheus Operator Status

```bash
# Check if Prometheus Operator is installed
kubectl get pods -n bizra-testnet -l app.kubernetes.io/name=prometheus-operator

# Expected output:
# NAME                                        READY   STATUS    RESTARTS   AGE
# prometheus-prometheus-operator-xxx-xxx      1/1     Running   0          Xh

# If not installed:
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace bizra-testnet \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false
```

### 1.2 Verify CRDs Installed

```bash
# Check for required Custom Resource Definitions
kubectl get crd | grep monitoring.coreos.com

# Expected CRDs:
# prometheusrules.monitoring.coreos.com
# servicemonitors.monitoring.coreos.com
# prometheuses.monitoring.coreos.com
# alertmanagers.monitoring.coreos.com

# If missing, install manually:
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_prometheusrules.yaml
```

### 1.3 Application Deployment Status

```bash
# Verify BIZRA application is running
kubectl get deployment bizra-apex -n bizra-testnet

# Expected output:
# NAME         READY   UP-TO-DATE   AVAILABLE   AGE
# bizra-apex   3/3     3            3           Xh

# Check pods
kubectl get pods -n bizra-testnet -l app=bizra-apex

# Expected: 3+ pods in Running state
```

---

## 2. Metrics Collection Validation

### 2.1 Verify Metrics Endpoint

```bash
# Port forward to application metrics endpoint
kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 &
PORT_FORWARD_PID=$!
sleep 3

# Test metrics endpoint
echo "=== Testing Metrics Endpoint ==="
METRICS_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:9464/metrics)
HTTP_CODE=$(echo "$METRICS_RESPONSE" | tail -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Metrics endpoint responding (200 OK)"
else
    echo "❌ Metrics endpoint failed (HTTP $HTTP_CODE)"
    kill $PORT_FORWARD_PID 2>/dev/null
    exit 1
fi

# Kill port forward
kill $PORT_FORWARD_PID 2>/dev/null
```

**✅ Expected Result**: HTTP 200 with Prometheus-formatted metrics

### 2.2 Validate احسان Metrics

```bash
# Port forward again
kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 >/dev/null 2>&1 &
PORT_FORWARD_PID=$!
sleep 3

echo "=== احسان Metrics Validation ==="

# Check احسان score metric
AHSAN_SCORE=$(curl -s http://localhost:9464/metrics | grep "^ahsan_score" | awk '{print $2}')
echo "احسان Score: $AHSAN_SCORE"

if [ -z "$AHSAN_SCORE" ]; then
    echo "❌ احسان score metric not found"
    kill $PORT_FORWARD_PID 2>/dev/null
    exit 1
elif (( $(echo "$AHSAN_SCORE < 95" | bc -l) )); then
    echo "⚠️  احسان score $AHSAN_SCORE is below threshold 95"
else
    echo "✅ احسान score verified: $AHSAN_SCORE/100"
fi

# Check for other احسان metrics
echo ""
echo "=== All احسان Metrics ==="
curl -s http://localhost:9464/metrics | grep "^ahsan"

# Expected metrics:
# ahsan_score <value>
# ahsan_violations_total <value>
# (Add more احسان-specific metrics as needed)

kill $PORT_FORWARD_PID 2>/dev/null
```

**✅ Expected Result**: احسان score ≥95%, all احسān metrics present

### 2.3 Validate Core Hive Metrics

```bash
kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 >/dev/null 2>&1 &
PORT_FORWARD_PID=$!
sleep 3

echo "=== Core Hive Metrics Validation ==="

# Check critical metrics
METRICS_TO_CHECK=(
    "hive_up"
    "hive_operations_total"
    "hive_operation_duration_seconds_bucket"
    "hive_errors_total"
    "hive_memory_size_bytes"
    "hive_database_connection_errors"
)

for metric in "${METRICS_TO_CHECK[@]}"; do
    FOUND=$(curl -s http://localhost:9464/metrics | grep "^$metric" | head -1)
    if [ -n "$FOUND" ]; then
        echo "✅ $metric: Present"
    else
        echo "❌ $metric: Missing"
    fi
done

kill $PORT_FORWARD_PID 2>/dev/null
```

**✅ Expected Result**: All core metrics present

---

## 3. ServiceMonitor Validation

### 3.1 Deploy ServiceMonitor

```bash
# Apply monitoring stack (includes ServiceMonitor)
kubectl apply -f k8s/production/hpa-autoscaling.yaml

# Verify ServiceMonitor created
kubectl get servicemonitor -n bizra-testnet

# Expected output:
# NAME                 AGE
# bizra-apex-metrics   Xs
```

### 3.2 Verify ServiceMonitor Configuration

```bash
# Describe ServiceMonitor
kubectl describe servicemonitor bizra-apex-metrics -n bizra-testnet

# Check for:
# - Selector matching app: bizra-apex
# - Port: metrics (9464)
# - Interval: 15s
# - Path: /metrics
```

**✅ Expected**: ServiceMonitor selector matches application labels

### 3.3 Verify Prometheus is Scraping

```bash
# Port forward Prometheus
kubectl port-forward -n bizra-testnet svc/prometheus-kube-prometheus-prometheus 9090:9090 >/dev/null 2>&1 &
PROM_PID=$!
sleep 5

# Check Prometheus targets
echo "=== Checking Prometheus Targets ==="
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="bizra-apex") | {health: .health, lastScrape: .lastScrape, scrapeUrl: .scrapeUrl}'

# Expected: health: "up", recent lastScrape timestamp

kill $PROM_PID 2>/dev/null
```

**✅ Expected Result**: Target health "up", recent scrape timestamp

---

## 4. PrometheusRule Validation

### 4.1 Deploy PrometheusRule

```bash
# Apply monitoring stack (includes PrometheusRule with 26+ alert rules)
kubectl apply -f monitoring/advanced-monitoring-stack.yaml

# Verify PrometheusRule created
kubectl get prometheusrule -n bizra-testnet

# Expected output:
# NAME                 AGE
# bizra-apex-alerts    Xs
```

### 4.2 Verify Alert Rules Loaded

```bash
# Describe PrometheusRule
kubectl describe prometheusrule bizra-apex-alerts -n bizra-testnet | head -50

# Expected: 4 alert groups:
# - ahsan_compliance_critical (3 rules)
# - performance_warnings (4 rules)
# - predictive_alerts (3 rules)
# - anomaly_detection (3 rules)
```

### 4.3 Check Prometheus Rules API

```bash
# Port forward Prometheus
kubectl port-forward -n bizra-testnet svc/prometheus-kube-prometheus-prometheus 9090:9090 >/dev/null 2>&1 &
PROM_PID=$!
sleep 5

echo "=== Checking Alert Rules in Prometheus ==="
curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[] | select(.name | contains("ahsan")) | {name: .name, rules: [.rules[].name]}'

# Expected: احسان-related alert rules present:
# - AhsanComplianceViolation
# - AhsanScoreTrendingDown
# - AhsanCompliancePredictedViolation
# - AhsanScoreAnomaly

kill $PROM_PID 2>/dev/null
```

**✅ Expected Result**: All 26+ alert rules loaded and active

---

## 5. احسان Alert Validation

### 5.1 Critical Alerts (P0)

```bash
kubectl port-forward -n bizra-testnet svc/prometheus-kube-prometheus-prometheus 9090:9090 >/dev/null 2>&1 &
PROM_PID=$!
sleep 5

echo "=== Critical احسān Alerts Status ==="

# Check AhsanComplianceViolation alert
curl -s 'http://localhost:9090/api/v1/query?query=ALERTS{alertname="AhsanComplianceViolation"}' | jq '.data.result'

# Expected if احسان score ≥95%: Empty array [] (alert NOT firing)
# If احسان score <95%: Array with alert details (alert FIRING)

kill $PROM_PID 2>/dev/null
```

**✅ Expected Result (Healthy System)**: Alert NOT firing (empty result)

### 5.2 Predictive Alerts (P2)

```bash
kubectl port-forward -n bizra-testnet svc/prometheus-kube-prometheus-prometheus 9090:9090 >/dev/null 2>&1 &
PROM_PID=$!
sleep 5

echo "=== Predictive احسان Alert Status ==="

# Query predictive alert
curl -s 'http://localhost:9090/api/v1/query?query=predict_linear(ahsan_score[30m],3600)' | jq '.data.result[0].value'

# Expected: Predicted احسان score 1 hour ahead
# If predicted value <95, AhsanCompliancePredictedViolation should fire

kill $PROM_PID 2>/dev/null
```

**✅ Expected Result**: Predictive query returns value, alert fires proactively if trend negative

### 5.3 Anomaly Detection Alerts

```bash
kubectl port-forward -n bizra-testnet svc/prometheus-kube-prometheus-prometheus 9090:9090 >/dev/null 2>&1 &
PROM_PID=$!
sleep 5

echo "=== احسان Anomaly Detection Status ==="

# Query anomaly detection (deviation from 1-hour average)
curl -s 'http://localhost:9090/api/v1/query?query=abs(ahsan_score-avg_over_time(ahsan_score[1h]))' | jq '.data.result[0].value'

# Expected: Small deviation (<5) indicates stable احسان score
# Large deviation (>5) triggers AhsanScoreAnomaly alert

kill $PROM_PID 2>/dev/null
```

**✅ Expected Result**: Small deviation from average (stable system)

---

## 6. Grafana Dashboard Validation

### 6.1 Access Grafana UI

```bash
# Port forward Grafana
kubectl port-forward -n bizra-testnet svc/prometheus-grafana 3000:80 &
GRAFANA_PID=$!

echo ""
echo "=== Grafana Access ==="
echo "URL: http://localhost:3000"
echo "Username: admin"
echo "Password: prom-operator (default)"
echo ""
echo "Press Ctrl+C to stop port forward when done"

# Keep running until user stops
wait $GRAFANA_PID
```

### 6.2 Verify Dashboard Import

**Manual Steps**:

1. Open http://localhost:3000
2. Login with admin/prom-operator
3. Navigate to: Dashboards → Browse
4. Search for: "BIZRA Advanced Monitoring"
5. Open dashboard

**Expected Dashboard UID**: `bizra-advanced-monitoring`

### 6.3 Dashboard Panel Validation

**Expected Panels**:

| Panel                              | Query                                                                                                                                             | Expected Visualization                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| احسان Score with Anomaly Detection | `ahsan_score`, `avg_over_time(ahsan_score[1h])`, `predict_linear(ahsan_score[30m],3600)`                                                          | Graph with current, average, predicted, and threshold line (95) |
| Performance Metrics                | `histogram_quantile(0.99,rate(hive_operation_duration_seconds_bucket[5m]))`, `rate(hive_operations_total[5m])`, `rate(hive_errors_total[5m])*100` | Multi-series graph                                              |
| Latency Distribution Heatmap       | `sum(rate(hive_operation_duration_seconds_bucket[5m])) by (le)`                                                                                   | Heatmap showing latency distribution over time                  |
| System Health Score                | `(ahsan_score*0.4)+((1-rate(hive_errors_total[5m]))*100*0.3)+((rate(hive_operations_total[5m])/1500)*100*0.3)`                                    | Single stat with thresholds                                     |
| Resource Utilization               | `(hive_memory_size_bytes/(4*1024*1024*1024))*100`                                                                                                 | Gauge showing % of 4GB                                          |
| Active Alerts                      | `ALERTS{alertstate="firing",namespace="bizra-testnet"}`                                                                                           | Stat panel showing count                                        |

**Validation Steps**:

```bash
# For each panel, verify:
□ Panel displays data (not "No data")
□ احسان score visible and ≥95%
□ Thresholds configured (green ≥95, orange 85-95, red <85)
□ Time series showing recent data
□ Units configured correctly (percent, seconds, etc.)
```

---

## 7. HPA Monitoring Validation

### 7.1 Deploy احسان-Aware HPA

```bash
# Apply HPA configuration
kubectl apply -f k8s/production/hpa-autoscaling.yaml

# Verify HPA created
kubectl get hpa -n bizra-testnet

# Expected output:
# NAME              REFERENCE               TARGETS                      MINPODS   MAXPODS   REPLICAS   AGE
# bizra-apex-hpa    Deployment/bizra-apex   <unknown>/70%, <unknown>/80%    3         20        3          Xs
```

### 7.2 Wait for Metrics Availability

```bash
# HPA metrics may take 1-2 minutes to populate
echo "Waiting for HPA metrics to populate (60s)..."
sleep 60

# Check HPA status again
kubectl get hpa bizra-apex-hpa -n bizra-testnet

# Expected:
# TARGETS showing actual values: 25%/70%, 30%/80%, etc.
```

### 7.3 Verify Multi-Dimensional Scaling

```bash
# Describe HPA to see all metrics
kubectl describe hpa bizra-apex-hpa -n bizra-testnet

# Expected metrics:
# - Resource cpu (target: 70%)
# - Resource memory (target: 80%)
# - Pods metric http_requests_per_second (target: 1000)
# - Pods metric http_request_duration_p99_seconds (target: 0.1)
# - Pods metric ahsan_score_inverted (target: 5)

# Check for scaling events
kubectl get events -n bizra-testnet --sort-by='.lastTimestamp' | grep HorizontalPodAutoscaler
```

**✅ Expected Result**: All 5 metrics available, HPA responding to load

### 7.4 Test احسان-Aware Scaling

**Simulate احسان Score Drop** (Testing Only - Do NOT run in production):

```bash
# This would normally happen due to actual احسان violations
# For testing, we can verify the HPA configuration responds to احسان metrics

# Check current احسان score
kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 >/dev/null 2>&1 &
PORT_FORWARD_PID=$!
sleep 3

CURRENT_AHSAN=$(curl -s http://localhost:9464/metrics | grep "^ahsan_score" | awk '{print $2}')
AHSAN_INVERTED=$(echo "100 - $CURRENT_AHSAN" | bc)

echo "Current احسان Score: $CURRENT_AHSAN"
echo "احسان Inverted Metric: $AHSAN_INVERTED (target: <5 to not scale)"

# If احسان score drops below 95 (inverted >5), HPA should scale up automatically

kill $PORT_FORWARD_PID 2>/dev/null
```

**✅ Expected Behavior**: If احسān score drops below 95%, HPA scales up pods to distribute load and recover compliance

---

## 8. Custom Prometheus Adapter Validation (احسان Metrics)

### 8.1 Verify Prometheus Adapter Deployed

```bash
# Check if Prometheus Adapter is running
kubectl get pods -n bizra-testnet -l app=prometheus-adapter

# If not deployed with kube-prometheus-stack, deploy separately:
# (Usually included, but can be deployed standalone if needed)
```

### 8.2 Verify Custom Metrics API

```bash
# Check custom metrics API available
kubectl get apiservices | grep custom.metrics

# Expected output:
# v1beta1.custom.metrics.k8s.io   Local   True   Xh

# List all custom metrics
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1 | jq '.resources[] | .name' | sort

# Expected احسان-related metrics:
# "ahsan_score_inverted"
# "http_requests_per_second"
# "http_request_duration_p99_seconds"
```

### 8.3 Query احسان Inverted Metric

```bash
# Query احsān inverted metric via custom metrics API
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/bizra-testnet/pods/*/ahsan_score_inverted" | jq .

# Expected output:
# {
#   "kind": "MetricValueList",
#   "items": [
#     {
#       "describedObject": {...},
#       "metricName": "ahsan_score_inverted",
#       "value": "<5"  # If احسān score ≥95%
#     }
#   ]
# }
```

**✅ Expected Result**: احسان inverted metric <5 (indicating احsān score ≥95%)

---

## 9. End-to-End Monitoring Validation

### 9.1 Generate Test Load

```bash
# Quick load test (1 minute)
k6 run --vus 50 --duration 60s tests/performance/stress-test-24h.js

# This will:
# - Generate 50 concurrent users for 1 minute
# - Exercise all application endpoints
# - Validate احسان score throughout
# - Test metrics collection
```

### 9.2 Observe Metrics During Load

**In separate terminal windows**:

```bash
# Terminal 1: Watch احسان score
watch -n 2 'kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 >/dev/null 2>&1 & sleep 2; curl -s http://localhost:9464/metrics | grep ahsan_score; pkill -f "port-forward"'

# Terminal 2: Watch HPA scaling
watch -n 5 'kubectl get hpa bizra-apex-hpa -n bizra-testnet'

# Terminal 3: Watch pod count
watch -n 5 'kubectl get pods -n bizra-testnet -l app=bizra-apex'

# Terminal 4: Monitor Prometheus alerts
# Access http://localhost:9090/alerts (after port-forward)
```

### 9.3 Verify Monitoring Response

**During load test, verify**:

```bash
□ احسان score remains ≥95%
□ Metrics updating in real-time
□ HPA considers scaling (if load high enough)
□ Grafana dashboards showing live data
□ No critical (P0) alerts firing
□ Latency within thresholds (P99 <500ms)
□ Error rate <1%
```

---

## 10. Monitoring Validation Checklist

### 10.1 Metrics Collection ✅

```bash
□ Metrics endpoint accessible (http://localhost:9464/metrics)
□ احسان score metric present and ≥95%
□ All core hive metrics present (hive_up, hive_operations_total, etc.)
□ Prometheus scraping successfully (target health: up)
□ ServiceMonitor configured correctly
□ Metrics updating in real-time
```

### 10.2 Alerting ✅

```bash
□ PrometheusRule deployed with 26+ alert rules
□ All alert rules loaded in Prometheus
□ Critical احسان alert (AhsanComplianceViolation) configured
□ Predictive احسان alert (AhsanCompliancePredictedViolation) working
□ Anomaly detection alert (AhsanScoreAnomaly) configured
□ Alert routing configured (if using Alertmanager)
□ Test alerts firing correctly when thresholds breached
```

### 10.3 Dashboards ✅

```bash
□ Grafana accessible (http://localhost:3000)
□ BIZRA Advanced Monitoring dashboard imported
□ احسان score panel showing data with predictions
□ Performance metrics panel showing P99, throughput, error rate
□ Latency heatmap displaying distribution
□ System health score calculated correctly
□ Resource utilization gauge showing % of limits
□ Active alerts panel showing firing alerts
```

### 10.4 HPA Monitoring ✅

```bash
□ HPA deployed with 5 dimensional metrics
□ CPU and memory metrics available
□ Custom metrics (RPS, P99 latency) available via Prometheus Adapter
□ احسان inverted metric available for scaling
□ HPA responding to load (scaling events visible)
□ احسان-aware scaling tested (scales up when احسان <95%)
```

### 10.5 End-to-End ✅

```bash
□ Load test executed successfully
□ Metrics collected throughout load test
□ احsān score maintained ≥95% under load
□ HPA scaled appropriately during load
□ Dashboards updated in real-time
□ No critical alerts fired inappropriately
□ Performance thresholds met (P99 <500ms, error <1%)
```

---

## 11. Monitoring Health Report

**Generate after validation**:

```bash
cat << 'EOF' > MONITORING-HEALTH-REPORT.txt
# BIZRA NODE-0 Monitoring Health Report
Generated: $(date)

## Metrics Collection
- Prometheus: [✅ OPERATIONAL / ❌ FAILED]
- ServiceMonitor: [✅ CONFIGURED / ❌ NOT CONFIGURED]
- احsān Metrics: [✅ AVAILABLE / ❌ MISSING]
- Scrape Health: [✅ UP / ❌ DOWN]

## Alerting
- PrometheusRule: [✅ DEPLOYED / ❌ NOT DEPLOYED]
- Alert Rules Loaded: [26+ / <26]
- احسان Alerts: [✅ CONFIGURED / ❌ MISSING]
- Critical Alerts: [✅ NOT FIRING / ⚠️ FIRING / ❌ MISSING]

## Dashboards
- Grafana: [✅ ACCESSIBLE / ❌ INACCESSIBLE]
- BIZRA Dashboard: [✅ IMPORTED / ❌ NOT IMPORTED]
- احسان Panel: [✅ DATA VISIBLE / ❌ NO DATA]
- Health Score: [XX/100]

## HPA Monitoring
- HPA Status: [✅ ACTIVE / ❌ INACTIVE]
- Metrics Available: [5/5 / X/5]
- احسان-Aware Scaling: [✅ CONFIGURED / ❌ NOT CONFIGURED]
- Scaling Events: [X events in last 1h]

## Current احسان Status
- احسان Score: [XX.X/100]
- Compliance: [✅ ≥95% / ⚠️ 85-95% / ❌ <85%]
- Violations (24h): [X]
- Trend: [↑ Improving / → Stable / ↓ Declining]

## Overall Monitoring Health
[✅ EXCELLENT / ⚠️ NEEDS ATTENTION / ❌ CRITICAL ISSUES]

---
End of Report
EOF

echo "Monitoring health report generated: MONITORING-HEALTH-REPORT.txt"
```

---

## 12. Continuous Monitoring Best Practices

### 12.1 Daily احسان Checks

```bash
# Add to cron or scheduler
# Daily احسان compliance check (8 AM)
0 8 * * * kubectl port-forward -n bizra-testnet svc/bizra-apex 9464:9464 & sleep 5; curl -s http://localhost:9464/metrics | grep ahsan_score >> /var/log/bizra/daily-ahsan-check.log; pkill -f "port-forward"
```

### 12.2 Weekly Monitoring Health Audit

```bash
# Weekly monitoring health check (Monday 9 AM)
0 9 * * 1 /path/to/BIZRA-NODE0/scripts/weekly-monitoring-audit.sh
```

### 12.3 احسان Violation Response

**If احسان score drops below 95%**:

1. Immediate notification to team
2. Check PRODUCTION-OPERATIONS-RUNBOOK.md Section 5.1
3. Investigate root cause within 5 minutes (RTO)
4. Implement mitigation (rollback if necessary)
5. Document incident and root cause
6. Update احsān Ground Truth Database if needed

---

## احسان Compliance Declaration

**By completing this monitoring validation, I affirm:**

> All monitoring systems have been validated with احسان (excellence).
> احsān metrics are collecting accurately and alerting appropriately.
> The monitoring stack meets professional elite practitioner standards.
> I have not made assumptions about monitoring functionality without verification.
> I am prepared to respond to احسān violations with documented procedures.

**Validated By**: ************\_\_\_************
**Date**: ************\_\_\_************
**احسान Compliance Status**: [✅ ≥95% / ⚠️ <95%]

---

**End of Monitoring Validation Procedures**

**Next Steps**:

1. ✅ Complete all validation checklist items
2. ✅ Generate monitoring health report
3. ✅ Configure daily/weekly monitoring checks
4. ✅ Train team on Grafana dashboards
5. ✅ Test alert notification channels
6. ✅ Document any custom monitoring additions

**Status**: Elite Monitoring Stack Validated ✅
