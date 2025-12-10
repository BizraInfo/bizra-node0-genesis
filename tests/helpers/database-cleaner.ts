/**
 * Database Cleaner
 * Manages test database state and cleanup
 */
import { Pool, PoolClient } from 'pg';

export class DatabaseCleaner {
  private pool: Pool;
  private client: PoolClient | null = null;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    this.client = await this.pool.connect();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
  }

  /**
   * Clean all tables
   */
  async clean(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const tables = await this.getTables();

    // Disable foreign key checks
    await this.client.query('SET session_replication_role = replica;');

    // Truncate all tables
    for (const table of tables) {
      await this.client.query(`TRUNCATE TABLE ${table} CASCADE;`);
    }

    // Re-enable foreign key checks
    await this.client.query('SET session_replication_role = DEFAULT;');
  }

  /**
   * Get all table names
   */
  private async getTables(): Promise<string[]> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const result = await this.client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    `);

    return result.rows.map(row => row.tablename);
  }

  /**
   * Reset sequences
   */
  async resetSequences(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const sequences = await this.getSequences();

    for (const sequence of sequences) {
      await this.client.query(`ALTER SEQUENCE ${sequence} RESTART WITH 1;`);
    }
  }

  /**
   * Get all sequence names
   */
  private async getSequences(): Promise<string[]> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const result = await this.client.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `);

    return result.rows.map(row => row.sequence_name);
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not connected');
    }
    await this.client.query('BEGIN');
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not connected');
    }
    await this.client.query('ROLLBACK');
  }

  /**
   * Commit transaction
   */
  async commit(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not connected');
    }
    await this.client.query('COMMIT');
  }
}

/**
 * Setup database cleaner with automatic cleanup
 */
export const setupDatabaseCleaner = (pool: Pool): DatabaseCleaner => {
  const cleaner = new DatabaseCleaner(pool);

  beforeAll(async () => {
    await cleaner.connect();
  });

  afterAll(async () => {
    await cleaner.disconnect();
  });

  beforeEach(async () => {
    await cleaner.beginTransaction();
  });

  afterEach(async () => {
    await cleaner.rollback();
  });

  return cleaner;
};
