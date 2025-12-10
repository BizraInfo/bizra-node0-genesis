/**
 * BIZRA CLI - Live GTUI Dashboard
 * Real-time metrics visualization with blessed-contrib
 *
 * Production-hardened stable GTUI با احسان
 */

const blessed = require("blessed");
const contrib = require("blessed-contrib");
const { fetchText, getGauge, getHistAvg } = require("../utils/metrics");

module.exports = (program) => {
  program
    .command("dashboard")
    .description("Live GTUI")
    .option("--interval <ms>", "refresh", (v) => Number(v), null)
    .action(async function (opts) {
      const cfg = this.parent._bizraCfg;
      const refresh = opts.interval || 1500;

      const screen = blessed.screen({
        smartCSR: true,
        title: "BIZRA • Node-0 Dashboard",
      });
      const grid = new contrib.grid({ rows: 12, cols: 12, screen });

      // احسان gauge (top-left)
      const ihsanGauge = grid.set(0, 0, 4, 4, contrib.gauge, {
        label: "احسان (0-100)",
      });

      // Latency bar chart (top-right)
      const latencyBar = grid.set(0, 4, 4, 8, contrib.bar, {
        label: "Latency (ms)",
        barWidth: 6,
        barSpacing: 6,
        xOffset: 2,
      });

      // SLO table (bottom-left)
      const sloTable = grid.set(4, 0, 8, 6, contrib.table, {
        label: "SLO Snapshot",
        columnWidth: [16, 12, 10],
      });

      // Event log (bottom-right)
      const log = grid.set(4, 6, 8, 6, contrib.log, { label: "Events" });

      // Initial data
      sloTable.setData({
        headers: ["Metric", "Value", "Status"],
        data: [
          ["احسان", "…", "…"],
          ["API avg", "…", "…"],
          ["MCP avg", "…", "…"],
          ["Alpha avg", "…", "…"],
        ],
      });
      latencyBar.setData({ titles: ["API", "MCP", "Alpha"], data: [0, 0, 0] });

      // Keyboard handlers
      screen.key(["q", "C-c", "escape"], () => process.exit(0));

      // Update function
      async function tick() {
        try {
          const text = await fetchText(cfg.metricsEndpoint, 5000);
          const ihsan = getGauge(text, "ihsan_compliance_score") ?? 0;

          const api =
            (getHistAvg(
              text,
              "http_request_duration_seconds",
              "endpoint",
              "/api",
            ) ?? 0) * 1000;
          const mcp =
            (getHistAvg(
              text,
              "mcp_llm_request_duration_seconds",
              "model",
              "claude-3",
            ) ?? 0) * 1000;
          const alpha =
            (getHistAvg(
              text,
              "alpha_request_duration_seconds",
              "operation",
              "inference",
            ) ?? 0) * 1000;

          ihsanGauge.setData([Math.max(0, Math.min(100, ihsan))]);
          latencyBar.setData({
            titles: ["API", "MCP", "Alpha"],
            data: [api, mcp, alpha],
          });

          sloTable.setData({
            headers: ["Metric", "Value", "Status"],
            data: [
              [
                "احسان",
                `${ihsan.toFixed(1)}/100`,
                ihsan >= 95 ? "PEAK ✓" : "ATTN",
              ],
              ["API avg", `${api.toFixed(1)}ms`, api < 50 ? "✓" : "SLOW"],
              ["MCP avg", `${mcp.toFixed(1)}ms`, mcp < 100 ? "✓" : "SLOW"],
              [
                "Alpha avg",
                `${alpha.toFixed(1)}ms`,
                alpha < 500 ? "✓" : "SLOW",
              ],
            ],
          });

          log.log(
            `tick ihsan=${ihsan.toFixed(1)} api=${api.toFixed(1)}ms mcp=${mcp.toFixed(1)}ms alpha=${alpha.toFixed(1)}ms`,
          );
          screen.render();
        } catch (e) {
          log.log(`error ${e.message}`);
          screen.render();
        }
      }

      // Start refresh loop
      await tick();
      setInterval(tick, refresh);
    });
};
