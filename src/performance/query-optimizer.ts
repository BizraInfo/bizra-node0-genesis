import { Pool, PoolClient, QueryConfig, QueryResult } from "pg";
import { Logger } from "../utils/logger";
import { cacheService, CacheKeys } from "./cache.service";

/**
 * Database query optimizer with connection pooling and caching
 * Target: <50ms query execution time (p95)
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private pool: Pool | null = null;
  private readonly logger = Logger.getInstance("QueryOptimizer");

  // Performance metrics
  private metrics = {
    totalQueries: 0,
    cachedQueries: 0,
    slowQueries: 0,
    errors: 0,
    avgQueryTime: 0,
  };

  private constructor() {}

  public static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Initialize connection pool with optimal configuration
   */
  public initialize(config?: PoolConfig): void {
    this.pool = new Pool({
      host: config?.host || process.env.DB_HOST || "localhost",
      port: config?.port || parseInt(process.env.DB_PORT || "5432"),
      database: config?.database || process.env.DB_NAME || "app",
      user: config?.user || process.env.DB_USER || "postgres",
      password: config?.password || process.env.DB_PASSWORD,

      // Connection pool optimization
      max: config?.maxConnections || 20, // Maximum pool size
      min: config?.minConnections || 5, // Minimum pool size
      idleTimeoutMillis: config?.idleTimeout || 30000, // 30 seconds
      connectionTimeoutMillis: config?.connectionTimeout || 5000, // 5 seconds

      // Statement timeout (prevent slow queries)
      statement_timeout: config?.statementTimeout || 10000, // 10 seconds

      // Query timeout
      query_timeout: config?.queryTimeout || 5000, // 5 seconds

      // Keep alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Event handlers
    this.pool.on("connect", (client) => {
      this.logger.debug("New database connection established");

      // Set optimal session parameters
      client
        .query(
          `
        SET statement_timeout = '10s';
        SET work_mem = '16MB';
        SET effective_cache_size = '1GB';
        SET random_page_cost = 1.1;
      `,
        )
        .catch((err) =>
          this.logger.error("Failed to set session parameters", err),
        );
    });

    this.pool.on("error", (err, client) => {
      this.logger.error("Unexpected database pool error", err);
    });

    this.pool.on("remove", () => {
      this.logger.debug("Database connection removed from pool");
    });

    this.logger.info("Query optimizer initialized with connection pool", {
      maxConnections: this.pool.options.max,
      minConnections: this.pool.options.min,
    });
  }

  /**
   * Execute optimized query with automatic caching
   * Target: <50ms execution time
   */
  public async query<T = any>(
    query: string | QueryConfig,
    params?: any[],
    options: QueryOptions = {},
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(query, params);

      // Check cache if enabled
      if (options.cache !== false && options.cacheTTL !== 0) {
        const cached = await cacheService.get<QueryResult<T>>(cacheKey);
        if (cached) {
          this.metrics.cachedQueries++;
          const duration = Date.now() - startTime;
          this.logger.debug(`Query cache hit (${duration}ms)`, { query });
          return cached;
        }
      }

      // Execute query
      const result = await this.executeQuery<T>(query, params);

      const duration = Date.now() - startTime;
      this.updateMetrics(duration);

      // Cache result if cacheable
      if (options.cache !== false && this.isCacheable(query, result)) {
        const ttl = options.cacheTTL || this.getDefaultCacheTTL(query);
        await cacheService.set(cacheKey, result, ttl);
      }

      // Log slow queries
      if (duration > 100) {
        this.metrics.slowQueries++;
        this.logger.warn(`Slow query detected (${duration}ms)`, {
          query: this.sanitizeQuery(query),
          duration,
        });
      } else {
        this.logger.debug(`Query executed (${duration}ms)`);
      }

      return result;
    } catch (error) {
      this.metrics.errors++;
      const duration = Date.now() - startTime;
      this.logger.error(`Query error (${duration}ms)`, {
        query: this.sanitizeQuery(query),
        error,
      });
      throw error;
    }
  }

  /**
   * Execute query within a transaction
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool!.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch query execution for improved performance
   * Target: Process 1000+ records in <200ms
   */
  public async batchQuery<T = any>(
    query: string,
    batchParams: any[][],
    options: BatchQueryOptions = {},
  ): Promise<QueryResult<T>[]> {
    const batchSize = options.batchSize || 100;
    const results: QueryResult<T>[] = [];

    // Process in chunks
    for (let i = 0; i < batchParams.length; i += batchSize) {
      const chunk = batchParams.slice(i, i + batchSize);

      // Execute batch in parallel
      const chunkResults = await Promise.all(
        chunk.map((params) => this.query<T>(query, params, { cache: false })),
      );

      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Execute query with cursor for large result sets
   * Prevents memory overflow for large datasets
   */
  public async *queryCursor<T = any>(
    query: string,
    params?: any[],
    options: CursorOptions = {},
  ): AsyncGenerator<T, void, unknown> {
    const client = await this.pool!.connect();
    const batchSize = options.batchSize || 1000;

    try {
      const cursorName = `cursor_${Date.now()}`;

      await client.query("BEGIN");
      await client.query(`DECLARE ${cursorName} CURSOR FOR ${query}`, params);

      while (true) {
        const result = await client.query<T>(
          `FETCH ${batchSize} FROM ${cursorName}`,
        );

        if (result.rows.length === 0) {
          break;
        }

        for (const row of result.rows) {
          yield row;
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  public async analyzeQuery(
    query: string,
    params?: any[],
  ): Promise<QueryAnalysis> {
    const client = await this.pool!.connect();

    try {
      // Get query plan
      const explainResult = await client.query(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`,
        params,
      );

      const plan = explainResult.rows[0]["QUERY PLAN"][0];

      return {
        executionTime: plan["Execution Time"],
        planningTime: plan["Planning Time"],
        totalCost: plan["Plan"]["Total Cost"],
        suggestions: this.generateOptimizationSuggestions(plan),
        plan: plan,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create optimized index for better query performance
   */
  public async createIndex(
    tableName: string,
    columnNames: string[],
    options: IndexOptions = {},
  ): Promise<void> {
    const indexName =
      options.name || `idx_${tableName}_${columnNames.join("_")}`;

    const unique = options.unique ? "UNIQUE" : "";
    const method = options.method || "btree";
    const where = options.where ? `WHERE ${options.where}` : "";

    const query = `
      CREATE ${unique} INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
      ON ${tableName} USING ${method} (${columnNames.join(", ")})
      ${where}
    `;

    await this.query(query);
    this.logger.info(`Created index: ${indexName}`);
  }

  /**
   * Get connection pool statistics
   */
  public getPoolStats(): PoolStats {
    if (!this.pool) {
      return {
        total: 0,
        idle: 0,
        waiting: 0,
      };
    }

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Get query performance metrics
   */
  public getMetrics(): QueryMetrics {
    return {
      ...this.metrics,
      cacheHitRate:
        this.metrics.totalQueries > 0
          ? (this.metrics.cachedQueries / this.metrics.totalQueries) * 100
          : 0,
      errorRate:
        this.metrics.totalQueries > 0
          ? (this.metrics.errors / this.metrics.totalQueries) * 100
          : 0,
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      errors: 0,
      avgQueryTime: 0,
    };
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.info("Connection pool closed");
    }
  }

  // Private helper methods

  private async executeQuery<T>(
    query: string | QueryConfig,
    params?: any[],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error("Query optimizer not initialized");
    }

    if (typeof query === "string") {
      return this.pool.query<T>(query, params);
    } else {
      return this.pool.query<T>(query);
    }
  }

  private generateCacheKey(
    query: string | QueryConfig,
    params?: any[],
  ): string {
    const queryStr = typeof query === "string" ? query : query.text;
    const paramsStr = JSON.stringify(params || []);
    return CacheKeys.queryResult(queryStr, paramsStr);
  }

  private isCacheable(
    query: string | QueryConfig,
    result: QueryResult,
  ): boolean {
    const queryStr =
      typeof query === "string"
        ? query.toLowerCase()
        : query.text.toLowerCase();

    // Only cache SELECT queries
    if (!queryStr.trim().startsWith("select")) {
      return false;
    }

    // Don't cache empty results
    if (result.rows.length === 0) {
      return false;
    }

    // Don't cache very large results
    if (result.rows.length > 10000) {
      return false;
    }

    return true;
  }

  private getDefaultCacheTTL(query: string | QueryConfig): number {
    const queryStr = typeof query === "string" ? query : query.text;
    const lowerQuery = queryStr.toLowerCase();

    // Short TTL for frequently changing data
    if (lowerQuery.includes("session") || lowerQuery.includes("lock")) {
      return 60; // 1 minute
    }

    // Medium TTL for user data
    if (lowerQuery.includes("user") || lowerQuery.includes("profile")) {
      return 300; // 5 minutes
    }

    // Long TTL for static data
    return 3600; // 1 hour
  }

  private sanitizeQuery(query: string | QueryConfig): string {
    const queryStr = typeof query === "string" ? query : query.text;
    return queryStr.substring(0, 200) + (queryStr.length > 200 ? "..." : "");
  }

  private updateMetrics(duration: number): void {
    const { totalQueries, avgQueryTime } = this.metrics;
    this.metrics.avgQueryTime =
      (avgQueryTime * (totalQueries - 1) + duration) / totalQueries;
  }

  private generateOptimizationSuggestions(plan: any): string[] {
    const suggestions: string[] = [];

    // Check for sequential scans
    if (JSON.stringify(plan).includes("Seq Scan")) {
      suggestions.push("Consider adding indexes to avoid sequential scans");
    }

    // Check for high execution time
    if (plan["Execution Time"] > 100) {
      suggestions.push(
        "Query execution time is high. Consider query optimization",
      );
    }

    // Check for large result sets
    if (plan["Plan Rows"] > 10000) {
      suggestions.push(
        "Consider adding pagination or filtering to reduce result set",
      );
    }

    return suggestions;
  }
}

// Types and interfaces

interface PoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  maxConnections?: number;
  minConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  statementTimeout?: number;
  queryTimeout?: number;
}

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
}

interface BatchQueryOptions {
  batchSize?: number;
}

interface CursorOptions {
  batchSize?: number;
}

interface IndexOptions {
  name?: string;
  unique?: boolean;
  method?: "btree" | "hash" | "gist" | "gin";
  where?: string;
}

interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
}

interface QueryMetrics {
  totalQueries: number;
  cachedQueries: number;
  slowQueries: number;
  errors: number;
  avgQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
}

interface QueryAnalysis {
  executionTime: number;
  planningTime: number;
  totalCost: number;
  suggestions: string[];
  plan: any;
}

// Export singleton instance
export const queryOptimizer = QueryOptimizer.getInstance();
