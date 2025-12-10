/**
 * Database Configuration
 * PostgreSQL connection pool and query builder setup
 */

import { Pool, PoolClient, PoolConfig } from "pg";
import { config } from "./app.config";
import { logger } from "../middleware/logger";

class DatabaseConnection {
  private pool: Pool | null = null;
  private isConnected = false;

  /**
   * Initialize database connection pool
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn("Database already connected");
      return;
    }

    try {
      const poolConfig: PoolConfig = {
        connectionString: config.database.url,
        min: config.database.pool.min,
        max: config.database.pool.max,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: config.app.isProduction
          ? { rejectUnauthorized: false }
          : undefined,
      };

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();

      this.isConnected = true;
      logger.info("Database connected successfully", {
        pool: {
          min: config.database.pool.min,
          max: config.database.pool.max,
        },
      });

      // Handle pool errors
      this.pool.on("error", (err) => {
        logger.error("Unexpected database pool error", { error: err.message });
      });

      this.pool.on("connect", () => {
        logger.debug("New database client connected");
      });

      this.pool.on("remove", () => {
        logger.debug("Database client removed from pool");
      });
    } catch (error) {
      logger.error("Database connection failed", { error });
      throw new Error(
        `Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get database connection pool
   */
  getPool(): Pool {
    if (!this.pool || !this.isConnected) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.pool;
  }

  /**
   * Execute a query
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const pool = this.getPool();
    const start = Date.now();

    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug("Query executed", {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });

      return result.rows as T[];
    } catch (error) {
      logger.error("Query execution failed", {
        query: text,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    const pool = this.getPool();
    return await pool.connect();
  }

  /**
   * Execute queries within a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Transaction rolled back", { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const result = await pool.query("SELECT 1 as health");
      return result.rows[0]?.health === 1;
    } catch (error) {
      logger.error("Database health check failed", { error });
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Gracefully close database connections
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info("Database disconnected successfully");
    } catch (error) {
      logger.error("Error disconnecting database", { error });
      throw error;
    }
  }
}

// Export singleton instance
export const database = new DatabaseConnection();

// Helper function for parameterized queries
export const buildQuery = (
  baseQuery: string,
  conditions: Record<string, any>,
) => {
  const whereConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      whereConditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  return {
    query: `${baseQuery} ${whereClause}`,
    params,
  };
};
