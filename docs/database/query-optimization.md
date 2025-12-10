# PostgreSQL Query Optimization Guide

## BIZRA-NODE0 Database Performance Tuning

### Table of Contents

1. [Index Strategy](#index-strategy)
2. [Query Optimization Techniques](#query-optimization-techniques)
3. [Common Query Patterns](#common-query-patterns)
4. [Performance Monitoring](#performance-monitoring)
5. [Troubleshooting Slow Queries](#troubleshooting-slow-queries)
6. [Best Practices](#best-practices)

---

## Index Strategy

### Index Types Used

#### 1. B-Tree Indexes (Default)

**Best For**: Sorted data, range queries, equality checks

```sql
-- Standard B-tree index
CREATE INDEX idx_users_created ON users(created_at DESC);

-- Composite B-tree index
CREATE INDEX idx_sessions_user_status ON sessions(user_id, status);

-- Partial B-tree index (filtered)
CREATE INDEX idx_users_active ON users(email)
WHERE deleted_at IS NULL AND is_active = true;

-- Covering index (index-only scans)
CREATE INDEX idx_sessions_covering ON sessions(token_hash)
INCLUDE (user_id, status, expires_at)
WHERE status = 'active';
```

**When to Use**:

- Primary keys and unique constraints
- Foreign key relationships
- Range queries (`<`, `<=`, `>`, `>=`, `BETWEEN`)
- Sorting operations (`ORDER BY`)
- Pattern matching (`LIKE 'prefix%'`)

#### 2. Hash Indexes

**Best For**: Exact equality matches

```sql
-- Fast exact UUID lookups
CREATE INDEX idx_sessions_user_hash ON sessions USING hash(user_id);
```

**When to Use**:

- Exact equality checks only (`=`)
- UUIDs and large text fields
- No range queries needed

**Limitations**:

- Not WAL-logged before PostgreSQL 10
- Equality operations only

#### 3. GIN Indexes (Generalized Inverted Index)

**Best For**: JSONB, arrays, full-text search

```sql
-- JSONB queries
CREATE INDEX idx_users_metadata ON users USING gin(metadata);

-- Full-text search
CREATE INDEX idx_users_fulltext ON users USING gin(
    to_tsvector('english',
        COALESCE(username, '') || ' ' ||
        COALESCE(full_name, '') || ' ' ||
        COALESCE(email, '')
    )
);

-- Array operations
CREATE INDEX idx_api_keys_permissions ON api_keys USING gin(permissions);
```

**When to Use**:

- JSONB queries (`@>`, `?`, `?&`, `?|`)
- Array containment checks
- Full-text search (`@@`)

**Performance**:

- Larger than B-tree indexes
- Slower writes, much faster reads
- Best for read-heavy workloads

#### 4. GIST Indexes (Generalized Search Tree)

**Best For**: Spatial data, range types

```sql
-- Spatial queries (if using PostGIS)
CREATE INDEX idx_locations_geom ON locations USING gist(geom);

-- Range type overlaps
CREATE INDEX idx_time_ranges ON events USING gist(time_range);
```

**When to Use**:

- Geometric and spatial data
- Range type operations
- Nearest-neighbor searches

#### 5. BRIN Indexes (Block Range Index)

**Best For**: Very large tables with natural ordering

```sql
-- Time-series data on partitioned tables
CREATE INDEX idx_audit_logs_brin ON audit_logs USING brin(created_at)
WITH (pages_per_range = 128);

CREATE INDEX idx_validations_brin ON validations USING brin(created_at)
WITH (pages_per_range = 128);
```

**When to Use**:

- Very large tables (> 1GB)
- Naturally ordered data (timestamps, sequences)
- Low selectivity columns

**Benefits**:

- Extremely small index size
- Fast index creation
- Minimal maintenance overhead

---

## Query Optimization Techniques

### 1. Use EXPLAIN ANALYZE

```sql
-- Analyze query execution plan
EXPLAIN ANALYZE
SELECT u.username, COUNT(v.id) as validation_count
FROM users u
LEFT JOIN validations v ON u.id = v.user_id
WHERE u.is_active = true
AND v.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY u.username
ORDER BY validation_count DESC
LIMIT 10;
```

**Key Metrics to Watch**:

- **Seq Scan**: Avoid on large tables
- **Index Scan**: Good for selective queries
- **Index Only Scan**: Best performance
- **Nested Loop**: Good for small result sets
- **Hash Join**: Good for large result sets
- **Merge Join**: Good for pre-sorted data

### 2. Index-Only Scans

```sql
-- BAD: Requires table access
SELECT user_id, status FROM sessions WHERE token_hash = 'xyz';

-- GOOD: Index-only scan with covering index
CREATE INDEX idx_sessions_covering ON sessions(token_hash)
INCLUDE (user_id, status, expires_at)
WHERE status = 'active';

-- Now this query only reads the index
SELECT user_id, status FROM sessions WHERE token_hash = 'xyz';
```

### 3. Partial Indexes

```sql
-- Index only active users (reduces index size by 90% if most are active)
CREATE INDEX idx_users_active_email ON users(email)
WHERE is_active = true AND deleted_at IS NULL;

-- Index only pending validations (hot data)
CREATE INDEX idx_validations_pending ON validations(validation_started_at)
WHERE status = 'pending';

-- Index only recent audit logs
CREATE INDEX idx_audit_recent ON audit_logs(created_at DESC)
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days';
```

### 4. Composite Indexes

```sql
-- Order matters! Most selective column first
-- BAD: status first (low selectivity)
CREATE INDEX idx_bad ON validations(status, user_id, created_at);

-- GOOD: user_id first (high selectivity)
CREATE INDEX idx_good ON validations(user_id, status, created_at);

-- Covers these queries:
-- SELECT * FROM validations WHERE user_id = 'xyz';
-- SELECT * FROM validations WHERE user_id = 'xyz' AND status = 'pending';
-- SELECT * FROM validations WHERE user_id = 'xyz' AND status = 'pending' ORDER BY created_at;
```

### 5. Query Rewriting

#### Avoid SELECT \*

```sql
-- BAD: Retrieves unnecessary data
SELECT * FROM users WHERE email = 'test@example.com';

-- GOOD: Only select needed columns
SELECT id, username, role FROM users WHERE email = 'test@example.com';
```

#### Use EXISTS instead of COUNT

```sql
-- BAD: Counts all matches
SELECT id FROM users WHERE (SELECT COUNT(*) FROM sessions WHERE user_id = users.id) > 0;

-- GOOD: Stops at first match
SELECT id FROM users WHERE EXISTS (SELECT 1 FROM sessions WHERE user_id = users.id);
```

#### Avoid OR in WHERE clauses

```sql
-- BAD: May not use indexes efficiently
SELECT * FROM users WHERE email = 'a@b.com' OR username = 'test';

-- GOOD: Use UNION ALL
SELECT * FROM users WHERE email = 'a@b.com'
UNION ALL
SELECT * FROM users WHERE username = 'test' AND email != 'a@b.com';
```

### 6. Batch Operations

```sql
-- BAD: Multiple single inserts
INSERT INTO audit_logs (user_id, action) VALUES ('uuid1', 'login');
INSERT INTO audit_logs (user_id, action) VALUES ('uuid2', 'login');
INSERT INTO audit_logs (user_id, action) VALUES ('uuid3', 'login');

-- GOOD: Bulk insert
INSERT INTO audit_logs (user_id, action) VALUES
    ('uuid1', 'login'),
    ('uuid2', 'login'),
    ('uuid3', 'login');

-- BEST: Use COPY for very large datasets
COPY audit_logs (user_id, action) FROM '/tmp/audit_data.csv' CSV;
```

---

## Common Query Patterns

### 1. Session Validation (Ultra-Fast)

```sql
-- Optimized with covering index
SELECT user_id, status, expires_at, last_activity_at
FROM sessions
WHERE token_hash = $1
AND status = 'active'
AND expires_at > CURRENT_TIMESTAMP;

-- Uses: idx_sessions_covering
-- Expected: < 1ms
```

### 2. API Rate Limit Check

```sql
-- Real-time rate limit check
SELECT request_count
FROM rate_limits
WHERE api_key_id = $1
AND window_type = 'minute'
AND window_start = DATE_TRUNC('minute', CURRENT_TIMESTAMP);

-- Uses: idx_rate_limits_lookup
-- Expected: < 2ms
```

### 3. User Authentication

```sql
-- Fast authentication lookup
SELECT id, password_hash, role, is_active, failed_login_attempts
FROM users
WHERE email = $1
AND deleted_at IS NULL;

-- Uses: idx_users_email_active
-- Expected: < 5ms
```

### 4. Validation History

```sql
-- User validation history with pagination
SELECT id, validation_type, status, blockchain_network, created_at
FROM validations
WHERE user_id = $1
AND created_at >= $2
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;

-- Uses: idx_validations_user_status
-- Expected: < 10ms
```

### 5. Security Audit Query

```sql
-- Find failed login attempts in last hour
SELECT user_id, ip_address, COUNT(*) as attempt_count
FROM audit_logs
WHERE action = 'login'
AND success = false
AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY user_id, ip_address
HAVING COUNT(*) >= 5;

-- Uses: idx_audit_action_time, idx_audit_errors
-- Expected: < 20ms
```

### 6. Dashboard Aggregates (Use Materialized Views)

```sql
-- SLOW: Direct aggregation
SELECT blockchain_network, COUNT(*), AVG(gas_used)
FROM validations
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY blockchain_network;

-- FAST: Use materialized view
SELECT blockchain_network, validation_count, avg_gas_used
FROM mv_validation_stats_by_network
WHERE time_bucket >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY blockchain_network;

-- 10-50x faster with materialized views
```

---

## Performance Monitoring

### 1. Identify Slow Queries

```sql
-- Install pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100 -- queries > 100ms average
ORDER BY mean_time DESC
LIMIT 20;
```

### 2. Monitor Index Usage

```sql
-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelid NOT IN (
    SELECT conindid FROM pg_constraint WHERE contype IN ('p', 'u')
)
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 3. Check Index Bloat

```sql
-- Monitor index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 10 * 1024 * 1024 -- > 10MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 4. Cache Hit Ratio

```sql
-- Should be > 99%
SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    ROUND(
        sum(heap_blks_hit) * 100.0 /
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0),
        2
    ) as cache_hit_ratio
FROM pg_statio_user_tables;
```

### 5. Active Connections

```sql
-- Monitor connection pool usage
SELECT
    state,
    COUNT(*) as connection_count,
    MAX(EXTRACT(EPOCH FROM (now() - query_start))) as max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
```

---

## Troubleshooting Slow Queries

### Step 1: Get Execution Plan

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT ...;
```

### Step 2: Look for Red Flags

1. **Sequential Scans on large tables**
   - Solution: Add appropriate indexes

2. **Nested Loops with large row counts**
   - Solution: Consider hash join, increase work_mem

3. **High buffer reads**
   - Solution: Check cache hit ratio, increase shared_buffers

4. **Long planning time**
   - Solution: Run ANALYZE, update statistics

### Step 3: Apply Fixes

#### Add Missing Index

```sql
-- If you see: Seq Scan on users
-- Add:
CREATE INDEX CONCURRENTLY idx_users_needed ON users(needed_column);
```

#### Update Statistics

```sql
-- After bulk operations
ANALYZE users;
ANALYZE VERBOSE; -- All tables
```

#### Increase Work Memory (Session)

```sql
-- For complex sorts/aggregations
SET work_mem = '256MB';
SELECT ... -- complex query
```

#### Rewrite Query

```sql
-- Use CTE for readability and optimization
WITH active_users AS (
    SELECT id, username FROM users WHERE is_active = true
)
SELECT * FROM active_users WHERE ...;
```

---

## Best Practices

### DO ✓

1. **Always use EXPLAIN ANALYZE** for slow queries
2. **Create indexes on foreign keys**
3. **Use partial indexes** for frequently filtered columns
4. **Use covering indexes** for frequently selected columns
5. **Batch insert/update operations**
6. **Use connection pooling** (PgBouncer)
7. **Run VACUUM ANALYZE regularly**
8. **Monitor index usage** and remove unused ones
9. **Use materialized views** for complex aggregations
10. **Partition large tables** (> 1GB)

### DON'T ✗

1. **Don't use SELECT \*** in production code
2. **Don't over-index** (slows writes)
3. **Don't use OR in WHERE** clauses (use UNION)
4. **Don't use functions on indexed columns** in WHERE
5. **Don't use OFFSET for large offsets** (use cursors)
6. **Don't forget to ANALYZE** after bulk operations
7. **Don't store large binary data** in database
8. **Don't use too many joins** (> 5-6 tables)
9. **Don't ignore slow query log**
10. **Don't disable autovacuum**

---

## Performance Tuning Checklist

### Database Configuration

```sql
-- postgresql.conf recommendations for 16GB RAM server

shared_buffers = 4GB                  -- 25% of RAM
effective_cache_size = 12GB           -- 75% of RAM
maintenance_work_mem = 1GB            -- For VACUUM, CREATE INDEX
work_mem = 50MB                       -- Per sort operation
max_connections = 200                 -- Via PgBouncer
random_page_cost = 1.1                -- For SSD storage
effective_io_concurrency = 200        -- For SSD storage
wal_buffers = 16MB
default_statistics_target = 100
```

### Regular Maintenance

```bash
# Daily
pg_dump -Fc bizra_node0 > backup.dump
psql -c "SELECT expire_sessions();"
psql -c "DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '7 days';"

# Weekly
psql -c "REINDEX INDEX CONCURRENTLY idx_sessions_token_hash;"
psql -c "VACUUM ANALYZE users;"

# Monthly
psql -c "SELECT create_next_partition('validations', DATE_TRUNC('month', NOW() + INTERVAL '2 months'));"
```

---

## Performance Targets

| Operation            | Target  | Index Used                  |
| -------------------- | ------- | --------------------------- |
| Session validation   | < 1ms   | idx_sessions_covering       |
| API key lookup       | < 2ms   | idx_api_keys_hash_active    |
| User authentication  | < 5ms   | idx_users_email_active      |
| Validation query     | < 10ms  | idx_validations_user_status |
| Audit log write      | < 5ms   | Partitioned table           |
| Dashboard aggregates | < 5ms   | Materialized views          |
| Full-text search     | < 100ms | idx_users_fulltext (GIN)    |

---

_BIZRA-NODE0 Query Optimization Guide v1.0.0_
