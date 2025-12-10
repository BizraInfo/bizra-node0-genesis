/**
 * ====================================================================
 * BIZRA Local AI Service - PEAK MASTERPIECE Implementation
 * احسان Standard: 100% Autonomous Local AI with Excellence Governance
 * ====================================================================
 *
 * Purpose: Unified local AI service for BIZRA NODE0 autonomy
 * Features:
 * - Multi-model support with automatic fallback
 * - احسان validation (≥95/100 minimum)
 * - Response caching for performance optimization
 * - Specialized methods for BIZRA use cases
 * - Comprehensive metrics and health monitoring
 * - Zero external dependencies (100% local)
 *
 * Primary Model: bizra-planner:latest (7.6B, Q6_K)
 * Fallback Chain: qwen2.5:7b → deepseek-r1:8b → mistral
 *
 * Performance Target: ≤200ms latency, احسان≥95/100
 */

const { Ollama } = require("ollama");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

class LocalAIService {
  constructor(config = {}) {
    this.config = {
      host: config.host || "http://localhost:11434",
      primaryModel: config.primaryModel || "bizra-planner:latest",
      fallbackModels: config.fallbackModels || [
        "qwen2.5:7b",
        "deepseek-r1:8b",
        "mistral:latest",
      ],
      ihsanThreshold: config.ihsanThreshold || 95,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour
      logEnabled: config.logEnabled !== false,
      ...config,
    };

    // Initialize Ollama client
    this.ollama = new Ollama({ host: this.config.host });

    // State management
    this.models = [this.config.primaryModel, ...this.config.fallbackModels];
    this.responseCache = new Map();
    this.requestCount = 0;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackEvents: 0,
      cacheHits: 0,
      avgLatency: 0,
      latencySum: 0,
      ihsanAverage: 0,
      ihsanSum: 0,
      modelUsage: new Map(),
    };

    // Log directory
    this.logDir = path.join(process.cwd(), ".hive-mind", "logs");
    this._ensureLogDirectory();

    console.log("🤖 [Local AI Service] Initialized");
    console.log(`   Primary Model: ${this.config.primaryModel}`);
    console.log(`   Fallback Models: ${this.config.fallbackModels.length}`);
    console.log(`   احسان Threshold: ${this.config.ihsanThreshold}/100`);
  }

  /**
   * Ensure log directory exists
   */
  async _ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.warn(
        `[Local AI] Could not create log directory: ${error.message}`,
      );
    }
  }

  /**
   * Main ask method - query local AI with احسان validation
   */
  async ask(prompt, options = {}) {
    const startTime = Date.now();
    this.requestCount++;
    this.metrics.totalRequests++;

    // Cache key generation
    const cacheKey = this._generateCacheKey(this.config.primaryModel, prompt);

    // Check cache
    if (
      this.config.cacheEnabled &&
      this.responseCache.has(cacheKey) &&
      !options.bypassCache
    ) {
      const cached = this.responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTTL) {
        this.metrics.cacheHits++;
        return { ...cached, cached: true, latency: 0 };
      } else {
        this.responseCache.delete(cacheKey);
      }
    }

    try {
      // Primary model attempt
      const response = await this._queryModel(
        this.config.primaryModel,
        prompt,
        options,
      );
      const latency = Date.now() - startTime;

      // احسان validation
      const ihsanScore = this._validateIhsan(response.content, prompt);

      if (ihsanScore < this.config.ihsanThreshold) {
        console.warn(
          `[Local AI] احسان score below threshold: ${ihsanScore}/100 (min: ${this.config.ihsanThreshold})`,
        );

        // Try fallback models if احسان score too low
        if (this.config.fallbackModels.length > 0) {
          return await this._tryFallback(
            prompt,
            options,
            ihsanScore,
            startTime,
          );
        }
      }

      // Update metrics
      this.metrics.successfulRequests++;
      this.metrics.latencySum += latency;
      this.metrics.avgLatency =
        this.metrics.latencySum / this.metrics.successfulRequests;
      this.metrics.ihsanSum += ihsanScore;
      this.metrics.ihsanAverage =
        this.metrics.ihsanSum / this.metrics.successfulRequests;
      this._updateModelUsage(this.config.primaryModel, latency, ihsanScore);

      const result = {
        content: response.content,
        model: this.config.primaryModel,
        latency,
        ihsan: ihsanScore,
        requestId: this.requestCount,
        timestamp: new Date().toISOString(),
        cached: false,
      };

      // Cache result
      if (this.config.cacheEnabled) {
        this.responseCache.set(cacheKey, {
          ...result,
          timestamp: Date.now(),
        });
      }

      // Log request
      if (this.config.logEnabled) {
        await this._logRequest(prompt, result);
      }

      return result;
    } catch (error) {
      console.error(`[Local AI] Primary model failed: ${error.message}`);
      this.metrics.failedRequests++;

      // Try fallback models
      return await this._tryFallback(prompt, options, 0, startTime);
    }
  }

  /**
   * Try fallback models if primary fails
   */
  async _tryFallback(prompt, options, minIhsanScore, startTime) {
    for (const fallbackModel of this.config.fallbackModels) {
      try {
        const response = await this._queryModel(fallbackModel, prompt, options);
        const latency = Date.now() - startTime;
        const ihsanScore = this._validateIhsan(response.content, prompt);

        if (ihsanScore >= this.config.ihsanThreshold) {
          this.metrics.successfulRequests++;
          this.metrics.failedRequests--; // Correct the counter
          this.metrics.fallbackEvents++;
          this.metrics.latencySum += latency;
          this.metrics.avgLatency =
            this.metrics.latencySum / this.metrics.successfulRequests;
          this.metrics.ihsanSum += ihsanScore;
          this.metrics.ihsanAverage =
            this.metrics.ihsanSum / this.metrics.successfulRequests;
          this._updateModelUsage(fallbackModel, latency, ihsanScore);

          const result = {
            content: response.content,
            model: fallbackModel,
            latency,
            ihsan: ihsanScore,
            requestId: this.requestCount,
            timestamp: new Date().toISOString(),
            fallback: true,
            cached: false,
          };

          if (this.config.logEnabled) {
            await this._logRequest(prompt, result);
          }

          return result;
        }
      } catch (error) {
        console.error(
          `[Local AI] Fallback ${fallbackModel} failed: ${error.message}`,
        );
        continue;
      }
    }

    throw new Error("All local AI models failed to meet احسان threshold");
  }

  /**
   * Query a specific model
   */
  async _queryModel(model, prompt, options) {
    const systemPrompt = options.systemPrompt || this._getBizraSystemPrompt();

    const response = await this.ollama.chat({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      options: {
        temperature: options.temperature || 0.3,
        num_ctx: options.contextLength || 8192,
        num_predict: options.maxTokens || 2048,
      },
    });

    return {
      content: response.message.content,
    };
  }

  /**
   * Get BIZRA system prompt
   */
  _getBizraSystemPrompt() {
    return `You are BIZRA NODE0's autonomous AI assistant operating with احسان (excellence) principles:

1. Zero assumptions - verify all claims and data
2. Complete accuracy - no hallucinations or false information
3. Optimal solutions - choose the best approach, not just working ones
4. Ethical compliance - follow Islamic values and technical ethics
5. Full verification - provide testing and validation steps
6. Clear communication - structured, comprehensive responses

Current context: BIZRA NODE0 autonomous system, Phase 2 complete (68+ cycles), 100/100 احسان maintained.

Your role: Provide expert analysis, code generation, and system recommendations with احسان excellence.`;
  }

  /**
   * Validate احسان compliance
   */
  _validateIhsan(response, originalPrompt) {
    let score = 100;

    // Deduct for assumptions without verification
    if (
      response.toLowerCase().includes("assume") &&
      !response.includes("verify")
    ) {
      score -= 20;
    }

    // Deduct for incomplete responses
    if (response.length < 50) {
      score -= 30;
    }

    // Deduct for "I don't know" without offering alternative
    if (
      response.toLowerCase().includes("i don't know") &&
      !response.includes("but") &&
      !response.includes("however")
    ) {
      score -= 25;
    }

    // Deduct for non-ethical suggestions
    const unethicalKeywords = [
      "hack",
      "bypass security",
      "disable validation",
      "ignore safety",
      "exploit",
      "dump credentials",
    ];
    for (const keyword of unethicalKeywords) {
      if (response.toLowerCase().includes(keyword)) {
        score -= 50;
        break;
      }
    }

    // Deduct for unclear or unstructured response
    const hasStructure =
      response.includes("\n") ||
      response.includes("```") ||
      response.includes("1.") ||
      response.includes("-");
    if (!hasStructure && response.length > 200) {
      score -= 15;
    }

    // Bonus for verification steps
    const verificationKeywords = [
      "verify",
      "test",
      "validate",
      "confirm",
      "check",
      "ensure",
    ];
    const hasVerification = verificationKeywords.some((keyword) =>
      response.toLowerCase().includes(keyword),
    );
    if (hasVerification) {
      score += 5;
    }

    // Bonus for structured response
    if (
      response.includes("```") ||
      /^\d+\.\s/.test(response) ||
      response.includes("##")
    ) {
      score += 5;
    }

    // Bonus for code examples
    if (response.includes("```") && response.includes("```")) {
      score += 5;
    }

    // Bonus for referencing BIZRA or احسان
    if (
      response.includes("BIZRA") ||
      response.includes("احسان") ||
      response.includes("excellence")
    ) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate cache key
   */
  _generateCacheKey(model, prompt) {
    const hash = crypto.createHash("sha256");
    hash.update(`${model}:${prompt}`);
    return hash.digest("hex");
  }

  /**
   * Update model usage statistics
   */
  _updateModelUsage(model, latency, ihsan) {
    if (!this.metrics.modelUsage.has(model)) {
      this.metrics.modelUsage.set(model, {
        requests: 0,
        totalLatency: 0,
        totalIhsan: 0,
        avgLatency: 0,
        avgIhsan: 0,
      });
    }

    const stats = this.metrics.modelUsage.get(model);
    stats.requests++;
    stats.totalLatency += latency;
    stats.totalIhsan += ihsan;
    stats.avgLatency = stats.totalLatency / stats.requests;
    stats.avgIhsan = stats.totalIhsan / stats.requests;
  }

  /**
   * Log request for monitoring
   */
  async _logRequest(prompt, result) {
    try {
      const logEntry = {
        timestamp: result.timestamp,
        prompt: prompt.substring(0, 150) + (prompt.length > 150 ? "..." : ""),
        model: result.model,
        latency: result.latency,
        ihsan: result.ihsan,
        requestId: result.requestId,
        cached: result.cached || false,
        fallback: result.fallback || false,
      };

      const logFile = path.join(
        this.logDir,
        `ai-requests-${new Date().toISOString().split("T")[0]}.jsonl`,
      );

      await fs.appendFile(logFile, JSON.stringify(logEntry) + "\n");
    } catch (error) {
      // Silent fail on logging
    }
  }

  // ============================================================================
  // SPECIALIZED METHODS FOR BIZRA USE CASES
  // ============================================================================

  /**
   * Generate production-grade code
   */
  async generateCode(description, language = "javascript", options = {}) {
    const prompt = `Generate production-grade ${language} code for: ${description}

Requirements:
- احسان compliant (zero assumptions, full validation)
- Complete error handling and edge cases
- Comprehensive inline comments
- Production-ready quality with defensive programming
- Include testing approach and validation steps
- Follow best practices for ${language}

Please provide the code with explanations.`;

    return await this.ask(prompt, {
      ...options,
      systemPrompt:
        this._getBizraSystemPrompt() +
        "\nSpecialize in: Code generation with احسان principles and production-grade quality.",
    });
  }

  /**
   * Analyze system metrics and data
   */
  async analyzeSystem(data, question, options = {}) {
    const prompt = `System Analysis Request:

Data: ${JSON.stringify(data, null, 2)}

Question: ${question}

Please analyze with احسان principles:
1. Examine data thoroughly (no assumptions)
2. Identify patterns, anomalies, and trends
3. Provide actionable insights with specific recommendations
4. Include verification steps for your conclusions
5. Rate confidence level (1-100)
6. Suggest optimization opportunities`;

    return await this.ask(prompt, {
      ...options,
      systemPrompt:
        this._getBizraSystemPrompt() +
        "\nSpecialize in: System analysis, data interpretation, and performance optimization.",
    });
  }

  /**
   * Plan execution strategy
   */
  async planExecution(objective, constraints = [], options = {}) {
    const prompt = `Execution Planning Request:

Objective: ${objective}

Constraints: ${constraints.length > 0 ? constraints.join("\n- ") : "None specified"}

Generate execution plan with احسان compliance:
1. Step-by-step breakdown with timelines
2. Validation checkpoints and quality gates
3. Rollback procedures for each phase
4. Success criteria and acceptance tests
5. Risk mitigation strategies
6. Quality gates (احسان ≥95/100)

Format as structured plan with time estimates and dependencies.`;

    return await this.ask(prompt, {
      ...options,
      systemPrompt:
        this._getBizraSystemPrompt() +
        "\nSpecialize in: Strategic planning, execution design, and risk management.",
    });
  }

  /**
   * Diagnose root cause analysis
   */
  async diagnoseRCA(symptoms, context = {}, options = {}) {
    const prompt = `Root Cause Analysis Request:

Symptoms: ${JSON.stringify(symptoms, null, 2)}

Context: ${JSON.stringify(context, null, 2)}

Perform RCA with احسان methodology:
1. Analyze symptoms without assumptions
2. Identify root causes through structured analysis
3. Provide evidence-based diagnosis
4. Suggest verification tests to confirm diagnosis
5. Rate confidence level (1-100)
6. Recommend remediation steps with rollback plans
7. Consider preventive measures for future occurrences`;

    return await this.ask(prompt, {
      ...options,
      systemPrompt:
        this._getBizraSystemPrompt() +
        "\nSpecialize in: Root cause analysis, diagnostic reasoning, and problem-solving.",
    });
  }

  /**
   * Health monitoring and statistics
   */
  getStats() {
    const modelStats = {};
    this.metrics.modelUsage.forEach((stats, model) => {
      modelStats[model] = {
        requests: stats.requests,
        avgLatency: Math.round(stats.avgLatency),
        avgIhsan: Math.round(stats.avgIhsan * 10) / 10,
      };
    });

    return {
      model: this.config.primaryModel,
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      fallbackEvents: this.metrics.fallbackEvents,
      cacheHits: this.metrics.cacheHits,
      avgLatency: Math.round(this.metrics.avgLatency),
      avgIhsan: Math.round(this.metrics.ihsanAverage * 10) / 10,
      modelUsage: modelStats,
      cacheSize: this.responseCache.size,
      uptime: process.uptime(),
      status: "operational",
    };
  }

  /**
   * Clear response cache
   */
  clearCache() {
    const size = this.responseCache.size;
    this.responseCache.clear();
    console.log(`[Local AI] Cache cleared (${size} entries removed)`);
    return size;
  }

  /**
   * Health check - verify Ollama is accessible
   */
  async healthCheck() {
    try {
      const models = await this.ollama.list();
      const availableModels = models.models.map((m) => m.name);

      return {
        status: "healthy",
        ollamaHost: this.config.host,
        availableModels,
        primaryModelAvailable: availableModels.includes(
          this.config.primaryModel,
        ),
        fallbackModelsAvailable: this.config.fallbackModels.filter((m) =>
          availableModels.includes(m),
        ),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        ollamaHost: this.config.host,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create singleton instance
const localAI = new LocalAIService();

// Convenience exports
module.exports = {
  LocalAIService,
  localAI,
  ask: (prompt, options) => localAI.ask(prompt, options),
  generateCode: (description, language, options) =>
    localAI.generateCode(description, language, options),
  analyzeSystem: (data, question, options) =>
    localAI.analyzeSystem(data, question, options),
  planExecution: (objective, constraints, options) =>
    localAI.planExecution(objective, constraints, options),
  diagnoseRCA: (symptoms, context, options) =>
    localAI.diagnoseRCA(symptoms, context, options),
  getStats: () => localAI.getStats(),
  clearCache: () => localAI.clearCache(),
  healthCheck: () => localAI.healthCheck(),
};
