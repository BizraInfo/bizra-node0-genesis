/**
 * BIZRA Unified API Gateway - Universal Entry Point
 * Synthesizes all 6 northstar files into single orchestration hub
 */

const express = require("express");
const SphereOrchestrator = require("./sphere-orchestrator");
const SelfHealing = require("./self-healing");
const MemoryManager = require("./memory-manager");
const HyperGraphRAG = require("./hypergraph-rag");
const NeuralOrchestrator = require("./neural-orchestrator");

class UnifiedAPIGateway {
  constructor() {
    this.app = express();
    this.sphereOrchestrator = new SphereOrchestrator();
    this.selfHealing = new SelfHealing();
    this.memoryManager = new MemoryManager();
    this.hyperGraphRAG = new HyperGraphRAG();
    this.neuralOrchestrator = new NeuralOrchestrator();

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(this.selfHealing.wrapWithRecovery.bind(this.selfHealing));
  }

  setupRoutes() {
    // Universal query router - aggregates 87 MCP tools + 508 specs
    this.app.post("/unified/query", async (req, res) => {
      const { query, sphere, context } = req.body;

      try {
        const result = await this.sphereOrchestrator.route(query, sphere);
        await this.memoryManager.store(query, result, "L3"); // Episodic
        res.json({ status: "success", result });
      } catch (error) {
        const recovered = await this.selfHealing.recover(error, req);
        res
          .status(recovered ? 200 : 500)
          .json(recovered || { error: error.message });
      }
    });

    // Multi-agent workflow execution
    this.app.post("/unified/execute", async (req, res) => {
      const { workflow, agents, priority } = req.body;

      try {
        const execution = await this.sphereOrchestrator.executeWorkflow(
          workflow,
          agents,
        );
        res.json({
          status: "executing",
          executionId: execution.id,
          agents: execution.agents,
        });
      } catch (error) {
        const recovered = await this.selfHealing.recover(error, req);
        res
          .status(recovered ? 200 : 500)
          .json(recovered || { error: error.message });
      }
    });

    // HyperGraph knowledge access with φ-aligned RAG
    this.app.get("/unified/knowledge", async (req, res) => {
      const { search, depth, phi_aligned, algorithm, max_nodes } = req.query;

      try {
        const knowledge = await this.hyperGraphRAG.query(search, {
          depth: parseInt(depth) || 3,
          phiAligned: phi_aligned !== "false",
          algorithm: algorithm || "phi-spiral",
          maxNodes: parseInt(max_nodes) || 50,
        });
        res.json({
          status: "success",
          knowledge,
          nodeCount: knowledge.nodes.length,
          edgeCount: knowledge.edges.length,
        });
      } catch (error) {
        const recovered = await this.selfHealing.recover(error, req);
        res
          .status(recovered ? 200 : 500)
          .json(recovered || { error: error.message });
      }
    });

    // HyperGraph semantic search
    this.app.post("/unified/knowledge/semantic", async (req, res) => {
      const { query, limit } = req.body;

      try {
        const results = await this.hyperGraphRAG.semanticSearch(query, limit);
        res.json({ status: "success", results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // HyperGraph statistics
    this.app.get("/unified/knowledge/stats", async (req, res) => {
      try {
        const stats = await this.hyperGraphRAG.getStats();
        res.json({ status: "success", stats });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 5-layer memory persistence
    this.app.post("/unified/memory/store", async (req, res) => {
      const { content, layer, importance } = req.body;

      try {
        const stored = await this.memoryManager.store(
          content,
          null,
          layer,
          importance,
        );
        res.json({
          status: "stored",
          layer,
          id: stored.id,
          storage: stored.storage || "unknown",
          phiScaled: stored.phiScaled,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Memory consolidation endpoint
    this.app.post("/unified/memory/consolidate", async (req, res) => {
      try {
        const report = await this.memoryManager.consolidateMemories();
        res.json({
          status: "success",
          consolidation: report,
          message: "φ-aligned memory consolidation completed",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Semantic memory retrieval
    this.app.get("/unified/memory/recall", async (req, res) => {
      const { query, layer, limit } = req.query;

      try {
        const memories = await this.memoryManager.recall(
          query,
          layer,
          limit || 10,
        );
        res.json({ status: "success", memories, count: memories.length });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Self-healing trigger
    this.app.post("/unified/heal", async (req, res) => {
      const { component, strategy } = req.body;

      try {
        const healing = await this.selfHealing.trigger(component, strategy);
        res.json({
          status: "healing",
          strategy: healing.strategy,
          recovered: healing.success,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Sphere-specific operations
    this.app.post("/unified/sphere/:sphereId", async (req, res) => {
      const { sphereId } = req.params;
      const operation = req.body;

      try {
        const result = await this.sphereOrchestrator.executeSphereOperation(
          sphereId,
          operation,
        );
        res.json({ status: "success", sphere: sphereId, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Setup neural network routes
    const setupNeuralRoutes = require("./api-gateway-neural-routes");
    setupNeuralRoutes(this.app, this.neuralOrchestrator, this.selfHealing);

    // Health check with full system status
    this.app.get("/unified/health", async (req, res) => {
      const health = {
        status: "healthy",
        version: "v2.3.0-unified-phase1c-neural",
        spheres: await this.sphereOrchestrator.getHealth(),
        memory: await this.memoryManager.getHealth(),
        selfHealing: this.selfHealing.getStats(),
        hyperGraph: await this.hyperGraphRAG.getStats(),
        neural: this.neuralOrchestrator.getStats(),
        timestamp: new Date().toISOString(),
      };
      res.json(health);
    });
  }

  async start(port = 8080) {
    await this.memoryManager.initialize();
    await this.sphereOrchestrator.initialize();
    await this.hyperGraphRAG.initialize();

    this.app.listen(port, () => {
      console.log(`🚀 BIZRA Unified API Gateway running on port ${port}`);
      console.log(`📊 Three-Sphere Consciousness: ACTIVE`);
      console.log(`🔧 Self-Healing Recovery: ARMED`);
      console.log(`🧠 5-Layer Memory: INITIALIZED`);
      console.log(`🕸️  HyperGraph RAG: CONNECTED`);
    });
  }
}

module.exports = UnifiedAPIGateway;
