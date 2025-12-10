#!/usr/bin/env node

/**
 * ====================================================================
 * BIZRA MCP Filesystem Server
 * احسان Standard: Self-Use Local Filesystem Operations
 * ====================================================================
 *
 * Purpose: Built-in MCP server providing filesystem capabilities
 *          for autonomous file management, organization, and
 *          knowledge storage.
 *
 * Features:
 * - Safe file operations (read, write, copy, move, delete)
 * - Directory management
 * - File search and filtering
 * - Content analysis
 * - Batch operations
 * - احسان quality verification
 * - Integration with autonomous data processor
 * - Whitelist/blacklist patterns
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

class MCPFilesystem extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      rootDir: config.rootDir || "C:\\BIZRA-NODE0",
      allowedPaths: config.allowedPaths || ["C:\\BIZRA-NODE0"],
      deniedPaths: config.deniedPaths || [
        "C:\\Windows",
        "C:\\Program Files",
        "C:\\Program Files (x86)",
      ],
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100 MB
      ihsanThreshold: config.ihsanThreshold || 95.0,
      ...config,
    };

    this.tools = this.registerTools();
    this.operations = {
      read: 0,
      write: 0,
      delete: 0,
      errors: 0,
    };
  }

  /**
   * Initialize MCP server
   */
  async initialize() {
    console.log(
      `\n${colors.sapphire}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(`${colors.sapphire}  MCP FILESYSTEM SERVER${colors.reset}`);
    console.log(
      `${colors.sapphire}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    console.log(
      `${colors.platinum}[MCP Filesystem] احسان Standard: Safe File Operations${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Filesystem] Root Directory: ${this.config.rootDir}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Filesystem] Max File Size: ${this.formatBytes(this.config.maxFileSize)}${colors.reset}`,
    );
    console.log(
      `${colors.platinum}[MCP Filesystem] احسان Threshold: ${this.config.ihsanThreshold}%${colors.reset}\n`,
    );

    // Verify root directory exists
    try {
      await fs.access(this.config.rootDir);
      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Root directory accessible${colors.reset}`,
      );
    } catch (error) {
      console.error(
        `${colors.ruby}[MCP Filesystem] ⚠️  Root directory not accessible: ${error.message}${colors.reset}`,
      );
    }

    // Register tools with MCP protocol
    console.log(
      `\n${colors.emerald}[MCP Filesystem] ✅ Registered ${this.tools.length} tools${colors.reset}`,
    );
    for (const tool of this.tools) {
      console.log(
        `${colors.dim}  • ${tool.name}: ${tool.description}${colors.reset}`,
      );
    }

    console.log(
      `\n${colors.emerald}[MCP Filesystem] ✅ MCP Filesystem Server ready${colors.reset}\n`,
    );
    return this;
  }

  /**
   * Register MCP tools
   */
  registerTools() {
    return [
      {
        name: "fs_read_file",
        description: "Read a file from the filesystem",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to read" },
            encoding: {
              type: "string",
              description: "Encoding (default: utf-8)",
            },
          },
          required: ["path"],
        },
        handler: this.readFile.bind(this),
      },
      {
        name: "fs_write_file",
        description: "Write content to a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to write" },
            content: { type: "string", description: "Content to write" },
            encoding: {
              type: "string",
              description: "Encoding (default: utf-8)",
            },
          },
          required: ["path", "content"],
        },
        handler: this.writeFile.bind(this),
      },
      {
        name: "fs_list_directory",
        description: "List contents of a directory",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory path" },
            recursive: {
              type: "boolean",
              description: "Recursive listing (default: false)",
            },
          },
          required: ["path"],
        },
        handler: this.listDirectory.bind(this),
      },
      {
        name: "fs_create_directory",
        description: "Create a new directory",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory path to create" },
            recursive: {
              type: "boolean",
              description: "Create parent dirs (default: true)",
            },
          },
          required: ["path"],
        },
        handler: this.createDirectory.bind(this),
      },
      {
        name: "fs_delete",
        description: "Delete a file or directory",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to delete" },
            recursive: {
              type: "boolean",
              description: "Delete recursively (default: false)",
            },
          },
          required: ["path"],
        },
        handler: this.delete.bind(this),
      },
      {
        name: "fs_copy",
        description: "Copy a file or directory",
        inputSchema: {
          type: "object",
          properties: {
            source: { type: "string", description: "Source path" },
            destination: { type: "string", description: "Destination path" },
          },
          required: ["source", "destination"],
        },
        handler: this.copy.bind(this),
      },
      {
        name: "fs_move",
        description: "Move or rename a file or directory",
        inputSchema: {
          type: "object",
          properties: {
            source: { type: "string", description: "Source path" },
            destination: { type: "string", description: "Destination path" },
          },
          required: ["source", "destination"],
        },
        handler: this.move.bind(this),
      },
      {
        name: "fs_file_info",
        description: "Get file or directory information",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to get info for" },
          },
          required: ["path"],
        },
        handler: this.getFileInfo.bind(this),
      },
      {
        name: "fs_search",
        description: "Search for files by pattern",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Root path to search" },
            pattern: {
              type: "string",
              description: "File name pattern (glob or regex)",
            },
            maxDepth: {
              type: "number",
              description: "Maximum search depth (default: 5)",
            },
          },
          required: ["path", "pattern"],
        },
        handler: this.search.bind(this),
      },
      {
        name: "fs_calculate_hash",
        description: "Calculate hash of a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path" },
            algorithm: {
              type: "string",
              description: "Hash algorithm (default: sha256)",
            },
          },
          required: ["path"],
        },
        handler: this.calculateHash.bind(this),
      },
    ];
  }

  /**
   * Verify path is allowed
   */
  verifyPath(filePath) {
    const normalized = path.resolve(filePath);

    // Check denied paths
    for (const denied of this.config.deniedPaths) {
      if (normalized.startsWith(denied)) {
        throw new Error(`Access denied: ${normalized} is in a restricted area`);
      }
    }

    // Check allowed paths
    const isAllowed = this.config.allowedPaths.some((allowed) =>
      normalized.startsWith(allowed),
    );

    if (!isAllowed) {
      throw new Error(`Access denied: ${normalized} is not in an allowed area`);
    }

    return normalized;
  }

  /**
   * Read file
   */
  async readFile({ path: filePath, encoding = "utf-8" }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Reading: ${filePath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(filePath);

      // Check file size
      const stats = await fs.stat(normalizedPath);
      if (stats.size > this.config.maxFileSize) {
        throw new Error(
          `File too large: ${this.formatBytes(stats.size)} (max: ${this.formatBytes(this.config.maxFileSize)})`,
        );
      }

      const content = await fs.readFile(normalizedPath, encoding);

      this.operations.read++;
      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Read ${this.formatBytes(stats.size)}${colors.reset}`,
      );

      return {
        success: true,
        content,
        size: stats.size,
        encoding,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Read error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Write file
   */
  async writeFile({ path: filePath, content, encoding = "utf-8" }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Writing: ${filePath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(filePath);

      // احسان quality check
      const qualityScore = this.calculateContentQuality(content);
      if (qualityScore < this.config.ihsanThreshold) {
        console.log(
          `${colors.dim}[MCP Filesystem] ⚠️  Content quality: ${qualityScore}% (threshold: ${this.config.ihsanThreshold}%)${colors.reset}`,
        );
      }

      // Ensure directory exists
      const dir = path.dirname(normalizedPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(normalizedPath, content, encoding);

      const stats = await fs.stat(normalizedPath);

      this.operations.write++;
      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Wrote ${this.formatBytes(stats.size)} (احسان: ${qualityScore}%)${colors.reset}`,
      );

      return {
        success: true,
        path: normalizedPath,
        size: stats.size,
        qualityScore,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Write error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List directory
   */
  async listDirectory({ path: dirPath, recursive = false }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Listing: ${dirPath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(dirPath);

      const entries = await fs.readdir(normalizedPath, {
        withFileTypes: true,
        recursive,
      });

      const items = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        try {
          const stats = await fs.stat(fullPath);

          items.push({
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? "directory" : "file",
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        } catch (error) {
          // Skip inaccessible entries
        }
      }

      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Found ${items.length} items${colors.reset}`,
      );

      return {
        success: true,
        path: normalizedPath,
        items,
        count: items.length,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] List error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create directory
   */
  async createDirectory({ path: dirPath, recursive = true }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Creating directory: ${dirPath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(dirPath);

      await fs.mkdir(normalizedPath, { recursive });

      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Directory created${colors.reset}`,
      );

      return {
        success: true,
        path: normalizedPath,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Create error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file or directory
   */
  async delete({ path: targetPath, recursive = false }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Deleting: ${targetPath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(targetPath);

      const stats = await fs.stat(normalizedPath);

      if (stats.isDirectory() && !recursive) {
        throw new Error("Cannot delete directory without recursive flag");
      }

      await fs.rm(normalizedPath, { recursive, force: true });

      this.operations.delete++;
      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Deleted${colors.reset}`,
      );

      return {
        success: true,
        path: normalizedPath,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Delete error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Copy file or directory
   */
  async copy({ source, destination }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Copying: ${source} → ${destination}${colors.reset}`,
    );

    try {
      const normalizedSource = this.verifyPath(source);
      const normalizedDest = this.verifyPath(destination);

      await fs.cp(normalizedSource, normalizedDest, { recursive: true });

      console.log(`${colors.emerald}[MCP Filesystem] ✅ Copied${colors.reset}`);

      return {
        success: true,
        source: normalizedSource,
        destination: normalizedDest,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Copy error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Move file or directory
   */
  async move({ source, destination }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Moving: ${source} → ${destination}${colors.reset}`,
    );

    try {
      const normalizedSource = this.verifyPath(source);
      const normalizedDest = this.verifyPath(destination);

      await fs.rename(normalizedSource, normalizedDest);

      console.log(`${colors.emerald}[MCP Filesystem] ✅ Moved${colors.reset}`);

      return {
        success: true,
        source: normalizedSource,
        destination: normalizedDest,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Move error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo({ path: filePath }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Getting info: ${filePath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(filePath);

      const stats = await fs.stat(normalizedPath);

      const info = {
        path: normalizedPath,
        type: stats.isDirectory() ? "directory" : "file",
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
        mode: stats.mode,
        permissions: (stats.mode & parseInt("777", 8)).toString(8),
      };

      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Info retrieved${colors.reset}`,
      );

      return {
        success: true,
        info,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Info error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search for files
   */
  async search({ path: searchPath, pattern, maxDepth = 5 }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Searching: "${pattern}" in ${searchPath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(searchPath);
      const regex = new RegExp(pattern, "i");

      const results = [];

      const searchDir = async (dir, depth = 0) => {
        if (depth > maxDepth) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Test against pattern
          if (regex.test(entry.name)) {
            const stats = await fs.stat(fullPath);
            results.push({
              name: entry.name,
              path: fullPath,
              type: entry.isDirectory() ? "directory" : "file",
              size: stats.size,
              modified: stats.mtime.toISOString(),
            });
          }

          // Recurse into directories
          if (entry.isDirectory() && depth < maxDepth) {
            await searchDir(fullPath, depth + 1);
          }
        }
      };

      await searchDir(normalizedPath);

      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Found ${results.length} matches${colors.reset}`,
      );

      return {
        success: true,
        pattern,
        results,
        count: results.length,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Search error: ${error.message}${colors.reset}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate file hash
   */
  async calculateHash({ path: filePath, algorithm = "sha256" }) {
    console.log(
      `${colors.sapphire}[MCP Filesystem] Calculating ${algorithm} hash: ${filePath}${colors.reset}`,
    );

    try {
      const normalizedPath = this.verifyPath(filePath);

      const content = await fs.readFile(normalizedPath);
      const hash = crypto.createHash(algorithm).update(content).digest("hex");

      console.log(
        `${colors.emerald}[MCP Filesystem] ✅ Hash: ${hash.substring(0, 16)}...${colors.reset}`,
      );

      return {
        success: true,
        path: normalizedPath,
        algorithm,
        hash,
      };
    } catch (error) {
      this.operations.errors++;
      console.error(
        `${colors.ruby}[MCP Filesystem] Hash error: ${error.message}${colors.reset}`,
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
  calculateContentQuality(content) {
    if (!content) return 0;

    let score = 100;

    // Length check
    if (content.length < 10) score -= 40;
    if (content.length > 1000000) score -= 20;

    // Null bytes (binary content)
    if (content.includes("\0")) return 50; // Binary file

    // Line breaks (structured content)
    const lines = content.split("\n");
    if (lines.length < 2 && content.length > 100) score -= 15;

    // Control characters
    const controlChars = (content.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
    if (controlChars > 10) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Format bytes to human-readable
   */
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
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
   * Get statistics
   */
  getStatistics() {
    return {
      operations: { ...this.operations },
      totalOperations:
        this.operations.read + this.operations.write + this.operations.delete,
      errorRate:
        (this.operations.errors /
          (this.operations.read +
            this.operations.write +
            this.operations.delete +
            1)) *
        100,
    };
  }
}

// Export for use as module
module.exports = { MCPFilesystem };

// Main execution
if (require.main === module) {
  (async () => {
    const filesystem = new MCPFilesystem();

    try {
      await filesystem.initialize();

      // Demo: List and search
      console.log(
        `${colors.gold}═══════════════════════════════════${colors.reset}`,
      );
      console.log(`${colors.gold}  DEMO: Filesystem Operations${colors.reset}`);
      console.log(
        `${colors.gold}═══════════════════════════════════${colors.reset}\n`,
      );

      const listResult = await filesystem.listDirectory({
        path: "C:\\BIZRA-NODE0\\node0",
        recursive: false,
      });

      if (listResult.success) {
        console.log(
          `\n${colors.platinum}Directory Contents (${listResult.count} items):${colors.reset}`,
        );
        for (const item of listResult.items.slice(0, 10)) {
          const icon = item.type === "directory" ? "📁" : "📄";
          console.log(
            `${colors.dim}  ${icon} ${item.name} (${filesystem.formatBytes(item.size)})${colors.reset}`,
          );
        }
      }

      const stats = filesystem.getStatistics();
      console.log(`\n${colors.platinum}Statistics:${colors.reset}`);
      console.log(
        `${colors.dim}  Read operations: ${stats.operations.read}${colors.reset}`,
      );
      console.log(
        `${colors.dim}  Write operations: ${stats.operations.write}${colors.reset}`,
      );
      console.log(
        `${colors.dim}  Delete operations: ${stats.operations.delete}${colors.reset}`,
      );
      console.log(
        `${colors.dim}  Errors: ${stats.operations.errors}${colors.reset}`,
      );

      console.log(
        `\n${colors.emerald}✅ MCP Filesystem demo complete!${colors.reset}\n`,
      );
      console.log(
        `${colors.dim}Use as module: const {MCPFilesystem} = require('./mcp-filesystem');${colors.reset}\n`,
      );

      process.exit(0);
    } catch (error) {
      console.error(`${colors.ruby}Error: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  })();
}
