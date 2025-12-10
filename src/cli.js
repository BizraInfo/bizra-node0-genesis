/**
 * BIZRA CLI - Core Router and Orchestrator
 * Production-hardened version with ConfigManager integration
 *
 * Manages command registration, configuration, and execution flow
 * با احسان - Zero assumptions, complete transparency
 */

const { Command } = require("commander");
const { ConfigManager } = require("./config");

// Import all command modules
const healthCmd = require("./commands/health");
const dashCmd = require("./commands/dashboard");
const optCmd = require("./commands/optimize");
const evidenceCmd = require("./commands/evidence");
const nodeCmd = require("./commands/node");
const agentsCmd = require("./commands/agents");
const wowCmd = require("./commands/wow");
const docCmd = require("./commands/doctor");

/**
 * Main CLI entry point
 * @param {string[]} argv - Command-line arguments
 */
async function run(argv) {
  const cfgMgr = new ConfigManager();
  const program = new Command();

  program
    .name("bizra")
    .description("BIZRA NODE0 — احسان-Driven Command Center")
    .version("1.0.0-genesis")
    .option("--metrics <url>", "override metrics endpoint")
    .option("--health <url>", "override health endpoint")
    .option("--repo <dir>", "override repo root")
    .option("--pwsh <path>", "override PowerShell path")
    .hook("preAction", async (cmd) => {
      // Load base config
      const base = await cfgMgr.load();

      // Get options (with fallback for older commander versions)
      const o = cmd.optsWithGlobals ? cmd.optsWithGlobals() : cmd.opts();

      // Save config with overrides from command line
      await cfgMgr.save({
        metricsEndpoint: o.metrics || base.metricsEndpoint,
        healthEndpoint: o.health || base.healthEndpoint,
        repoRoot: o.repo || base.repoRoot,
        powershell: o.pwsh || base.powershell,
      });

      // Attach config to command for subcommands to access
      cmd._bizraCfg = cfgMgr.config;
    });

  // Register all commands
  healthCmd(program);
  dashCmd(program);
  optCmd(program);
  evidenceCmd(program);
  nodeCmd(program);
  agentsCmd(program);
  wowCmd(program);
  docCmd(program);

  // Parse and execute
  await program.parseAsync(argv);
}

module.exports = { run };
