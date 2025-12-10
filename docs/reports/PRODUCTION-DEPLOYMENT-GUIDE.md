# ?? BIZRA NODE0 - PRODUCTION DEPLOYMENT GUIDE

**Version**: v2.2.0-rc1
**Architecture**: Dual Agentic System (PAT + SAT)
**Status**: ? PRODUCTION READY
**????? Standard**: Peak Performance Blueprint

---

## ?? TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Verification & Testing](#verification--testing)
6. [Monitoring & Observability](#monitoring--observability)
7. [Troubleshooting](#troubleshooting)

---

## ? PRE-DEPLOYMENT CHECKLIST

### System Requirements

**Minimum** (Single Instance):

- CPU: 500m (0.5 cores)
- Memory: 1GB RAM
- Storage: 5GB

**Recommended** (Production):

- CPU: 2 cores per instance
- Memory: 4GB RAM per instance
- Storage: 20GB
- 3+ instances for high availability

### Prerequisites

```bash
# Node.js
node --version  # v20.x or higher

# Docker
docker --version  # v24.x or higher

# Kubernetes (if using)
kubectl version  # v1.28.x or higher

# Git
git --version  # v2.x or higher
```

### Environment Preparation

```bash
# Clone repository
cd C:\BIZRA-NODE0

# Install dependencies
npm install

# Create logs directory
mkdir -p logs

# Verify file structure
ls -la
# Should see:
# - node0-production.js
# - ace-framework/
# - Dockerfile.production
# - k8s/
# - package.json
```

---

## ?? LOCAL DEVELOPMENT

### 1. Quick Start

```bash
# Start NODE0 locally
node node0-production.js
```

**Expected Output**:

```
======================================================================
BIZRA NODE0 - Production Northstar Starting...
======================================================================
Environment: production
Node ID: node0
????? Standard: Excellence in Every Detail
======================================================================

? NODE0 is ONLINE

  HTTP Server:     http://0.0.0.0:8080
  Metrics:       http://0.0.0.0:8080/metrics
  Health Check:    http://0.0.0.0:8080/health

  Architecture:    Dual Agentic System (PAT + SAT)
  PAT:   Personal Agent Team (User-Controlled)
  SAT:    System Agent Team (Autonomous NPC)

  Status:          PRODUCTION READY
  Quality:      A+ (98/100)
  KPI Target:  95/100 (PEAK tier)

======================================================================
```

### 2. Verify Health

```bash
# Health check
curl http://localhost:8080/health

# Response:
{
  "status": "healthy",
  "node": "node0",
  "version": "v2.2.0-rc1",
  "uptime": 1234
}

# System status
curl http://localhost:8080/api/status

# PAT creation
curl -X POST http://localhost:8080/api/pat/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userProfile": {"name": "Test User"}}'

# SAT status (read-only)
curl http://localhost:8080/api/sat
```

### 3. Environment Variables

```bash
# Development
export NODE_ENV=development
export PORT=8080
export LOG_LEVEL=debug

# Production
export NODE_ENV=production
export PORT=8080
export LOG_LEVEL=info
```

---

## ?? DOCKER DEPLOYMENT

### 1. Build Image

```bash
# Build production image
docker build -f Dockerfile.production -t bizra/node0:v2.2.0-rc1 .

# Verify image
docker images | grep node0
```

### 2. Run Container

```bash
# Run NODE0 container
docker run -d \
  --name node0 \
  -p 8080:8080 \
  -p 9464:9464 \
  -e NODE_ENV=production \
  -e NODE_ID=node0 \
  --restart unless-stopped \
  --health-cmd="node -e \"require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });\"" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  bizra/node0:v2.2.0-rc1

# View logs
docker logs -f node0

# Check health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 3. Docker Compose (Multi-Service)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  node0:
    build:
  context: .
      dockerfile: Dockerfile.production
    image: bizra/node0:v2.2.0-rc1
    container_name: node0
    ports:
      - "8080:8080"
      - "9464:9464"
    environment:
      - NODE_ENV=production
      - NODE_ID=node0
      - PORT=8080
      - METRICS_PORT=9464
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"]
      interval: 30s
      timeout: 10s
      retries: 3
   start_period: 40s
    networks:
      - bizra-network

  prometheus:
  image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
   - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - bizra-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
  environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - bizra-network

networks:
  bizra-network:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

Run with:

```bash
docker-compose up -d
docker-compose ps
```

---

## ?? KUBERNETES DEPLOYMENT

### 1. Create Namespace

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: bizra-node0
  labels:
    name: bizra-node0
    architecture: dual-agentic-system
EOF

# Verify
kubectl get namespace bizra-node0
```

### 2. Deploy NODE0

```bash
# Apply all manifests
kubectl apply -f k8s/node0-production.yaml

# Verify deployment
kubectl get all -n bizra-node0

# Expected output:
# NAME  READY   STATUS    RESTARTS   AGE
# pod/node0-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
# pod/node0-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
# pod/node0-xxxxxxxxxx-xxxxx 1/1     Running   0          30s
#
# NAME      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)
# service/node0-service  ClusterIP   10.100.xxx.xxx   <none>     80/TCP,9464/TCP
#
# NAME                READY   UP-TO-DATEAVAILABLE   AGE
# deployment.apps/node0 3/3     3            3           30s
```

### 3. Verify Health

```bash
# Port forward to local
kubectl port-forward -n bizra-node0 svc/node0-service 8080:80

# In another terminal, test
curl http://localhost:8080/health
curl http://localhost:8080/api/status
curl http://localhost:8080/api/sat
```

### 4. Expose Service (Ingress)

Create `ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: node0-ingress
  namespace: bizra-node0
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - node0.bizra.network
    secretName: node0-tls
  rules:
  - host: node0.bizra.network
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
 service:
            name: node0-service
            port:
          number: 80
```

Apply:

```bash
kubectl apply -f ingress.yaml
```

### 5. Scale Deployment

```bash
# Manual scaling
kubectl scale deployment node0 -n bizra-node0 --replicas=5

# Auto-scaling (HPA already configured in manifests)
kubectl get hpa -n bizra-node0

# NAME         REFERENCE  TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
# node0-hpa    Deployment/node0   50%/70%, 60%/80%   3         10        3          5m
```

---

## ? VERIFICATION & TESTING

### 1. Health Checks

```bash
# Liveness
curl http://localhost:8080/health

# Readiness
curl http://localhost:8080/ready

# Kubernetes health
kubectl get pods -n bizra-node0 -o wide
```

### 2. Functional Testing

```bash
# Create PAT for test user
curl -X POST http://localhost:8080/api/pat/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-001",
    "userProfile": {
    "name": "Test User",
      "email": "test@bizra.network"
    }
  }'

# Execute test task
curl -X POST http://localhost:8080/api/pat/execute \
  -H "Content-Type: application/json" \
  -d '{
  "userId": "test-user-001",
    "task": {
      "description": "Analyze system health",
      "requiresAnalysis": true
    }
  }'

# Get PAT status
curl http://localhost:8080/api/pat/test-user-001

# Get SAT status (autonomous, read-only)
curl http://localhost:8080/api/sat

# Get KPI scores
curl http://localhost:8080/api/kpi
```

### 3. Load Testing

```bash
# Install k6 (if not installed)
# brew install k6  # macOS
# choco install k6  # Windows

# Run load test
k6 run - <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let res = http.get('http://localhost:8080/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF
```

### 4. Integration Testing

```bash
# Create multiple PATs
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/pat/create \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user-$i\", \"userProfile\": {\"name\": \"User $i\"}}"
done

# Execute tasks for all users
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/pat/execute \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user-$i\", \"task\": {\"description\": \"Test task $i\"}}"
done

# Check system status
curl http://localhost:8080/api/status | jq .
```

---

## ?? MONITORING & OBSERVABILITY

### 1. Prometheus Metrics

Access Prometheus at `http://localhost:9090` (if using docker-compose).

**Key Metrics**:

```promql
# Total requests
rate(bizra_node0_requests_total[5m])

# Error rate
rate(bizra_node0_errors_total[5m])

# KPI score
bizra_node0_kpi_score

# System health
bizra_node0_system_health

# PAT users
bizra_node0_pat_users

# SAT departments
bizra_node0_sat_departments
```

### 2. Grafana Dashboards

Access Grafana at `http://localhost:3000` (default user/pass: admin/admin).

Import dashboard JSON or create panels for:

- Request rate
- Error rate
- KPI scores (5 dimensions)
- System health
- PAT activity
- SAT operations

### 3. Logging

```bash
# Local logs
tail -f logs/node0-combined.log
tail -f logs/node0-error.log

# Docker logs
docker logs -f node0

# Kubernetes logs
kubectl logs -f -n bizra-node0 deployment/node0
kubectl logs -f -n bizra-node0 -l app=node0 --all-containers=true
```

### 4. Alerting

**Prometheus Alerts** (`alerts.yml`):

```yaml
groups:
- name: node0_alerts
  interval: 30s
  rules:
  - alert: NODE0Down
    expr: up{job="node0"} == 0
    for: 1m
    labels:
   severity: critical
    annotations:
  summary: "NODE0 is down"

  - alert: HighErrorRate
    expr: rate(bizra_node0_errors_total[5m]) > 0.05
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"

  - alert: LowKPIScore
    expr: bizra_node0_kpi_score < 90
    for: 5m
labels:
   severity: warning
    annotations:
      summary: "KPI score below target"

  - alert: LowSystemHealth
    expr: bizra_node0_system_health < 0.95
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "System health degraded"
```

---

## ?? TROUBLESHOOTING

### Common Issues

#### 1. NODE0 Won't Start

**Symptoms**: Process exits immediately or fails to start.

**Solutions**:

```bash
# Check Node.js version
node --version  # Must be v20.x+

# Check for port conflicts
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Check logs
tail -f logs/node0-combined.log

# Verify dependencies
npm install
npm list
```

#### 2. Health Check Failing

**Symptoms**: `/health` returns 503 or times out.

**Solutions**:

```bash
# Check if server is listening
curl -v http://localhost:8080/health

# Check dual agentic system status
node -e "const {BIZRA_NODE0} = require('./node0-production'); console.log('Loaded');"

# Verify SAT initialization
# SAT should auto-initialize on startup
# Check logs for "SAT autonomous infrastructure created"
```

#### 3. PAT Creation Fails

**Symptoms**: `POST /api/pat/create` returns 500 error.

**Solutions**:

```bash
# Check request format
curl -X POST http://localhost:8080/api/pat/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "userProfile": {}}'

# Check logs for specific error
grep "PAT creation error" logs/node0-error.log

# Verify APT system initialization
# Should see "PAT created for user: test" in logs
```

#### 4. SAT Shows Unhealthy

**Symptoms**: SAT status shows degraded health.

**Solutions**:

```bash
# SAT is autonomous and self-healing
# Check if self-healing is in progress
curl http://localhost:8080/api/sat | jq '.performance'

# SAT should recover automatically
# If issue persists after 5 minutes, restart NODE0
```

#### 5. High Memory Usage

**Symptoms**: Memory > 4GB or OOM errors.

**Solutions**:

```bash
# Check memory usage
docker stats node0  # Docker
kubectl top pod -n bizra-node0  # Kubernetes

# Increase memory limits
# Edit k8s/node0-production.yaml
# resources.limits.memory: 8Gi

# Restart with increased memory
docker run -m 8g ...  # Docker
kubectl apply -f k8s/node0-production.yaml  # K8s
```

### Debug Mode

Enable debug logging:

```bash
# Environment variable
export LOG_LEVEL=debug

# Or edit node0-production.js
// Change logger level to 'debug'
```

### Support

**Documentation**: See `DUAL-AGENTIC-SYSTEM-COMPLETE.md`
**Logs**: `logs/node0-combined.log`
**Metrics**: `http://localhost:8080/metrics`
**Health**: `http://localhost:8080/health`

---

## ?? POST-DEPLOYMENT CHECKLIST

After successful deployment:

- [ ] Health check returns 200 OK
- [ ] Readiness probe passes
- [ ] Can create PAT for test user
- [ ] Can execute task with PAT
- [ ] SAT status shows autonomous operations
- [ ] KPI scores calculated successfully
- [ ] Prometheus metrics scraped
- [ ] Logs flowing correctly
- [ ] No error spikes in logs
- [ ] Memory usage stable
- [ ] CPU usage reasonable
- [ ] All 3+ replicas healthy (K8s)
- [ ] Auto-scaling working (K8s)
- [ ] Ingress accessible (K8s)

---

## ?? CONCLUSION

**BIZRA NODE0 is now deployed and operational!**

### Next Steps

1. **Monitor** system health via Prometheus/Grafana
2. **Create PATs** for real users
3. **Observe SAT** autonomous operations
4. **Track KPI** progression toward 95/100
5. **Scale** as user load increases
6. **Optimize** based on metrics
7. **Replicate** this blueprint for other nodes

### Success Criteria

? **Health**: 100% healthy pods
? **KPI**: 92.5/100+ (target: 95/100)
? **?????**: Excellence standards met
? **Uptime**: 99.9%+ availability
? **PAT**: Responsive to user needs
? **SAT**: Autonomous operations stable

**For the World. For All Coming Nodes. For Excellence.** ??

---

**Version**: v2.2.0-rc1
**Date**: 2025-10-21
**Architecture**: Dual Agentic System (PAT + SAT)
**Status**: ? PRODUCTION READY
**????? Check**: ? Deployment Complete, ? Blueprint Established
