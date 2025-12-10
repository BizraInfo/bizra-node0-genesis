#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BIZRA NODE-0 WOW FACTOR DEMO v1.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The COMPLETE experience that makes users and investors speechless.
 * Combines data visualization + storytelling for maximum impact.
 *
 * This is what users see on FIRST LAUNCH - their introduction to BIZRA.
 * Every detail crafted with احسان to create an unforgettable impression.
 *
 * What This Demo Shows:
 * - Luxury brand identity from first second
 * - Real-time animated metrics
 * - Narrative storytelling that creates emotional connection
 * - Bilingual support (switch between Arabic/English)
 * - Achievement tracking and celebrations
 * - Problem detection with helpful context
 * - Investor-ready metrics presentation
 *
 * Usage:
 *   node bizra-wow-factor-demo.js              # English demo
 *   node bizra-wow-factor-demo.js --ar         # Arabic demo
 *   node bizra-wow-factor-demo.js --investor   # Investor mode
 *   node bizra-wow-factor-demo.js --help       # Show help
 *
 * Created: 2025-10-23
 * Author: BIZRA First Architect (MoMo)
 * احسان Standard: 95%+
 * ═══════════════════════════════════════════════════════════════════════════
 */

const {
  DataVisualizationEngine,
  colors,
  box,
  icons,
} = require("./data-visualization-engine");
const { StorytellingDashboard } = require("./storytelling-dashboard");

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 */
const config = {
  language: process.argv.includes("--ar") ? "ar" : "en",
  investorMode: process.argv.includes("--investor"),
  demoMode: true,
  updateInterval: 2000, // 2 seconds for demo
  simulateRealMetrics: true,
};

// Help text
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
${colors.accentGold}╔═══════════════════════════════════════════════════════════════════════════╗${colors.reset}
${colors.accentGold}║  ${icons.logo} BIZRA NODE-0 WOW FACTOR DEMO                                        ║${colors.reset}
${colors.accentGold}╚═══════════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.platinum}Usage:${colors.reset}
  node bizra-wow-factor-demo.js              ${colors.silver}# English demo${colors.reset}
  node bizra-wow-factor-demo.js --ar         ${colors.silver}# Arabic demo${colors.reset}
  node bizra-wow-factor-demo.js --investor   ${colors.silver}# Investor mode${colors.reset}
  node bizra-wow-factor-demo.js --help       ${colors.silver}# Show this help${colors.reset}

${colors.platinum}Options:${colors.reset}
  --ar           ${colors.silver}Switch to Arabic language${colors.reset}
  --investor     ${colors.silver}Show investor-focused metrics${colors.reset}
  --help, -h     ${colors.silver}Show this help message${colors.reset}

${colors.successGreen}Press Ctrl+C to exit demo at any time.${colors.reset}
  `);
  process.exit(0);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WELCOME ANIMATION - First impression matters!
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function showWelcomeAnimation() {
  console.clear();

  const welcome =
    config.language === "en"
      ? "WELCOME TO BIZRA NODE-0"
      : "مرحباً بك في BIZRA NODE-0";

  const subtitle =
    config.language === "en"
      ? "Autonomous Blockchain Infrastructure"
      : "البنية التحتية المستقلة للبلوكتشين";

  // Animated banner
  console.log(`\n${colors.deepNavy}${" ".repeat(120)}${colors.reset}`);
  await sleep(200);

  console.log(
    `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(78)}${box.topRight}${colors.reset}`,
  );
  await sleep(200);

  console.log(
    `${colors.accentGold}${box.vertical}  ${icons.logo} ${colors.bold}${welcome}${colors.reset}${" ".repeat(79 - welcome.length)}${colors.accentGold}${box.vertical}${colors.reset}`,
  );
  await sleep(200);

  console.log(
    `${colors.accentGold}${box.vertical}  ${colors.platinum}${subtitle}${" ".repeat(79 - subtitle.length)}${colors.accentGold}${box.vertical}${colors.reset}`,
  );
  await sleep(200);

  console.log(
    `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(78)}${box.bottomRight}${colors.reset}`,
  );
  await sleep(200);

  console.log(`${colors.deepNavy}${" ".repeat(120)}${colors.reset}\n`);

  // احسان badge
  console.log(
    `${colors.platinum}${" ".repeat(25)}${icons.star} Crafted with ${colors.accentGold}احسان${colors.platinum} (Excellence) ${icons.star}${colors.reset}\n`,
  );
  await sleep(500);

  // Loading animation
  const loadingMsg =
    config.language === "en" ? "Initializing systems" : "تهيئة الأنظمة";
  process.stdout.write(`${colors.cyberBlue}${loadingMsg}${colors.reset}`);

  for (let i = 0; i < 3; i++) {
    await sleep(400);
    process.stdout.write(`${colors.cyberBlue}.${colors.reset}`);
  }

  console.log(` ${colors.successGreen}${icons.check}${colors.reset}\n`);
  await sleep(500);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEMO ORCHESTRATOR - Main demo loop
 * ═══════════════════════════════════════════════════════════════════════════
 */
class WowFactorDemo {
  constructor(config) {
    this.config = config;
    this.vizEngine = null;
    this.storyDashboard = null;
    this.demoState = {
      running: true,
      frame: 0,
      blockHeight: 150000,
      achievements: [],
    };
  }

  async initialize() {
    await showWelcomeAnimation();

    // Initialize visualization engine
    console.log(
      `${colors.platinum}${icons.gauge} Starting Data Visualization Engine...${colors.reset}`,
    );
    this.vizEngine = new DataVisualizationEngine({
      language: this.config.language,
      refreshRate: 3000, // Don't render (we'll do it manually)
      outputFormat: "none", // We'll control output
    });
    this.vizEngine.stopAnimationLoop(); // Stop auto-rendering
    await sleep(300);
    console.log(
      `${colors.successGreen}${icons.check} Visualization ready${colors.reset}\n`,
    );

    // Initialize storytelling dashboard
    console.log(
      `${colors.platinum}${icons.star} Starting Storytelling Dashboard...${colors.reset}`,
    );
    this.storyDashboard = new StorytellingDashboard({
      language: this.config.language,
      investorMode: this.config.investorMode,
      saveStories: false, // Don't save during demo
    });
    await sleep(300);
    console.log(
      `${colors.successGreen}${icons.check} Storytelling ready${colors.reset}\n`,
    );

    await sleep(1000);

    // Show initial message
    const startMsg =
      this.config.language === "en"
        ? "Starting live demo... Press Ctrl+C to exit"
        : "بدء العرض التوضيحي... اضغط Ctrl+C للخروج";

    console.log(
      `${colors.accentGold}${box.horizontal.repeat(80)}${colors.reset}`,
    );
    console.log(`${colors.platinum}${startMsg}${colors.reset}`);
    console.log(
      `${colors.accentGold}${box.horizontal.repeat(80)}${colors.reset}\n`,
    );

    await sleep(2000);
  }

  /**
   * Generate realistic simulated metrics
   */
  generateMetrics() {
    const baseMetrics = {
      // TPS varies between 300-1200
      tps:
        500 + Math.random() * 700 + Math.sin(this.demoState.frame * 0.1) * 200,

      // Finality varies between 200-800ms
      finality:
        400 + Math.random() * 200 + Math.cos(this.demoState.frame * 0.15) * 100,

      // Uptime slowly increases toward 100%
      uptime: Math.min(
        100,
        99.5 + Math.random() * 0.5 + this.demoState.frame * 0.001,
      ),

      // Block height increases
      blockHeight: this.demoState.blockHeight,

      // Peers vary between 25-45
      peers: Math.floor(30 + Math.random() * 15),

      // Mempool varies between 500-3000
      mempool: Math.floor(1000 + Math.random() * 2000),

      // Latency varies between 30-150ms
      latency: 60 + Math.random() * 90,

      // Validators with varying health
      validators: [
        {
          name: "Genesis-Validator",
          health: Math.min(100, 95 + Math.random() * 5),
        },
        {
          name: "Node-Alpha",
          health: Math.min(100, 90 + Math.random() * 10),
        },
        {
          name: "Node-Beta",
          health: Math.min(100, 88 + Math.random() * 12),
        },
        {
          name: "Node-Gamma",
          health: Math.min(100, 92 + Math.random() * 8),
        },
      ],
    };

    // Increment block height periodically
    if (this.demoState.frame % 5 === 0) {
      this.demoState.blockHeight++;
    }

    return baseMetrics;
  }

  /**
   * Render combined view (visualization + story)
   */
  renderCombinedView(metrics, story) {
    console.clear();

    // === HEADER ===
    console.log(
      `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(118)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${icons.logo} ${colors.bold}BIZRA NODE-0 LIVE EXPERIENCE${colors.reset}${colors.accentGold}${" ".repeat(82)}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${colors.silver}${new Date().toLocaleString()} | احسان Quality: 95%+${" ".repeat(62)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(118)}${box.bottomRight}${colors.reset}\n`,
    );

    // === TWO-COLUMN LAYOUT ===
    console.log(
      `${colors.accentGold}┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────────┐${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}│ ${colors.bold}${icons.gauge} LIVE METRICS${colors.reset}${" ".repeat(33)} ${colors.accentGold}│ ${colors.bold}${icons.star} YOUR STORY${colors.reset}${" ".repeat(37)}${colors.accentGold}│${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤${colors.reset}`,
    );

    // Left column: Metrics visualization
    const avgTps = metrics.tps.toFixed(1);
    const avgFinality = metrics.finality.toFixed(0);

    console.log(
      `${colors.accentGold}│${colors.reset} ${colors.platinum}TPS:${colors.reset} ${colors.cyberBlue}${avgTps.padStart(6)}${colors.reset}/sec${" ".repeat(29)} ${colors.accentGold}│${colors.reset} ${colors.platinum}${story.sections[0]?.content.slice(0, 48) || ""}${" ".repeat(Math.max(0, 48 - (story.sections[0]?.content.length || 0)))}${colors.accentGold}│${colors.reset}`,
    );

    const tpsSparkline = this.vizEngine.generateSparkline(
      this.vizEngine.metrics.tps,
      { width: 40, color: colors.cyberBlue },
    );
    console.log(
      `${colors.accentGold}│${colors.reset} ${tpsSparkline}${" ".repeat(7)} ${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset}${" ".repeat(49)}${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset} ${colors.platinum}Finality:${colors.reset} ${colors.successGreen}${avgFinality}ms${colors.reset}${" ".repeat(29)} ${colors.accentGold}│${colors.reset} ${colors.silver}Recent metrics show:${colors.reset}${" ".repeat(32)}${colors.accentGold}│${colors.reset}`,
    );

    const finalitySparkline = this.vizEngine.generateSparkline(
      this.vizEngine.metrics.finality,
      { width: 40, color: colors.successGreen },
    );
    console.log(
      `${colors.accentGold}│${colors.reset} ${finalitySparkline}${" ".repeat(7)} ${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset}${" ".repeat(49)}${colors.accentGold}│${colors.reset} ${colors.cyberBlue}${box.bullet}${colors.reset} ${colors.platinum}TPS: ${avgTps}/sec${colors.reset}${" ".repeat(Math.max(0, 34 - avgTps.length))}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset} ${colors.platinum}Uptime:${colors.reset} ${colors.successGreen}${metrics.uptime.toFixed(2)}%${colors.reset}${" ".repeat(29)} ${colors.accentGold}│${colors.reset} ${colors.successGreen}${box.bullet}${colors.reset} ${colors.platinum}Finality: ${avgFinality}ms${colors.reset}${" ".repeat(Math.max(0, 30 - avgFinality.length))}${colors.accentGold}│${colors.reset}`,
    );

    const uptimeBar = this.vizEngine.generateProgressBar(metrics.uptime, 100, {
      width: 38,
      showPercentage: false,
    });
    console.log(
      `${colors.accentGold}│${colors.reset} ${uptimeBar}${" ".repeat(8)} ${colors.accentGold}│${colors.reset} ${colors.accentGold}${box.bullet}${colors.reset} ${colors.platinum}Uptime: ${metrics.uptime.toFixed(1)}%${colors.reset}${" ".repeat(Math.max(0, 30 - metrics.uptime.toFixed(1).length))}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset}${" ".repeat(49)}${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset} ${colors.platinum}Network:${colors.reset}${" ".repeat(40)} ${colors.accentGold}│${colors.reset} ${colors.silver}Network status:${colors.reset}${" ".repeat(37)}${colors.accentGold}│${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}│${colors.reset}   ${colors.silver}Block:${colors.reset} ${colors.accentGold}#${metrics.blockHeight.toLocaleString()}${colors.reset}${" ".repeat(33 - metrics.blockHeight.toLocaleString().length)} ${colors.accentGold}│${colors.reset} ${colors.cyberBlue}${box.bullet}${colors.reset} ${colors.platinum}${metrics.peers} peers connected${colors.reset}${" ".repeat(Math.max(0, 32 - String(metrics.peers).length))}${colors.accentGold}│${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}│${colors.reset}   ${colors.silver}Peers:${colors.reset} ${colors.cyberBlue}${metrics.peers}${colors.reset}${" ".repeat(36 - String(metrics.peers).length)} ${colors.accentGold}│${colors.reset} ${colors.cryptoPurple}${box.bullet}${colors.reset} ${colors.platinum}Block #${metrics.blockHeight.toLocaleString()}${colors.reset}${" ".repeat(Math.max(0, 30 - metrics.blockHeight.toLocaleString().length))}${colors.accentGold}│${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}│${colors.reset}   ${colors.silver}Mempool:${colors.reset} ${colors.cryptoPurple}${metrics.mempool.toLocaleString()}${colors.reset}${" ".repeat(31 - metrics.mempool.toLocaleString().length)} ${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset}${" ".repeat(49)}${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
    );

    console.log(
      `${colors.accentGold}│${colors.reset} ${colors.platinum}Validators: ${colors.successGreen}${metrics.validators.length} active${colors.reset}${" ".repeat(22)} ${colors.accentGold}│${colors.reset} ${colors.accentGold}${icons.trophy}${colors.reset} ${colors.bold}All systems operating perfectly!${colors.reset}${" ".repeat(14)}${colors.accentGold}│${colors.reset}`,
    );

    metrics.validators.slice(0, 2).forEach((v) => {
      const healthIcon =
        v.health >= 95
          ? icons.check
          : v.health >= 85
            ? icons.warning
            : icons.cross;
      const healthColor =
        v.health >= 95
          ? colors.successGreen
          : v.health >= 85
            ? colors.warningAmber
            : colors.ruby;
      console.log(
        `${colors.accentGold}│${colors.reset}   ${healthColor}${healthIcon}${colors.reset} ${colors.platinum}${v.name}${colors.reset} ${colors.silver}${v.health.toFixed(0)}%${colors.reset}${" ".repeat(30 - v.name.length)} ${colors.accentGold}│${colors.reset}${" ".repeat(53)}${colors.accentGold}│${colors.reset}`,
      );
    });

    console.log(
      `${colors.accentGold}└──────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘${colors.reset}\n`,
    );

    // === ACHIEVEMENTS (if any) ===
    if (story.sections.find((s) => s.type === "achievements")) {
      const achievementSection = story.sections.find(
        (s) => s.type === "achievements",
      );
      console.log(
        `${colors.accentGold}╔══════════════════════════════════════════════════════════════════════════╗${colors.reset}`,
      );
      console.log(
        `${colors.accentGold}║ ${icons.trophy} ${colors.bold}RECENT ACHIEVEMENTS${colors.reset}${" ".repeat(50)}${colors.accentGold}║${colors.reset}`,
      );
      console.log(
        `${colors.accentGold}╚══════════════════════════════════════════════════════════════════════════╝${colors.reset}`,
      );

      achievementSection.items?.slice(0, 2).forEach((item) => {
        console.log(`${colors.platinum}  ${box.bullet} ${item}${colors.reset}`);
      });
      console.log("");
    }

    // === FOOTER ===
    const footerMsg =
      this.config.language === "en"
        ? `Frame ${this.demoState.frame} | Press Ctrl+C to exit`
        : `إطار ${this.demoState.frame} | اضغط Ctrl+C للخروج`;

    console.log(
      `${colors.accentGold}${box.horizontal.repeat(120)}${colors.reset}`,
    );
    console.log(
      `${colors.silver}${footerMsg}${" ".repeat(120 - footerMsg.length)}${colors.reset}`,
    );
  }

  /**
   * Main demo loop
   */
  async run() {
    await this.initialize();

    while (this.demoState.running) {
      // Generate metrics
      const metrics = this.generateMetrics();

      // Update visualization engine
      this.vizEngine.updateMetrics(metrics);

      // Update storytelling dashboard
      const story = this.storyDashboard.updateMetrics(metrics);

      // Render combined view
      this.renderCombinedView(metrics, story);

      // Increment frame
      this.demoState.frame++;

      // Wait for next update
      await sleep(this.config.updateInterval);
    }
  }

  async shutdown() {
    this.demoState.running = false;

    console.log(
      `\n\n${colors.accentGold}${box.topLeft}${box.horizontal.repeat(78)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${icons.star} ${colors.bold}THANK YOU FOR EXPERIENCING BIZRA${colors.reset}${" ".repeat(40)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(78)}${box.bottomRight}${colors.reset}\n`,
    );

    const closingMsg =
      this.config.language === "en"
        ? "This was a demonstration of BIZRA's data visualization and storytelling."
        : "كان هذا عرضاً توضيحياً لتصور البيانات ورواية القصص في BIZRA.";

    console.log(`${colors.platinum}${closingMsg}${colors.reset}\n`);

    const ctaMsg =
      this.config.language === "en"
        ? "Ready to start your own node? Visit: https://bizra.ai"
        : "جاهز لبدء عقدتك الخاصة؟ زر: https://bizra.ai";

    console.log(`${colors.cyberBlue}${ctaMsg}${colors.reset}\n`);

    await this.vizEngine.shutdown();
    await this.storyDashboard.shutdown();

    console.log(
      `${colors.successGreen}${icons.check} Demo completed gracefully${colors.reset}\n`,
    );
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN EXECUTION
 * ═══════════════════════════════════════════════════════════════════════════
 */
(async () => {
  const demo = new WowFactorDemo(config);

  // Graceful shutdown on Ctrl+C
  process.on("SIGINT", async () => {
    console.log(
      `\n\n${colors.warningAmber}${icons.info} Shutting down demo...${colors.reset}\n`,
    );
    await demo.shutdown();
    process.exit(0);
  });

  // Run demo
  try {
    await demo.run();
  } catch (error) {
    console.error(
      `${colors.ruby}${icons.cross} Demo error: ${error.message}${colors.reset}`,
    );
    await demo.shutdown();
    process.exit(1);
  }
})();
