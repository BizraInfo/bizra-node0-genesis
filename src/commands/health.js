/**
 * BIZRA CLI - Health Triad Validator
 * Checks: /health endpoint, /metrics endpoint, احسان compliance score
 *
 * Production-hardened با احسان - Zero assumptions, complete validation
 */

const chalk = require("chalk");
const http = require("http");
const { fetchText, getGauge } = require("../utils/metrics");

module.exports = (program) => {
  program
    .command("health")
    .description("Validate health triad (/health, /metrics, احسان gauge)")
    .action(async function () {
      const cfg = this.parent._bizraCfg;

      // Check 1: Health endpoint
      process.stdout.write("• /health ... ");
      const ok = await new Promise((res) => {
        const r = http.get(cfg.healthEndpoint, (resp) =>
          res(resp.statusCode === 200),
        );
        r.on("error", () => res(false));
      });
      console.log(ok ? chalk.green("OK") : chalk.red("FAIL"));
      if (!ok) process.exitCode = 1;

      // Check 2: Metrics endpoint
      process.stdout.write("• /metrics ... ");
      let text = "";
      try {
        text = await fetchText(cfg.metricsEndpoint, 5000);
        console.log(chalk.green("OK"));
      } catch (e) {
        console.log(chalk.red(`FAIL (${e.message})`));
        process.exit(1);
      }

      // Check 3: احسان compliance
      const ihsan = getGauge(text, "ihsan_compliance_score");
      console.log(
        `• احسان: ${ihsan !== null ? chalk.green(ihsan.toFixed(1)) : chalk.red("N/A")}`,
      );
      if (ihsan === null) process.exit(1);
    });
};
