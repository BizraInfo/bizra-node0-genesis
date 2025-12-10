/**
 * BIZRA CLI - Configuration Management with Zod Validation
 * Handles persistent configuration across CLI sessions
 *
 * با احسان - Zero assumptions, validated configuration
 */

const { z } = require("zod");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

// Zod schema for configuration validation
const configSchema = z.object({
  metricsEndpoint: z.string().url().default("http://localhost:8080/metrics"),
  healthEndpoint: z.string().url().default("http://localhost:8080/health"),
  repoRoot: z.string().default(process.cwd()),
  powershell: z.string().default(process.env.PWSH || "powershell"),
  images: z
    .array(z.string())
    .default([
      "BIZRA_Architecture_Diagram.png",
      "BIZRA_Performance_Dashboard.png",
      "BIZRA_Scalability_Comparison.png",
    ]),
});

/**
 * Configuration Manager
 * Loads, validates, and persists CLI configuration
 */
class ConfigManager {
  constructor() {
    this.config = null;
    this.configPath = path.join(os.homedir(), ".bizra", "config.json");
  }

  /**
   * Load configuration from file system
   * Falls back to defaults if file doesn't exist or is invalid
   * @returns {Promise<Object>} Validated configuration object
   */
  async load() {
    try {
      // Ensure config directory exists
      await fs.ensureDir(path.dirname(this.configPath));

      let userConfig = {};

      // Read existing config if it exists
      if (await fs.pathExists(this.configPath)) {
        userConfig = await fs.readJson(this.configPath);
      }

      // Validate and merge with defaults
      this.config = configSchema.parse(userConfig);
      return this.config;
    } catch (error) {
      console.error("❌ Configuration error:", error.message);
      // Fall back to defaults
      this.config = configSchema.parse({});
      return this.config;
    }
  }

  /**
   * Save configuration to file system
   * @param {Object} newConfig - New configuration values
   * @returns {Promise<Object>} Updated configuration
   */
  async save(newConfig) {
    try {
      // Merge with existing config
      this.config = configSchema.parse({ ...this.config, ...newConfig });

      // Write to file
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      return this.config;
    } catch (error) {
      throw new Error(`Invalid configuration: ${error.message}`);
    }
  }

  /**
   * Get a single configuration value
   * @param {string} key - Configuration key
   * @returns {*} Configuration value
   */
  get(key) {
    return this.config?.[key];
  }

  /**
   * Get all configuration values
   * @returns {Object} Complete configuration object
   */
  getAll() {
    return this.config;
  }
}

module.exports = { ConfigManager, configSchema };
