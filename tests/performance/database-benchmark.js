/**
 * Database Performance Benchmark Suite
 * Target: <50ms query execution time (p95)
 *
 * Run with: node database-benchmark.js
 */

const { Pool } = require('pg');
const { performance } = require('perf_hooks');

// Benchmark configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  min: 5,
};

// Test parameters
const WARMUP_ITERATIONS = 100;
const TEST_ITERATIONS = 1000;
const CONCURRENT_QUERIES = 50;

// Results storage
const results = {
  warmup: [],
  sequential: [],
  concurrent: [],
  transactions: [],
  prepared: [],
  cursors: [],
};

class DatabaseBenchmark {
  constructor() {
    this.pool = new Pool(config);
  }

  async initialize() {
    console.log('Initializing database benchmark...\n');

    // Create test tables
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS benchmark_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS benchmark_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES benchmark_users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON benchmark_users(email);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON benchmark_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON benchmark_posts(created_at);
    `);

    // Seed test data
    await this.seedData();

    console.log('Database benchmark initialized\n');
  }

  async seedData() {
    console.log('Seeding test data...');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert test users (batch)
      const userValues = [];
      for (let i = 0; i < 1000; i++) {
        userValues.push(`('user${i}@example.com', 'User ${i}')`);
      }

      await client.query(`
        INSERT INTO benchmark_users (email, name)
        VALUES ${userValues.join(', ')}
        ON CONFLICT (email) DO NOTHING
      `);

      // Insert test posts (batch)
      const postValues = [];
      for (let i = 0; i < 10000; i++) {
        const userId = Math.floor(Math.random() * 1000) + 1;
        postValues.push(`(${userId}, 'Post ${i}', 'Content for post ${i}')`);
      }

      await client.query(`
        INSERT INTO benchmark_posts (user_id, title, content)
        VALUES ${postValues.join(', ')}
      `);

      await client.query('COMMIT');
      console.log('Test data seeded\n');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async runWarmup() {
    console.log(`Running warmup (${WARMUP_ITERATIONS} iterations)...`);

    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      await this.pool.query('SELECT 1');
    }

    console.log('Warmup complete\n');
  }

  async benchmarkSequentialQueries() {
    console.log(`Benchmarking sequential queries (${TEST_ITERATIONS} iterations)...`);

    const queries = [
      'SELECT * FROM benchmark_users WHERE id = $1',
      'SELECT * FROM benchmark_posts WHERE user_id = $1 LIMIT 10',
      'SELECT u.*, COUNT(p.id) as post_count FROM benchmark_users u LEFT JOIN benchmark_posts p ON u.id = p.user_id WHERE u.id = $1 GROUP BY u.id',
    ];

    for (const query of queries) {
      const times = [];

      for (let i = 0; i < TEST_ITERATIONS; i++) {
        const userId = Math.floor(Math.random() * 1000) + 1;

        const start = performance.now();
        await this.pool.query(query, [userId]);
        const duration = performance.now() - start;

        times.push(duration);
      }

      results.sequential.push({
        query: query.substring(0, 50) + '...',
        ...this.calculateStats(times),
      });
    }

    console.log('Sequential queries benchmark complete\n');
  }

  async benchmarkConcurrentQueries() {
    console.log(`Benchmarking concurrent queries (${CONCURRENT_QUERIES} concurrent)...`);

    const times = [];
    const iterations = Math.floor(TEST_ITERATIONS / CONCURRENT_QUERIES);

    for (let i = 0; i < iterations; i++) {
      const promises = [];

      const start = performance.now();

      for (let j = 0; j < CONCURRENT_QUERIES; j++) {
        const userId = Math.floor(Math.random() * 1000) + 1;
        promises.push(
          this.pool.query('SELECT * FROM benchmark_users WHERE id = $1', [userId])
        );
      }

      await Promise.all(promises);
      const duration = performance.now() - start;

      times.push(duration / CONCURRENT_QUERIES); // Average per query
    }

    results.concurrent.push({
      query: 'Concurrent user queries',
      concurrency: CONCURRENT_QUERIES,
      ...this.calculateStats(times),
    });

    console.log('Concurrent queries benchmark complete\n');
  }

  async benchmarkTransactions() {
    console.log('Benchmarking transactions...');

    const times = [];

    for (let i = 0; i < 100; i++) {
      const client = await this.pool.connect();

      try {
        const start = performance.now();

        await client.query('BEGIN');

        // Multiple operations in transaction
        const userId = Math.floor(Math.random() * 1000) + 1;
        await client.query('SELECT * FROM benchmark_users WHERE id = $1', [userId]);
        await client.query('UPDATE benchmark_users SET updated_at = NOW() WHERE id = $1', [userId]);
        await client.query('SELECT * FROM benchmark_posts WHERE user_id = $1 LIMIT 5', [userId]);

        await client.query('COMMIT');

        const duration = performance.now() - start;
        times.push(duration);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    results.transactions.push({
      operation: 'Multi-query transaction',
      ...this.calculateStats(times),
    });

    console.log('Transaction benchmark complete\n');
  }

  async benchmarkPreparedStatements() {
    console.log('Benchmarking prepared statements...');

    const client = await this.pool.connect();

    try {
      // Prepare statement
      await client.query({
        name: 'get_user',
        text: 'SELECT * FROM benchmark_users WHERE id = $1',
      });

      const times = [];

      for (let i = 0; i < TEST_ITERATIONS; i++) {
        const userId = Math.floor(Math.random() * 1000) + 1;

        const start = performance.now();
        await client.query({
          name: 'get_user',
          values: [userId],
        });
        const duration = performance.now() - start;

        times.push(duration);
      }

      results.prepared.push({
        query: 'Prepared statement query',
        ...this.calculateStats(times),
      });
    } finally {
      client.release();
    }

    console.log('Prepared statements benchmark complete\n');
  }

  async benchmarkCursors() {
    console.log('Benchmarking cursor-based pagination...');

    const client = await this.pool.connect();

    try {
      const times = [];

      for (let i = 0; i < 10; i++) {
        const start = performance.now();

        await client.query('BEGIN');
        await client.query('DECLARE test_cursor CURSOR FOR SELECT * FROM benchmark_posts ORDER BY id');

        let totalRows = 0;
        while (true) {
          const result = await client.query('FETCH 1000 FROM test_cursor');
          totalRows += result.rows.length;
          if (result.rows.length === 0) break;
        }

        await client.query('COMMIT');

        const duration = performance.now() - start;
        times.push(duration);
      }

      results.cursors.push({
        operation: 'Cursor-based pagination (10k records)',
        ...this.calculateStats(times),
      });
    } finally {
      client.release();
    }

    console.log('Cursor benchmark complete\n');
  }

  calculateStats(times) {
    times.sort((a, b) => a - b);

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;

    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    const min = times[0];
    const max = times[times.length - 1];

    return {
      avg: avg.toFixed(2),
      p50: p50.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      count: times.length,
    };
  }

  printResults() {
    console.log('\n==========================================');
    console.log('Database Performance Benchmark Results');
    console.log('==========================================\n');

    console.log('Target: p95 < 50ms\n');

    // Sequential queries
    console.log('Sequential Queries:');
    results.sequential.forEach(result => {
      const status = parseFloat(result.p95) < 50 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${result.query}`);
      console.log(`    avg: ${result.avg}ms | p50: ${result.p50}ms | p95: ${result.p95}ms | p99: ${result.p99}ms ${status}`);
    });
    console.log('');

    // Concurrent queries
    console.log('Concurrent Queries:');
    results.concurrent.forEach(result => {
      const status = parseFloat(result.p95) < 50 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${result.query} (${result.concurrency} concurrent)`);
      console.log(`    avg: ${result.avg}ms | p50: ${result.p50}ms | p95: ${result.p95}ms | p99: ${result.p99}ms ${status}`);
    });
    console.log('');

    // Transactions
    console.log('Transactions:');
    results.transactions.forEach(result => {
      const status = parseFloat(result.p95) < 100 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${result.operation}`);
      console.log(`    avg: ${result.avg}ms | p50: ${result.p50}ms | p95: ${result.p95}ms | p99: ${result.p99}ms ${status}`);
    });
    console.log('');

    // Prepared statements
    console.log('Prepared Statements:');
    results.prepared.forEach(result => {
      const status = parseFloat(result.p95) < 50 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${result.query}`);
      console.log(`    avg: ${result.avg}ms | p50: ${result.p50}ms | p95: ${result.p95}ms | p99: ${result.p99}ms ${status}`);
    });
    console.log('');

    // Cursors
    console.log('Cursor-Based Pagination:');
    results.cursors.forEach(result => {
      const status = parseFloat(result.p95) < 200 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${result.operation}`);
      console.log(`    avg: ${result.avg}ms | p50: ${result.p50}ms | p95: ${result.p95}ms | p99: ${result.p99}ms ${status}`);
    });
    console.log('');

    // Pool statistics
    console.log('Connection Pool Statistics:');
    console.log(`  Total connections: ${this.pool.totalCount}`);
    console.log(`  Idle connections: ${this.pool.idleCount}`);
    console.log(`  Waiting clients: ${this.pool.waitingCount}`);
    console.log('');

    // Summary
    const allP95s = [
      ...results.sequential.map(r => parseFloat(r.p95)),
      ...results.concurrent.map(r => parseFloat(r.p95)),
      ...results.prepared.map(r => parseFloat(r.p95)),
    ];

    const avgP95 = allP95s.reduce((a, b) => a + b, 0) / allP95s.length;
    const passCount = allP95s.filter(p95 => p95 < 50).length;
    const totalCount = allP95s.length;

    console.log('Overall Performance:');
    console.log(`  Average p95: ${avgP95.toFixed(2)}ms`);
    console.log(`  Tests passed: ${passCount}/${totalCount} (${((passCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`  Status: ${avgP95 < 50 ? '✓ PASS' : '✗ FAIL'}`);
    console.log('');
  }

  async cleanup() {
    console.log('Cleaning up...');

    await this.pool.query('DROP TABLE IF EXISTS benchmark_posts CASCADE');
    await this.pool.query('DROP TABLE IF EXISTS benchmark_users CASCADE');

    await this.pool.end();
    console.log('Cleanup complete');
  }

  async run() {
    try {
      await this.initialize();
      await this.runWarmup();

      await this.benchmarkSequentialQueries();
      await this.benchmarkConcurrentQueries();
      await this.benchmarkTransactions();
      await this.benchmarkPreparedStatements();
      await this.benchmarkCursors();

      this.printResults();

      // Save results to file
      const fs = require('fs');
      fs.writeFileSync(
        'benchmark-results.json',
        JSON.stringify(results, null, 2)
      );
      console.log('Results saved to benchmark-results.json\n');

    } catch (error) {
      console.error('Benchmark error:', error);
    } finally {
      // await this.cleanup();
      await this.pool.end();
    }
  }
}

// Run benchmark
const benchmark = new DatabaseBenchmark();
benchmark.run().catch(console.error);
