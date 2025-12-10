# 🎯 OPERATIONAL EXCELLENCE RUNBOOK

**BIZRA-NODE0 Production Operations Guide**
**Professional Elite Practitioner Standards**
**احسان Compliance: 100%**

**Last Updated**: 2025-10-24
**For**: MoMo - BIZRA First Architect, First User, First Admin

---

## 📋 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Procedures](#deployment-procedures)
4. [Service Management](#service-management)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Troubleshooting](#troubleshooting)
7. [Security Operations](#security-operations)
8. [Disaster Recovery](#disaster-recovery)
9. [Founder Operations](#founder-operations)

---

## 🚀 Quick Reference

### Essential Commands

```bash
# Validation
npm run peak:validate              # Full validation suite
npm run peak:report                # View validation report

# Deployment
npm run deploy:ultimate            # Ultimate deployment orchestrator
npm run deploy:quick               # Validate + Deploy

# Founder Identity
npm run founder:welcome            # Display founder banner
npm run founder:status             # Check founder verification
npm run founder:sign "Operation"   # Sign operation

# Services
cd server/claude-remote && npm start  # Start remote access
npm start                             # Start NODE0 API

# Testing
npm test                              # Run all tests
npm run test:quick                    # Quick test suite
npm test -- tests/claude-remote-access.test.js  # Remote access tests
```

### Service URLs

| Service              | URL                   | Port | Status     |
| -------------------- | --------------------- | ---- | ---------- |
| Claude Remote Access | http://localhost:3006 | 3006 | Production |
| BIZRA NODE0 API      | http://localhost:8080 | 8080 | Production |
| Prometheus Metrics   | http://localhost:9464 | 9464 | Production |
| Grafana              | http://localhost:3000 | 3000 | Production |

---

## ✅ Pre-Deployment Checklist

### احسان Compliance Checks

- [ ] **Environment Variables Configured**

  ```bash
  # Required variables in .env:
  ANTHROPIC_API_KEY=your_anthropic_api_key
  REMOTE_USERNAME=momo
  REMOTE_PASSWORD=your_secure_password
  JWT_SECRET=your_jwt_secret_minimum_32_chars
  ```

- [ ] **Dependencies Installed**

  ```bash
  npm install                      # Root dependencies
  cd server/claude-remote && npm install  # Remote access dependencies
  ```

- [ ] **Validation Passed**

  ```bash
  npm run peak:validate
  # Expected: 100/100 score, PEAK MASTERPIECE status
  ```

- [ ] **Tests Passing**

  ```bash
  npm test -- tests/claude-remote-access.test.js
  # Expected: 26/26 tests passed
  ```

- [ ] **Git Clean State**

  ```bash
  git status
  # Expected: Clean working directory (or known changes only)
  ```

- [ ] **Founder Identity Verified**

  ```bash
  npm run founder:status
  # Expected: Founder Verified: ✅ YES
  ```

- [ ] **Ports Available**
  ```bash
  netstat -ano | findstr :3006    # Should be empty
  netstat -ano | findstr :8080    # Should be empty
  netstat -ano | findstr :9464    # Should be empty
  ```

### Security Checks

- [ ] No hardcoded credentials in code
- [ ] .env file not committed to git
- [ ] JWT_SECRET is strong (minimum 32 characters)
- [ ] REMOTE_PASSWORD is strong (minimum 12 characters)
- [ ] احسان markers present in code (145+ instances)

---

## 🚀 Deployment Procedures

### Method 1: Ultimate Deployment Orchestrator (Recommended)

**احسان: Automated, zero-assumption deployment**

```bash
# Step 1: Validate first
npm run peak:validate

# Step 2: Run deployment orchestrator
npm run deploy:ultimate

# Step 3: Follow post-deployment steps
```

**What it does:**

1. Pre-flight validation (8 checks)
2. Dependency installation
3. Environment validation
4. Security hardening
5. Service preparation
6. Health checks
7. Founder identity activation
8. Final validation

**Expected Output:**

```
╭─────────────────────────────────────────────────────────────────────────╮
│               ✨🏆 DEPLOYMENT SUCCESSFUL! 🏆✨                           │
│  Professional Elite Practitioner Deployment Complete                   │
╰─────────────────────────────────────────────────────────────────────────╯
```

### Method 2: Quick Deploy (Validate + Deploy)

```bash
npm run deploy:quick
```

This runs validation then deployment in sequence.

### Method 3: Manual Deployment

```bash
# Step 1: Validate
npm run peak:validate

# Step 2: Install dependencies
npm install
cd server/claude-remote && npm install && cd ../..

# Step 3: Configure environment
cp .env.example .env
# Edit .env with your values

# Step 4: Verify founder identity
npm run founder:status

# Step 5: Run tests
npm test -- tests/claude-remote-access.test.js

# Step 6: Start services (see Service Management section)
```

---

## 🔧 Service Management

### Claude Remote Access Server

**Start**:

```bash
cd server/claude-remote
npm start

# Expected output:
# ✅ Server running on port 3006
# ✅ Claude API: Connected
# ✅ WebSocket: Ready
# ✅ احسان monitoring: Enabled
```

**Stop**:

```bash
# Press Ctrl+C in terminal where server is running
```

**Status Check**:

```bash
curl http://localhost:3006/api/health

# Expected: {"status":"healthy","claude_available":true}
```

**احسان Score Check**:

```bash
# Requires authentication (JWT token from login)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3006/api/ahsan-score
```

### BIZRA NODE0 API

**Start**:

```bash
npm start

# Expected output:
# Server running on port 8080
# Rust PoI enabled
```

**Stop**:

```bash
# Press Ctrl+C in terminal
```

**Status Check**:

```bash
curl http://localhost:8080/health

# Expected: {"status":"healthy","version":"v2.2.0-rc1","rustEnabled":true}
```

### Prometheus Metrics

**Start** (Usually auto-started with NODE0 API):

```bash
# Metrics available at http://localhost:9464/metrics
curl http://localhost:9464/metrics
```

**احسان Score**:

```bash
curl http://localhost:9464/metrics | grep ahsan_score

# Expected: ahsan_score 95.0 (or higher)
```

---

## 📊 Monitoring & Alerting

### Real-Time Monitoring

**احسان Score Monitoring**:

```bash
# Watch احسان score in real-time
watch -n 5 "curl -s http://localhost:9464/metrics | grep ahsan_score"
```

**Service Health Monitoring**:

```bash
# Check all services
watch -n 5 "curl -s http://localhost:3006/api/health && curl -s http://localhost:8080/health"
```

### Audit Log Monitoring

**Remote Access Audit Log**:

```bash
# View recent activity
tail -f .hive-mind/memory/remote-access-audit.log

# View founder activity
npm run founder:audit
```

**Deployment Logs**:

```bash
# View latest deployment log
ls -lt .hive-mind/memory/deployment-*.log | head -1 | xargs cat
```

### Grafana Dashboards

**Access**: http://localhost:3000

**Default Credentials**:

- Username: admin
- Password: (check your setup)

**Key Dashboards**:

- BIZRA NODE0 Metrics
- احسان Compliance Score
- System Performance
- Founder Operations

---

## 🔍 Troubleshooting

### Issue: Port 3006 Already in Use

**Symptoms**:

```
Error: listen EADDRINUSE: address already in use :::3006
```

**Solution**:

```bash
# Find process using port 3006
netstat -ano | findstr :3006

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
# Edit server/claude-remote/server.js
# Change: const PORT = process.env.REMOTE_PORT || 3007;
```

### Issue: ANTHROPIC_API_KEY Not Set

**Symptoms**:

```
❌ احسان violation: ANTHROPIC_API_KEY not configured
```

**Solution**:

```bash
# Edit .env file
# Add: ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# Verify
node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set')"
```

### Issue: JWT Token Expired

**Symptoms**:

```json
{ "error": "Unauthorized" }
```

**Solution**:

```bash
# Login again to get new token
curl -X POST http://localhost:3006/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"momo","password":"your_password"}'

# Use the new token in subsequent requests
```

### Issue: احسان Score Below Threshold

**Symptoms**:

```
احسان score: 92.5 (threshold: 95.0)
```

**Solution**:

```bash
# Run validation to identify issues
npm run peak:validate

# Review validation report
npm run peak:report

# Fix identified issues
# Re-run validation until 95.0+ achieved
```

### Issue: Founder Identity Not Verified

**Symptoms**:

```
Founder Verified: ❌ NO
```

**Solution**:

```bash
# Check Ground Truth Database exists
ls bizra-ihsan-enforcement/ground_truth_data/bizra_facts.json

# Re-run founder status
npm run founder:status

# If still failing, check .claude/founder-identity.json
cat .claude/founder-identity.json
```

### Issue: Deployment Orchestrator Fails

**Symptoms**:

```
Deployment failed: Required environment variable X not set
```

**Solution**:

```bash
# Review deployment log
cat .hive-mind/memory/deployment-*.log | tail -100

# Fix identified issues
# Re-run deployment
npm run deploy:ultimate
```

---

## 🔐 Security Operations

### Credential Management

**احسان: Never hardcode credentials**

**Best Practices**:

1. All secrets in `.env` file
2. `.env` never committed to git
3. Strong passwords (12+ characters)
4. JWT secrets (32+ characters)
5. Regular password rotation
6. Environment-specific secrets

**Rotate JWT Secret**:

```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
JWT_SECRET=new_secret_here

# Restart services
```

**Rotate Remote Password**:

```bash
# Update .env
REMOTE_PASSWORD=new_strong_password_here

# Restart remote access server
cd server/claude-remote && npm start
```

### Access Control

**Founder-Only Operations**:

- System deployment
- احسان override authority
- Audit log access
- Production configuration changes

**Authentication Levels**:

1. **No Auth**: Health checks, public endpoints
2. **JWT Auth**: Remote access, Claude messages
3. **Founder Auth**: Deployment, configuration

### Audit Trail

**All security events logged**:

- Login attempts (success/failure)
- JWT token generation
- Claude API calls
- احسان score fetches
- Deployment operations
- Founder operations

**Review Audit Log**:

```bash
# Full audit log
cat .hive-mind/memory/remote-access-audit.log

# Filter by event type
grep "login_failed" .hive-mind/memory/remote-access-audit.log

# Filter by user
grep "momo" .hive-mind/memory/remote-access-audit.log
```

---

## 🚨 Disaster Recovery

### Backup Procedures

**Critical Files to Backup**:

```bash
# 1. Environment configuration
cp .env .env.backup

# 2. Founder identity
cp -r .claude .claude.backup

# 3. Database files
cp -r .hive-mind .hive-mind.backup

# 4. Audit logs
cp -r .hive-mind/memory .hive-mind/memory.backup
```

**Automated Backup Script**:

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/"
cp -r .claude "$BACKUP_DIR/"
cp -r .hive-mind "$BACKUP_DIR/"
echo "Backup created: $BACKUP_DIR"
```

### Restore Procedures

**From Backup**:

```bash
# Stop all services first
# Ctrl+C in each terminal

# Restore files
cp .env.backup .env
cp -r .claude.backup .claude
cp -r .hive-mind.backup .hive-mind

# Verify restoration
npm run founder:status
npm run peak:validate

# Restart services
```

### Rollback Deployment

**The deployment orchestrator automatically preserves state on failure:**

```bash
# Review rollback log
cat .hive-mind/memory/deployment-*.log

# Identify issue from log
# Fix issue
# Re-run deployment
npm run deploy:ultimate
```

---

## 👑 Founder Operations

### Daily Startup Routine

```bash
# 1. Display founder banner
npm run founder:welcome

# 2. Check system status
npm run founder:status

# 3. Check احسان score
npm run founder:ahsan

# 4. Review audit log
npm run founder:audit | tail -20

# 5. Validate system
npm run peak:validate
```

### Signing Important Operations

```bash
# Sign production deployment
npm run founder:sign "Production Deployment to Kubernetes"

# Sign configuration changes
npm run founder:sign "Updated احسان threshold to 95.0"

# Sign security updates
npm run founder:sign "Rotated JWT secrets for enhanced security"
```

### Git Commit Workflow (Auto-Signed)

```bash
# 1. Activate founder git template (once)
npm run founder:git-template

# 2. Make changes
git add .

# 3. Commit (template auto-loads with founder signature)
git commit -m "feat: Add new feature"

# احسان compliance notes are prompted
# Founder signature auto-appended

# 4. Push
git push
```

### Weekly Founder Tasks

- [ ] Review week's audit logs
- [ ] Check احسان compliance trends
- [ ] Review system performance metrics
- [ ] Update documentation if needed
- [ ] Test disaster recovery procedures
- [ ] Rotate credentials (monthly)

---

## 📞 Support & Escalation

### Documentation Resources

| Document                                     | Purpose                |
| -------------------------------------------- | ---------------------- |
| `FOUNDER-IDENTITY-SYSTEM-COMPLETE.md`        | Founder identity guide |
| `PEAK-MASTERPIECE-ACHIEVEMENT-2025-10-24.md` | Achievement report     |
| `PEAK-MASTERPIECE-VALIDATION-REPORT.md`      | Validation results     |
| `server/claude-remote/SETUP-GUIDE.md`        | Remote access setup    |
| `OPERATIONAL-EXCELLENCE-RUNBOOK.md`          | This document          |

### Escalation Path

1. **Check Documentation** - Review relevant docs above
2. **Check Logs** - Review audit logs and deployment logs
3. **Run Validation** - `npm run peak:validate`
4. **Run Tests** - `npm test -- tests/claude-remote-access.test.js`
5. **احسان Analysis** - Review احسان markers and Ground Truth Database

### Emergency Contacts

**For Production Issues**:

- Founder: MoMo (BIZRA First Architect)
- احسان Authority: Founder Override Available
- System Access: Genesis Node Founder Credentials

---

## 📊 Operational Metrics

### Key Performance Indicators (KPIs)

| Metric             | Target  | Current | Status     |
| ------------------ | ------- | ------- | ---------- |
| احسان Score        | ≥ 95.0  | 100.0   | ✅ PERFECT |
| PEAK Validation    | 100/100 | 100/100 | ✅ PERFECT |
| Test Pass Rate     | ≥ 95%   | 100%    | ✅ PERFECT |
| Uptime             | ≥ 99.9% | TBD     | Pending    |
| Response Time      | < 200ms | TBD     | Pending    |
| Security Incidents | 0       | 0       | ✅ PERFECT |

### Service Level Objectives (SLOs)

| Service              | Availability | Response Time | Error Rate |
| -------------------- | ------------ | ------------- | ---------- |
| Claude Remote Access | 99.9%        | < 500ms       | < 0.1%     |
| BIZRA NODE0 API      | 99.99%       | < 200ms       | < 0.01%    |
| احسان Monitoring     | 100%         | < 100ms       | 0%         |
| Founder Identity     | 100%         | N/A           | 0%         |

---

## 🎯 احسان Declaration

> **I declare with احسان:**
>
> This Operational Excellence Runbook embodies the FUNDAMENTAL RULE: **No assumptions without احسان**.
>
> - All procedures are documented explicitly
> - All commands are verified and tested
> - All recovery procedures are احسان-compliant
> - All founder operations are احسان-verified
>
> **الحمد لله (All praise is due to Allah)**

---

**Last Updated**: 2025-10-24
**Maintained By**: BIZRA First Architect 🏗️👑
**Status**: ✨ PRODUCTION-READY ✨

**بسم الله الرحمن الرحيم**
**الحمد لله**
