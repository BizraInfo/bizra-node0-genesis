/**
 * BIZRA CLI - Proof-of-Impact Evidence Tools
 * Real SHA-256 checksum verification against Day-0 seal
 *
 * Production-hardened با احسان - Cryptographic verification
 */

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const chalk = require("chalk");

/**
 * Calculate SHA-256 checksum of a file
 * @param {string} fp - File path
 * @returns {string} SHA-256 hex digest
 */
function sha256(fp) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(fp));
  return h.digest("hex");
}

module.exports = (program) => {
  const cmd = program.command("evidence").description("Proof-of-Impact tools");

  // Subcommand: latest
  cmd
    .command("latest")
    .description("Show most recent PoI attestation")
    .action(async function () {
      const cfg = this.parent.parent._bizraCfg;
      const dir = path.join(cfg.repoRoot, "evidence", "poi-attestations");
      const files = (await fse.pathExists(dir))
        ? (await fse.readdir(dir)).filter((f) => f.endsWith(".json"))
        : [];
      if (!files.length) return console.log("No PoI files found.");
      const sorted = files
        .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t);
      const f = sorted[0];
      const fp = path.join(dir, f.f);
      const b = fs.statSync(fp).size;
      console.log(`${f.f} ${b} bytes ${new Date(f.t).toString()}`);
      console.log(fp);
    });

  // Subcommand: verify
  cmd
    .command("verify")
    .description("Verify checksums against Day-0 seal")
    .option("--file <path>", "checksums file")
    .action(async function (opt) {
      const cfg = this.parent.parent._bizraCfg;
      const list =
        opt.file || path.join(cfg.repoRoot, "signatures", "checksums-day0.txt");
      if (!fs.existsSync(list)) {
        console.log(chalk.red(`Missing file: ${list}`));
        process.exit(1);
      }
      const lines = fs
        .readFileSync(list, "utf8")
        .split(/\r?\n/)
        .filter(Boolean);

      let okAll = true;
      for (const line of lines) {
        const [expected, rel] = line.trim().split(/\s+/, 2);
        const fp = path.join(cfg.repoRoot, rel);
        const actual = fs.existsSync(fp) ? sha256(fp) : "MISSING";
        const ok = expected === actual;
        console.log(`${ok ? "OK  " : "FAIL"} ${rel}`);
        if (!ok) okAll = false;
      }
      if (!okAll) {
        console.log(chalk.red("❌ Verification failed."));
        process.exit(2);
      }
      console.log(chalk.green("✅ All checksums verified."));
    });
};
