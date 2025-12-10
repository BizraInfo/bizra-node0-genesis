/**
 * P2P Network API Routes for BIZRA Node-0
 *
 * Provides REST API endpoints for monitoring and controlling the P2P mesh network.
 *
 * إحسان (Excellence) Standard: Professional-grade API design
 * - Clear endpoint structure
 * - Comprehensive error handling
 * - Prometheus-compatible metrics
 * - Real-time network status
 */

const express = require("express");

/**
 * Create P2P API router
 * @param {Object} meshNetwork - P2P mesh network instance (Rust integration)
 * @param {Object} logger - Logger instance
 * @returns {express.Router} Configured router
 */
function createP2PRouter(meshNetwork = null, logger = console) {
  const router = express.Router();

  /**
   * GET /api/p2p/status
   * Get overall P2P network status
   * Contract: Never throws 500, always returns JSON
   */
  router.get("/status", (req, res) => {
    try {
      if (!meshNetwork) {
        return res.status(200).json({
          agentId: 'unknown',
          status: 'initializing',
          peers: [],
          reason: 'mesh instance not available'
        });
      }

      // Use the safe getStatus method if available
      if (typeof meshNetwork.getStatus === 'function') {
          const status = meshNetwork.getStatus();
          return res.status(200).json(status);
      }

      // Fallback for legacy mesh objects (should not happen with new GenesisMesh)
      return res.status(200).json({
          agentId: meshNetwork.nodeId || 'unknown',
          status: 'degraded',
          peers: [],
          reason: 'legacy mesh object'
      });

    } catch (err) {
      logger.error('[P2P] status handler error', err);
      return res.status(200).json({
        agentId: meshNetwork?.agentId || 'unknown',
        status: 'degraded',
        peers: [],
        reason: 'status computation error'
      });
    }
  });

  /**
   * GET /api/p2p/peers
   * Get list of connected peers
   */
  router.get("/peers", async (req, res) => {
    try {
      if (!meshNetwork) {
        return res.json({
          listening: false,
          peers: [],
          count: 0,
          message: "P2P network not initialized",
        });
      }

      const peers = meshNetwork.connectedPeers();
      const stats = await meshNetwork.getStats();

      res.json({
        listening: await meshNetwork.isRunning(),
        peers: peers || [],
        count: peers ? peers.length : 0,
        stats: {
          connected_peers: stats.connected_peers,
          disconnected_peers: stats.disconnected_peers,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get peers",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/p2p/metrics
   * Get detailed network metrics (Prometheus compatible)
   */
  router.get("/metrics", async (req, res) => {
    try {
      if (!meshNetwork) {
        return res.json({
          error: "P2P network not initialized",
        });
      }

      const stats = await meshNetwork.getStats();

      // Prometheus-compatible format
      const metrics = {
        // Connection metrics
        p2p_connected_peers: stats.connected_peers,
        p2p_disconnected_peers_total: stats.disconnected_peers,

        // Message metrics
        p2p_messages_sent_total: stats.messages_sent,
        p2p_messages_received_total: stats.messages_received,
        p2p_bytes_sent_total: stats.bytes_sent,
        p2p_bytes_received_total: stats.bytes_received,

        // Latency metrics (milliseconds)
        p2p_latency_avg_ms: stats.avg_latency_ms,
        p2p_latency_p50_ms: stats.p50_latency_ms,
        p2p_latency_p95_ms: stats.p95_latency_ms,
        p2p_latency_p99_ms: stats.p99_latency_ms,

        // Throughput metrics
        p2p_messages_per_second: stats.messages_per_second || 0,
        p2p_bytes_per_second: stats.bytes_per_second || 0,

        // Connection quality
        p2p_connection_success_rate: stats.connection_success_rate,

        // Uptime
        p2p_uptime_seconds: stats.uptime_seconds,
      };

      // Return in both JSON and Prometheus text format based on Accept header
      if (req.accepts("text/plain")) {
        let prometheusText =
          "# HELP p2p_connected_peers Number of connected peers\n";
        prometheusText += "# TYPE p2p_connected_peers gauge\n";

        for (const [key, value] of Object.entries(metrics)) {
          prometheusText += `${key} ${value}\n`;
        }

        res.type("text/plain").send(prometheusText);
      } else {
        res.json(metrics);
      }
    } catch (error) {
      res.status(500).json({
        error: "Failed to get metrics",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/p2p/stats
   * Get comprehensive network statistics
   */
  router.get("/stats", async (req, res) => {
    try {
      if (!meshNetwork) {
        return res.json({
          error: "P2P network not initialized",
        });
      }

      const stats = await meshNetwork.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get stats",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/p2p/connect
   * Manually connect to a peer
   * Body: { peer_id: string, addresses: string[] }
   */
  router.post("/connect", async (req, res) => {
    try {
      if (!meshNetwork) {
        return res.status(503).json({
          error: "P2P network not initialized",
        });
      }

      const { peer_id, addresses } = req.body;

      if (!peer_id || !addresses || !Array.isArray(addresses)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "peer_id and addresses array required",
        });
      }

      // In real implementation, call meshNetwork.connect(peerInfo)
      // For now, return success placeholder
      res.json({
        success: true,
        message: "Connection initiated",
        peer_id,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to connect",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/p2p/disconnect
   * Disconnect from a peer
   * Body: { peer_id: string }
   */
  router.post("/disconnect", async (req, res) => {
    try {
      if (!meshNetwork) {
        return res.status(503).json({
          error: "P2P network not initialized",
        });
      }

      const { peer_id } = req.body;

      if (!peer_id) {
        return res.status(400).json({
          error: "Invalid request",
          message: "peer_id required",
        });
      }

      // In real implementation, call meshNetwork.disconnect(peer_id)
      res.json({
        success: true,
        message: "Disconnection initiated",
        peer_id,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to disconnect",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/p2p/health
   * Health check endpoint (minimal response for probes)
   */
  router.get("/health", async (req, res) => {
    try {
      const isRunning = meshNetwork ? await meshNetwork.isRunning() : false;
      const peerCount = meshNetwork ? meshNetwork.peerCount() : 0;

      res.json({
        status: isRunning ? "healthy" : "initialized",
        peer_count: peerCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: error.message,
      });
    }
  });

  return router;
}

module.exports = { createP2PRouter };
