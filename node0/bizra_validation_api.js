// BIZRA NODE0 Entry Point
// v2.2.0-rc1 Alpha Testnet - Genesis Validation System
// Purpose: Bootstrap BIZRA validation API with Rust PoI core + P2P Mesh Network + WebSocket Live Updates

const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const { createP2PRouter } = require("./p2p_api_routes");
const { createConsensusRouter } = require("./consensus_api_routes");
const { createValidatorRouter } = require("./validator_api_routes");
const { createMetricsHandler } = require("./prometheus_bridge");
const { WebSocketServer } = require("./websocket_server");
const { createObservabilityMiddleware } = require("./observability_middleware");

console.log("[NODE0] BIZRA Validation API v2.2.0-rc1");
console.log("[NODE0] Starting BIZRA Node with Rust PoI core + Consensus...");
console.log("[NODE0] Environment:", process.env.NODE_ENV || "production");

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 8080;
const METRICS_PORT = process.env.METRICS_PORT || 9464;

// Middleware
app.use(express.json());
app.use(createObservabilityMiddleware());

// Initialize P2P mesh network (Genesis Mesh Implementation)
const GenesisMesh = require("./p2p/genesis_mesh");
const meshNetwork = new GenesisMesh(process.env.NODE_ID);
meshNetwork.start();

// Initialize GoT Service (Threaded AI)
const GoTService = require("./ai/got_service");
const gotService = new GoTService();

// Initialize Cultural Adapter (Ethics)
const CulturalAdapter = require("./ai/cultural_adapter");
const culturalAdapter = new CulturalAdapter();
culturalAdapter.injectPerspective(gotService);

// Initialize Sharding Manager (Consensus)
const ShardingManager = require("./consensus/sharding_manager");
const shardingManager = new ShardingManager(meshNetwork);
shardingManager.initialize();

// Initialize consensus manager (placeholder for Rust integration)
const consensusManager = null; // Will be initialized when Rust NAPI bindings are ready

// Initialize validator registry (NAPI-RS Rust integration)
let validatorRegistry = null;
try {
  const {
    ValidatorRegistryNapi,
    getVersion,
  } = require("../rust/validator_napi");
  validatorRegistry = new ValidatorRegistryNapi();
  const version = getVersion();
  console.log("[NODE0] Validator Registry initialized via NAPI-RS:", version);
} catch (error) {
  console.warn("[NODE0] Failed to load validator NAPI module:", error.message);
  console.warn("[NODE0] Falling back to placeholder mode");
}

// Mount API routes
app.use("/api/p2p", createP2PRouter(meshNetwork));
app.use("/api/consensus", createConsensusRouter(consensusManager));
app.use("/api/validator", createValidatorRouter(validatorRegistry));

// Federation Mesh topology endpoint
const { getMeshTopology } = require('./routes/mesh_topology');
app.get('/api/mesh/topology', getMeshTopology);

// Federation Mesh events endpoint
const meshEventsRouter = require('./routes/mesh_events');
app.use('/api', meshEventsRouter);

// SAPE Elevation API
// Exposes the internal self-healing state for dashboard visualization
const SelfHealing = require("./unified/self-healing");
const selfHealingInstance = new SelfHealing();
app.get("/api/sape/state", (req, res) => {
  res.json({
    elevationConfig: selfHealingInstance.elevationConfig,
    circuitBreaker: selfHealingInstance.circuitBreaker,
    timestamp: new Date().toISOString(),
  });
});

// GoT Insight API (Threaded)
app.post("/api/ai/insight", async (req, res) => {
  try {
    const { context } = req.body;
    const insight = await gotService.process(context || "System Status Check");
    res.json({ insight, snr: 0.95, engine: "GoT-Threaded" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System metrics routes (real-time CPU, RAM, GPU, Storage)
const { createSystemMetricsRouter } = require("./system_metrics_api");
app.use("/api/system", createSystemMetricsRouter());

// Evidence routes (PoI attestations)
require("./routes/evidence")(app);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    version: "v2.2.0-rc1",
    timestamp: new Date().toISOString(),
    rustEnabled: process.env.BIZRA_USE_RUST === "true",
  });
});

// Readiness probe
app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    version: "v2.2.0-rc1",
    timestamp: new Date().toISOString(),
  });
});

// Prometheus metrics endpoint (OpenMetrics format)
app.get("/metrics", createMetricsHandler());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "BIZRA Node v2.2.0-rc1",
    status: "running",
    chainId: process.env.CHAIN_ID || "bizra-testnet-001",
    features: {
      rustPoI: process.env.BIZRA_USE_RUST === "true",
      p2pMesh: true,
      consensus: true,
      validator: true,
      genesisActivated: true,
    },
    endpoints: {
      health: "/health",
      ready: "/ready",
      metrics: "/metrics",
      p2p: {
        status: "/api/p2p/status",
        peers: "/api/p2p/peers",
        metrics: "/api/p2p/metrics",
        stats: "/api/p2p/stats",
        health: "/api/p2p/health",
      },
      consensus: {
        status: "/api/consensus/status",
        tipset: "/api/consensus/tipset",
        finality: "/api/consensus/finality/:hash",
        block: "/api/consensus/block/:hash",
        genesis: "/api/consensus/genesis",
        stats: "/api/consensus/stats",
        health: "/api/consensus/health",
      },
      validator: {
        register: "/api/validator/register",
        getValidator: "/api/validator/:id",
        list: "/api/validator/list",
        stats: "/api/validator/stats",
        submitAttestation: "/api/validator/attestation/submit",
        verifyAttestation: "/api/validator/attestation/verify",
        getAttestation: "/api/validator/attestation/:id",
        epochSummary: "/api/validator/epoch/:n/summary",
      },
      evidence: {
        latest: "/evidence/latest",
        list: "/evidence/list",
      },
    },
  });
});

// Create HTTP server (required for WebSocket upgrade)
const httpServer = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(httpServer, {
  path: "/ws/live-updates",
  heartbeatInterval: 30000,
  ahsanThreshold: 95.0,
});

// Start server
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[NODE0] HTTP Server listening on port ${PORT}`);
  console.log(`[NODE0] Health check: http://localhost:${PORT}/health`);
  console.log(`[NODE0] Metrics: http://localhost:${PORT}/metrics`);
  console.log(`[NODE0] WebSocket: ws://localhost:${PORT}/ws/live-updates`);
  console.log("[NODE0] BIZRA Node v2.2.0-rc1 initialized successfully");
});

// Broadcast Ahsan/Ihsan score updates every 30 seconds
setInterval(() => {
  const metrics = wsServer.getMetrics();
  wsServer.broadcastAhsanScore(metrics.ahsan, {
    activeConnections: metrics.activeConnections,
    messagesSent: metrics.messagesSent,
    errors: metrics.errors,
  });

  // Write runtime metrics for Prometheus bridge
  try {
    const runtimeMetrics = {
      timestamp: new Date().toISOString(),
      ihsan_score: metrics.ahsan,
      snr_score: 0.95, // Baseline SNR until GoT integration is deeper
      active_connections: metrics.activeConnections,
      messages_sent: metrics.messagesSent,
      errors: metrics.errors,
      node_id: process.env.NODE_ID || "node-0"
    };
    fs.writeFileSync(path.join(__dirname, "runtime_metrics.json"), JSON.stringify(runtimeMetrics, null, 2));
  } catch (err) {
    console.error("[NODE0] Failed to write runtime metrics:", err.message);
  }
}, 5000); // Update metrics file every 5s (broadcast is 30s, but we want faster metrics)

// Handle graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`[NODE0] ${signal} received, shutting down gracefully...`);

  // Shutdown WebSocket server first
  await wsServer.shutdown();

  // Close HTTP server
  httpServer.close(() => {
    console.log("[NODE0] HTTP server closed");
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error("[NODE0] Forceful shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Export for use in other modules
module.exports = { app, httpServer, wsServer };
