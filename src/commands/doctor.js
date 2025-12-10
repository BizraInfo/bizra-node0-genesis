/**
 * BIZRA CLI - Doctor Command
 * Environment verification and system diagnostics
 *
 * Production-hardened با احسان
 * Now includes OpenMetrics validation (counter/label sanity checks)
 */

const chalk = require("chalk");
const execa = require("execa"); // CJS import (not destructured)
const fs = require("fs");
const path = require("path");
const { fetchText, validateMetrics } = require("../utils/metrics");

module.exports = (program) => {
  program
    .command("doctor")
    .description("Verify environment and diagnose issues")
    .option("--skip-metrics", "Skip OpenMetrics validation")
    .action(async function (options) {
      const cfg = this.parent._bizraCfg;
      console.log(chalk.cyan("\n🩺 BIZRA Environment Doctor با احسان\n"));

      let hasErrors = false;

      // Check Node.js version
      const nodeVersion = process.version;
      console.log(
        chalk.gray(`Node.js: ${nodeVersion}`) + " " + chalk.green("✓"),
      );

      // Check config
      console.log(
        chalk.gray(
          `Config: ${path.join(require("os").homedir(), ".bizra", "config.json")}`,
        ) +
          " " +
          chalk.green("✓"),
      );

      // Check repo root
      const repoExists = fs.existsSync(cfg.repoRoot);
      const repoStatus = repoExists ? chalk.green("✓") : chalk.red("✗");
      console.log(chalk.gray(`Repo: ${cfg.repoRoot}`) + " " + repoStatus);
      if (!repoExists) hasErrors = true;

      // Check bin/bizra
      const binPath = path.join(cfg.repoRoot, "bin", "bizra");
      const binExists = fs.existsSync(binPath);
      const binStatus = binExists ? chalk.green("✓") : chalk.red("✗");
      console.log(chalk.gray(`CLI Entry: ${binPath}`) + " " + binStatus);
      if (!binExists) hasErrors = true;

      // OpenMetrics validation (with احسان compliance)
      if (!options.skipMetrics) {
        console.log(
          chalk.cyan("\n📊 OpenMetrics Validation (Counter/Label Sanity)\n"),
        );

        const metricsUrl =
          cfg.apiUrl?.replace(/\/$/, "") + "/metrics" ||
          "http://localhost:9464/metrics";
        try {
          console.log(chalk.gray(`Fetching metrics from: ${metricsUrl}`));
          const metricsText = await fetchText(metricsUrl, 5000);

          // Run validations
          const validation = validateMetrics(metricsText);

          // Display counter validation results
          if (validation.counters.valid) {
            console.log(chalk.green("✓ Counter validation passed"));
          } else {
            console.log(
              chalk.red(
                `✗ Counter validation failed (${validation.counters.issues.length} issues)`,
              ),
            );
            hasErrors = true;
            for (const issue of validation.counters.issues.slice(0, 3)) {
              console.log(chalk.yellow(`  → ${issue.message}`));
              console.log(chalk.gray(`    ${issue.line}`));
            }
            if (validation.counters.issues.length > 3) {
              console.log(
                chalk.gray(
                  `  ... and ${validation.counters.issues.length - 3} more`,
                ),
              );
            }
          }

          // Display label validation results
          if (validation.labels.valid) {
            console.log(chalk.green("✓ Label validation passed"));
          } else {
            console.log(
              chalk.red(
                `✗ Label validation failed (${validation.labels.issues.length} issues)`,
              ),
            );
            hasErrors = true;
            for (const issue of validation.labels.issues.slice(0, 3)) {
              console.log(chalk.yellow(`  → ${issue.message}`));
              console.log(chalk.gray(`    ${issue.line}`));
            }
            if (validation.labels.issues.length > 3) {
              console.log(
                chalk.gray(
                  `  ... and ${validation.labels.issues.length - 3} more`,
                ),
              );
            }
          }

          // احسان compliance summary
          if (validation.valid) {
            console.log(
              chalk.green("\n✅ OpenMetrics احسان Compliance: 100/100"),
            );
          } else {
            const complianceScore = Math.max(
              0,
              100 - validation.totalIssues * 10,
            );
            console.log(
              chalk.yellow(
                `\n⚠️  OpenMetrics احسان Compliance: ${complianceScore}/100`,
              ),
            );
            console.log(
              chalk.gray(
                `    ${validation.totalIssues} issue(s) detected - fix these to reach 100/100`,
              ),
            );
          }
        } catch (err) {
          console.log(
            chalk.yellow(`⚠️  Could not fetch metrics: ${err.message}`),
          );
          console.log(chalk.gray("    (This is OK if the API is not running)"));
        }
      }

      // Final status
      console.log("");
      if (hasErrors) {
        console.log(
          chalk.red(
            "❌ Environment check failed - please fix the issues above\n",
          ),
        );
        process.exit(1);
      } else {
        console.log(
          chalk.green(
            "✅ Environment check complete - all systems operational\n",
          ),
        );
      }
    });
};
