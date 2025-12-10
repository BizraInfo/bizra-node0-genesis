/**
 * BIZRA Unified System - Main Entry Point
 * Launches complete 6-file synthesized architecture
 */

require("dotenv").config();
const UnifiedAPIGateway = require("./api-gateway");

async function main() {
  console.log("🚀 BIZRA Unified System - Initializing...\n");

  const gateway = new UnifiedAPIGateway();
  await gateway.start(8080);

  console.log(
    "\n✅ System Ready - All 6 Northstar Files Synthesized + Neural Integration",
  );
  console.log("📍 Unified Entry Point: http://localhost:8080");
  console.log("\n📚 Core Endpoints:");
  console.log("  POST /unified/query - Universal query router");
  console.log("  POST /unified/execute - Multi-agent workflows");
  console.log("  GET  /unified/health - System status");
  console.log("\n🕸️  HyperGraph RAG:");
  console.log("  GET  /unified/knowledge - φ-aligned RAG query");
  console.log("  POST /unified/knowledge/semantic - Semantic search");
  console.log("  GET  /unified/knowledge/stats - Graph statistics");
  console.log("\n🧠 Memory System (5-Layer φ-Aligned):");
  console.log("  POST /unified/memory/store - L1-L5 persistence");
  console.log("  GET  /unified/memory/recall - L1-L5 semantic retrieval");
  console.log("  POST /unified/memory/consolidate - φ-aligned consolidation");
  console.log("\n🤖 Neural Networks:");
  console.log("  GET  /unified/neural/templates - List φ-aligned templates");
  console.log("  POST /unified/neural/train - Train model from template");
  console.log("  GET  /unified/neural/status/:jobId - Training job status");
  console.log(
    "  POST /unified/neural/cluster/create - Create distributed cluster",
  );
  console.log(
    "  POST /unified/neural/cluster/:id/deploy - Deploy cluster node",
  );
  console.log(
    "  POST /unified/neural/cluster/:id/train - Start distributed training",
  );
  console.log(
    "  POST /unified/neural/integrate/hypergraph - Integrate with HyperGraph",
  );
  console.log(
    "  POST /unified/neural/integrate/memory - Integrate with Memory",
  );
  console.log("\n🔧 Self-Healing:");
  console.log("  POST /unified/heal - Self-healing trigger");
  console.log("\n📊 Setup Commands:");
  console.log("  Neo4j:  .\\BIZRA-DATA\\scripts\\setup-neo4j.bat");
  console.log(
    "  Populate: python BIZRA-DATA/scripts/populate-knowledge-graph.py\n",
  );
}

main().catch((err) => {
  console.error("❌ Startup failed:", err);
  process.exit(1);
});
