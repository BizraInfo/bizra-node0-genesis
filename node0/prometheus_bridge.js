/**
 * PROMETHEUS METRICS BRIDGE (Node.js → Python)
 *
 * Purpose: Bridge between Express.js and Python Prometheus metrics
 * احسان Compliance: Zero-assumption error handling with explicit failures
 *
 * Architecture:
 * - Express /metrics endpoint → prometheus_bridge.js → prometheus_metrics.py
 * - Metrics rendered in OpenMetrics format for Prometheus scraping
 * - Fallback to basic metrics if Python bridge fails
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * Get Prometheus metrics from Python registry
 *
 * @returns {Promise<string>} OpenMetrics formatted metrics
 */
async function getPrometheusMetrics() {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "prometheus_metrics_endpoint.py");

    // Verify Python script exists (احسان - no assumptions)
    if (!fs.existsSync(pythonScript)) {
      const fallbackMetrics = generateFallbackMetrics();
      console.warn("[METRICS] Python script not found, using fallback");
      return resolve(fallbackMetrics);
    }

    // Spawn Python process to render metrics
    const python = spawn("python", [pythonScript]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("[METRICS] Python script failed:", stderr);
        const fallbackMetrics = generateFallbackMetrics();
        return resolve(fallbackMetrics);
      }

      // احسان - endpoint script outputs clean metrics directly
      if (!stdout || stdout.trim().length === 0) {
        console.warn("[METRICS] Empty Python output, using fallback");
        return resolve(generateFallbackMetrics());
      }

      resolve(stdout.trim());
    });

    python.on("error", (error) => {
      console.error("[METRICS] Failed to spawn Python process:", error.message);
      resolve(generateFallbackMetrics());
    });

    // Timeout after 5 seconds (احسان - explicit limits)
    setTimeout(() => {
      python.kill("SIGTERM");
      console.error("[METRICS] Python process timeout, using fallback");
      resolve(generateFallbackMetrics());
    }, 5000);
  });
}

/**
 * Read latest metrics from integrated optimizer output
 *
 * احسان Compliance: Reads from actual optimizer evidence files
 *
 * @returns {Object} Latest metrics data
 */
function readLatestOptimizerMetrics() {
  try {
    const metricsDir = path.join(__dirname, "..", "evidence", "prometheus");

    if (!fs.existsSync(metricsDir)) {
      return null;
    }

    // Find most recent metrics file
    const files = fs
      .readdirSync(metricsDir)
      .filter((f) => f.startsWith("optimizer-metrics-") && f.endsWith(".txt"))
      .sort()
      .reverse();

    if (files.length === 0) {
      return null;
    }

    const latestFile = path.join(metricsDir, files[0]);
    const content = fs.readFileSync(latestFile, "utf-8");

    return { content, timestamp: fs.statSync(latestFile).mtime };
  } catch (error) {
    console.warn("[METRICS] Failed to read optimizer metrics:", error.message);
    return null;
  }
}

/**
 * Generate fallback metrics (احسان - graceful degradation)
 *
 * @returns {string} Basic Prometheus metrics
 */
function generateFallbackMetrics() {
  const timestamp = new Date().toISOString();
  const version = "v2.2.0-rc1";

  // Check if optimizer metrics exist
  const optimizerMetrics = readLatestOptimizerMetrics();

  let metrics = `# OpenMetrics format - BIZRA Node0 Metrics (Fallback Mode)
# Generated: ${timestamp}
# Version: ${version}

# HELP bizra_node_info Node information
# TYPE bizra_node_info gauge
bizra_node_info{version="${version}",mode="fallback"} 1

# HELP bizra_metrics_bridge_status Metrics bridge status (1=ok, 0=fallback)
# TYPE bizra_metrics_bridge_status gauge
bizra_metrics_bridge_status 0

# HELP bizra_node_uptime_seconds Node uptime in seconds
# TYPE bizra_node_uptime_seconds gauge
bizra_node_uptime_seconds ${Math.floor(process.uptime())}

`;

  // Add optimizer metrics if available
  if (optimizerMetrics) {
    metrics += `# Optimizer metrics from: ${optimizerMetrics.timestamp.toISOString()}\n`;
    metrics += optimizerMetrics.content;
    metrics += "\n";
  }

  metrics += "# EOF\n";

  return metrics;
}

/**
 * Update metrics registry with real-time data
 *
 * احسان Compliance: Explicit metric updates, no silent assumptions
 *
 * @param {Object} data - Metrics data to update
 */
function updateMetrics(data) {
  // This would update the Python registry via inter-process communication
  // For now, metrics are read from filesystem (evidence/prometheus/)
  // Future enhancement: gRPC or HTTP API for real-time updates
  console.log("[METRICS] Update requested:", data);
}

/**
 * Record API request metric
 *
 * @param {string} method - HTTP method
 * @param {string} endpoint - Endpoint path
 * @param {number} statusCode - HTTP status code
 * @param {number} durationMs - Request duration in milliseconds
 */
function recordApiRequest(method, endpoint, statusCode, durationMs) {
  // Future: Update Python registry or write to shared metrics file
  // For now, logged for audit trail
  console.log(
    `[METRICS] API request: ${method} ${endpoint} ${statusCode} ${durationMs}ms`,
  );
}

/**
 * Create Express middleware for Prometheus metrics endpoint
 *
 * Usage:
 *   app.get('/metrics', createMetricsHandler());
 *
 * @returns {Function} Express route handler
 */
function createMetricsHandler() {
  return async (req, res) => {
    try {
      const metrics = await getPrometheusMetrics();
      res.type("text/plain; version=0.0.4; charset=utf-8"); // OpenMetrics format
      res.send(metrics);
    } catch (error) {
      console.error("[METRICS] Failed to generate metrics:", error);
      res.type("text/plain");
      res.status(500).send("# Metrics generation failed\n# EOF\n");
    }
  };
}

module.exports = {
  getPrometheusMetrics,
  updateMetrics,
  recordApiRequest,
  createMetricsHandler,
  readLatestOptimizerMetrics,
};
