# Performance Optimization Guide

## Overview

This guide covers comprehensive performance optimization strategies to achieve **<100ms response times (p95)** for API endpoints and database operations.

## Table of Contents

1. [Multi-Layer Caching](#multi-layer-caching)
2. [Database Optimization](#database-optimization)
3. [Response Compression](#response-compression)
4. [Pagination Strategies](#pagination-strategies)
5. [Performance Monitoring](#performance-monitoring)
6. [Load Testing](#load-testing)
7. [Best Practices](#best-practices)

---

## Multi-Layer Caching

### Architecture

The caching system uses a two-tier approach:

- **L1 Cache (Memory)**: In-memory cache for ultra-fast access (<5ms)
- **L2 Cache (Redis)**: Distributed cache for larger datasets (<20ms)

### Implementation

```typescript
import { cacheService, CacheKeys } from "./performance/cache.service";

// Initialize cache
await cacheService.connect({
  host: "localhost",
  port: 6379,
});

// Get from cache (auto-fallback L1 -> L2)
const user = await cacheService.get<User>(CacheKeys.user(userId));

// Set in cache (writes to both layers)
await cacheService.set(CacheKeys.user(userId), userData, 300);

// Get or compute pattern
const user = await cacheService.getOrSet(
  CacheKeys.user(userId),
  async () => await db.query("SELECT * FROM users WHERE id = $1", [userId]),
  300,
);
```

### Cache Key Patterns

```typescript
// User-related
CacheKeys.user(userId);
CacheKeys.allUsers();

// API responses
CacheKeys.apiResponse("/api/users", "limit=20&sort=desc");

// Database queries
CacheKeys.queryResult(sql, params);

// Rate limiting
CacheKeys.rateLimit(ipAddress);
```

### Cache Invalidation

```typescript
// Invalidate single key
await cacheService.delete(CacheKeys.user(userId));

// Invalidate pattern
await cacheService.deletePattern("user:*");

// Strategic invalidation
await cacheService.deletePattern(cacheConfig.invalidation.userUpdate);
```

### Performance Targets

- **L1 Hit**: <5ms
- **L2 Hit**: <20ms
- **Cache Hit Rate**: >80%

---

## Database Optimization

### Connection Pooling

```typescript
import { queryOptimizer } from "./performance/query-optimizer";

// Initialize with optimal pool settings
queryOptimizer.initialize({
  maxConnections: 20,
  minConnections: 5,
  idleTimeout: 30000,
  connectionTimeout: 5000,
  queryTimeout: 5000,
});
```

### Query Optimization

```typescript
// Cached queries (automatic)
const result = await queryOptimizer.query(
  "SELECT * FROM users WHERE id = $1",
  [userId],
  { cache: true, cacheTTL: 300 },
);

// Batch operations
const results = await queryOptimizer.batchQuery(
  "INSERT INTO posts (user_id, title) VALUES ($1, $2)",
  batchParams,
  { batchSize: 100 },
);

// Cursor-based processing for large datasets
for await (const row of queryOptimizer.queryCursor(
  "SELECT * FROM large_table",
  [],
  { batchSize: 1000 },
)) {
  await processRow(row);
}
```

### Index Creation

```typescript
// Create optimized indexes
await queryOptimizer.createIndex("users", ["email"], {
  unique: true,
  method: "btree",
});

await queryOptimizer.createIndex("posts", ["user_id", "created_at"], {
  method: "btree",
});

// Partial indexes
await queryOptimizer.createIndex("users", ["status"], {
  where: "status = 'active'",
});
```

### Query Analysis

```typescript
// Analyze query performance
const analysis = await queryOptimizer.analyzeQuery(
  "SELECT * FROM users WHERE email = $1",
  ["user@example.com"],
);

console.log(analysis.executionTime); // Actual execution time
console.log(analysis.suggestions); // Optimization suggestions
```

### Performance Targets

- **Query Time**: <50ms (p95)
- **Transaction Time**: <100ms
- **Pool Utilization**: <70%

---

## Response Compression

### Middleware Setup

```typescript
import { createCompressionMiddleware } from "./performance/compression.middleware";

// Apply to Express app
app.use(
  createCompressionMiddleware({
    enabled: true,
    minSize: 1024, // Only compress >1KB
    excludePaths: ["/health", "/metrics"],
  }),
);
```

### Manual Compression

```typescript
import { compressionMiddleware } from "./performance/compression.middleware";

// Compress data manually
const compressed = await compressionMiddleware.compress(
  largeData,
  "brotli", // or 'gzip'
);
```

### Compression Methods

- **Brotli**: Best compression ratio (preferred)
- **Gzip**: Better compatibility
- **Deflate**: Fallback option

### Performance Targets

- **Compression Ratio**: 60-80% size reduction
- **Compression Time**: <10ms
- **Response Size**: Reduced by 60-80%

---

## Pagination Strategies

### Cursor-Based Pagination

```typescript
import { paginationService } from "./performance/pagination.service";

// Build cursor query
const { query, params, limit, fetchLimit } = paginationService.buildCursorQuery(
  {
    table: "users",
    columns: ["id", "email", "name"],
    cursor: req.query.cursor,
    limit: 20,
    sortField: "id",
    sortOrder: "desc",
  },
);

// Execute query
const rows = await db.query(query, params);

// Create paginated response
const response = paginationService.createPaginatedResponse(rows, {
  limit,
  cursor: req.query.cursor,
  sortField: "id",
  sortOrder: "desc",
});

res.json(response);
```

### API Implementation

```typescript
app.get("/api/users", async (req, res) => {
  // Parse pagination params
  const params = paginationService.parsePaginationParams(req.query);

  // Build and execute query
  const {
    query,
    params: queryParams,
    limit,
  } = paginationService.buildCursorQuery({
    table: "users",
    cursor: params.cursor,
    limit: params.limit,
    sortField: params.sortField,
    sortOrder: params.sortOrder,
  });

  const result = await queryOptimizer.query(query, queryParams);

  // Create response with pagination metadata
  const response = paginationService.createPaginatedResponse(
    result.rows,
    params,
  );

  res.json(response);
});
```

### Performance Targets

- **Pagination Time**: <50ms
- **Large Dataset**: Support 1M+ records
- **Complexity**: O(1) with proper indexes

---

## Performance Monitoring

### Metrics Collection

```typescript
// Cache metrics
const cacheStats = await cacheService.getStats();
console.log(`L1 Cache: ${cacheStats.l1.size}/${cacheStats.l1.maxSize}`);
console.log(`Cache hit rate: ${cacheStats.l1.utilization}%`);

// Query metrics
const queryMetrics = queryOptimizer.getMetrics();
console.log(`Avg query time: ${queryMetrics.avgQueryTime}ms`);
console.log(`Cache hit rate: ${queryMetrics.cacheHitRate}%`);
console.log(`Slow queries: ${queryMetrics.slowQueries}`);

// Compression metrics
const compMetrics = compressionMiddleware.getMetrics();
console.log(`Compression rate: ${compMetrics.compressionRate}%`);
console.log(`Bytes saved: ${compMetrics.bytesSaved}`);
```

### Monitoring Dashboard

```typescript
// Create monitoring endpoint
app.get("/metrics", async (req, res) => {
  const metrics = {
    cache: await cacheService.getStats(),
    database: queryOptimizer.getMetrics(),
    pool: queryOptimizer.getPoolStats(),
    compression: compressionMiddleware.getMetrics(),
    timestamp: Date.now(),
  };

  res.json(metrics);
});
```

---

## Load Testing

### K6 Load Tests

```bash
# Install k6
npm install -g k6

# Run load tests
k6 run tests/performance/api-load-test.js

# Run with custom parameters
k6 run --vus 50 --duration 2m tests/performance/api-load-test.js

# Run specific scenario
k6 run --env SCENARIO=spike tests/performance/api-load-test.js
```

### Database Benchmarks

```bash
# Run database benchmarks
node tests/performance/database-benchmark.js

# View results
cat benchmark-results.json
```

### Performance Targets

- **API Response**: <100ms (p95)
- **Database Query**: <50ms (p95)
- **Throughput**: >100 req/s
- **Error Rate**: <1%

---

## Best Practices

### 1. Always Cache Expensive Operations

```typescript
// ❌ Bad: No caching
const users = await db.query("SELECT * FROM users");

// ✅ Good: With caching
const users = await cacheService.getOrSet(
  "users:all",
  async () => await db.query("SELECT * FROM users"),
  300,
);
```

### 2. Use Cursor Pagination for Large Datasets

```typescript
// ❌ Bad: Offset pagination for 1M records
const users = await db.query(
  "SELECT * FROM users LIMIT 20 OFFSET " + page * 20,
);

// ✅ Good: Cursor pagination
const { query, params } = paginationService.buildCursorQuery({
  table: "users",
  cursor: req.query.cursor,
  limit: 20,
});
const users = await db.query(query, params);
```

### 3. Compress Large Responses

```typescript
// ✅ Automatic compression middleware
app.use(createCompressionMiddleware());

// ✅ Manual compression for specific routes
app.get("/api/large-report", async (req, res) => {
  const data = await generateLargeReport();
  const compressed = await compressionMiddleware.compress(data, "brotli");
  res.set("Content-Encoding", "br");
  res.send(compressed);
});
```

### 4. Use Connection Pooling

```typescript
// ❌ Bad: New connection per query
const client = new Client(config);
await client.connect();
await client.query(sql);
await client.end();

// ✅ Good: Use connection pool
queryOptimizer.initialize(config);
await queryOptimizer.query(sql);
```

### 5. Monitor Performance Continuously

```typescript
// Set up monitoring hooks
npx claude-flow@alpha hooks post-edit --memory-key "performance/metrics"

// Track slow operations
queryOptimizer.on('slowQuery', (query, duration) => {
  logger.warn(`Slow query detected: ${duration}ms`, { query });
});

// Alert on performance degradation
if (metrics.avgQueryTime > 100) {
  alerting.trigger('performance-degradation', metrics);
}
```

### 6. Use Strategic Indexes

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Create composite indexes for common query patterns
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);

-- Use partial indexes for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

### 7. Batch Operations

```typescript
// ❌ Bad: Sequential inserts
for (const item of items) {
  await db.query("INSERT INTO table VALUES ($1)", [item]);
}

// ✅ Good: Batch insert
await queryOptimizer.batchQuery(
  "INSERT INTO table VALUES ($1)",
  items.map((item) => [item]),
  { batchSize: 100 },
);
```

---

## Configuration Reference

### Cache Configuration

See `config/performance/cache.config.ts` for:

- Redis connection settings
- L1/L2 cache configuration
- TTL strategies
- Cache key patterns

### Performance Configuration

See `config/performance/performance.config.ts` for:

- Database pool settings
- Query timeouts
- Performance targets
- Monitoring configuration

---

## Troubleshooting

### High Response Times

1. Check cache hit rate: `cacheService.getStats()`
2. Analyze slow queries: `queryOptimizer.getMetrics()`
3. Review database indexes
4. Check connection pool utilization

### High Memory Usage

1. Review L1 cache size
2. Check for memory leaks in query results
3. Optimize large result sets with cursors
4. Implement pagination

### Low Cache Hit Rate

1. Review cache TTL settings
2. Check cache invalidation patterns
3. Analyze cache key distribution
4. Increase L1 cache size if needed

---

## Additional Resources

- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [K6 Load Testing Guide](https://k6.io/docs/)
- [Express.js Performance Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Target Achievement**: <100ms response times (p95) with proper implementation of all optimization strategies.
