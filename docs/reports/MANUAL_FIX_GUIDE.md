# BIZRA Node Zero - Manual Database Password Fix

## Current Situation

All 3 databases are running but authentication is failing:

- ✅ Redis on port 6379 (requires unknown password)
- ✅ PostgreSQL on port 5432 (wrong password)
- ❌ Neo4j on port 7687 (locked from failed attempts)

All services appear to be running from PID 39116 - likely Docker or WSL.

## Step-by-Step Manual Fix

### Step 1: Find How Databases Are Running

**Check Docker:**

```powershell
docker ps
```

If you see containers for Redis, PostgreSQL, and Neo4j:

```powershell
# Get Redis password
docker exec -it <redis-container-name> redis-cli CONFIG GET requirepass

# Access PostgreSQL
docker exec -it <postgres-container-name> psql -U postgres

# Access Neo4j
docker exec -it <neo4j-container-name> cypher-shell
```

**Check Docker Compose:**

```powershell
cd C:\BIZRA-NODE0
docker-compose ps
# or
cd config
docker-compose -f docker-compose.yml ps
```

If using docker-compose, check the environment variables:

```powershell
# Look for passwords in:
cat docker-compose.yml
cat docker-compose.production.yml
cat .env.docker
```

### Step 2: Fix Redis (L1 Memory)

**Option A: Find password in Docker**

```bash
# If using Docker
docker exec <redis-container> cat /usr/local/etc/redis/redis.conf | grep requirepass

# Or check docker-compose environment
docker-compose config | grep REDIS_PASSWORD
```

**Option B: Disable auth temporarily**

```bash
# Access Redis container
docker exec -it <redis-container> bash

# Edit config
vi /usr/local/etc/redis/redis.conf
# Comment out: # requirepass <password>

# Restart container
docker restart <redis-container>
```

**Option C: Set new password**

```bash
docker exec -it <redis-container> redis-cli
# If it asks for password, try common ones:
# AUTH <old-password>
# CONFIG SET requirepass bizra2025
# exit
```

### Step 3: Fix PostgreSQL (L2 Memory)

**Using Docker:**

```bash
# Access container
docker exec -it <postgres-container> psql -U postgres

# If password fails, modify docker-compose.yml:
# Add: POSTGRES_HOST_AUTH_METHOD: trust
# Restart container: docker-compose restart postgres

# Then connect without password:
docker exec -it <postgres-container> psql -U postgres

# Set new password:
ALTER USER postgres WITH PASSWORD 'bizra2025';

# Create bizra database:
CREATE DATABASE bizra;
\q

# Remove trust method from docker-compose, restart again
```

**Without Docker:**

```powershell
# Find PostgreSQL data directory
# Usually: C:\Program Files\PostgreSQL\<version>\data\

# Edit pg_hba.conf:
# Change: host all all 127.0.0.1/32 md5
# To:     host all all 127.0.0.1/32 trust

# Restart PostgreSQL service in Windows Services

# Connect and change password:
psql -U postgres
ALTER USER postgres WITH PASSWORD 'bizra2025';
CREATE DATABASE bizra;
\q

# Change pg_hba.conf back to md5
# Restart PostgreSQL service again
```

### Step 4: Fix Neo4j (L3 HyperGraph) - LOCKED

Neo4j is locked from too many failed attempts. You MUST reset it.

**Using Docker:**

```bash
# Stop container
docker stop <neo4j-container>

# Remove auth database volume
docker volume ls | grep neo4j
docker volume rm <neo4j-auth-volume>

# Or access container filesystem:
docker exec -it <neo4j-container> bash
rm -rf /data/dbms/auth

# Restart container
docker start <neo4j-container>

# Access Neo4j Browser: http://localhost:7474
# Default: neo4j / neo4j
# Change to: bizra2025
```

**Without Docker:**

```powershell
# Stop Neo4j service
net stop neo4j

# Delete auth folder:
# Location: <NEO4J_HOME>\data\dbms\auth
# Usually: C:\Program Files\Neo4j\<version>\data\dbms\auth
del "C:\Program Files\Neo4j\*\data\dbms\auth" /S /Q

# Start Neo4j service
net start neo4j

# Access browser: http://localhost:7474
# Login: neo4j / neo4j
# Change password to: bizra2025
```

**Alternative: Use neo4j-admin**

```powershell
# Stop Neo4j first
net stop neo4j

# Reset password
neo4j-admin set-initial-password bizra2025

# Start Neo4j
net start neo4j
```

### Step 5: Update .env File

Once you know the correct passwords, update `C:\BIZRA-NODE0\.env`:

```bash
# Example working configuration
DATABASE_URL=postgresql://postgres:bizra2025@localhost:5432/bizra
REDIS_PASSWORD=bizra2025  # or leave empty if no auth
NEO4J_PASSWORD=bizra2025
```

### Step 6: Test Connections

```bash
cd C:\BIZRA-NODE0
node diagnose-node0.js
```

Expected output:

```
✅ Redis: CONNECTED
✅ PostgreSQL: CONNECTED
✅ Neo4j: CONNECTED
```

### Step 7: Restart Node Zero

```bash
# Kill old process
taskkill /F /PID 8076

# Start fresh
node node0/unified/index.js
```

## Quick Reference

### Finding Docker Passwords

```bash
# Check compose file
docker-compose config

# Check running containers
docker inspect <container-name> | grep -i password

# Access container logs
docker logs <container-name> | grep password
```

### Common Docker Compose Locations

- `C:\BIZRA-NODE0\docker-compose.yml`
- `C:\BIZRA-NODE0\config\docker-compose.production.yml`
- `C:\BIZRA-NODE0\.env.docker`

### Default Passwords to Try

- Redis: (no password), `redis`, `bizra`, `bizra2025`
- PostgreSQL: `postgres`, `password`, `bizra2025`
- Neo4j: `neo4j`, `bizra2025`

## Need Help?

If you're still stuck:

1. Check if databases are in Docker: `docker ps`
2. Find docker-compose file: `dir docker-compose*.yml /s`
3. Look for environment files: `dir .env* /s`
4. Check running services: `services.msc` in Windows
