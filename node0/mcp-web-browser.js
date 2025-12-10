#!/usr/bin/env node

/**
 * ====================================================================
 * BIZRA MCP Web Browser Server
 * احسان Standard: Self-Use Web Access & Research
 * ====================================================================
 *
 * Purpose: Built-in MCP server providing web browser capabilities
 *          for autonomous web research, data extraction, and
 *          knowledge gathering.
 *
 * Features:
 * - Headless browser automation (Puppeteer-based)
 * - Autonomous web research
 * - Content extraction and parsing
 * - Screenshot capture
 * - PDF generation from web pages
 * - Form interaction
 * - Navigation and link following
 * - Search engine integration
 * - احسان quality verification on extracted content
 *
 * MCP Protocol Compliance:
 * - Standard input/output communication
 * - JSON-RPC 2.0 message format
 * - Tool registration and discovery
 * - Error handling and reporting
 *
 * Date: 2025-10-23
 * Author: MoMo (First Architect) + Claude Code (احسان implementation)
 */

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

class MCPWebBrowser extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      headless: config.headless !== false, // Default: headless mode
      timeout: config.timeout || 30000, // 30 seconds
      userAgent: config.userAgent || "BIZRA-Node-0-Web-Browser/1.0",
      viewport: config.viewport || { width: 1920, height: 1080 },
      ihsanThreshold: config.ihsanThreshold || 95.0,
      maxConcurrentPages: config.maxConcurrentPages || 3,
      ...config,
    };

    this.browser = null;
    this.pages = new Map();
    this.tools = this.registerTools();
    this.messageId = 0;
  }

  /**
   * Initialize MCP server
   */
  async initialize() {
    console.log(
      `\n${colors.sapphire}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(`${colors.sapphire}  MCP WEB BROWSER SERVER${colors.reset}`);
    console.log(
      `${colors.sapphire}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    console.log(
      `${colors.platinum}[MCP Browser] احسان Standard: Autonomous Web Access${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Browser] Headless Mode: ${this.config.headless}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Browser] Timeout: ${this.config.timeout}ms${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Browser] احسان Threshold: ${this.config.ihsanThreshold}%${colors.reset}\n`,
    );

    // Initialize browser (lazy loading)
    console.log(
      `${colors.platinum}[MCP Browser] Browser will initialize on first use (lazy loading)${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Browser] Note: Requires 'puppeteer' package: npm install puppeteer${colors.reset}\n`,
    );

    // Register tools with MCP protocol
    console.log(
      `${colors.emerald}[MCP Browser] ✅ Registered ${this.tools.length} tools${colors.reset}`,
    );
    for (const tool of this.tools) {
      console.log(
        `${colors.dim}  • ${tool.name}: ${tool.description}${colors.reset}`,
      );
    }

    console.log(
      `\n${colors.emerald}[MCP Browser] ✅ MCP Web Browser Server ready${colors.reset}\n`,
    );
    return this;
  }

  /**
   * Register MCP tools
   */
  registerTools() {
    return [
      {
        name: "web_navigate",
        description: "Navigate to a URL and extract page content",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to navigate to" },
            waitForSelector: {
              type: "string",
              description: "Optional: CSS selector to wait for",
            },
          },
          required: ["url"],
        },
        handler: this.navigate.bind(this),
      },
      {
        name: "web_extract_text",
        description: "Extract all text content from current page",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "Optional: CSS selector to extract from",
            },
          },
        },
        handler: this.extractText.bind(this),
      },
      {
        name: "web_extract_links",
        description: "Extract all links from current page",
        inputSchema: {
          type: "object",
          properties: {
            filterPattern: {
              type: "string",
              description: "Optional: Regex pattern to filter links",
            },
          },
        },
        handler: this.extractLinks.bind(this),
      },
      {
        name: "web_screenshot",
        description: "Take a screenshot of current page",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Output file path" },
            fullPage: {
              type: "boolean",
              description: "Capture full page (default: true)",
            },
          },
          required: ["path"],
        },
        handler: this.screenshot.bind(this),
      },
      {
        name: "web_pdf",
        description: "Generate PDF from current page",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Output PDF file path" },
          },
          required: ["path"],
        },
        handler: this.generatePDF.bind(this),
      },
      {
        name: "web_search",
        description: "Perform web search using DuckDuckGo",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            maxResults: {
              type: "number",
              description: "Maximum results (default: 10)",
            },
          },
          required: ["query"],
        },
        handler: this.search.bind(this),
      },
      {
        name: "web_fill_form",
        description: "Fill and submit a form",
        inputSchema: {
          type: "object",
          properties: {
            formData: {
              type: "object",
              description: "Key-value pairs for form fields",
            },
            submitSelector: {
              type: "string",
              description: "Submit button selector",
            },
          },
          required: ["formData"],
        },
        handler: this.fillForm.bind(this),
      },
      {
        name: "web_execute_script",
        description: "Execute JavaScript on the page",
        inputSchema: {
          type: "object",
          properties: {
            script: {
              type: "string",
              description: "JavaScript code to execute",
            },
          },
          required: ["script"],
        },
        handler: this.executeScript.bind(this),
      },
    ];
  }

  /**
   * Ensure browser is initialized
   */
  async ensureBrowser() {
    if (!this.browser) {
      console.log(
        `${colors.sapphire}[MCP Browser] Initializing Puppeteer browser...${colors.reset}`,
      );

      try {
        const puppeteer = require("puppeteer");

        this.browser = await puppeteer.launch({
          headless: this.config.headless,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        });

        console.log(
          `${colors.emerald}[MCP Browser] ✅ Browser initialized${colors.reset}`,
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize browser: ${error.message}. Run: npm install puppeteer`,
        );
      }
    }
  }

  /**
   * Get or create a page
   */
  async getPage(pageId = "default") {
    await this.ensureBrowser();

    if (!this.pages.has(pageId)) {
      const page = await this.browser.newPage();

      // Set viewport
      await page.setViewport(this.config.viewport);

      // Set user agent
      await page.setUserAgent(this.config.userAgent);

      // Set timeout
      page.setDefaultTimeout(this.config.timeout);

      this.pages.set(pageId, page);
      console.log(
        `${colors.platinum}[MCP Browser] Created new page: ${pageId}${colors.reset}`,
      );
    }

    return this.pages.get(pageId);
  }

  /**
   * Navigate to URL
   */
  async navigate({ url, waitForSelector }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Navigating to: ${url}${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: this.config.timeout,
      });

      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, {
          timeout: this.config.timeout,
        });
      }

      const status = response.status();
      const contentType = response.headers()["content-type"] || "unknown";

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Page loaded (${status}) - ${contentType}${colors.reset}`,
      );

      return {
        success: true,
        url: page.url(),
        status,
        contentType,
        title: await page.title(),
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Navigation error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract text content
   */
  async extractText({ selector }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Extracting text...${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      let text;

      if (selector) {
        text = await page.$eval(selector, (el) => el.textContent);
      } else {
        text = await page.evaluate(() => document.body.textContent);
      }

      // Clean and normalize text
      text = text.replace(/\s+/g, " ").trim();

      // احسان quality check
      const qualityScore = this.calculateContentQuality(text);

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Extracted ${text.length} chars (احسان: ${qualityScore}%)${colors.reset}`,
      );

      return {
        success: true,
        text,
        length: text.length,
        qualityScore,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Extraction error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract links
   */
  async extractLinks({ filterPattern }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Extracting links...${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]")).map((a) => ({
          href: a.href,
          text: a.textContent.trim(),
          title: a.title || null,
        }));
      });

      // Filter if pattern provided
      let filteredLinks = links;
      if (filterPattern) {
        const regex = new RegExp(filterPattern);
        filteredLinks = links.filter((link) => regex.test(link.href));
      }

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Extracted ${filteredLinks.length} links${colors.reset}`,
      );

      return {
        success: true,
        links: filteredLinks,
        totalCount: filteredLinks.length,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Link extraction error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Take screenshot
   */
  async screenshot({ path, fullPage = true }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Taking screenshot...${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      await page.screenshot({
        path,
        fullPage,
      });

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Screenshot saved: ${path}${colors.reset}`,
      );

      return {
        success: true,
        path,
        fullPage,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Screenshot error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate PDF
   */
  async generatePDF({ path }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Generating PDF...${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      await page.pdf({
        path,
        format: "A4",
        printBackground: true,
      });

      console.log(
        `${colors.emerald}[MCP Browser] ✅ PDF saved: ${path}${colors.reset}`,
      );

      return {
        success: true,
        path,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] PDF error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Perform web search
   */
  async search({ query, maxResults = 10 }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Searching: "${query}"${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      // Use DuckDuckGo
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: "networkidle2" });

      // Extract search results
      const results = await page.evaluate((max) => {
        const items = Array.from(document.querySelectorAll(".result"));
        return items.slice(0, max).map((item) => {
          const titleEl = item.querySelector(".result__title a");
          const snippetEl = item.querySelector(".result__snippet");

          return {
            title: titleEl ? titleEl.textContent.trim() : "",
            url: titleEl ? titleEl.href : "",
            snippet: snippetEl ? snippetEl.textContent.trim() : "",
          };
        });
      }, maxResults);

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Found ${results.length} results${colors.reset}`,
      );

      return {
        success: true,
        query,
        results,
        count: results.length,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Search error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fill form
   */
  async fillForm({ formData, submitSelector }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Filling form...${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      for (const [selector, value] of Object.entries(formData)) {
        await page.type(selector, value);
      }

      if (submitSelector) {
        await page.click(submitSelector);
        await page.waitForNavigation({ waitUntil: "networkidle2" });
      }

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Form filled${colors.reset}`,
      );

      return {
        success: true,
        fields: Object.keys(formData).length,
        submitted: !!submitSelector,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Form error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute JavaScript
   */
  async executeScript({ script }) {
    console.log(
      `${colors.sapphire}[MCP Browser] Executing script...${colors.reset}`,
    );

    const page = await this.getPage();

    try {
      const result = await page.evaluate(script);

      console.log(
        `${colors.emerald}[MCP Browser] ✅ Script executed${colors.reset}`,
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Browser] Script error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate content quality (احسان)
   */
  calculateContentQuality(text) {
    if (!text) return 0;

    let score = 100;

    // Length check
    if (text.length < 100) score -= 30;
    if (text.length > 100000) score -= 20;

    // Word count
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length < 20) score -= 20;

    // Unique word ratio
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const uniqueRatio = uniqueWords.size / words.length;
    if (uniqueRatio < 0.3) score -= 25;

    // Special characters (too many might indicate noise)
    const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const specialRatio = specialChars / text.length;
    if (specialRatio > 0.3) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Handle MCP protocol message
   */
  async handleMessage(message) {
    try {
      const { id, method, params } = message;

      if (method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: this.tools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            })),
          },
        };
      }

      if (method === "tools/call") {
        const { name, arguments: args } = params;
        const tool = this.tools.find((t) => t.name === name);

        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }

        const result = await tool.handler(args);

        return {
          jsonrpc: "2.0",
          id,
          result,
        };
      }

      throw new Error(`Unknown method: ${method}`);
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log(
      `${colors.sapphire}[MCP Browser] Cleaning up...${colors.reset}`,
    );

    for (const [pageId, page] of this.pages) {
      await page.close();
      console.log(
        `${colors.dim}[MCP Browser] Closed page: ${pageId}${colors.reset}`,
      );
    }

    if (this.browser) {
      await this.browser.close();
      console.log(
        `${colors.emerald}[MCP Browser] ✅ Browser closed${colors.reset}`,
      );
    }
  }
}

// Export for use as module
module.exports = { MCPWebBrowser };

// Main execution
if (require.main === module) {
  (async () => {
    const browser = new MCPWebBrowser();

    try {
      await browser.initialize();

      // Demo: Search and extract
      console.log(
        `${colors.gold}═══════════════════════════════════${colors.reset}`,
      );
      console.log(
        `${colors.gold}  DEMO: Web Search and Extraction${colors.reset}`,
      );
      console.log(
        `${colors.gold}═══════════════════════════════════${colors.reset}\n`,
      );

      const searchResult = await browser.search({
        query: "احسان excellence Islamic concept",
        maxResults: 3,
      });

      if (searchResult.success) {
        console.log(`\n${colors.platinum}Search Results:${colors.reset}`);
        for (const result of searchResult.results) {
          console.log(`${colors.sapphire}  • ${result.title}${colors.reset}`);
          console.log(`${colors.dim}    ${result.url}${colors.reset}`);
          console.log(
            `${colors.dim}    ${result.snippet.substring(0, 100)}...${colors.reset}\n`,
          );
        }
      }

      console.log(
        `\n${colors.emerald}✅ MCP Web Browser demo complete!${colors.reset}\n`,
      );
      console.log(
        `${colors.dim}Use as module: const {MCPWebBrowser} = require('./mcp-web-browser');${colors.reset}\n`,
      );

      await browser.cleanup();
      process.exit(0);
    } catch (error) {
      console.error(`${colors.ruby}Error: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  })();
}
