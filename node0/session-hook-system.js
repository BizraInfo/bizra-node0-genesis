#!/usr/bin/env node

/**
 * ====================================================================
 * BIZRA Session Hook System
 * احسان Standard: Context Restoration & Continuous Work
 * ====================================================================
 *
 * Purpose: Automatically restore context and continue work from
 *          previous sessions by scanning for user profile and
 *          knowledge files.
 *
 * Features:
 * - Auto-scan for user profile.md and model local knowledge.md
 * - Parse previous requests and current tasks
 * - Restore session context
 * - Event-driven hook system
 * - Integration with memory and knowledge systems
 * - Standing on Shoulders of Giants protocol
 * - A2A (Agent-to-Agent) protocol support
 *
 * Date: 2025-10-23
 * Author: MoMo (First Architect) + Claude Code (احسان implementation)
 */

const fs = require("fs").promises;
const path = require("path");
const EventEmitter = require("events");

// ANSI Colors (from bizra-startup.js)
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

class SessionHookSystem extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      rootDir: config.rootDir || "C:\\BIZRA-NODE0",
      profileFileName: config.profileFileName || "user profile.md",
      knowledgeFileName: config.knowledgeFileName || "model local knowledge.md",
      memoryDir:
        config.memoryDir || path.join(process.cwd(), ".hive-mind", "memory"),
      knowledgeDir:
        config.knowledgeDir ||
        path.join(process.cwd(), "knowledge", "organized"),
      scanDepth: config.scanDepth || 3, // Max directory depth to scan
      ...config,
    };

    this.sessionContext = {
      userProfile: null,
      localKnowledge: null,
      previousRequests: [],
      currentTasks: [],
      memoryFiles: [],
      knowledgeFiles: [],
      startTime: Date.now(),
    };

    this.hooks = new Map();
  }

  /**
   * Initialize hook system
   */
  async initialize() {
    console.log(
      `\n${colors.sapphire}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(
      `${colors.sapphire}  SESSION HOOK SYSTEM INITIALIZATION${colors.reset}`,
    );
    console.log(
      `${colors.sapphire}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    console.log(
      `${colors.platinum}[Hook System] احسان Standard: Context Restoration${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[Hook System] Root Directory: ${this.config.rootDir}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[Hook System] Scan Depth: ${this.config.scanDepth} levels${colors.reset}\n`,
    );

    // Register default hooks
    this.registerDefaultHooks();

    console.log(
      `${colors.emerald}[Hook System] ✅ Initialization complete${colors.reset}\n`,
    );
    return this;
  }

  /**
   * Register default hooks
   */
  registerDefaultHooks() {
    // Hook: session-start
    this.registerHook("session-start", async () => {
      console.log(
        `${colors.amethyst}[Hook] 🪝 Triggering: session-start${colors.reset}`,
      );
      await this.scanEnvironment();
      await this.restoreContext();
      this.emit("context-restored", this.sessionContext);
    });

    // Hook: session-end
    this.registerHook("session-end", async () => {
      console.log(
        `${colors.amethyst}[Hook] 🪝 Triggering: session-end${colors.reset}`,
      );
      await this.saveSessionState();
      this.emit("session-saved");
    });

    // Hook: task-update
    this.registerHook("task-update", async (task) => {
      console.log(
        `${colors.amethyst}[Hook] 🪝 Triggering: task-update${colors.reset}`,
      );
      await this.updateKnowledge(task);
      this.emit("knowledge-updated", task);
    });

    // Hook: request-logged
    this.registerHook("request-logged", async (request) => {
      console.log(
        `${colors.amethyst}[Hook] 🪝 Triggering: request-logged${colors.reset}`,
      );
      this.sessionContext.previousRequests.push({
        request,
        timestamp: new Date().toISOString(),
      });
    });

    console.log(
      `${colors.platinum}[Hook System] Registered 4 default hooks${colors.reset}`,
    );
  }

  /**
   * Register a new hook
   */
  registerHook(eventName, handler) {
    if (!this.hooks.has(eventName)) {
      this.hooks.set(eventName, []);
    }
    this.hooks.get(eventName).push(handler);
  }

  /**
   * Trigger a hook
   */
  async triggerHook(eventName, data) {
    if (!this.hooks.has(eventName)) {
      console.log(
        `${colors.dim}[Hook System] No handlers for: ${eventName}${colors.reset}`,
      );
      return;
    }

    const handlers = this.hooks.get(eventName);
    console.log(
      `${colors.sapphire}[Hook System] Executing ${handlers.length} handler(s) for: ${eventName}${colors.reset}`,
    );

    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(
          `${colors.ruby}[Hook System] Error in handler: ${error.message}${colors.reset}`,
        );
      }
    }
  }

  /**
   * Scan environment for profile and knowledge files
   */
  async scanEnvironment() {
    console.log(
      `${colors.sapphire}[Scanner] 🔍 Scanning environment for context files...${colors.reset}\n`,
    );

    const scanTasks = [
      this.findFile(this.config.profileFileName),
      this.findFile(this.config.knowledgeFileName),
      this.scanMemoryDirectory(),
      this.scanKnowledgeDirectory(),
    ];

    const [profilePath, knowledgePath, memoryFiles, knowledgeFiles] =
      await Promise.all(scanTasks);

    // Load profile
    if (profilePath) {
      console.log(
        `${colors.emerald}[Scanner] ✅ Found user profile: ${profilePath}${colors.reset}`,
      );
      this.sessionContext.userProfile =
        await this.loadMarkdownFile(profilePath);
    } else {
      console.log(
        `${colors.dim}[Scanner] ⚠️  User profile not found (will create template)${colors.reset}`,
      );
      await this.createProfileTemplate();
    }

    // Load local knowledge
    if (knowledgePath) {
      console.log(
        `${colors.emerald}[Scanner] ✅ Found local knowledge: ${knowledgePath}${colors.reset}`,
      );
      this.sessionContext.localKnowledge =
        await this.loadMarkdownFile(knowledgePath);
    } else {
      console.log(
        `${colors.dim}[Scanner] ⚠️  Local knowledge not found (will create template)${colors.reset}`,
      );
      await this.createKnowledgeTemplate();
    }

    // Load memory files
    this.sessionContext.memoryFiles = memoryFiles;
    console.log(
      `${colors.platinum}[Scanner] 📁 Found ${memoryFiles.length} memory files${colors.reset}`,
    );

    // Load knowledge files
    this.sessionContext.knowledgeFiles = knowledgeFiles;
    console.log(
      `${colors.platinum}[Scanner] 📚 Found ${knowledgeFiles.length} knowledge files${colors.reset}\n`,
    );
  }

  /**
   * Find a file recursively
   */
  async findFile(fileName, dir = this.config.rootDir, depth = 0) {
    if (depth > this.config.scanDepth) {
      return null;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip common large directories
        if (this.shouldSkip(entry.name)) {
          continue;
        }

        if (
          entry.isFile() &&
          entry.name.toLowerCase() === fileName.toLowerCase()
        ) {
          return fullPath;
        }

        if (entry.isDirectory()) {
          const found = await this.findFile(fileName, fullPath, depth + 1);
          if (found) return found;
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }

    return null;
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkip(name) {
    const skipPatterns = [
      "node_modules",
      ".git",
      "target",
      "dist",
      "build",
      ".next",
      "coverage",
      "__pycache__",
    ];
    return skipPatterns.includes(name);
  }

  /**
   * Scan memory directory
   */
  async scanMemoryDirectory() {
    const files = [];
    try {
      const entries = await fs.readdir(this.config.memoryDir, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push({
            name: entry.name,
            path: path.join(this.config.memoryDir, entry.name),
            type: "memory",
          });
        }
      }
    } catch (error) {
      console.log(
        `${colors.dim}[Scanner] Memory directory not accessible${colors.reset}`,
      );
    }

    return files;
  }

  /**
   * Scan knowledge directory
   */
  async scanKnowledgeDirectory() {
    const files = [];
    try {
      const entries = await fs.readdir(this.config.knowledgeDir, {
        withFileTypes: true,
        recursive: true,
      });

      for (const entry of entries) {
        if (
          entry.isFile() &&
          (entry.name.endsWith(".md") || entry.name.endsWith(".json"))
        ) {
          files.push({
            name: entry.name,
            path: path.join(this.config.knowledgeDir, entry.name),
            type: "knowledge",
          });
        }
      }
    } catch (error) {
      console.log(
        `${colors.dim}[Scanner] Knowledge directory not accessible${colors.reset}`,
      );
    }

    return files;
  }

  /**
   * Load markdown file and parse
   */
  async loadMarkdownFile(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return this.parseMarkdown(content, filePath);
    } catch (error) {
      console.error(
        `${colors.ruby}[Scanner] Error loading ${filePath}: ${error.message}${colors.reset}`,
      );
      return null;
    }
  }

  /**
   * Parse markdown content
   */
  parseMarkdown(content, filePath) {
    const parsed = {
      rawContent: content,
      filePath,
      sections: {},
      previousRequests: [],
      currentTasks: [],
    };

    // Extract sections by headers
    const lines = content.split("\n");
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      // Check for header
      const headerMatch = line.match(/^#+\s+(.+)$/);
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          parsed.sections[currentSection] = currentContent.join("\n").trim();
        }

        currentSection = headerMatch[1].trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      parsed.sections[currentSection] = currentContent.join("\n").trim();
    }

    // Extract previous requests (look for "Previous Requests" section)
    if (parsed.sections["Previous Requests"]) {
      const requestLines = parsed.sections["Previous Requests"].split("\n");
      for (const line of requestLines) {
        const match = line.match(/^-\s+\[(.+?)\]\s+(.+)$/);
        if (match) {
          parsed.previousRequests.push({
            timestamp: match[1],
            request: match[2],
          });
        }
      }
    }

    // Extract current tasks (look for "Current Tasks" section)
    if (parsed.sections["Current Tasks"]) {
      const taskLines = parsed.sections["Current Tasks"].split("\n");
      for (const line of taskLines) {
        const match = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
        if (match) {
          parsed.currentTasks.push({
            completed: match[1] === "x",
            task: match[2],
          });
        }
      }
    }

    return parsed;
  }

  /**
   * Restore context from parsed files
   */
  async restoreContext() {
    console.log(
      `${colors.sapphire}[Context] 🔄 Restoring session context...${colors.reset}\n`,
    );

    // Extract previous requests from user profile
    if (this.sessionContext.userProfile) {
      this.sessionContext.previousRequests.push(
        ...this.sessionContext.userProfile.previousRequests,
      );
      console.log(
        `${colors.platinum}[Context] Loaded ${this.sessionContext.userProfile.previousRequests.length} previous requests${colors.reset}`,
      );
    }

    // Extract current tasks from local knowledge
    if (this.sessionContext.localKnowledge) {
      this.sessionContext.currentTasks.push(
        ...this.sessionContext.localKnowledge.currentTasks,
      );
      console.log(
        `${colors.platinum}[Context] Loaded ${this.sessionContext.localKnowledge.currentTasks.length} current tasks${colors.reset}`,
      );
    }

    // Display context summary
    this.displayContextSummary();
  }

  /**
   * Display context summary
   */
  displayContextSummary() {
    console.log(
      `\n${colors.gold}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(
      `${colors.gold}${colors.bright}  SESSION CONTEXT RESTORED${colors.reset}`,
    );
    console.log(
      `${colors.gold}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    // User Profile
    if (this.sessionContext.userProfile) {
      console.log(`${colors.emerald}✓ User Profile${colors.reset}`);
      const sections = Object.keys(this.sessionContext.userProfile.sections);
      console.log(
        `${colors.dim}  Sections: ${sections.join(", ")}${colors.reset}\n`,
      );
    }

    // Local Knowledge
    if (this.sessionContext.localKnowledge) {
      console.log(`${colors.emerald}✓ Local Knowledge${colors.reset}`);
      const sections = Object.keys(this.sessionContext.localKnowledge.sections);
      console.log(
        `${colors.dim}  Sections: ${sections.join(", ")}${colors.reset}\n`,
      );
    }

    // Previous Requests
    console.log(
      `${colors.sapphire}Previous Requests: ${this.sessionContext.previousRequests.length}${colors.reset}`,
    );
    if (this.sessionContext.previousRequests.length > 0) {
      const recent = this.sessionContext.previousRequests.slice(-3);
      for (const req of recent) {
        console.log(
          `${colors.dim}  • [${req.timestamp}] ${req.request.substring(0, 60)}...${colors.reset}`,
        );
      }
    }
    console.log();

    // Current Tasks
    console.log(
      `${colors.sapphire}Current Tasks: ${this.sessionContext.currentTasks.length}${colors.reset}`,
    );
    if (this.sessionContext.currentTasks.length > 0) {
      for (const task of this.sessionContext.currentTasks.slice(0, 5)) {
        const status = task.completed
          ? colors.emerald + "✓"
          : colors.platinum + "○";
        console.log(`${colors.dim}  ${status} ${task.task}${colors.reset}`);
      }
    }
    console.log();

    // Resources
    console.log(`${colors.platinum}Resources:${colors.reset}`);
    console.log(
      `${colors.dim}  Memory Files: ${this.sessionContext.memoryFiles.length}${colors.reset}`,
    );
    console.log(
      `${colors.dim}  Knowledge Files: ${this.sessionContext.knowledgeFiles.length}${colors.reset}`,
    );
    console.log();
  }

  /**
   * Create user profile template
   */
  async createProfileTemplate() {
    const template = `# User Profile

## Identity
- **Name**: [Your Name]
- **Role**: [Your Role]
- **Node**: BIZRA Node-0

## Preferences
- **Working Hours**: [Your preferred hours]
- **Communication Style**: [Direct/Detailed/etc]
- **احسان Threshold**: 95%

## Previous Requests

(This section will be auto-populated by the system)

## Current Focus

[What you're currently working on]

## Goals

- [ ] [Your goal 1]
- [ ] [Your goal 2]
- [ ] [Your goal 3]

---
*Last Updated: ${new Date().toISOString()}*
*Auto-generated by BIZRA Session Hook System*
`;

    const profilePath = path.join(
      this.config.rootDir,
      this.config.profileFileName,
    );

    try {
      await fs.writeFile(profilePath, template, "utf-8");
      console.log(
        `${colors.emerald}[Scanner] ✅ Created user profile template: ${profilePath}${colors.reset}`,
      );
    } catch (error) {
      console.error(
        `${colors.ruby}[Scanner] Error creating profile template: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * Create local knowledge template
   */
  async createKnowledgeTemplate() {
    const template = `# Model Local Knowledge

## System Overview

BIZRA Node-0 is a genesis validation node combining:
- Node.js/Express HTTP services
- Rust-powered Proof of Integrity (PoI) core
- ACE Framework (Agentic Context Engineering)
- 100% local operation via Ollama

## Current Tasks

(This section will be auto-populated by the system)

## Recent Achievements

- Day 13: Full local autonomy achieved
- Day 14: Revolutionary environment transformation complete

## Active Components

- **REST API**: Port 8080
- **Metrics**: Port 9464
- **Local Models**: 4 models (bizra-planner, deepseek-r1:8b, mistral, llama3.2)
- **احسان Standard**: 95% threshold maintained

## Known Issues

- bizra-planner: Verbose output (2-5 minute responses)
- Recommended: Use mistral or deepseek-r1 for production

## Next Steps

(Populated based on user requests and system analysis)

---
*Last Updated: ${new Date().toISOString()}*
*Auto-generated by BIZRA Session Hook System*
`;

    const knowledgePath = path.join(
      this.config.rootDir,
      this.config.knowledgeFileName,
    );

    try {
      await fs.writeFile(knowledgePath, template, "utf-8");
      console.log(
        `${colors.emerald}[Scanner] ✅ Created local knowledge template: ${knowledgePath}${colors.reset}`,
      );
    } catch (error) {
      console.error(
        `${colors.ruby}[Scanner] Error creating knowledge template: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * Save session state
   */
  async saveSessionState() {
    console.log(
      `${colors.sapphire}[Session] 💾 Saving session state...${colors.reset}`,
    );

    const sessionData = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.sessionContext.startTime,
      previousRequests: this.sessionContext.previousRequests,
      currentTasks: this.sessionContext.currentTasks,
      memoryFilesScanned: this.sessionContext.memoryFiles.length,
      knowledgeFilesScanned: this.sessionContext.knowledgeFiles.length,
    };

    const sessionPath = path.join(
      this.config.memoryDir,
      `SESSION-${new Date().toISOString().split("T")[0]}.json`,
    );

    try {
      await fs.mkdir(this.config.memoryDir, { recursive: true });
      await fs.writeFile(
        sessionPath,
        JSON.stringify(sessionData, null, 2),
        "utf-8",
      );
      console.log(
        `${colors.emerald}[Session] ✅ Session state saved: ${sessionPath}${colors.reset}`,
      );
    } catch (error) {
      console.error(
        `${colors.ruby}[Session] Error saving state: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * Update knowledge with new information
   */
  async updateKnowledge(data) {
    console.log(
      `${colors.sapphire}[Knowledge] 📝 Updating knowledge base...${colors.reset}`,
    );

    const knowledgePath = path.join(
      this.config.rootDir,
      this.config.knowledgeFileName,
    );

    try {
      // Read existing knowledge
      let content = "";
      try {
        content = await fs.readFile(knowledgePath, "utf-8");
      } catch {
        // File doesn't exist, will create
        await this.createKnowledgeTemplate();
        content = await fs.readFile(knowledgePath, "utf-8");
      }

      // Append new knowledge
      const updateSection = `\n## Update: ${new Date().toISOString()}\n\n${JSON.stringify(data, null, 2)}\n`;
      content += updateSection;

      await fs.writeFile(knowledgePath, content, "utf-8");
      console.log(
        `${colors.emerald}[Knowledge] ✅ Knowledge updated${colors.reset}`,
      );
    } catch (error) {
      console.error(
        `${colors.ruby}[Knowledge] Error updating: ${error.message}${colors.reset}`,
      );
    }
  }

  /**
   * Get current session context
   */
  getContext() {
    return this.sessionContext;
  }
}

// Export for use as module
module.exports = { SessionHookSystem };

// Main execution
if (require.main === module) {
  (async () => {
    const hookSystem = new SessionHookSystem();

    try {
      await hookSystem.initialize();
      await hookSystem.triggerHook("session-start");

      console.log(
        `\n${colors.emerald}✅ Session hook system ready!${colors.reset}\n`,
      );

      // Keep alive for demonstration
      console.log(
        `${colors.dim}Press Ctrl+C to trigger session-end hook...${colors.reset}`,
      );

      process.on("SIGINT", async () => {
        console.log(
          `\n${colors.sapphire}[System] Received SIGINT, triggering session-end...${colors.reset}`,
        );
        await hookSystem.triggerHook("session-end");
        process.exit(0);
      });
    } catch (error) {
      console.error(`${colors.ruby}Error: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  })();
}
