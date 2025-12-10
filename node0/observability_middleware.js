const { randomUUID } = require("crypto");

/**
 * Observability middleware for Express.
 * - Attaches traceId and agentId to each request.
 * - Emits a structured log on response finish with latency and status.
 * - Sets response headers for downstream correlation.
 */
function createObservabilityMiddleware(options = {}) {
  const agentId = options.agentId || process.env.NODE_ID || "node0";

  return function observabilityMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    const traceId = req.headers["x-trace-id"] || randomUUID();

    // Expose identifiers on request object for handlers
    req.traceId = traceId;
    req.agentId = agentId;

    // Set response headers for correlation
    res.setHeader("X-Trace-Id", traceId);
    res.setHeader("X-Agent-Id", agentId);

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const log = {
        type: "http_request",
        traceId,
        agentId,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 1000) / 1000, // 3 decimal places
      };
      try {
        console.log(JSON.stringify(log));
      } catch {
        // Avoid throwing inside finish handler
      }
    });

    next();
  };
}

module.exports = { createObservabilityMiddleware };
