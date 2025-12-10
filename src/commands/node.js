/**
 * BIZRA CLI - Node Operations Command
 * Node status and management
 *
 * Production-hardened با احسان
 */

const chalk = require("chalk");
const execa = require("execa"); // CJS import (not destructured)

module.exports = (program) => {
  program
    .command("node")
    .description("Node operations and status")
    .option("--status", "Show node status")
    .option("--restart", "Restart node services")
    .action(async function (opts) {
      const cfg = this.parent._bizraCfg;
      console.log(chalk.cyan("\n🌐 BIZRA Node Operations\n"));

      if (opts.status) {
        console.log(chalk.gray("Node Status:"));
        console.log(`  Repo: ${cfg.repoRoot}`);
        console.log(`  Metrics: ${cfg.metricsEndpoint}`);
        console.log(`  Health: ${cfg.healthEndpoint}`);
      } else {
        console.log(chalk.yellow("Use --status to view node information"));
      }
    });
};
