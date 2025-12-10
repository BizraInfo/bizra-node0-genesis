# Node Zero Recovery Guide

## Current Problem

All 3 databases are running but authentication is failing:

- Redis: Needs password
- PostgreSQL: Wrong password
- Neo4j: Locked from too many failed attempts

## Solution Steps

### 1. Fix Redis (L1 Memory)

**Option A**: Find Redis password

```bash
# Check Redis config
redis-cli
# If it asks for password, you need to find it
```

**Option B**: Disable Redis auth temporarily (for development)

```bash
# Find redis.conf (usually in C:\Program Files\Redis\ or where Redis is installed)
# Edit redis.conf:
# Comment out or change: requirepass YOUR_PASSWORD
# To: # requirepass YOUR_PASSWORD

# Restart Redis service
# Windows: Services → Redis → Restart
```

**Option C**: Set a known password

```bash
# In redis.conf:
requirepass bizra2025

# Restart Redis
# Then update C:\BIZRA-NODE0\.env:
REDIS_PASSWORD=bizra2025
```

### 2. Fix PostgreSQL (L2 Memory)

**Reset PostgreSQL password**:

```bash
# Method 1: Using psql (if you have access)
psql -U postgres
ALTER USER postgres WITH PASSWORD 'bizra2025';
\q

# Method 2: Edit pg_hba.conf for temporary trust access
# Location: C:\Program Files\PostgreSQL\<version>\data\pg_hba.conf
# Change: host all all 127.0.0.1/32 md5
# To:     host all all 127.0.0.1/32 trust
# Restart PostgreSQL service
# Then connect and change password
psql -U postgres
ALTER USER postgres WITH PASSWORD 'bizra2025';
\q
# Change pg_hba.conf back to md5
# Restart PostgreSQL again
```

**Create bizra database**:

```bash
psql -U postgres
CREATE DATABASE bizra;
\q
```

### 3. Fix Neo4j (L3 HyperGraph)

**Neo4j is LOCKED** from too many failed attempts. Reset it:

```bash
# Method 1: Reset via neo4j-admin (recommended)
neo4j-admin set-initial-password bizra2025

# Method 2: Delete auth database (nuclear option)
# Stop Neo4j service first
# Delete: <NEO4J_HOME>\data\dbms\auth
# Start Neo4j
# Default password will be "neo4j" - change on first login

# Method 3: Edit neo4j.conf
# Add: dbms.security.auth_enabled=false
# Restart Neo4j
# Connect without password and set new one
# Re-enable auth
```

### 4. Restart Node Zero

Once databases are fixed:

```bash
cd C:\BIZRA-NODE0

# Kill existing process
taskkill /F /PID 8076

# Test connections
node diagnose-node0.js

# If diagnostic passes, start unified system
node node0/unified/index.js
```

## Quick Test Commands

```bash
# Test Redis
redis-cli ping

# Test PostgreSQL
psql -U postgres -c "SELECT version();"

# Test Neo4j
curl -u neo4j:bizra2025 http://localhost:7474/db/neo4j/tx/commit

# Test Unified API
curl http://localhost:8080/unified/health
```

## Recommended Database Passwords (Development)

For consistency across BIZRA NODE0:

- **Redis**: `bizra2025` (or no password for dev)
- **PostgreSQL**: `bizra2025`
- **Neo4j**: `bizra2025`

Update `.env` file with working credentials after fixing.

## Emergency: Run Without Databases

The unified system is designed to work in degraded mode:

```bash
# It will show warnings but continue:
# ⚠️  L1 Memory (Redis) unavailable
# ⚠️  L2 Memory (Postgres) unavailable
# ⚠️  Neo4j connection failed
# ✅ L3-L5 will use mock data

# System will be functional but without persistence
```

## Next Steps After Fix

1. ✅ Run diagnostic: `node diagnose-node0.js`
2. ✅ Start unified system: `node node0/unified/index.js`
3. ✅ Populate knowledge graph:
   ```bash
   python BIZRA-DATA/scripts/populate-knowledge-graph.py \
     --sources "knowledge/,agents/,memory/,swarms/,hive-mind/" \
     --neo4j "bolt://localhost:7687"
   ```
4. ✅ Test all endpoints: `curl http://localhost:8080/unified/health`

## Support

Database admin tools:

- **Redis**: `redis-cli` or RedisInsight
- **PostgreSQL**: `psql` or pgAdmin
- **Neo4j**: Neo4j Browser (http://localhost:7474)
