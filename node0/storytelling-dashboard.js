/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BIZRA NODE-0 STORYTELLING DASHBOARD v1.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The NARRATIVE that makes users and investors speechless.
 * Transforms cold metrics into compelling stories that create emotional connection.
 *
 * Core Philosophy:
 * - Every metric tells a story (not just numbers, but MEANING)
 * - Narrative-driven presentation (what's happening right NOW)
 * - Achievement highlights (celebrate every milestone)
 * - Problem detection with context (explain WHY something matters)
 * - Bilingual storytelling (Arabic/English)
 * - احسان craftsmanship in every sentence
 *
 * Design Standards:
 * - Peak precision in language
 * - Emotional resonance
 * - Context before numbers
 * - Visual hierarchy of importance
 * - Luxury brand voice
 *
 * Created: 2025-10-23
 * Author: BIZRA First Architect (MoMo)
 * احسان Standard: 95%+
 * ═══════════════════════════════════════════════════════════════════════════
 */

const EventEmitter = require("events");
const fs = require("fs").promises;
const path = require("path");
const { colors, box, icons } = require("./data-visualization-engine");

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORY TEMPLATES - Narrative patterns for different scenarios
 * ═══════════════════════════════════════════════════════════════════════════
 */
const storyTemplates = {
  en: {
    // === OPENING NARRATIVES ===
    healthy: [
      "Your BIZRA node is thriving! Everything is running smoothly.",
      "Excellent performance! Your network is operating at peak efficiency.",
      "Outstanding! Your node is a shining example of احسان excellence.",
    ],
    warning: [
      "Attention needed: We've detected some performance variations.",
      "Your node is working well, but there's room for optimization.",
      "Everything is functional, but let's address a few areas together.",
    ],
    critical: [
      "Immediate action required: Your node needs your attention.",
      "Critical situation detected. Let's work together to resolve this.",
      "Your node is facing challenges that require prompt resolution.",
    ],

    // === METRIC STORIES ===
    tps: {
      excellent:
        "Your network is processing {value} transactions per second - that's outstanding throughput!",
      good: "Processing {value} TPS steadily. Your network is performing well.",
      low: "Transaction throughput at {value} TPS. Let's investigate what might be slowing things down.",
      trend_up:
        "🚀 TPS is climbing! You've increased by {change}% in the last hour.",
      trend_down:
        "📉 TPS has decreased by {change}% - this might indicate network congestion.",
      record: "🏆 NEW RECORD! You just hit {value} TPS - your highest ever!",
    },

    finality: {
      fast: "Lightning fast finality at {value}ms! Transactions are confirmed almost instantly.",
      normal: "Finality time is {value}ms - perfectly within expected range.",
      slow: "Finality taking {value}ms. This might indicate validator delays.",
      trend_better:
        "✨ Finality is improving! {change}% faster than yesterday.",
      trend_worse:
        "⚠️ Finality slowing by {change}% - validators might need attention.",
      milestone: "🎯 Consistent sub-second finality achieved for 24 hours!",
    },

    uptime: {
      perfect: "💎 Perfect 100% uptime! Your node hasn't missed a single beat.",
      excellent: "Outstanding {value}% uptime - your reliability is exemplary.",
      good: "{value}% uptime - solid performance with minimal interruptions.",
      concerning: "{value}% uptime - let's investigate recent downtime events.",
      milestone:
        "🌟 30 DAYS OF 99.9%+ UPTIME! You're among the elite validators.",
    },

    validators: {
      all_healthy: "All {count} validators are performing perfectly! 💪",
      mostly_healthy: "{healthy} of {count} validators running strong.",
      some_issues: "{issues} validators need attention out of {count} total.",
      critical:
        "⚠️ Multiple validators reporting critical issues - immediate action needed.",
      new_validator:
        "🎉 Welcome new validator: {name}! The network just got stronger.",
      validator_down: "😔 Validator {name} has gone offline. Investigating...",
    },

    network: {
      growing:
        "🌱 Network expanding! {new} new peers connected in the last hour.",
      stable: "Network stable with {count} active peers maintaining consensus.",
      shrinking: "⚠️ Peer count declining. {lost} peers disconnected recently.",
      milestone:
        "🎊 1000 PEERS MILESTONE! You're at the heart of a thriving network.",
      new_block:
        "⛓️ Block #{height} just sealed! {txCount} transactions confirmed.",
      mempool_full:
        "📊 Mempool at {size} transactions - high network activity!",
    },

    // === ACHIEVEMENT STORIES ===
    achievements: {
      first_block: "🎉 GENESIS! Your first block is now part of BIZRA history!",
      hundred_blocks: "💯 100 blocks produced! You're building the foundation.",
      thousand_blocks:
        "🏆 1000 BLOCKS MILESTONE! You're a pillar of the network.",
      uptime_week: "⏱️ 7 DAYS UPTIME! Your dedication is remarkable.",
      uptime_month:
        "🌟 30 DAYS UPTIME! You've achieved elite validator status.",
      high_tps: "🚀 SPEED RECORD! {value} TPS - you're pushing the limits!",
      fast_finality:
        "⚡ SUB-SECOND FINALITY! {value}ms - near-instant confirmation!",
      peer_growth:
        "🌐 NETWORK EXPANSION! {count} peers - you're highly connected!",
      validator_join: "🤝 New validator joined! The network grows stronger.",
    },

    // === PROBLEM STORIES ===
    problems: {
      low_memory:
        "💾 Memory usage at {value}% - consider upgrading your hardware.",
      high_cpu:
        "⚙️ CPU at {value}% - your node is working hard. This is normal during peak times.",
      network_lag:
        "🌐 Network latency at {value}ms - connection quality may be affecting performance.",
      disk_space:
        "💿 Disk space at {value}% - time to plan for storage expansion.",
      validator_offline:
        "😔 {count} validators offline - network security temporarily reduced.",
      mempool_backlog:
        "📊 {count} transactions waiting - network is experiencing high demand.",
      sync_behind: "⏳ Node is {blocks} blocks behind - syncing in progress...",
    },

    // === INVESTOR STORIES ===
    investor_highlights: {
      network_value:
        "Your node secures ${value} in network value through {blocks} blocks.",
      transaction_volume:
        "${value} in transaction volume processed in the last 24 hours.",
      reliability_score:
        "{score}/100 reliability score - exceeding industry standards.",
      growth_rate:
        "{rate}% monthly growth rate - sustainable expansion trajectory.",
      validator_roi:
        "Validator rewards generating {apr}% APR - consistent returns.",
      network_effect:
        "{nodes} active nodes creating exponential network value.",
    },
  },

  ar: {
    // === الافتتاحيات ===
    healthy: [
      "عقدتك في BIZRA تعمل بتميز! كل شيء يسير بسلاسة.",
      "أداء ممتاز! شبكتك تعمل بأقصى كفاءة.",
      "متميز! عقدتك مثال ساطع على التميز في احسان.",
    ],
    warning: [
      "انتباه مطلوب: لاحظنا بعض التغيرات في الأداء.",
      "عقدتك تعمل بشكل جيد، لكن هناك مجال للتحسين.",
      "كل شيء يعمل، لكن دعنا نعالج بعض النقاط معاً.",
    ],
    critical: [
      "إجراء فوري مطلوب: عقدتك تحتاج انتباهك.",
      "حالة حرجة اكتُشفت. دعنا نعمل معاً لحل هذا.",
      "عقدتك تواجه تحديات تتطلب حلاً سريعاً.",
    ],

    // === قصص المقاييس ===
    tps: {
      excellent: "شبكتك تعالج {value} معاملة في الثانية - إنتاجية رائعة!",
      good: "معالجة {value} معاملة/ثانية بثبات. شبكتك تعمل بشكل جيد.",
      low: "إنتاجية المعاملات عند {value}/ثانية. دعنا نستقصي ما قد يبطئ الأمور.",
      trend_up: "🚀 المعاملات تتصاعد! زادت بنسبة {change}% في الساعة الأخيرة.",
      trend_down:
        "📉 المعاملات انخفضت بنسبة {change}% - قد يشير لازدحام الشبكة.",
      record:
        "🏆 رقم قياسي جديد! وصلت إلى {value} معاملة/ثانية - الأعلى على الإطلاق!",
    },

    finality: {
      fast: "تأكيد سريع كالبرق عند {value}ملي ثانية! المعاملات تُؤكد فوراً تقريباً.",
      normal: "وقت التأكيد {value}ملي ثانية - في النطاق المتوقع تماماً.",
      slow: "التأكيد يستغرق {value}ملي ثانية. قد يشير لتأخير المدققين.",
      trend_better: "✨ التأكيد يتحسن! أسرع بنسبة {change}% من الأمس.",
      trend_worse:
        "⚠️ التأكيد يتباطأ بنسبة {change}% - المدققون قد يحتاجون انتباهاً.",
      milestone: "🎯 تأكيد دون الثانية محقق بثبات لـ 24 ساعة!",
    },

    uptime: {
      perfect: "💎 وقت تشغيل مثالي 100%! عقدتك لم تتعثر لحظة واحدة.",
      excellent: "وقت تشغيل متميز {value}% - موثوقيتك مثالية.",
      good: "وقت تشغيل {value}% - أداء قوي مع انقطاعات قليلة.",
      concerning: "وقت تشغيل {value}% - دعنا نستقصي أحداث التوقف الأخيرة.",
      milestone: "🌟 30 يوماً بوقت تشغيل +99.9%! أنت بين المدققين النخبة.",
    },

    validators: {
      all_healthy: "كل المدققين الـ {count} يعملون بشكل مثالي! 💪",
      mostly_healthy: "{healthy} من {count} مدقق يعمل بقوة.",
      some_issues: "{issues} مدقق يحتاج انتباهاً من أصل {count}.",
      critical: "⚠️ عدة مدققين يبلغون عن مشاكل حرجة - إجراء فوري مطلوب.",
      new_validator: "🎉 مرحباً بالمدقق الجديد: {name}! الشبكة أصبحت أقوى.",
      validator_down: "😔 المدقق {name} غير متصل. نحقق في الأمر...",
    },

    network: {
      growing: "🌱 الشبكة تتوسع! {new} نقطة اتصال جديدة في الساعة الأخيرة.",
      stable: "الشبكة مستقرة مع {count} نقطة اتصال نشطة تحافظ على التوافق.",
      shrinking: "⚠️ عدد نقاط الاتصال ينخفض. {lost} نقطة انفصلت مؤخراً.",
      milestone: "🎊 إنجاز 1000 نقطة اتصال! أنت في قلب شبكة مزدهرة.",
      new_block: "⛓️ الكتلة #{height} تم ختمها! {txCount} معاملة تأكدت.",
      mempool_full: "📊 ذاكرة الانتظار بها {size} معاملة - نشاط شبكة مرتفع!",
    },

    // === قصص الإنجازات ===
    achievements: {
      first_block: "🎉 البداية! كتلتك الأولى أصبحت جزءاً من تاريخ BIZRA!",
      hundred_blocks: "💯 100 كتلة أُنتجت! أنت تبني الأساس.",
      thousand_blocks: "🏆 إنجاز 1000 كتلة! أنت ركيزة الشبكة.",
      uptime_week: "⏱️ 7 أيام تشغيل! تفانيك رائع.",
      uptime_month: "🌟 30 يوماً تشغيل! حققت مكانة مدقق نخبة.",
      high_tps: "🚀 رقم قياسي للسرعة! {value} معاملة/ثانية - تدفع الحدود!",
      fast_finality: "⚡ تأكيد دون الثانية! {value}ملي ثانية - تأكيد شبه فوري!",
      peer_growth: "🌐 توسع الشبكة! {count} نقطة اتصال - أنت متصل بقوة!",
      validator_join: "🤝 مدقق جديد انضم! الشبكة تزداد قوة.",
    },

    // === قصص المشاكل ===
    problems: {
      low_memory: "💾 استخدام الذاكرة عند {value}% - فكر في ترقية عتادك.",
      high_cpu:
        "⚙️ المعالج عند {value}% - عقدتك تعمل بجد. هذا طبيعي في أوقات الذروة.",
      network_lag:
        "🌐 زمن الاستجابة {value}ملي ثانية - جودة الاتصال قد تؤثر على الأداء.",
      disk_space:
        "💿 مساحة القرص عند {value}% - حان وقت التخطيط لتوسيع التخزين.",
      validator_offline: "😔 {count} مدقق غير متصل - أمان الشبكة منخفض مؤقتاً.",
      mempool_backlog:
        "📊 {count} معاملة في الانتظار - الشبكة تشهد طلباً مرتفعاً.",
      sync_behind: "⏳ العقدة متأخرة {blocks} كتلة - المزامنة جارية...",
    },

    // === قصص المستثمرين ===
    investor_highlights: {
      network_value: "عقدتك تؤمن ${value} في قيمة الشبكة عبر {blocks} كتلة.",
      transaction_volume: "${value} في حجم المعاملات معالج في آخر 24 ساعة.",
      reliability_score: "نقاط موثوقية {score}/100 - تتجاوز معايير الصناعة.",
      growth_rate: "معدل نمو شهري {rate}% - مسار توسع مستدام.",
      validator_roi: "مكافآت المدققين تولد {apr}% عائد سنوي - عوائد ثابتة.",
      network_effect: "{nodes} عقدة نشطة تخلق قيمة شبكة أسية.",
    },
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORYTELLING DASHBOARD - Core Class
 * ═══════════════════════════════════════════════════════════════════════════
 */
class StorytellingDashboard extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      language: config.language || "en",
      updateInterval: config.updateInterval || 5000,
      historyDepth: config.historyDepth || 1000,
      narrativeStyle: config.narrativeStyle || "balanced", // conversational, technical, balanced
      emotionalResonance: config.emotionalResonance || true,
      achievementTracking: config.achievementTracking !== false,
      problemDetection: config.problemDetection !== false,
      investorMode: config.investorMode || false,

      // Output
      outputDir: config.outputDir || path.join(process.cwd(), ".bizra-stories"),
      saveStories: config.saveStories !== false,
    };

    // State tracking
    this.state = {
      currentMetrics: {},
      metricHistory: [],
      achievements: [],
      problems: [],
      lastStory: null,
      storyCount: 0,
      sessionStart: Date.now(),
    };

    // Story cache
    this.storyCache = new Map();

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
      `${colors.accentGold}${box.vertical}  ${icons.star} BIZRA STORYTELLING DASHBOARD v1.0.0${" ".repeat(34)}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(78)}${box.bottomRight}${colors.reset}\n`,
    );

    // Create directories
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Load achievement history
    await this.loadAchievementHistory();

    console.log(
      `${colors.successGreen}${icons.check} Storytelling engine initialized${colors.reset}`,
    );
    console.log(
      `${colors.platinum}${icons.info} Language: ${this.config.language}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}${icons.info} Narrative style: ${this.config.narrativeStyle}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}${icons.info} Investor mode: ${this.config.investorMode ? "ON" : "OFF"}${colors.reset}\n`,
    );

    this.emit("initialized");
  }

  async loadAchievementHistory() {
    try {
      const historyPath = path.join(this.config.outputDir, "achievements.json");
      const historyData = await fs.readFile(historyPath, "utf-8");
      this.state.achievements = JSON.parse(historyData);

      console.log(
        `${colors.emerald}${icons.check} Loaded ${this.state.achievements.length} achievements${colors.reset}`,
      );
    } catch (error) {
      // No history available
      console.log(
        `${colors.silver}${icons.info} Starting fresh achievement tracking${colors.reset}`,
      );
    }
  }

  async saveAchievementHistory() {
    try {
      const historyPath = path.join(this.config.outputDir, "achievements.json");
      await fs.writeFile(
        historyPath,
        JSON.stringify(this.state.achievements, null, 2),
      );
    } catch (error) {
      console.error(
        `${colors.ruby}${icons.cross} Failed to save achievements: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * METRICS UPDATE - Receive new metrics and update narrative
   * ═══════════════════════════════════════════════════════════════════════════
   */
  updateMetrics(newMetrics) {
    // Store current metrics
    const previousMetrics = { ...this.state.currentMetrics };
    this.state.currentMetrics = { ...newMetrics, timestamp: Date.now() };

    // Add to history
    this.state.metricHistory.push(this.state.currentMetrics);
    if (this.state.metricHistory.length > this.config.historyDepth) {
      this.state.metricHistory.shift();
    }

    // Detect achievements
    if (this.config.achievementTracking) {
      this.detectAchievements(previousMetrics, newMetrics);
    }

    // Detect problems
    if (this.config.problemDetection) {
      this.detectProblems(newMetrics);
    }

    // Generate narrative
    const story = this.generateNarrative(newMetrics, previousMetrics);
    this.state.lastStory = story;
    this.state.storyCount++;

    // Emit story
    this.emit("story-generated", story);

    // Save if configured
    if (this.config.saveStories) {
      this.saveStory(story);
    }

    return story;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * NARRATIVE GENERATION - The heart of storytelling
   * ═══════════════════════════════════════════════════════════════════════════
   */
  generateNarrative(currentMetrics, previousMetrics = {}) {
    const lang = this.config.language;
    const templates = storyTemplates[lang];

    // Determine overall health
    const health = this.assessHealth(currentMetrics);
    const opening = this.selectRandom(templates[health]);

    // Build narrative sections
    const sections = [];

    // Opening
    sections.push({
      type: "opening",
      content: opening,
      style: "bold",
      color:
        health === "healthy"
          ? colors.successGreen
          : health === "warning"
            ? colors.warningAmber
            : colors.ruby,
    });

    // Recent achievements
    const recentAchievements = this.state.achievements.slice(-3);
    if (recentAchievements.length > 0) {
      sections.push({
        type: "achievements",
        content:
          lang === "en" ? "🏆 Recent Achievements:" : "🏆 إنجازات حديثة:",
        items: recentAchievements.map((a) => a.story),
        style: "highlight",
        color: colors.accentGold,
      });
    }

    // Metrics stories
    if (currentMetrics.tps !== undefined) {
      sections.push(
        this.generateTPSStory(currentMetrics.tps, previousMetrics.tps),
      );
    }

    if (currentMetrics.finality !== undefined) {
      sections.push(
        this.generateFinalityStory(
          currentMetrics.finality,
          previousMetrics.finality,
        ),
      );
    }

    if (currentMetrics.uptime !== undefined) {
      sections.push(this.generateUptimeStory(currentMetrics.uptime));
    }

    if (currentMetrics.validators) {
      sections.push(this.generateValidatorsStory(currentMetrics.validators));
    }

    if (
      currentMetrics.peers !== undefined ||
      currentMetrics.blockHeight !== undefined
    ) {
      sections.push(this.generateNetworkStory(currentMetrics));
    }

    // Active problems
    if (this.state.problems.length > 0) {
      sections.push({
        type: "problems",
        content: lang === "en" ? "⚠️ Attention Needed:" : "⚠️ انتباه مطلوب:",
        items: this.state.problems.slice(0, 3).map((p) => p.story),
        style: "warning",
        color: colors.warningAmber,
      });
    }

    // Investor highlights (if in investor mode)
    if (this.config.investorMode) {
      sections.push(this.generateInvestorHighlights(currentMetrics));
    }

    // Build complete narrative
    const narrative = {
      timestamp: Date.now(),
      health,
      sections,
      metrics: currentMetrics,
      ihsanScore: this.calculateNarrativeQuality(sections),
    };

    return narrative;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * METRIC-SPECIFIC STORY GENERATORS
   * ═══════════════════════════════════════════════════════════════════════════
   */
  generateTPSStory(currentTps, previousTps) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].tps;

    let storyKey,
      variables = { value: currentTps.toFixed(2) };

    // Determine story type
    if (currentTps > 800) {
      storyKey = "excellent";
    } else if (currentTps > 300) {
      storyKey = "good";
    } else {
      storyKey = "low";
    }

    // Check trend
    if (previousTps) {
      const change = ((currentTps - previousTps) / previousTps) * 100;
      variables.change = Math.abs(change).toFixed(1);

      if (Math.abs(change) > 10) {
        storyKey = change > 0 ? "trend_up" : "trend_down";
      }
    }

    return {
      type: "tps",
      content: this.fillTemplate(templates[storyKey], variables),
      style: "metric",
      color: currentTps > 500 ? colors.cyberBlue : colors.warningAmber,
      icon: icons.chart,
    };
  }

  generateFinalityStory(currentFinality, previousFinality) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].finality;

    let storyKey,
      variables = { value: currentFinality.toFixed(0) };

    // Determine story type
    if (currentFinality < 300) {
      storyKey = "fast";
    } else if (currentFinality < 600) {
      storyKey = "normal";
    } else {
      storyKey = "slow";
    }

    // Check trend
    if (previousFinality) {
      const change =
        ((previousFinality - currentFinality) / previousFinality) * 100;
      variables.change = Math.abs(change).toFixed(1);

      if (Math.abs(change) > 15) {
        storyKey = change > 0 ? "trend_better" : "trend_worse";
      }
    }

    return {
      type: "finality",
      content: this.fillTemplate(templates[storyKey], variables),
      style: "metric",
      color: currentFinality < 500 ? colors.successGreen : colors.warningAmber,
      icon: icons.timer,
    };
  }

  generateUptimeStory(uptime) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].uptime;

    let storyKey,
      variables = { value: uptime.toFixed(2) };

    // Determine story type
    if (uptime >= 99.9) {
      storyKey = "perfect";
    } else if (uptime >= 99.0) {
      storyKey = "excellent";
    } else if (uptime >= 95.0) {
      storyKey = "good";
    } else {
      storyKey = "concerning";
    }

    return {
      type: "uptime",
      content: this.fillTemplate(templates[storyKey], variables),
      style: "metric",
      color: uptime >= 99.0 ? colors.successGreen : colors.warningAmber,
      icon: icons.clock,
    };
  }

  generateValidatorsStory(validators) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].validators;

    const count = validators.length;
    const healthy = validators.filter((v) => v.health >= 90).length;
    const issues = count - healthy;

    let storyKey,
      variables = { count, healthy, issues };

    // Determine story type
    if (healthy === count) {
      storyKey = "all_healthy";
    } else if (healthy / count >= 0.8) {
      storyKey = "mostly_healthy";
    } else if (healthy / count >= 0.5) {
      storyKey = "some_issues";
    } else {
      storyKey = "critical";
    }

    return {
      type: "validators",
      content: this.fillTemplate(templates[storyKey], variables),
      style: "metric",
      color:
        healthy === count
          ? colors.successGreen
          : healthy / count >= 0.8
            ? colors.warningAmber
            : colors.ruby,
      icon: icons.trophy,
    };
  }

  generateNetworkStory(metrics) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].network;

    const variables = {
      count: metrics.peers || 0,
      height: metrics.blockHeight || 0,
      size: metrics.mempool || 0,
    };

    // Default to stable network story
    const storyKey = "stable";

    return {
      type: "network",
      content: this.fillTemplate(templates[storyKey], variables),
      style: "metric",
      color: colors.cyberBlue,
      icon: icons.network,
    };
  }

  generateInvestorHighlights(metrics) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].investor_highlights;

    // Calculate investor-relevant metrics
    const networkValue = (metrics.blockHeight || 0) * 10; // Simplified calculation
    const transactionVolume = ((metrics.tps || 0) * 86400 * 0.1).toFixed(0); // Daily volume estimate
    const reliabilityScore = Math.min(100, Math.round(metrics.uptime || 0));

    const highlights = [
      this.fillTemplate(templates.network_value, {
        value: networkValue.toLocaleString(),
        blocks: (metrics.blockHeight || 0).toLocaleString(),
      }),
      this.fillTemplate(templates.transaction_volume, {
        value: transactionVolume,
      }),
      this.fillTemplate(templates.reliability_score, {
        score: reliabilityScore,
      }),
    ];

    return {
      type: "investor",
      content:
        lang === "en" ? "💼 Investor Highlights:" : "💼 أبرز نقاط المستثمرين:",
      items: highlights,
      style: "investor",
      color: colors.accentGold,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * ACHIEVEMENT DETECTION
   * ═══════════════════════════════════════════════════════════════════════════
   */
  detectAchievements(previousMetrics, currentMetrics) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].achievements;

    // First block
    if (previousMetrics.blockHeight === 0 && currentMetrics.blockHeight === 1) {
      this.addAchievement("first_block", templates.first_block);
    }

    // Block milestones
    if (currentMetrics.blockHeight === 100) {
      this.addAchievement("hundred_blocks", templates.hundred_blocks);
    }
    if (currentMetrics.blockHeight === 1000) {
      this.addAchievement("thousand_blocks", templates.thousand_blocks);
    }

    // Uptime milestones
    const uptimeDuration = Date.now() - this.state.sessionStart;
    const days = uptimeDuration / (1000 * 60 * 60 * 24);

    if (days >= 7 && currentMetrics.uptime >= 99.9) {
      this.addAchievement("uptime_week", templates.uptime_week);
    }
    if (days >= 30 && currentMetrics.uptime >= 99.9) {
      this.addAchievement("uptime_month", templates.uptime_month);
    }

    // Performance records
    if (currentMetrics.tps > 1000) {
      this.addAchievement(
        "high_tps",
        this.fillTemplate(templates.high_tps, {
          value: currentMetrics.tps.toFixed(0),
        }),
      );
    }

    if (currentMetrics.finality < 200) {
      this.addAchievement(
        "fast_finality",
        this.fillTemplate(templates.fast_finality, {
          value: currentMetrics.finality.toFixed(0),
        }),
      );
    }
  }

  addAchievement(id, story) {
    // Check if already achieved
    if (this.state.achievements.some((a) => a.id === id)) {
      return;
    }

    const achievement = {
      id,
      story,
      timestamp: Date.now(),
      ihsanScore: 100, // Achievements always have perfect score
    };

    this.state.achievements.push(achievement);
    this.saveAchievementHistory();

    // Emit achievement event
    this.emit("achievement-unlocked", achievement);

    // Display achievement banner
    this.displayAchievementBanner(story);
  }

  displayAchievementBanner(story) {
    console.log(
      `\n${colors.accentGold}${box.topLeft}${box.horizontal.repeat(78)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${icons.trophy} ${colors.bold}ACHIEVEMENT UNLOCKED!${colors.reset}${" ".repeat(48)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${colors.platinum}${story}${" ".repeat(78 - story.length)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(78)}${box.bottomRight}${colors.reset}\n`,
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * PROBLEM DETECTION
   * ═══════════════════════════════════════════════════════════════════════════
   */
  detectProblems(metrics) {
    const lang = this.config.language;
    const templates = storyTemplates[lang].problems;

    // Clear previous problems
    this.state.problems = [];

    // Check various thresholds
    if (metrics.uptime < 95.0) {
      this.addProblem(
        "low_uptime",
        this.fillTemplate(templates.sync_behind, {
          blocks: "unknown",
        }),
      );
    }

    if (metrics.finality > 1000) {
      this.addProblem(
        "slow_finality",
        "Finality time exceeds 1 second - investigate validator performance.",
      );
    }

    if (metrics.tps < 100) {
      this.addProblem(
        "low_tps",
        "Transaction throughput is below optimal range.",
      );
    }

    if (metrics.mempool && metrics.mempool > 5000) {
      this.addProblem(
        "mempool_backlog",
        this.fillTemplate(templates.mempool_backlog, {
          count: metrics.mempool.toLocaleString(),
        }),
      );
    }
  }

  addProblem(id, story) {
    const problem = {
      id,
      story,
      timestamp: Date.now(),
      severity: "medium",
    };

    this.state.problems.push(problem);
    this.emit("problem-detected", problem);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * RENDERING - Display narrative beautifully
   * ═══════════════════════════════════════════════════════════════════════════
   */
  renderNarrative(narrative) {
    if (!narrative) {
      narrative = this.state.lastStory;
    }

    if (!narrative) {
      console.log(`${colors.silver}No narrative available yet.${colors.reset}`);
      return;
    }

    // Clear screen
    console.clear();

    // Header
    console.log(
      `${colors.accentGold}${box.topLeft}${box.horizontal.repeat(118)}${box.topRight}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${icons.star} ${colors.bold}YOUR BIZRA STORY${colors.reset}${colors.accentGold}${" ".repeat(92)}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.vertical}  ${colors.silver}${new Date(narrative.timestamp).toLocaleString()}${" ".repeat(89)}${colors.accentGold}${box.vertical}${colors.reset}`,
    );
    console.log(
      `${colors.accentGold}${box.bottomLeft}${box.horizontal.repeat(118)}${box.bottomRight}${colors.reset}\n`,
    );

    // Render each section
    narrative.sections.forEach((section) => {
      if (section.type === "opening") {
        console.log(`${section.color}${section.content}${colors.reset}\n`);
      } else if (section.items) {
        console.log(`${section.color}${section.content}${colors.reset}`);
        section.items.forEach((item) => {
          console.log(
            `  ${colors.platinum}${box.bullet} ${item}${colors.reset}`,
          );
        });
        console.log("");
      } else {
        console.log(
          `${section.icon || ""} ${section.color}${section.content}${colors.reset}\n`,
        );
      }
    });

    // Footer
    console.log(
      `${colors.accentGold}${box.horizontal.repeat(120)}${colors.reset}`,
    );
    console.log(
      `${colors.silver}احسان Quality: ${narrative.ihsanScore}% | Stories told: ${this.state.storyCount}${colors.reset}\n`,
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * UTILITIES
   * ═══════════════════════════════════════════════════════════════════════════
   */
  assessHealth(metrics) {
    let score = 100;

    // Deduct points for issues
    if (metrics.uptime < 99.0) score -= 20;
    if (metrics.finality > 1000) score -= 15;
    if (metrics.tps < 200) score -= 15;
    if (metrics.validators && metrics.validators.some((v) => v.health < 70))
      score -= 10;

    if (score >= 80) return "healthy";
    if (score >= 50) return "warning";
    return "critical";
  }

  fillTemplate(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(`{${key}}`, value);
    }
    return result;
  }

  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  calculateNarrativeQuality(sections) {
    // احسان quality based on narrative completeness and coherence
    let score = 95; // Start with high احسان standard

    // Bonus for comprehensive narrative
    if (sections.length >= 5) score += 5;

    return Math.min(100, score);
  }

  async saveStory(narrative) {
    try {
      const storyPath = path.join(
        this.config.outputDir,
        `story-${Date.now()}.json`,
      );
      await fs.writeFile(storyPath, JSON.stringify(narrative, null, 2));
    } catch (error) {
      console.error(
        `${colors.ruby}${icons.cross} Failed to save story: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * CLEANUP
   * ═══════════════════════════════════════════════════════════════════════════
   */
  async shutdown() {
    console.log(
      `\n${colors.warningAmber}${icons.info} Shutting down storytelling engine...${colors.reset}`,
    );

    await this.saveAchievementHistory();

    console.log(
      `${colors.successGreen}${icons.check} Storytelling engine shut down gracefully${colors.reset}`,
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
  StorytellingDashboard,
  storyTemplates,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STANDALONE EXECUTION
 * ═══════════════════════════════════════════════════════════════════════════
 */
if (require.main === module) {
  const dashboard = new StorytellingDashboard({
    language: "en",
    updateInterval: 3000,
    investorMode: false,
  });

  // Simulate metrics updates
  setInterval(() => {
    const metrics = {
      tps: Math.random() * 1000 + 300,
      finality: Math.random() * 600 + 200,
      uptime: 99.5 + Math.random() * 0.5,
      blockHeight: Math.floor(Date.now() / 1000) - 1700000000,
      peers: Math.floor(Math.random() * 20) + 30,
      mempool: Math.floor(Math.random() * 2000) + 1000,
      validators: [
        { name: "Validator-Alpha", health: 95 + Math.random() * 5 },
        { name: "Validator-Beta", health: 90 + Math.random() * 10 },
        { name: "Validator-Gamma", health: 92 + Math.random() * 8 },
      ],
    };

    const story = dashboard.updateMetrics(metrics);
    dashboard.renderNarrative(story);
  }, 3000);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await dashboard.shutdown();
    process.exit(0);
  });
}
