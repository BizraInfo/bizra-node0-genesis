/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BIZRA NODE-0 DATA VISUALIZATION ENGINE v1.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The KEY differentiator that makes users and investors speechless.
 * World-class data visualization with luxury design and احسان excellence.
 *
 * Core Philosophy:
 * - Brand identity from FIRST LOOK (luxury dark theme + gold accents)
 * - Real-time animated metrics (TPS, finality, uptime, validator health)
 * - Both CLI/TUI (ASCII art) and Web (Canvas/SVG) rendering
 * - Bilingual support (Arabic/English)
 * - احسان quality standard (95%+)
 *
 * Design Standards:
 * - Deep Navy (#0A1428) background
 * - Accent Gold (#D4AF37) primary highlights
 * - Cyber Blue (#00D9FF) active/interactive
 * - Success Green (#00FF41) validation/success
 * - Warning Amber (#FFB600) alerts
 * - Crypto Purple (#A78BFA) secondary highlights
 *
 * Created: 2025-10-23
 * Author: BIZRA First Architect (MoMo)
 * احسان Standard: 95%+
 * ═══════════════════════════════════════════════════════════════════════════
 */

const EventEmitter = require("events");
const fs = require("fs").promises;
const path = require("path");

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANSI COLOR PALETTE - Luxury Elite Design
 * ═══════════════════════════════════════════════════════════════════════════
 */
const colors = {
  // Core Brand Colors
  deepNavy: "\x1b[48;2;10;20;40m", // Background: Deep Navy #0A1428
  accentGold: "\x1b[38;2;212;175;55m", // Primary: Accent Gold #D4AF37
  cyberBlue: "\x1b[38;2;0;217;255m", // Active: Cyber Blue #00D9FF
  successGreen: "\x1b[38;2;0;255;65m", // Success: #00FF41
  warningAmber: "\x1b[38;2;255;182;0m", // Warning: #FFB600
  cryptoPurple: "\x1b[38;2;167;139;250m", // Secondary: #A78BFA

  // Semantic Colors
  platinum: "\x1b[38;2;229;228;226m", // Text: Platinum
  silver: "\x1b[38;2;192;192;192m", // Dim text
  ruby: "\x1b[38;2;224;17;95m", // Error: Ruby Red
  emerald: "\x1b[38;2;80;200;120m", // Highlight: Emerald

  // Utility
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  underline: "\x1b[4m",
  blink: "\x1b[5m",

  // Background variants
  bgDeepNavy: "\x1b[48;2;10;20;40m",
  bgGold: "\x1b[48;2;212;175;55m",
  bgBlue: "\x1b[48;2;0;217;255m",
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNICODE BOX DRAWING CHARACTERS - Elite Design Elements
 * ═══════════════════════════════════════════════════════════════════════════
 */
const box = {
  // Single line borders
  topLeft: "╔",
  topRight: "╗",
  bottomLeft: "╚",
  bottomRight: "╝",
  horizontal: "═",
  vertical: "║",

  // Double line borders
  doubleTopLeft: "╔",
  doubleTopRight: "╗",
  doubleBottomLeft: "╚",
  doubleBottomRight: "╝",
  doubleHorizontal: "═",
  doubleVertical: "║",

  // Cross connectors
  cross: "╬",
  tDown: "╦",
  tUp: "╩",
  tRight: "╠",
  tLeft: "╣",

  // Rounded borders
  roundTopLeft: "╭",
  roundTopRight: "╮",
  roundBottomLeft: "╰",
  roundBottomRight: "╯",

  // Progress bars
  blockFull: "█",
  blockSeven: "▉",
  blockSix: "▊",
  blockFive: "▋",
  blockFour: "▌",
  blockThree: "▍",
  blockTwo: "▎",
  blockOne: "▏",

  // Arrows and indicators
  arrowUp: "↑",
  arrowDown: "↓",
  arrowRight: "→",
  arrowLeft: "←",
  bullet: "•",
  diamond: "◆",
  circle: "●",
  square: "■",
  triangle: "▲",
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ICONS AND EMOJIS - Visual Brand Identity
 * ═══════════════════════════════════════════════════════════════════════════
 */
const icons = {
  // BIZRA Brand
  logo: "🔷",
  seed: "🌱",
  bloom: "🌸",

  // Status indicators
  check: "✓",
  cross: "✗",
  warning: "⚠",
  info: "ℹ",

  // Metrics
  rocket: "🚀",
  fire: "🔥",
  star: "⭐",
  trophy: "🏆",
  chart: "📊",
  gauge: "📈",

  // System
  cpu: "⚙️",
  memory: "💾",
  network: "🌐",
  database: "🗄️",

  // Time
  clock: "⏱️",
  timer: "⏲️",
  hourglass: "⌛",

  // Actions
  play: "▶️",
  pause: "⏸️",
  stop: "⏹️",
  refresh: "🔄",
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATA VISUALIZATION ENGINE - Core Class
 * ═══════════════════════════════════════════════════════════════════════════
 */
class DataVisualizationEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // Visual settings
      width: config.width || 120, // Terminal width
      height: config.height || 40, // Terminal height
      theme: config.theme || "luxury-dark", // Theme name
      language: config.language || "en", // en or ar

      // Animation settings
      animationSpeed: config.animationSpeed || 100, // ms per frame
      smoothing: config.smoothing || true, // Smooth transitions
      sparklineLength: config.sparklineLength || 50, // History length

      // Quality settings
      ihsanThreshold: config.ihsanThreshold || 95, // احسان quality
      antiAliasing: config.antiAliasing || true, // Anti-aliasing

      // Output settings
      outputFormat: config.outputFormat || "cli", // cli, web, both
      refreshRate: config.refreshRate || 1000, // ms between updates

      // Paths
      outputDir: config.outputDir || path.join(process.cwd(), ".bizra-viz"),
      cacheDir: config.cacheDir || path.join(process.cwd(), ".bizra-cache"),
    };

    // Metrics storage
    this.metrics = {
      tps: [], // Transactions per second
      finality: [], // Finality time (ms)
      uptime: 0, // Uptime percentage
      validators: [], // Validator health
      blockHeight: 0, // Current block height
      peers: 0, // Connected peers
      mempool: 0, // Mempool size
      latency: [], // Network latency
    };

    // Visual state
    this.visualState = {
      currentFrame: 0,
      lastUpdate: Date.now(),
      animationQueue: [],
      activeCharts: new Map(),
    };

    // Bilingual labels
    this.labels = {
      en: {
        tps: "Transactions/Sec",
        finality: "Finality Time",
        uptime: "Uptime",
        validators: "Validators",
        blockHeight: "Block Height",
        peers: "Peers",
        mempool: "Mempool",
        latency: "Latency",
        status: "Status",
        healthy: "Healthy",
        warning: "Warning",
        critical: "Critical",
        performance: "Performance",
        network: "Network",
        system: "System",
      },
      ar: {
        tps: "المعاملات/ثانية",
        finality: "وقت التأكيد",
        uptime: "وقت التشغيل",
        validators: "المدققون",
        blockHeight: "ارتفاع الكتلة",
        peers: "الأقران",
        mempool: "ذاكرة الانتظار",
        latency: "زمن الاستجابة",
        status: "الحالة",
        healthy: "سليم",
        warning: "تحذير",
        critical: "حرج",
        performance: "الأداء",
        network: "الشبكة",
        system: "النظام",
      },
    };

    // Initialize
    this.initialize();
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * INITIALIZATION
   * ═══════════════════════════════════════════════════════════════════════════
   */
  async initialize() {
    console.log(
      `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(78)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${icons.logo} BIZRA DATA VISUALIZATION ENGINE v1.0.0${" ".repeat(32)}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(78)}${box.bottomRight}${colors.reset}\n`,
    );

    // Create directories
    await this.createDirectories();

    // Load cached data
    await this.loadCache();

    // Start animation loop
    this.startAnimationLoop();

    console.log(
      `${colors.successGreen}${icons.check} Visualization engine initialized${colors.reset}`,
    );
    console.log(
      `${colors.platinum}${icons.info} Output format: ${this.config.outputFormat}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}${icons.info} Language: ${this.config.language}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}${icons.info} احسان threshold: ${this.config.ihsanThreshold}%${colors.reset}\n`,
    );

    this.emit("initialized");
  }

  async createDirectories() {
    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.mkdir(this.config.cacheDir, { recursive: true });
  }

  async loadCache() {
    try {
      const cachePath = path.join(this.config.cacheDir, "metrics-cache.json");
      const cacheData = await fs.readFile(cachePath, "utf-8");
      const cached = JSON.parse(cacheData);

      // Restore metrics
      this.metrics = { ...this.metrics, ...cached };

      console.log(
        `${colors.emerald}${icons.check} Loaded cached metrics${colors.reset}`,
      );
    } catch (error) {
      // No cache available, start fresh
      console.log(
        `${colors.silver}${icons.info} No cache found, starting fresh${colors.reset}`,
      );
    }
  }

  async saveCache() {
    try {
      const cachePath = path.join(this.config.cacheDir, "metrics-cache.json");
      await fs.writeFile(cachePath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error(
        `${colors.ruby}${icons.cross} Failed to save cache: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * METRICS UPDATE - Feed data to visualization
   * ═══════════════════════════════════════════════════════════════════════════
   */
  updateMetrics(newMetrics) {
    // Update TPS
    if (newMetrics.tps !== undefined) {
      this.metrics.tps.push(newMetrics.tps);
      if (this.metrics.tps.length > this.config.sparklineLength) {
        this.metrics.tps.shift();
      }
    }

    // Update finality time
    if (newMetrics.finality !== undefined) {
      this.metrics.finality.push(newMetrics.finality);
      if (this.metrics.finality.length > this.config.sparklineLength) {
        this.metrics.finality.shift();
      }
    }

    // Update latency
    if (newMetrics.latency !== undefined) {
      this.metrics.latency.push(newMetrics.latency);
      if (this.metrics.latency.length > this.config.sparklineLength) {
        this.metrics.latency.shift();
      }
    }

    // Update scalar values
    if (newMetrics.uptime !== undefined)
      this.metrics.uptime = newMetrics.uptime;
    if (newMetrics.blockHeight !== undefined)
      this.metrics.blockHeight = newMetrics.blockHeight;
    if (newMetrics.peers !== undefined) this.metrics.peers = newMetrics.peers;
    if (newMetrics.mempool !== undefined)
      this.metrics.mempool = newMetrics.mempool;
    if (newMetrics.validators !== undefined)
      this.metrics.validators = newMetrics.validators;

    // Emit update event
    this.emit("metrics-updated", this.metrics);

    // Save to cache periodically
    if (Date.now() - this.visualState.lastUpdate > 60000) {
      this.saveCache();
      this.visualState.lastUpdate = Date.now();
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * SPARKLINE CHART - Inline time-series visualization
   * ═══════════════════════════════════════════════════════════════════════════
   */
  generateSparkline(data, options = {}) {
    if (!data || data.length === 0) {
      return "─".repeat(options.width || 20);
    }

    const width = options.width || 20;
    const height = options.height || 8;
    const color = options.color || colors.cyberBlue;

    // Normalize data to height
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const normalized = data.map((val) =>
      Math.round(((val - min) / range) * height),
    );

    // Generate sparkline using block characters
    const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

    let sparkline = "";
    for (
      let i = Math.max(0, normalized.length - width);
      i < normalized.length;
      i++
    ) {
      const blockIndex = Math.min(normalized[i], blocks.length - 1);
      sparkline += blocks[blockIndex];
    }

    // Pad if needed
    if (sparkline.length < width) {
      sparkline = "▁".repeat(width - sparkline.length) + sparkline;
    }

    return `${color}${sparkline}${colors.reset}`;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PROGRESS BAR - Animated horizontal bar
   * ═══════════════════════════════════════════════════════════════════════════
   */
  generateProgressBar(value, max, options = {}) {
    const width = options.width || 40;
    const showPercentage = options.showPercentage !== false;
    const colorize = options.colorize !== false;

    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const filledWidth = Math.round((percentage / 100) * width);

    // Choose color based on percentage
    let barColor = colors.successGreen;
    if (colorize) {
      if (percentage < 50) barColor = colors.ruby;
      else if (percentage < 80) barColor = colors.warningAmber;
      else barColor = colors.successGreen;
    }

    // Generate bar
    const filled = box.blockFull.repeat(filledWidth);
    const empty = box.blockOne.repeat(width - filledWidth);

    let bar = `${barColor}${filled}${colors.silver}${empty}${colors.reset}`;

    if (showPercentage) {
      bar += ` ${colors.platinum}${percentage.toFixed(1)}%${colors.reset}`;
    }

    return bar;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * GAUGE METER - Circular progress indicator
   * ═══════════════════════════════════════════════════════════════════════════
   */
  generateGauge(value, max, options = {}) {
    const segments = options.segments || 10;
    const label = options.label || "";

    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const filledSegments = Math.round((percentage / 100) * segments);

    // Choose color
    let color = colors.successGreen;
    if (percentage < 50) color = colors.ruby;
    else if (percentage < 80) color = colors.warningAmber;

    // Generate gauge segments
    let gauge = "[";
    for (let i = 0; i < segments; i++) {
      if (i < filledSegments) {
        gauge += `${color}${box.circle}${colors.reset}`;
      } else {
        gauge += `${colors.silver}${box.bullet}${colors.reset}`;
      }
    }
    gauge += "]";

    if (label) {
      gauge = `${colors.platinum}${label}: ${colors.reset}${gauge} ${colors.accentGold}${percentage.toFixed(0)}%${colors.reset}`;
    }

    return gauge;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * DASHBOARD - Full-screen live dashboard
   * ═══════════════════════════════════════════════════════════════════════════
   */
  renderDashboard() {
    const lang = this.config.language;
    const labels = this.labels[lang];

    // Clear screen
    console.clear();

    // Header
    console.log(
      `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(118)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${icons.logo} ${colors.bold}BIZRA NODE-0 LIVE DASHBOARD${colors.reset}${colors.accentGold}${" ".repeat(79)}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${colors.platinum}${new Date().toLocaleString()}${" ".repeat(89)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(118)}${box.bottomRight}${colors.reset}\n`,
    );

    // === PERFORMANCE METRICS ===
    console.log(
      `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(58)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical} ${icons.gauge} ${colors.bold}${labels.performance}${colors.reset}${" ".repeat(49 - labels.performance.length)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(58)}${box.bottomRight}${colors.reset}`,
    );

    // TPS
    const avgTps =
      this.metrics.tps.length > 0
        ? this.metrics.tps.reduce((a, b) => a + b, 0) / this.metrics.tps.length
        : 0;
    console.log(
      `${colors.platinum}${labels.tps}:${colors.reset} ${colors.cyberBlue}${avgTps.toFixed(2)}${colors.reset}`,
    );
    console.log(
      `${this.generateSparkline(this.metrics.tps, { width: 50, color: colors.cyberBlue })}\n`,
    );

    // Finality
    const avgFinality =
      this.metrics.finality.length > 0
        ? this.metrics.finality.reduce((a, b) => a + b, 0) /
          this.metrics.finality.length
        : 0;
    console.log(
      `${colors.platinum}${labels.finality}:${colors.reset} ${colors.successGreen}${avgFinality.toFixed(0)}ms${colors.reset}`,
    );
    console.log(
      `${this.generateSparkline(this.metrics.finality, { width: 50, color: colors.successGreen })}\n`,
    );

    // Uptime
    console.log(`${colors.platinum}${labels.uptime}:${colors.reset}`);
    console.log(
      `${this.generateProgressBar(this.metrics.uptime, 100, { width: 50 })}\n`,
    );

    // === NETWORK STATUS ===
    console.log(
      `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(58)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical} ${icons.network} ${colors.bold}${labels.network}${colors.reset}${" ".repeat(51 - labels.network.length)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(58)}${box.bottomRight}${colors.reset}`,
    );

    // Block height
    console.log(
      `${colors.platinum}${labels.blockHeight}:${colors.reset} ${colors.accentGold}${this.metrics.blockHeight.toLocaleString()}${colors.reset}`,
    );

    // Peers
    console.log(
      `${colors.platinum}${labels.peers}:${colors.reset} ${colors.cyberBlue}${this.metrics.peers}${colors.reset}`,
    );

    // Mempool
    console.log(
      `${colors.platinum}${labels.mempool}:${colors.reset} ${colors.cryptoPurple}${this.metrics.mempool.toLocaleString()}${colors.reset}\n`,
    );

    // Latency
    const avgLatency =
      this.metrics.latency.length > 0
        ? this.metrics.latency.reduce((a, b) => a + b, 0) /
          this.metrics.latency.length
        : 0;
    console.log(
      `${colors.platinum}${labels.latency}:${colors.reset} ${colors.warningAmber}${avgLatency.toFixed(0)}ms${colors.reset}`,
    );
    console.log(
      `${this.generateSparkline(this.metrics.latency, { width: 50, color: colors.warningAmber })}\n`,
    );

    // === VALIDATORS ===
    if (this.metrics.validators && this.metrics.validators.length > 0) {
      console.log(
        `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(58)}${box.topRight}${colors.reset}`,
      );
      console.log(
        `${colors.accentGold}${box.vertical} ${icons.trophy} ${colors.bold}${labels.validators}${colors.reset}${" ".repeat(50 - labels.validators.length)}${colors.accentGold}${box.vertical}${colors.reset}`,
      );
      console.log(
        `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(58)}${box.bottomRight}${colors.reset}`,
      );

      this.metrics.validators.slice(0, 5).forEach((validator, i) => {
        const health = validator.health || 100;
        const statusIcon =
          health >= 90
            ? icons.check
            : health >= 70
              ? icons.warning
              : icons.cross;
        const statusColor =
          health >= 90
            ? colors.successGreen
            : health >= 70
              ? colors.warningAmber
              : colors.ruby;

        console.log(
          `${statusColor}${statusIcon}${colors.reset} ${colors.platinum}${validator.name || `Validator ${i + 1}`}${colors.reset}`,
        );
        console.log(`  ${this.generateGauge(health, 100, { segments: 10 })}`);
      });
    }

    // Footer
    console.log(
      `\n${colors.accentGold}${box.horizontal.repeat(60)}${colors.reset}`,
    );
    console.log(
      `${colors.silver}احسان Quality: ${this.config.ihsanThreshold}% | Refresh: ${this.config.refreshRate}ms${colors.reset}`,
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * ANIMATION LOOP - Continuous updates
   * ═══════════════════════════════════════════════════════════════════════════
   */
  startAnimationLoop() {
    this.animationInterval = setInterval(() => {
      if (
        this.config.outputFormat === "cli" ||
        this.config.outputFormat === "both"
      ) {
        this.renderDashboard();
      }

      this.visualState.currentFrame++;
      this.emit("frame", this.visualState.currentFrame);
    }, this.config.refreshRate);
  }

  stopAnimationLoop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * WEB EXPORT - Generate HTML/SVG for web dashboard
   * ═══════════════════════════════════════════════════════════════════════════
   */
  async exportWebDashboard() {
    const html = this.generateWebHTML();
    const outputPath = path.join(this.config.outputDir, "dashboard.html");
    await fs.writeFile(outputPath, html);

    console.log(
      `${colors.successGreen}${icons.check} Web dashboard exported: ${outputPath}${colors.reset}`,
    );
    return outputPath;
  }

  generateWebHTML() {
    return `<!DOCTYPE html>
<html lang="${this.config.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIZRA NODE-0 Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Courier New', monospace;
      background: linear-gradient(135deg, #0A1428 0%, #1a2744 100%);
      color: #E5E4E2;
      padding: 20px;
    }

    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: linear-gradient(90deg, #D4AF37 0%, #FFD700 100%);
      color: #0A1428;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
    }

    .header h1 {
      font-size: 2em;
      font-weight: bold;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .metric-card {
      background: rgba(26, 39, 68, 0.8);
      border: 2px solid #D4AF37;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .metric-card h3 {
      color: #D4AF37;
      margin-bottom: 10px;
      font-size: 1.2em;
    }

    .metric-value {
      color: #00D9FF;
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }

    .sparkline {
      width: 100%;
      height: 60px;
      margin-top: 10px;
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      background: rgba(192, 192, 192, 0.2);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 10px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00FF41 0%, #00D9FF 100%);
      transition: width 0.5s ease;
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>🔷 BIZRA NODE-0 Live Dashboard</h1>
      <p>Real-time Performance Metrics</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>📊 Transactions/Sec</h3>
        <div class="metric-value" id="tps">0</div>
        <canvas class="sparkline" id="tps-chart"></canvas>
      </div>

      <div class="metric-card">
        <h3>⏱️ Finality Time</h3>
        <div class="metric-value" id="finality">0ms</div>
        <canvas class="sparkline" id="finality-chart"></canvas>
      </div>

      <div class="metric-card">
        <h3>⏲️ Uptime</h3>
        <div class="metric-value" id="uptime">0%</div>
        <div class="progress-bar">
          <div class="progress-fill" id="uptime-bar" style="width: 0%"></div>
        </div>
      </div>

      <div class="metric-card">
        <h3>🏆 Validators</h3>
        <div class="metric-value" id="validators">0</div>
        <div id="validator-list"></div>
      </div>

      <div class="metric-card">
        <h3>🌐 Network</h3>
        <div class="metric-value" id="peers">0 Peers</div>
        <p>Block Height: <span id="blockHeight">0</span></p>
        <p>Mempool: <span id="mempool">0</span></p>
      </div>

      <div class="metric-card">
        <h3>📈 Latency</h3>
        <div class="metric-value" id="latency">0ms</div>
        <canvas class="sparkline" id="latency-chart"></canvas>
      </div>
    </div>
  </div>

  <script>
    // WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:8080/metrics');

    ws.onmessage = (event) => {
      const metrics = JSON.parse(event.data);
      updateDashboard(metrics);
    };

    function updateDashboard(metrics) {
      document.getElementById('tps').textContent = metrics.tps?.toFixed(2) || '0';
      document.getElementById('finality').textContent = metrics.finality?.toFixed(0) + 'ms' || '0ms';
      document.getElementById('uptime').textContent = metrics.uptime?.toFixed(1) + '%' || '0%';
      document.getElementById('uptime-bar').style.width = (metrics.uptime || 0) + '%';
      document.getElementById('peers').textContent = (metrics.peers || 0) + ' Peers';
      document.getElementById('blockHeight').textContent = (metrics.blockHeight || 0).toLocaleString();
      document.getElementById('mempool').textContent = (metrics.mempool || 0).toLocaleString();
      document.getElementById('latency').textContent = metrics.latency?.toFixed(0) + 'ms' || '0ms';

      // Update charts (simplified for now)
      updateSparkline('tps-chart', metrics.tpsHistory || []);
      updateSparkline('finality-chart', metrics.finalityHistory || []);
      updateSparkline('latency-chart', metrics.latencyHistory || []);
    }

    function updateSparkline(canvasId, data) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (data.length === 0) return;

      // Draw line
      const width = canvas.width;
      const height = canvas.height;
      const step = width / data.length;
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;

      ctx.strokeStyle = '#00D9FF';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((value, i) => {
        const x = i * step;
        const y = height - ((value - min) / range) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Initial load
    fetch('/api/metrics')
      .then(res => res.json())
      .then(updateDashboard);
  </script>
</body>
</html>`;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * CLEANUP
   * ═══════════════════════════════════════════════════════════════════════════
   */
  async shutdown() {
    console.log(
      `\n${colors.warningAmber}${icons.info} Shutting down visualization engine...${colors.reset}`,
    );

    // Stop animation
    this.stopAnimationLoop();

    // Save cache
    await this.saveCache();

    console.log(
      `${colors.successGreen}${icons.check} Visualization engine shut down gracefully${colors.reset}`,
    );
    this.emit("shutdown");
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 */
module.exports = {
  DataVisualizationEngine,
  colors,
  box,
  icons,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STANDALONE EXECUTION
 * ═══════════════════════════════════════════════════════════════════════════
 */
if (require.main === module) {
  const engine = new DataVisualizationEngine({
    language: "en",
    refreshRate: 2000,
  });

  // Simulate metrics updates
  setInterval(() => {
    engine.updateMetrics({
      tps: Math.random() * 1000 + 500,
      finality: Math.random() * 500 + 200,
      uptime: 99.9 + Math.random() * 0.1,
      blockHeight: Math.floor(Date.now() / 1000),
      peers: Math.floor(Math.random() * 10) + 20,
      mempool: Math.floor(Math.random() * 1000) + 500,
      latency: Math.random() * 100 + 50,
      validators: [
        { name: "Validator-1", health: 95 + Math.random() * 5 },
        { name: "Validator-2", health: 90 + Math.random() * 10 },
        { name: "Validator-3", health: 85 + Math.random() * 15 },
      ],
    });
  }, 1000);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await engine.shutdown();
    process.exit(0);
  });
}
