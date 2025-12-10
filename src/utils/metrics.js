/**
 * BIZRA CLI - Dependency-Free Metrics Parser
 * OpenMetrics/Prometheus parser with native Node.js http/https
 *
 * Production-hardened - No external dependencies (no node-fetch)
 * با احسان - Zero assumptions, validated parsing
 */

const https = require("https");
const http = require("http");

/**
 * Fetch text from URL using native http/https
 * @param {string} url - URL to fetch
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<string>} Response text
 */
function fetchText(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
  });
}

/**
 * Parse label string into object
 * @param {string} labelString - Label string from metrics (e.g., 'endpoint="/api",method="GET"')
 * @returns {Object} Parsed labels
 */
function parseLabels(labelString) {
  if (!labelString) return {};
  return Object.fromEntries(
    labelString.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v || "").trim().replace(/^"|"$/g, "")];
    }),
  );
}

/**
 * Parse Prometheus/OpenMetrics format text
 * @param {string} text - Metrics text
 * @returns {Object} Parsed metrics grouped by name
 */
function parseMetrics(text) {
  const metrics = {};
  for (const line of text.split("\n")) {
    if (!line || line[0] === "#") continue;
    const [nameAndLabels, value] = line.trim().split(/\s+/, 2);
    if (!nameAndLabels || value === undefined) continue;
    const m = nameAndLabels.match(/^([^{}]+)(?:\{([^}]*)\})?$/);
    if (!m) continue;
    const [, name, labels] = m;
    const num = Number(value);
    if (!Number.isFinite(num)) continue;
    (metrics[name] ||= []).push({
      value: num,
      labels: parseLabels(labels || ""),
    });
  }
  return metrics;
}

/**
 * Get gauge value from metrics text
 * @param {string} text - Metrics text
 * @param {string} metricName - Metric name
 * @returns {number|null} Gauge value or null if not found
 */
function getGauge(text, metricName) {
  const m = parseMetrics(text)[metricName];
  return m && m.length ? m[0].value : null;
}

/**
 * Get average from histogram (sum/count)
 * @param {string} text - Metrics text
 * @param {string} base - Base metric name (without _sum/_count suffix)
 * @param {string} labelKey - Label key to filter by
 * @param {string} labelVal - Label value to filter by
 * @returns {number|null} Average value or null if not found
 */
function getHistAvg(text, base, labelKey, labelVal) {
  const parsed = parseMetrics(text);
  const sum = (parsed[`${base}_sum`] || []).find(
    (x) => x.labels[labelKey] === labelVal,
  )?.value;
  const count = (parsed[`${base}_count`] || []).find(
    (x) => x.labels[labelKey] === labelVal,
  )?.value;
  if (!Number.isFinite(sum) || !Number.isFinite(count)) return null;
  return count > 0 ? sum / count : 0;
}

/**
 * Validate counter metrics (should have _total suffix)
 * @param {string} text - Metrics text
 * @returns {Object} Validation result with issues array
 */
function validateCounters(text) {
  const issues = [];
  const lines = text.split("\n");
  let currentType = null;
  let currentMetric = null;

  for (const line of lines) {
    // Track metric type from HELP/TYPE comments
    if (line.startsWith("# TYPE ")) {
      const parts = line.split(/\s+/);
      currentMetric = parts[2];
      currentType = parts[3];
      continue;
    }

    // Skip comments and empty lines
    if (!line || line[0] === "#") continue;

    // Parse metric line
    const [nameAndLabels] = line.trim().split(/\s+/, 2);
    if (!nameAndLabels) continue;

    const m = nameAndLabels.match(/^([^{}]+)(?:\{([^}]*)\})?$/);
    if (!m) continue;
    const [, name] = m;

    // Check if counter without _total suffix
    if (
      currentType === "counter" &&
      currentMetric === name &&
      !name.endsWith("_total")
    ) {
      issues.push({
        type: "counter_without_total",
        metric: name,
        line: line.substring(0, 80),
        message: `Counter metric '${name}' should have '_total' suffix`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate label formatting (detect malformations like leading commas)
 * @param {string} text - Metrics text
 * @returns {Object} Validation result with issues array
 */
function validateLabels(text) {
  const issues = [];
  const lines = text.split("\n");

  for (const line of lines) {
    // Skip comments and empty lines
    if (!line || line[0] === "#") continue;

    // Check for label malformations
    const labelMatch = line.match(/\{([^}]*)\}/);
    if (!labelMatch) continue;

    const labelString = labelMatch[1];

    // Check for leading comma
    if (labelString.startsWith(",")) {
      issues.push({
        type: "leading_comma",
        line: line.substring(0, 80),
        message: "Label set has leading comma (malformed)",
      });
    }

    // Check for trailing comma
    if (labelString.endsWith(",")) {
      issues.push({
        type: "trailing_comma",
        line: line.substring(0, 80),
        message: "Label set has trailing comma (malformed)",
      });
    }

    // Check for consecutive commas
    if (labelString.includes(",,")) {
      issues.push({
        type: "consecutive_commas",
        line: line.substring(0, 80),
        message: "Label set has consecutive commas (malformed)",
      });
    }

    // Check for empty label set (just whitespace)
    if (labelString.trim() === "") {
      // This is actually valid - empty label sets are allowed
      continue;
    }

    // Check for labels without values
    const labels = labelString.split(",");
    for (const label of labels) {
      const trimmed = label.trim();
      if (trimmed && !trimmed.includes("=")) {
        issues.push({
          type: "label_without_value",
          line: line.substring(0, 80),
          message: `Label '${trimmed}' has no value`,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Run all metric validations
 * @param {string} text - Metrics text
 * @returns {Object} Combined validation result
 */
function validateMetrics(text) {
  const counterValidation = validateCounters(text);
  const labelValidation = validateLabels(text);

  return {
    valid: counterValidation.valid && labelValidation.valid,
    counters: counterValidation,
    labels: labelValidation,
    totalIssues:
      counterValidation.issues.length + labelValidation.issues.length,
  };
}

module.exports = {
  fetchText,
  parseMetrics,
  getGauge,
  getHistAvg,
  validateCounters,
  validateLabels,
  validateMetrics,
};
