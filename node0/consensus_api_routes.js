/**
 * Consensus API Routes for BIZRA Node-0
 *
 * Provides REST API endpoints for monitoring and controlling the consensus layer.
 *
 * إحسان (Excellence) Standard: Professional-grade API design
 * - Clear endpoint structure following BlockGraph Consensus Spec v2.0
 * - Comprehensive error handling
 * - Real-time finality status
 * - Block production monitoring
 *
 * ## Endpoints
 *
 * - GET  /api/consensus/status      - Overall consensus status
 * - GET  /api/consensus/tipset      - Current DAG tips
 * - GET  /api/consensus/finality/:hash - Check block finality
 * - GET  /api/consensus/block/:hash - Get block by hash
 * - POST /api/consensus/submit-block - Submit new block
 * - GET  /api/consensus/stats       - Comprehensive statistics
 * - GET  /api/consensus/health      - Health check
 */

const express = require("express");

/**
 * Create Consensus API router
 * @param {Object} consensusManager - Consensus manager instance (Rust integration)
 * @returns {express.Router} Configured router
 */
function createConsensusRouter(consensusManager = null) {
  const router = express.Router();

  /**
   * GET /api/consensus/status
   * Get overall consensus status
   */
  router.get("/status", async (req, res) => {
    try {
      const status = {
        enabled: consensusManager !== null,
        running: consensusManager ? await consensusManager.isRunning() : false,
        chain_id: process.env.CHAIN_ID || "bizra-testnet-001",
        timestamp: new Date().toISOString(),
      };

      if (consensusManager) {
        const stats = await consensusManager.getStats();
        status.current_height = stats.current_height || 0;
        status.finalized_height = stats.finalized_height || 0;
        status.tipset_size = stats.tipset_size || 0;
        status.validator_count = stats.validator_count || 1;
        status.epoch = stats.epoch || 0;
        status.slot = stats.slot || 0;
      } else {
        status.current_height = 0;
        status.finalized_height = 0;
        status.tipset_size = 0;
        status.message = "Consensus not initialized";
      }

      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get consensus status",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/consensus/tipset
   * Get current tipset (DAG tips)
   */
  router.get("/tipset", async (req, res) => {
    try {
      if (!consensusManager) {
        return res.json({
          tips: [],
          count: 0,
          message: "Consensus not initialized",
        });
      }

      const tipset = await consensusManager.getTipset();

      res.json({
        tips: tipset.map((tip) => ({
          hash: tip.hash,
          height: tip.height,
          timestamp: tip.timestamp,
          finalized: tip.finalized || false,
        })),
        count: tipset.length,
        epoch: tipset[0]?.epoch || 0,
        slot: tipset[0]?.slot || 0,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get tipset",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/consensus/finality/:hash
   * Check if block is finalized
   */
  router.get("/finality/:hash", async (req, res) => {
    try {
      const { hash } = req.params;

      if (!consensusManager) {
        return res.status(503).json({
          error: "Consensus not initialized",
        });
      }

      // Validate hash format
      if (!hash || hash.length !== 64) {
        return res.status(400).json({
          error: "Invalid block hash",
          message: "Hash must be 64-character hex string",
        });
      }

      const finalized = await consensusManager.isFinalized(hash);
      const block = await consensusManager.getBlock(hash);

      if (!block) {
        return res.status(404).json({
          error: "Block not found",
          hash,
        });
      }

      res.json({
        hash,
        height: block.height,
        finalized,
        weight: block.weight || 0,
        threshold: 0.67, // 67% default threshold
        finality_type: finalized ? "fast" : "pending",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to check finality",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/consensus/block/:hash
   * Get block by hash
   */
  router.get("/block/:hash", async (req, res) => {
    try {
      const { hash } = req.params;

      if (!consensusManager) {
        return res.status(503).json({
          error: "Consensus not initialized",
        });
      }

      const block = await consensusManager.getBlock(hash);

      if (!block) {
        return res.status(404).json({
          error: "Block not found",
          hash,
        });
      }

      res.json({
        hash: block.hash,
        height: block.height,
        timestamp: block.timestamp,
        parent_hashes: block.parent_hashes || [],
        tx_count: block.transactions?.length || 0,
        wq_refs_count: block.wq_refs?.length || 0,
        finalized: block.finalized || false,
        producer: block.producer_pubkey || "unknown",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get block",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/consensus/submit-block
   * Submit new block to network
   * Body: { block: <block_data> }
   */
  router.post("/submit-block", async (req, res) => {
    try {
      if (!consensusManager) {
        return res.status(503).json({
          error: "Consensus not initialized",
        });
      }

      const { block } = req.body;

      if (!block || !block.hash || !block.height) {
        return res.status(400).json({
          error: "Invalid block",
          message: "Block must contain hash and height",
        });
      }

      // Submit block to consensus manager
      await consensusManager.submitBlock(block);

      res.status(202).json({
        success: true,
        message: "Block accepted for propagation",
        hash: block.hash,
        height: block.height,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to submit block",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/consensus/stats
   * Get comprehensive consensus statistics
   */
  router.get("/stats", async (req, res) => {
    try {
      if (!consensusManager) {
        return res.json({
          error: "Consensus not initialized",
        });
      }

      const stats = await consensusManager.getStats();

      res.json({
        // Chain metrics
        current_height: stats.current_height || 0,
        finalized_height: stats.finalized_height || 0,
        tipset_size: stats.tipset_size || 0,

        // Epoch metrics
        epoch: stats.epoch || 0,
        slot: stats.slot || 0,
        epoch_duration_seconds: 64, // 32 slots × 2 seconds

        // Validator metrics
        validator_count: stats.validator_count || 1,
        active_validators: stats.active_validators || 1,

        // Block metrics
        blocks_produced: stats.blocks_produced || 0,
        blocks_finalized: stats.blocks_finalized || 0,

        // Performance metrics
        avg_block_time_ms: stats.avg_block_time_ms || 2000,
        avg_finality_time_ms: stats.avg_finality_time_ms || 12000,

        // Finality metrics
        finality_threshold: 0.67,
        fast_finality_epochs: 6,
        economic_finality_epochs: 12,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get stats",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/consensus/health
   * Health check endpoint (minimal response for probes)
   */
  router.get("/health", async (req, res) => {
    try {
      const isRunning = consensusManager
        ? await consensusManager.isRunning()
        : false;
      const stats = consensusManager ? await consensusManager.getStats() : null;

      const lag = stats ? stats.current_height - stats.finalized_height : 0;
      const healthy = isRunning && lag < 10; // Healthy if finality lag < 10 blocks

      res.status(healthy ? 200 : 503).json({
        status: healthy ? "healthy" : "degraded",
        running: isRunning,
        finality_lag: lag,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/consensus/genesis
   * Get genesis block information
   */
  router.get("/genesis", async (req, res) => {
    try {
      // Genesis block info (hardcoded for alpha testnet)
      const genesis = {
        chain_id: process.env.CHAIN_ID || "bizra-testnet-001",
        genesis_hash:
          process.env.GENESIS_HASH ||
          "0000000000000000000000000000000000000000000000000000000000000000",
        height: 0,
        timestamp: "2024-01-01T00:00:00Z",
        merkle_root:
          "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f",
        producer: "node0:bizra",
        finalized: true,
      };

      res.json(genesis);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get genesis info",
        message: error.message,
      });
    }
  });

  return router;
}

module.exports = { createConsensusRouter };
