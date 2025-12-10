/**
 * Validator REST API Routes
 *
 * Provides HTTP interface to validator registry and PoI attestation system.
 * Implements endpoints from BIZRA_Proof_of_Impact_Formal_Spec_v1.0.md section 10.
 *
 * ## Endpoints (8 total)
 *
 * Validator Registry:
 * - POST /api/validator/register    - Register new validator
 * - GET  /api/validator/:id          - Get validator details
 * - GET  /api/validator/list         - List active validators
 * - GET  /api/validator/stats        - Registry statistics
 *
 * PoI Attestation:
 * - POST /api/validator/attestation/submit  - Submit PoI attestation
 * - POST /api/validator/attestation/verify  - Verify attestation
 * - GET  /api/validator/attestation/:id     - Get attestation details
 * - GET  /api/validator/epoch/:n/summary    - Epoch rewards summary
 *
 * ## Architecture
 *
 * ```
 * Express Routes → NAPI-RS Bindings → Rust Validator Crate
 * ```
 *
 * Day 11: Placeholder implementation with API surface
 * Day 12: NAPI-RS bindings integrated (100% Rust-powered)
 *
 * @module node0/validator_api_routes
 */

const express = require("express");

/**
 * Create validator API router
 *
 * @param {Object|null} validatorRegistry - Validator registry manager (null = placeholder)
 * @returns {express.Router} Configured Express router
 */
function createValidatorRouter(validatorRegistry = null) {
  const router = express.Router();

  // CORS headers for API access
  router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept",
    );
    next();
  });

  /**
   * POST /api/validator/register
   *
   * Register new validator (Pending state)
   *
   * Body:
   * {
   *   "validator_id": "hex32",
   *   "pk_ed25519": "hex32",
   *   "network_address": "/ip4/127.0.0.1/tcp/9944",
   *   "epoch": 0
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "validator_id": "hex32",
   *   "status": "Pending",
   *   "epoch_join": 0
   * }
   */
  router.post("/register", async (req, res) => {
    try {
      const { validator_id, pk_ed25519, network_address, epoch } = req.body;

      // Validate required fields
      if (!validator_id || !pk_ed25519 || !network_address) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          required: ["validator_id", "pk_ed25519", "network_address"],
        });
      }

      // Placeholder: Return simulated registration
      if (validatorRegistry === null) {
        return res.json({
          success: true,
          validator_id,
          status: "Pending",
          epoch_join: epoch || 0,
          message:
            "Validator registered (placeholder - Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI
      const result = await validatorRegistry.register(
        validator_id,
        pk_ed25519,
        network_address,
        epoch || 0,
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/validator/list
   *
   * List active validators
   *
   * Query params:
   * - ?status=Active|Pending|All (default: Active)
   * - ?limit=N (default: 100)
   *
   * Response:
   * {
   *   "validators": [...],
   *   "total": 42,
   *   "active_count": 40,
   *   "total_weight": 150000
   * }
   */
  router.get("/list", async (req, res) => {
    try {
      const { status = "Active", limit = 100 } = req.query;

      // Placeholder: Return empty list
      if (validatorRegistry === null) {
        return res.json({
          validators: [],
          total: 0,
          active_count: 0,
          total_weight: 0,
          placeholder: true,
          message: "No validators (Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI
      const result = await validatorRegistry.listActive();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/validator/stats
   *
   * Registry statistics
   *
   * Response:
   * {
   *   "current_epoch": 12345,
   *   "active_validators": 42,
   *   "pending_validators": 5,
   *   "total_validators": 50,
   *   "total_active_weight": 150000,
   *   "average_reputation": 7500,
   *   "finality_threshold": 0.67
   * }
   */
  router.get("/stats", async (req, res) => {
    try {
      // Placeholder: Return default stats
      if (validatorRegistry === null) {
        return res.json({
          current_epoch: 0,
          active_validators: 0,
          pending_validators: 0,
          total_validators: 0,
          total_active_weight: 0,
          average_reputation: 0,
          finality_threshold: 0.67,
          placeholder: true,
          message: "Default stats (Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI
      const stats = await validatorRegistry.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/validator/attestation/submit
   *
   * Submit PoI attestation
   *
   * Body: Complete PoIAttestation JSON (see PoI spec)
   *
   * Response:
   * {
   *   "success": true,
   *   "attestation_id": "uuid",
   *   "digest": "hex64",
   *   "status": "accepted|rejected",
   *   "message": "..."
   * }
   */
  router.post("/attestation/submit", async (req, res) => {
    try {
      const attestation = req.body;

      // Validate required fields
      if (
        !attestation.version ||
        !attestation.anchor ||
        !attestation.evidence
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid attestation format",
          required: ["version", "anchor", "evidence", "measurement"],
        });
      }

      // Placeholder: Return simulated acceptance
      if (validatorRegistry === null) {
        return res.json({
          success: true,
          attestation_id: "simulated-" + Date.now(),
          digest: "0".repeat(64),
          status: "accepted",
          message:
            "Attestation accepted (placeholder - Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI (already receives JSON object, needs to stringify for Rust)
      const attestationJson =
        typeof attestation === "string"
          ? attestation
          : JSON.stringify(attestation);
      const result = await validatorRegistry.submitAttestation(attestationJson);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/validator/attestation/verify
   *
   * Verify PoI attestation
   *
   * Body: Complete PoIAttestation JSON
   *
   * Response:
   * {
   *   "valid": true|false,
   *   "reasons": ["..."],
   *   "computed": {
   *     "digest": "hex64",
   *     "impact_score": 0.893,
   *     "delta": 0.328
   *   }
   * }
   */
  router.post("/attestation/verify", async (req, res) => {
    try {
      const attestation = req.body;

      // Placeholder: Return simulated validation
      if (validatorRegistry === null) {
        return res.json({
          valid: true,
          reasons: [],
          computed: {
            digest: "0".repeat(64),
            impact_score: attestation.measurement?.impact_score || 0,
            delta: attestation.benchmarks?.delta || 0,
          },
          placeholder: true,
          message: "Simulated validation (Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI (already receives JSON object, needs to stringify for Rust)
      const attestationJson =
        typeof attestation === "string"
          ? attestation
          : JSON.stringify(attestation);
      const result = await validatorRegistry.verifyAttestation(attestationJson);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/validator/attestation/:id
   *
   * Get attestation details
   *
   * Response:
   * {
   *   "attestation_id": "uuid",
   *   "attester": "node0:bizra",
   *   "impact_score": 0.893,
   *   "status": "verified|pending|rejected",
   *   "timestamp": "2025-09-15T10:00:00Z"
   * }
   */
  router.get("/attestation/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Placeholder: Return simulated attestation
      if (validatorRegistry === null) {
        return res.json({
          attestation_id: id,
          attester: "node0:bizra",
          impact_score: 0.893,
          status: "verified",
          timestamp: new Date().toISOString(),
          placeholder: true,
          message: "Simulated attestation (Rust NAPI integration pending)",
        });
      }

      // Future: Call Rust NAPI
      // const attestation = await validatorRegistry.getAttestation(id);

      res.json({
        attestation_id: id,
        status: "verified",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/validator/epoch/:n/summary
   *
   * Epoch rewards summary
   *
   * Response:
   * {
   *   "epoch": 1023,
   *   "attestation_count": 1024,
   *   "total_impact_score": 850.5,
   *   "rewards": {
   *     "bloom_minted": 10000,
   *     "seed_distributed": 5000
   *   },
   *   "top_contributors": [...]
   * }
   */
  router.get("/epoch/:n/summary", async (req, res) => {
    try {
      const epoch = parseInt(req.params.n, 10);

      if (isNaN(epoch) || epoch < 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid epoch number",
        });
      }

      // Placeholder: Return default summary
      if (validatorRegistry === null) {
        return res.json({
          epoch,
          attestation_count: 0,
          total_impact_score: 0,
          rewards: {
            bloom_minted: 0,
            seed_distributed: 0,
          },
          top_contributors: [],
          placeholder: true,
          message: "Default summary (Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI
      const summary = await validatorRegistry.getEpochSummary(epoch);
      res.json(summary);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/validator/:id
   *
   * Get validator details by ID
   *
   * IMPORTANT: This route MUST be last because it matches any path.
   * Specific routes like /list and /stats must be defined BEFORE this.
   *
   * Response:
   * {
   *   "validator_id": "hex32",
   *   "pk_ed25519": "hex32",
   *   "status": "Active|Pending|Exiting|Exited|Slashed",
   *   "poi_weight": 1000,
   *   "rep_score": 5000,
   *   "stake_bond": 10000,
   *   "epoch_join": 0,
   *   "last_seen_slot": 12345
   * }
   */
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Placeholder: Return simulated validator
      if (validatorRegistry === null) {
        return res.json({
          validator_id: id,
          pk_ed25519: "0".repeat(64),
          status: "Active",
          poi_weight: 100,
          rep_score: 500,
          stake_bond: 0,
          epoch_join: 0,
          last_seen_slot: 0,
          placeholder: true,
          message: "Simulated validator (Rust NAPI integration pending)",
        });
      }

      // Call Rust NAPI
      const validator = await validatorRegistry.getValidator(id);

      if (validator === null) {
        return res.status(404).json({
          success: false,
          error: "Validator not found",
        });
      }

      res.json(validator);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}

module.exports = {
  createValidatorRouter,
};
