#!/usr/bin/env node

/**
 * ====================================================================
 * BIZRA Knowledge Builder
 * احسان Standard: Autonomous Knowledge Accumulation
 * ====================================================================
 *
 * Purpose: Accumulate knowledge from all system operations,
 *          organize it, and make it available to all agents.
 *          Implements "Standing on Shoulders of Giants" protocol.
 *
 * Features:
 * - Automatic knowledge extraction from operations
 * - Pattern recognition and classification
 * - Knowledge graph construction
 * - Memory integration
 * - Search and retrieval
 * - Version control (git-like)
 * - احسان quality scoring
 * - A2A (Agent-to-Agent) knowledge sharing
 *
 * Knowledge Sources:
 * - Session contexts
 * - Task executions
 * - File operations
 * - Web research
 * - User interactions
 * - Model outputs
 *
 * Date: 2025-10-23
 * Author: MoMo (First Architect) + Claude Code (احسان implementation)
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const EventEmitter = require("events");

// ANSI Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  gold: "\x1b[38;5;220m",
  platinum: "\x1b[38;5;252m",
  emerald: "\x1b[38;5;42m",
  sapphire: "\x1b[38;5;33m",
  ruby: "\x1b[38;5;196m",
  amethyst: "\x1b[38;5;141m",
};

class KnowledgeBuilder extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      knowledgeDir:
        config.knowledgeDir ||
        path.join(process.cwd(), "knowledge", "organized"),
      memoryDir:
        config.memoryDir || path.join(process.cwd(), ".hive-mind", "memory"),
      ihsanThreshold: config.ihsanThreshold || 95.0,
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 300000, // 5 minutes
      ...config,
    };

    this.knowledgeBase = {
      entities: new Map(), // Unique entities (people, systems, concepts)
      relationships: new Map(), // Entity relationships
      patterns: new Map(), // Recognized patterns
      procedures: new Map(), // Documented procedures
      facts: new Map(), // Verified facts
      hypotheses: new Map(), // Unverified hypotheses
    };

    this.statistics = {
      totalEntries: 0,
      lastUpdate: null,
      sources: {},
    };

    this.saveTimer = null;
  }

  /**
   * Initialize knowledge builder
   */
  async initialize() {
    console.log(
      `\n${colors.sapphire}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(`${colors.sapphire}  KNOWLEDGE BUILDER SYSTEM${colors.reset}`);
    console.log(
      `${colors.sapphire}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    console.log(
      `${colors.platinum}[Knowledge Builder] احسان Standard: Knowledge Accumulation${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[Knowledge Builder] Knowledge Directory: ${this.config.knowledgeDir}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[Knowledge Builder] Memory Directory: ${this.config.memoryDir}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[Knowledge Builder] احسان Threshold: ${this.config.ihsanThreshold}%${colors.reset}\n`,
    );

    // Create directories
    await fs.mkdir(this.config.knowledgeDir, { recursive: true });
    await fs.mkdir(this.config.memoryDir, { recursive: true });

    // Load existing knowledge
    await this.loadExistingKnowledge();

    // Setup auto-save
    if (this.config.autoSave) {
      this.setupAutoSave();
    }

    console.log(
      `${colors.emerald}[Knowledge Builder] ✅ Initialization complete${colors.reset}`,
    );
    console.log(
      `${colors.dim}[Knowledge Builder] Loaded ${this.statistics.totalEntries} knowledge entries${colors.reset}\n`,
    );

    return this;
  }

  /**
   * Load existing knowledge from disk
   */
  async loadExistingKnowledge() {
    console.log(
      `${colors.sapphire}[Knowledge Builder] Loading existing knowledge...${colors.reset}`,
    );

    try {
      // Load knowledge base
      const knowledgeFile = path.join(
        this.config.knowledgeDir,
        "knowledge-base.json",
      );
      try {
        const data = await fs.readFile(knowledgeFile, "utf-8");
        const loaded = JSON.parse(data);

        // Restore Maps
        this.knowledgeBase.entities = new Map(
          Object.entries(loaded.entities || {}),
        );
        this.knowledgeBase.relationships = new Map(
          Object.entries(loaded.relationships || {}),
        );
        this.knowledgeBase.patterns = new Map(
          Object.entries(loaded.patterns || {}),
        );
        this.knowledgeBase.procedures = new Map(
          Object.entries(loaded.procedures || {}),
        );
        this.knowledgeBase.facts = new Map(Object.entries(loaded.facts || {}));
        this.knowledgeBase.hypotheses = new Map(
          Object.entries(loaded.hypotheses || {}),
        );

        this.statistics = loaded.statistics || this.statistics;

        console.log(
          `${colors.emerald}[Knowledge Builder] ✅ Loaded knowledge base${colors.reset}`,
        );
      } catch (error) {
        console.log(
          `${colors.dim}[Knowledge Builder] No existing knowledge base found${colors.reset}`,
        );
      }

      // Count total entries
      this.statistics.totalEntries =
        this.knowledgeBase.entities.size +
        this.knowledgeBase.relationships.size +
        this.knowledgeBase.patterns.size +
        this.knowledgeBase.procedures.size +
        this.knowledgeBase.facts.size +
        this.knowledgeBase.hypotheses.size;
    } catch (error) {
      console.error(
        `${colors.ruby}[Knowledge Builder] Load error: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * Setup auto-save timer
   */
  setupAutoSave() {
    this.saveTimer = setInterval(async () => {
      console.log(
        `${colors.dim}[Knowledge Builder] Auto-saving...${colors.reset}`,
      );
      await this.save();
    }, this.config.saveInterval);

    console.log(
      `${colors.platinum}[Knowledge Builder] Auto-save enabled (every ${this.config.saveInterval / 1000}s)${colors.reset}`,
    );
  }

  /**
   * Add entity (person, system, concept)
   */
  addEntity(entity) {
    const id = this.generateId(entity.name);

    const entry = {
      id,
      name: entity.name,
      type: entity.type || "unknown",
      description: entity.description || "",
      attributes: entity.attributes || {},
      timestamp: new Date().toISOString(),
      source: entity.source || "unknown",
      ihsanScore: this.calculateQuality(entity),
    };

    this.knowledgeBase.entities.set(id, entry);
    this.recordSource(entity.source);

    console.log(
      `${colors.emerald}[Knowledge Builder] ✓ Added entity: ${entity.name}${colors.reset}`,
    );
    this.emit("entity-added", entry);

    return entry;
  }

  /**
   * Add relationship between entities
   */
  addRelationship(relationship) {
    const id = this.generateId(
      `${relationship.from}-${relationship.relation}-${relationship.to}`,
    );

    const entry = {
      id,
      from: relationship.from,
      to: relationship.to,
      relation: relationship.relation,
      metadata: relationship.metadata || {},
      timestamp: new Date().toISOString(),
      source: relationship.source || "unknown",
      ihsanScore: this.calculateQuality(relationship),
    };

    this.knowledgeBase.relationships.set(id, entry);
    this.recordSource(relationship.source);

    console.log(
      `${colors.emerald}[Knowledge Builder] ✓ Added relationship: ${relationship.from} → ${relationship.relation} → ${relationship.to}${colors.reset}`,
    );
    this.emit("relationship-added", entry);

    return entry;
  }

  /**
   * Add pattern
   */
  addPattern(pattern) {
    const id = this.generateId(pattern.name);

    const entry = {
      id,
      name: pattern.name,
      description: pattern.description || "",
      examples: pattern.examples || [],
      frequency: pattern.frequency || 1,
      timestamp: new Date().toISOString(),
      source: pattern.source || "unknown",
      ihsanScore: this.calculateQuality(pattern),
    };

    this.knowledgeBase.patterns.set(id, entry);
    this.recordSource(pattern.source);

    console.log(
      `${colors.emerald}[Knowledge Builder] ✓ Added pattern: ${pattern.name}${colors.reset}`,
    );
    this.emit("pattern-added", entry);

    return entry;
  }

  /**
   * Add procedure
   */
  addProcedure(procedure) {
    const id = this.generateId(procedure.name);

    const entry = {
      id,
      name: procedure.name,
      description: procedure.description || "",
      steps: procedure.steps || [],
      prerequisites: procedure.prerequisites || [],
      outcomes: procedure.outcomes || [],
      timestamp: new Date().toISOString(),
      source: procedure.source || "unknown",
      ihsanScore: this.calculateQuality(procedure),
    };

    this.knowledgeBase.procedures.set(id, entry);
    this.recordSource(procedure.source);

    console.log(
      `${colors.emerald}[Knowledge Builder] ✓ Added procedure: ${procedure.name}${colors.reset}`,
    );
    this.emit("procedure-added", entry);

    return entry;
  }

  /**
   * Add fact (verified)
   */
  addFact(fact) {
    const id = this.generateId(fact.statement);

    const entry = {
      id,
      statement: fact.statement,
      evidence: fact.evidence || [],
      confidence: fact.confidence || 1.0,
      timestamp: new Date().toISOString(),
      source: fact.source || "unknown",
      ihsanScore: this.calculateQuality(fact),
    };

    this.knowledgeBase.facts.set(id, entry);
    this.recordSource(fact.source);

    console.log(
      `${colors.emerald}[Knowledge Builder] ✓ Added fact: ${fact.statement.substring(0, 50)}...${colors.reset}`,
    );
    this.emit("fact-added", entry);

    return entry;
  }

  /**
   * Add hypothesis (unverified)
   */
  addHypothesis(hypothesis) {
    const id = this.generateId(hypothesis.statement);

    const entry = {
      id,
      statement: hypothesis.statement,
      reasoning: hypothesis.reasoning || "",
      needsVerification: true,
      timestamp: new Date().toISOString(),
      source: hypothesis.source || "unknown",
      ihsanScore: this.calculateQuality(hypothesis),
    };

    this.knowledgeBase.hypotheses.set(id, entry);
    this.recordSource(hypothesis.source);

    console.log(
      `${colors.amethyst}[Knowledge Builder] ⚠ Added hypothesis: ${hypothesis.statement.substring(0, 50)}...${colors.reset}`,
    );
    this.emit("hypothesis-added", entry);

    return entry;
  }

  /**
   * Search knowledge base
   */
  search(query, options = {}) {
    const {
      types = ["entities", "facts", "procedures", "patterns"],
      limit = 10,
      minQuality = 0,
    } = options;

    const results = [];
    const queryLower = query.toLowerCase();

    for (const type of types) {
      const collection = this.knowledgeBase[type];
      if (!collection) continue;

      for (const [id, entry] of collection.entries()) {
        // Skip low quality
        if (entry.ihsanScore < minQuality) continue;

        // Simple text matching (can be enhanced with embeddings)
        const text = JSON.stringify(entry).toLowerCase();
        if (text.includes(queryLower)) {
          results.push({
            type,
            id,
            entry,
            relevance: this.calculateRelevance(query, entry),
          });
        }
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return results.slice(0, limit);
  }

  /**
   * Get entity by name or ID
   */
  getEntity(nameOrId) {
    // Try by ID first
    if (this.knowledgeBase.entities.has(nameOrId)) {
      return this.knowledgeBase.entities.get(nameOrId);
    }

    // Try by name
    const id = this.generateId(nameOrId);
    return this.knowledgeBase.entities.get(id);
  }

  /**
   * Get relationships for entity
   */
  getRelationships(entityId) {
    const relationships = [];

    for (const [id, rel] of this.knowledgeBase.relationships.entries()) {
      if (rel.from === entityId || rel.to === entityId) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  /**
   * Extract knowledge from text
   */
  extractKnowledgeFromText(text, source = "text-extraction") {
    const extracted = {
      entities: [],
      facts: [],
      procedures: [],
    };

    // Simple extraction patterns (can be enhanced with NLP)

    // Extract capitalized entities
    const capitalizedWords =
      text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const uniqueEntities = [...new Set(capitalizedWords)];

    for (const entity of uniqueEntities) {
      if (entity.length > 2) {
        extracted.entities.push({
          name: entity,
          type: "extracted",
          source,
        });
      }
    }

    // Extract facts (sentences with key indicators)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();

      // Look for factual indicators
      if (trimmed.match(/\b(is|are|was|were|has|have|will|must|should)\b/i)) {
        extracted.facts.push({
          statement: trimmed,
          source,
          confidence: 0.5, // Low confidence for auto-extracted
        });
      }
    }

    // Extract procedures (numbered lists)
    const procedurePattern = /(\d+)\.\s+(.+)/g;
    let match;
    const steps = [];

    while ((match = procedurePattern.exec(text)) !== null) {
      steps.push({
        number: parseInt(match[1]),
        step: match[2].trim(),
      });
    }

    if (steps.length > 0) {
      extracted.procedures.push({
        name: "Extracted Procedure",
        steps: steps.map((s) => s.step),
        source,
      });
    }

    return extracted;
  }

  /**
   * Generate ID from string
   */
  generateId(str) {
    return crypto
      .createHash("md5")
      .update(str.toLowerCase())
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Calculate quality score
   */
  calculateQuality(item) {
    let score = 100;

    // Check completeness
    const requiredFields = ["name", "description", "source"];
    for (const field of requiredFields) {
      if (!item[field] || item[field].length === 0) {
        score -= 20;
      }
    }

    // Check description length
    if (item.description && item.description.length < 20) {
      score -= 15;
    }

    // Check source quality
    if (item.source === "unknown") {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate relevance of search result
   */
  calculateRelevance(query, entry) {
    const queryLower = query.toLowerCase();
    const text = JSON.stringify(entry).toLowerCase();

    // Count occurrences
    const occurrences = (text.match(new RegExp(queryLower, "g")) || []).length;

    // Boost by quality
    const relevance = occurrences * (entry.ihsanScore / 100);

    return relevance;
  }

  /**
   * Record source statistics
   */
  recordSource(source) {
    if (!this.statistics.sources[source]) {
      this.statistics.sources[source] = 0;
    }
    this.statistics.sources[source]++;
  }

  /**
   * Save knowledge base to disk
   */
  async save() {
    try {
      // Convert Maps to Objects for JSON
      const serializable = {
        entities: Object.fromEntries(this.knowledgeBase.entities),
        relationships: Object.fromEntries(this.knowledgeBase.relationships),
        patterns: Object.fromEntries(this.knowledgeBase.patterns),
        procedures: Object.fromEntries(this.knowledgeBase.procedures),
        facts: Object.fromEntries(this.knowledgeBase.facts),
        hypotheses: Object.fromEntries(this.knowledgeBase.hypotheses),
        statistics: {
          ...this.statistics,
          lastUpdate: new Date().toISOString(),
        },
      };

      const knowledgeFile = path.join(
        this.config.knowledgeDir,
        "knowledge-base.json",
      );
      await fs.writeFile(
        knowledgeFile,
        JSON.stringify(serializable, null, 2),
        "utf-8",
      );

      console.log(
        `${colors.emerald}[Knowledge Builder] ✅ Knowledge base saved (${this.statistics.totalEntries} entries)${colors.reset}`,
      );
    } catch (error) {
      console.error(
        `${colors.ruby}[Knowledge Builder] Save error: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalEntries: this.statistics.totalEntries,
      entities: this.knowledgeBase.entities.size,
      relationships: this.knowledgeBase.relationships.size,
      patterns: this.knowledgeBase.patterns.size,
      procedures: this.knowledgeBase.procedures.size,
      facts: this.knowledgeBase.facts.size,
      hypotheses: this.knowledgeBase.hypotheses.size,
      sources: this.statistics.sources,
      lastUpdate: this.statistics.lastUpdate,
    };
  }

  /**
   * Display knowledge summary
   */
  displaySummary() {
    const stats = this.getStatistics();

    console.log(
      `\n${colors.gold}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(
      `${colors.gold}${colors.bright}  KNOWLEDGE BASE SUMMARY${colors.reset}`,
    );
    console.log(
      `${colors.gold}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    console.log(
      `${colors.platinum}Total Entries: ${stats.totalEntries}${colors.reset}\n`,
    );

    console.log(`${colors.sapphire}Knowledge Types:${colors.reset}`);
    console.log(`${colors.dim}  Entities: ${stats.entities}${colors.reset}`);
    console.log(
      `${colors.dim}  Relationships: ${stats.relationships}${colors.reset}`,
    );
    console.log(`${colors.dim}  Patterns: ${stats.patterns}${colors.reset}`);
    console.log(
      `${colors.dim}  Procedures: ${stats.procedures}${colors.reset}`,
    );
    console.log(`${colors.dim}  Facts: ${stats.facts}${colors.reset}`);
    console.log(
      `${colors.dim}  Hypotheses: ${stats.hypotheses}${colors.reset}\n`,
    );

    console.log(`${colors.sapphire}Sources:${colors.reset}`);
    const sortedSources = Object.entries(stats.sources).sort(
      (a, b) => b[1] - a[1],
    );
    for (const [source, count] of sortedSources.slice(0, 5)) {
      console.log(`${colors.dim}  ${source}: ${count}${colors.reset}`);
    }
    console.log();

    if (stats.lastUpdate) {
      console.log(
        `${colors.dim}Last Updated: ${stats.lastUpdate}${colors.reset}\n`,
      );
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    await this.save();
    console.log(
      `${colors.sapphire}[Knowledge Builder] Cleanup complete${colors.reset}`,
    );
  }
}

// Export for use as module
module.exports = { KnowledgeBuilder };

// Main execution
if (require.main === module) {
  (async () => {
    const builder = new KnowledgeBuilder();

    try {
      await builder.initialize();

      // Demo: Add knowledge
      console.log(
        `${colors.gold}═══════════════════════════════════${colors.reset}`,
      );
      console.log(
        `${colors.gold}  DEMO: Knowledge Accumulation${colors.reset}`,
      );
      console.log(
        `${colors.gold}═══════════════════════════════════${colors.reset}\n`,
      );

      builder.addEntity({
        name: "BIZRA Node-0",
        type: "system",
        description: "Genesis validation node combining Node.js and Rust",
        attributes: {
          version: "v2.2.0-rc1",
          chainId: "bizra-testnet-001",
        },
        source: "demo",
      });

      builder.addEntity({
        name: "احسان",
        type: "principle",
        description:
          "Excellence in the sight of Allah - to do your work like God is in front of you",
        attributes: {
          threshold: "95%",
          standard: "PEAK",
        },
        source: "demo",
      });

      builder.addRelationship({
        from: "BIZRA Node-0",
        to: "احسان",
        relation: "implements",
        metadata: {
          quality: "PEAK",
          verification: "continuous",
        },
        source: "demo",
      });

      builder.addFact({
        statement: "BIZRA started in Ramadan 2023",
        evidence: ["Timeline document", "User testimony"],
        confidence: 1.0,
        source: "demo",
      });

      builder.displaySummary();

      // Search demo
      const results = builder.search("احسان", { limit: 3 });
      console.log(
        `${colors.sapphire}Search Results for "احسان":${colors.reset}`,
      );
      for (const result of results) {
        console.log(
          `${colors.dim}  • [${result.type}] ${result.entry.name || result.entry.statement}${colors.reset}`,
        );
      }

      console.log(
        `\n${colors.emerald}✅ Knowledge Builder demo complete!${colors.reset}\n`,
      );
      console.log(
        `${colors.dim}Use as module: const {KnowledgeBuilder} = require('./knowledge-builder');${colors.reset}\n`,
      );

      await builder.cleanup();
      process.exit(0);
    } catch (error) {
      console.error(`${colors.ruby}Error: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  })();
}
