/**
 * 5-Layer Memory Architecture
 * L1: Redis (50ms reactive)
 * L2: Postgres (200ms analytical)
 * L3: Neo4j HyperGraph (1000ms strategic)
 * L4: Semantic cross-domain
 * L5: LangGraph procedural (2000ms meta-cognitive)
 */

const redis = require("redis");
const { Client } = require("pg");

class MemoryManager {
  constructor() {
    this.layers = {
      L1: { name: "Immediate", latency: 50, storage: "Redis" },
      L2: { name: "Working", latency: 200, storage: "Postgres" },
      L3: { name: "Episodic", latency: 1000, storage: "Neo4j+ChromaDB" },
      L4: { name: "Semantic", latency: "variable", storage: "HyperGraph" },
      L5: { name: "Procedural", latency: 2000, storage: "LangGraph" },
    };

    this.redisClient = null;
    this.pgClient = null;
    this.phiRatio = 1.618033988749; // Golden ratio
  }

  async initialize() {
    // Initialize Redis (L1)
    try {
      const redisConfig = {
        socket: {
          host: "localhost",
          port: 6379,
        },
      };

      // Add password if provided
      const redisPassword = process.env.REDIS_PASSWORD;
      if (redisPassword) {
        redisConfig.password = redisPassword;
      }

      this.redisClient = redis.createClient(redisConfig);
      await this.redisClient.connect();
      console.log("✅ L1 Memory (Redis) connected");
    } catch (err) {
      console.warn("⚠️  L1 Memory (Redis) unavailable:", err.message);
    }

    // Initialize Postgres (L2)
    try {
      // Use DATABASE_URL with explicit SSL settings for Docker
      if (process.env.DATABASE_URL) {
        this.pgClient = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: false, // Disable SSL for local Docker connections
        });
      } else {
        this.pgClient = new Client({
          host: "localhost",
          port: 5432,
          user: "postgres",
          password: "postgres",
          database: "bizra",
          ssl: false,
        });
      }
      await this.pgClient.connect();
      await this.createL2Schema();
      console.log("✅ L2 Memory (Postgres) connected");
    } catch (err) {
      console.warn("⚠️  L2 Memory (Postgres) unavailable:", err.message);
      this.pgClient = null; // Set to null on failure
    }

    // Initialize L3-L5 (Neo4j, ChromaDB, LangGraph)
    await this.initializeL3toL5();
  }

  async initializeL3toL5() {
    // L3: Neo4j Episodic Memory
    try {
      const neo4j = require("neo4j-driver");
      this.neo4jDriver = neo4j.driver(
        process.env.NEO4J_URI || "bolt://localhost:7687",
        neo4j.auth.basic(
          process.env.NEO4J_USER || "neo4j",
          process.env.NEO4J_PASSWORD || "bizra2025",
        ),
      );

      // Verify connection
      const session = this.neo4jDriver.session();
      await session.run("RETURN 1");
      await session.close();

      console.log("✅ L3 Memory (Neo4j Episodic) connected");
      this.l3Available = true;
    } catch (err) {
      console.warn("⚠️  L3 Memory (Neo4j) unavailable:", err.message);
      this.l3Available = false;
    }

    // L4: ChromaDB Semantic Memory (via HTTP API)
    try {
      this.chromaClient = {
        host: process.env.CHROMA_HOST || "localhost",
        port: process.env.CHROMA_PORT || 8000,
        available: false,
      };

      // Try to ping ChromaDB
      const http = require("http");
      const pingPromise = new Promise((resolve, reject) => {
        const req = http.get(
          `http://${this.chromaClient.host}:${this.chromaClient.port}/api/v1/heartbeat`,
          (res) => {
            if (res.statusCode === 200) {
              resolve(true);
            } else {
              reject(new Error(`ChromaDB returned ${res.statusCode}`));
            }
          },
        );
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error("ChromaDB timeout"));
        });
      });

      await pingPromise;
      this.chromaClient.available = true;
      console.log("✅ L4 Memory (ChromaDB Semantic) connected");
    } catch (err) {
      console.warn("⚠️  L4 Memory (ChromaDB) unavailable:", err.message);
      this.chromaClient.available = false;
    }

    // L5: LangGraph Procedural Memory (initialized later on first use)
    this.langGraphStore = new Map(); // In-memory fallback
    console.log("✅ L5 Memory (LangGraph Procedural) initialized (in-memory)");
  }

  async createL2Schema() {
    await this.pgClient.query(`
      CREATE TABLE IF NOT EXISTS session_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        context JSONB,
        causal_events JSONB[],
        rl_feedback JSONB,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  async store(query, result, layer = "L3", importance = 0.5) {
    const timestamp = Date.now();
    const memoryObject = {
      query,
      result,
      layer,
      importance,
      timestamp,
      phiScaled: this.calculatePhiScaling(importance),
    };

    switch (layer) {
      case "L1":
        return this.storeL1(memoryObject);
      case "L2":
        return this.storeL2(memoryObject);
      case "L3":
      case "L4":
      case "L5":
        return this.storeL3Plus(memoryObject, layer);
      default:
        throw new Error(`Invalid memory layer: ${layer}`);
    }
  }

  async storeL1(memory) {
    // L1: Immediate memory in Redis (last 10 exchanges)
    if (!this.redisClient) return { id: "l1-unavailable", layer: "L1" };

    const key = `l1:immediate:${memory.timestamp}`;
    await this.redisClient.setEx(key, 3600, JSON.stringify(memory)); // 1 hour TTL

    // Keep only last 10
    const keys = await this.redisClient.keys("l1:immediate:*");
    if (keys.length > 10) {
      const oldestKeys = keys.sort().slice(0, keys.length - 10);
      await Promise.all(oldestKeys.map((k) => this.redisClient.del(k)));
    }

    return { id: key, layer: "L1", ttl: 3600 };
  }

  async storeL2(memory) {
    // L2: Working memory in Postgres (session + RL feedback)
    if (!this.pgClient) return { id: "l2-unavailable", layer: "L2" };

    const result = await this.pgClient.query(
      `INSERT INTO session_memory (context, causal_events, rl_feedback)
       VALUES ($1, $2, $3) RETURNING id`,
      [
        JSON.stringify(memory),
        [{ event: "memory_store", timestamp: memory.timestamp }],
        { importance: memory.importance },
      ],
    );

    return { id: result.rows[0].id, layer: "L2" };
  }

  async storeL3Plus(memory, layer) {
    switch (layer) {
      case "L3":
        return this.storeL3Episodic(memory);
      case "L4":
        return this.storeL4Semantic(memory);
      case "L5":
        return this.storeL5Procedural(memory);
      default:
        throw new Error(`Invalid layer: ${layer}`);
    }
  }

  async storeL3Episodic(memory) {
    // L3: Neo4j graph storage with temporal decay
    if (!this.l3Available || !this.neo4jDriver) {
      return {
        id: `l3-unavailable-${Date.now()}`,
        layer: "L3",
        status: "fallback",
        message: "Neo4j unavailable - memory not persisted to graph",
      };
    }

    const session = this.neo4jDriver.session();
    try {
      const memoryId = `mem-${Date.now()}`;
      const result = await session.run(
        `CREATE (m:Memory {
          id: $id,
          query: $query,
          result: $result,
          importance: $importance,
          phi_scaled: $phiScaled,
          timestamp: datetime(),
          decay_factor: $decayFactor
        })
        RETURN m.id as id`,
        {
          id: memoryId,
          query: JSON.stringify(memory.query),
          result: JSON.stringify(memory.result),
          importance: memory.importance,
          phiScaled: memory.phiScaled,
          decayFactor: Math.exp(-memory.importance * this.phiRatio), // Exponential decay
        },
      );

      return {
        id: result.records[0].get("id"),
        layer: "L3",
        status: "stored",
        storage: "Neo4j",
      };
    } catch (err) {
      console.error("L3 storage error:", err.message);
      return {
        id: `l3-error-${Date.now()}`,
        layer: "L3",
        status: "error",
        error: err.message,
      };
    } finally {
      await session.close();
    }
  }

  async storeL4Semantic(memory) {
    // L4: ChromaDB vector embedding storage
    if (!this.chromaClient?.available) {
      return {
        id: `l4-unavailable-${Date.now()}`,
        layer: "L4",
        status: "fallback",
        message: "ChromaDB unavailable - semantic embedding not created",
      };
    }

    const memoryId = `sem-${Date.now()}`;

    // In production, this would POST to ChromaDB API
    // For now, return pending status
    return {
      id: memoryId,
      layer: "L4",
      status: "pending",
      message: "ChromaDB API integration queued",
      embedding: {
        host: this.chromaClient.host,
        port: this.chromaClient.port,
        collection: "bizra_semantic_memory",
      },
    };
  }

  async storeL5Procedural(memory) {
    // L5: LangGraph workflow state storage
    const workflowId = `wf-${Date.now()}`;

    const workflow = {
      id: workflowId,
      query: memory.query,
      result: memory.result,
      importance: memory.importance,
      phiScaled: memory.phiScaled,
      timestamp: Date.now(),
      state: "completed",
      steps: memory.steps || [],
    };

    this.langGraphStore.set(workflowId, workflow);

    return {
      id: workflowId,
      layer: "L5",
      status: "stored",
      storage: "LangGraph (in-memory)",
      workflowState: "completed",
    };
  }

  async recall(query, layer = "L3", limit = 10) {
    switch (layer) {
      case "L1":
        return this.recallL1(query, limit);
      case "L2":
        return this.recallL2(query, limit);
      case "L3":
      case "L4":
      case "L5":
        return this.recallL3Plus(query, layer, limit);
      default:
        throw new Error(`Invalid memory layer: ${layer}`);
    }
  }

  async recallL1(query, limit) {
    if (!this.redisClient) return [];

    const keys = await this.redisClient.keys("l1:immediate:*");
    const memories = await Promise.all(
      keys.slice(-limit).map(async (k) => {
        const data = await this.redisClient.get(k);
        return JSON.parse(data);
      }),
    );

    return memories.filter((m) => m.query && m.query.includes(query));
  }

  async recallL2(query, limit) {
    if (!this.pgClient) return [];

    const result = await this.pgClient.query(
      `SELECT * FROM session_memory
       WHERE context::text ILIKE $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [`%${query}%`, limit],
    );

    return result.rows;
  }

  async recallL3Plus(query, layer, limit) {
    switch (layer) {
      case "L3":
        return this.recallL3Episodic(query, limit);
      case "L4":
        return this.recallL4Semantic(query, limit);
      case "L5":
        return this.recallL5Procedural(query, limit);
      default:
        throw new Error(`Invalid layer: ${layer}`);
    }
  }

  async recallL3Episodic(query, limit) {
    if (!this.l3Available || !this.neo4jDriver) {
      return [];
    }

    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH (m:Memory)
         WHERE m.query CONTAINS $query
         WITH m,
              duration.between(m.timestamp, datetime()).days as daysSince,
              m.importance * exp(-daysSince * 0.1 * $phi) as decayedImportance
         WHERE decayedImportance > 0.3
         RETURN m.id as id,
                m.query as query,
                m.result as result,
                m.importance as importance,
                decayedImportance,
                m.timestamp as timestamp
         ORDER BY decayedImportance DESC
         LIMIT $limit`,
        {
          query,
          limit: parseInt(limit),
          phi: this.phiRatio,
        },
      );

      return result.records.map((record) => ({
        id: record.get("id"),
        query: JSON.parse(record.get("query")),
        result: JSON.parse(record.get("result")),
        importance: record.get("importance"),
        decayedImportance: record.get("decayedImportance"),
        timestamp: record.get("timestamp"),
        layer: "L3",
      }));
    } catch (err) {
      console.error("L3 recall error:", err.message);
      return [];
    } finally {
      await session.close();
    }
  }

  async recallL4Semantic(query, limit) {
    if (!this.chromaClient?.available) {
      return [];
    }

    // ChromaDB semantic search would go here
    return [
      {
        layer: "L4",
        query,
        status: "pending",
        message: "ChromaDB semantic search API integration queued",
      },
    ];
  }

  async recallL5Procedural(query, limit) {
    // Search in-memory LangGraph workflows
    const workflows = Array.from(this.langGraphStore.values())
      .filter((wf) => {
        const queryStr = JSON.stringify(wf.query).toLowerCase();
        return queryStr.includes(query.toLowerCase());
      })
      .sort((a, b) => b.phiScaled - a.phiScaled)
      .slice(0, limit);

    return workflows.map((wf) => ({
      id: wf.id,
      query: wf.query,
      result: wf.result,
      importance: wf.importance,
      workflowState: wf.state,
      steps: wf.steps,
      layer: "L5",
    }));
  }

  async queryKnowledge(search, options = {}) {
    // HyperGraph RAG query placeholder
    return {
      query: search,
      nodes: [],
      edges: [],
      phiAligned: options.phiAligned,
      depth: options.depth || 3,
      message:
        "HyperGraph integration queued - will query 500k files + 508 specs",
    };
  }

  calculatePhiScaling(importance) {
    // Fibonacci-style φ-scaled consolidation
    // Higher importance = longer retention with golden ratio spacing
    const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34];
    const index = Math.floor(importance * (fibSequence.length - 1));
    return fibSequence[index] * this.phiRatio;
  }

  async getHealth() {
    return {
      L1: {
        connected: !!this.redisClient,
        latency: 50,
        storage: "Redis",
        type: "Immediate/Reactive",
      },
      L2: {
        connected: !!this.pgClient,
        latency: 200,
        storage: "PostgreSQL",
        type: "Working/Analytical",
      },
      L3: {
        connected: this.l3Available || false,
        latency: 1000,
        storage: "Neo4j",
        type: "Episodic/Graph",
        temporalDecay: "φ-aligned exponential",
      },
      L4: {
        connected: this.chromaClient?.available || false,
        latency: "variable",
        storage: "ChromaDB",
        type: "Semantic/Vector",
        host: this.chromaClient?.host,
        port: this.chromaClient?.port,
      },
      L5: {
        connected: !!this.langGraphStore,
        latency: 2000,
        storage: "LangGraph (in-memory)",
        type: "Procedural/Workflow",
        workflowCount: this.langGraphStore?.size || 0,
      },
      phiRatio: this.phiRatio,
      consolidation: "φ-scaled Fibonacci patterns",
    };
  }

  async consolidateMemories() {
    // φ-aligned memory consolidation across layers
    // Move memories from L1 → L2 → L3 → L4 → L5 based on importance and time

    const consolidationReport = {
      timestamp: Date.now(),
      phiRatio: this.phiRatio,
      moved: {
        L1toL2: 0,
        L2toL3: 0,
        L3toL4: 0,
        L4toL5: 0,
      },
    };

    // L1 → L2: Move high-importance immediate memories to working memory
    if (this.redisClient && this.pgClient) {
      try {
        const keys = await this.redisClient.keys("l1:immediate:*");
        for (const key of keys) {
          const data = await this.redisClient.get(key);
          const memory = JSON.parse(data);

          if (memory.importance > 0.6) {
            await this.storeL2(memory);
            consolidationReport.moved.L1toL2++;
          }
        }
      } catch (err) {
        console.error("L1→L2 consolidation error:", err.message);
      }
    }

    // L2 → L3: Move analytical insights to episodic graph
    if (this.pgClient && this.l3Available) {
      try {
        const result = await this.pgClient.query(
          `SELECT * FROM session_memory
           WHERE (context->>'importance')::float > 0.7
           AND timestamp < NOW() - INTERVAL '1 hour'
           LIMIT 10`,
        );

        for (const row of result.rows) {
          const context = row.context;
          await this.storeL3Episodic({
            query: context.query,
            result: context.result,
            importance: context.importance,
            phiScaled: context.importance * this.phiRatio,
          });
          consolidationReport.moved.L2toL3++;
        }
      } catch (err) {
        console.error("L2→L3 consolidation error:", err.message);
      }
    }

    return consolidationReport;
  }
}

module.exports = MemoryManager;
