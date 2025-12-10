# 🚀 Getting Started with Claude Flow SPARC Development

## ✅ Your Environment is Ready!

Congratulations! Your complete Claude Flow SPARC development environment has been successfully installed, configured, and optimized for Windows PowerShell.

## 📦 What You Have

### Core Installation

- **Claude Flow**: v2.7.0-alpha.10 (latest alpha)
- **Node.js**: v24.5.0 ✅
- **Swarm Topology**: Mesh (adaptive, 6 max agents)
- **Swarm ID**: swarm-1760711675026
- **Memory System**: ReasoningBank (SQLite database)
- **Hive Mind**: Fully initialized with collective intelligence

### MCP Servers (3 Connected)

✅ **ruv-swarm**: 90 tools for swarm coordination
✅ **flow-nexus**: 70+ tools for cloud features
✅ **agentic-payments**: Payment coordination tools

### Available Agents (64 Total)

See `.claude/agents/` for all categories:

- **core**: 5 agents (coder, reviewer, tester, planner, researcher)
- **swarm**: 10 coordination agents
- **sparc**: 6 methodology agents
- **github**: 8 integration agents
- **development**: 8 specialized agents
- **consensus**: 7 distributed system agents
- **performance**: 5 optimization agents
- And 13 more categories...

### Windows Compatibility Fix ✅

All hooks have been converted to cross-platform Node.js scripts:

- ✅ No more "'cat' is not recognized" errors
- ✅ Works in PowerShell, CMD, Git Bash
- ✅ All hook functionality preserved
- ✅ See `docs/windows-fixes.md` for details

## 🎯 Quick Start (Choose One Path)

### Path 1: Interactive Hive Mind (Easiest)

```bash
# Interactive setup wizard - RECOMMENDED for beginners
npx claude-flow@alpha hive-mind wizard

# Or spawn directly with a goal
npx claude-flow@alpha hive-mind spawn "Build a REST API with authentication"

# Check status
npx claude-flow@alpha hive-mind status
```

### Path 2: Manual Swarm

```bash
# Start swarm with specific objective
npx claude-flow@alpha swarm "Create full-stack application" --claude

# Or spawn specific agents
npx claude-flow@alpha agent spawn researcher --name "APIResearcher"
npx claude-flow@alpha agent spawn coder --name "BackendDev"

# Check system status
npx claude-flow@alpha status
```

### Path 3: SPARC TDD Workflow

```bash
# Run complete TDD workflow for a feature
npx claude-flow@alpha sparc tdd "User authentication system"

# Or run individual SPARC phases
npx claude-flow@alpha sparc run spec-pseudocode "Login feature"
npx claude-flow@alpha sparc run architect "Database schema"
```

## 📚 Essential Commands

### Memory Operations

```bash
# Initialize ReasoningBank
npx claude-flow@alpha agent memory init

# Check memory status and statistics
npx claude-flow@alpha agent memory status

# List stored memories
npx claude-flow@alpha agent memory list
```

### Agent Management

```bash
# List all available agent types
ls .claude/agents

# Spawn specific agent
npx claude-flow@alpha agent spawn [type] --name "CustomName"

# List active agents
npx claude-flow@alpha agent list
```

### Hooks & Automation

```bash
# Hooks are now enabled automatically with Windows-compatible scripts!

# Test pre-task hook
npx claude-flow@alpha hooks pre-task --description "Build API"

# Test post-edit hook with memory
npx claude-flow@alpha hooks post-edit --file "server.js" --update-memory true

# Session management
npx claude-flow@alpha hooks session-restore --session-id "swarm-123"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎓 Learning Resources

### 1. Read the Documentation

```
📂 docs/
  ├── quick-start-guide.md        ⭐ Start here!
  ├── installation-summary.md     📋 What was installed
  ├── windows-fixes.md            🔧 Windows compatibility details
  └── GETTING-STARTED.md          📚 This file
```

### 2. Explore Examples

```
📂 examples/
  ├── parallel-agent-demo.md      ⚡ Parallel execution patterns
  ├── practical-example.js        💼 Full REST API example
  ├── sparc-workflow-config.json  📋 SPARC configuration
  └── hooks-integration-guide.md  🪝 Hooks automation guide
```

### 3. Check Available Commands

```bash
# Browse all command documentation
ls .claude/commands

# Available categories:
# - swarm          (swarm coordination)
# - hive-mind      (hive mind operations)
# - hooks          (lifecycle automation)
# - memory         (ReasoningBank memory)
# - github         (GitHub integration)
# - sparc          (SPARC methodology)
# - training       (neural training)
# - monitoring     (performance monitoring)
```

### 4. Review Agent Categories

```bash
# Browse agent directories
ls .claude/agents

# Available categories:
# - analysis, architecture, consensus, core, data
# - development, devops, documentation, flow-nexus
# - github, goal, hive-mind, neural, optimization
# - reasoning, sparc, specialized, swarm, templates, testing
```

## 💡 Pro Tips

### 1. Use the GOLDEN RULE

**"1 MESSAGE = ALL RELATED OPERATIONS"**

Always batch operations together:

```javascript
// ✅ CORRECT: All agents in one message
Task("Backend Dev", "Build API...", "backend-dev")
Task("Frontend Dev", "Build UI...", "coder")
Task("Tester", "Write tests...", "tester")
Task("DevOps", "Setup Docker...", "cicd-engineer")

TodoWrite({ todos: [...8-10 todos...] })

Write("backend/server.js", code)
Write("frontend/App.jsx", code)
Write("tests/api.test.js", code)
```

### 2. Let Hooks Do the Work

Hooks are now enabled and will automatically:

- ✅ Validate commands before execution
- ✅ Auto-assign agents by file type
- ✅ Auto-format code after edits
- ✅ Update memory with changes
- ✅ Track performance metrics
- ✅ Train neural patterns

### 3. Use Memory for Coordination

Agents can share context via ReasoningBank:

```bash
# Backend stores API schema
npx claude-flow@alpha hooks post-edit --memory-key "api/schema"

# Frontend retrieves schema
npx claude-flow@alpha hooks session-restore --memory-key "api/schema"
```

### 4. Leverage Parallel Execution

Claude Code's Task tool spawns agents 10-20x faster:

```javascript
// All agents spawn concurrently in ~150ms
Task("Agent 1", "Task 1...", "type1");
Task("Agent 2", "Task 2...", "type2");
Task("Agent 3", "Task 3...", "type3");
// vs. 2250ms sequentially
```

## 🎯 Your First Project

### Example: Build a REST API

#### Step 1: Initialize with Hive Mind

```bash
npx claude-flow@alpha hive-mind spawn "Build Express REST API with JWT authentication"
```

#### Step 2: Or spawn agents manually via Claude Code

```javascript
// In Claude Code, use Task tool to spawn all agents at once:

Task(
  "Backend Developer",
  `
  Build Express API with:
  - JWT authentication
  - User CRUD endpoints
  - PostgreSQL integration
  - Request validation
  Use hooks for coordination
`,
  "backend-dev",
);

Task(
  "Database Architect",
  `
  Design PostgreSQL schema:
  - User tables with auth
  - Migrations with Knex
  - Store schema in memory
`,
  "system-architect",
);

Task(
  "Test Engineer",
  `
  Create test suite:
  - Jest unit tests
  - Supertest integration tests
  - 90%+ coverage
  - Check API schema in memory
`,
  "tester",
);

Task(
  "DevOps Engineer",
  `
  Setup infrastructure:
  - Dockerfile
  - GitHub Actions CI/CD
  - Environment config
`,
  "cicd-engineer",
);

// All spawned in parallel in one message!
```

#### Step 3: Check Progress

```bash
# Check active agents
npx claude-flow@alpha agent list

# Check memory updates
npx claude-flow@alpha agent memory status

# Check hive mind status
npx claude-flow@alpha hive-mind status
```

## 📊 Performance Expectations

Based on Claude Flow benchmarks:

- **84.8%** SWE-Bench solve rate
- **32.3%** token reduction
- **2.8-4.4x** speed improvement
- **10-20x** faster agent spawning (parallel)
- **27+** neural models available

## 🔧 Troubleshooting

### Hooks Not Working?

1. Check Node.js: `node --version` (should be v16+)
2. Verify scripts: `ls .claude/helpers`
3. Check settings: `.claude/settings.json`
4. See: `docs/windows-fixes.md`

### MCP Tools Not Available?

```bash
# Check MCP server status
claude mcp list

# Restart Claude Code to reload MCP servers
```

### Memory Issues?

```bash
# Reinitialize memory database
npx claude-flow@alpha agent memory init

# Check database
ls .swarm/memory.db
```

## 🌐 Next Steps

1. **Try the examples**: Start with `examples/practical-example.js`
2. **Read the guides**: Check `docs/quick-start-guide.md`
3. **Explore agents**: Browse `.claude/agents/` categories
4. **Test hooks**: Create a file and watch automation happen
5. **Build something**: Start with the REST API example above

## 📖 External Resources

- 📚 Claude Flow Docs: https://github.com/ruvnet/claude-flow
- 🐝 Hive Mind Guide: https://github.com/ruvnet/claude-flow/tree/main/docs/hive-mind
- 🐝 ruv-swarm: https://github.com/ruvnet/ruv-FANN/tree/main/ruv-swarm
- 💬 Discord Community: https://discord.agentics.org
- 🌐 Flow Nexus Platform: https://flow-nexus.ruv.io

## ✅ Success Checklist

Before you start coding, verify:

- [x] Claude Flow v2.7.0-alpha.10 installed
- [x] Node.js v24.5.0 working
- [x] 64 agents available in `.claude/agents/`
- [x] MCP servers connected (ruv-swarm, flow-nexus)
- [x] Hooks converted to Windows-compatible scripts
- [x] ReasoningBank memory database initialized
- [x] Hive Mind system ready
- [x] Example files created in `examples/`
- [x] Documentation available in `docs/`

## 🎉 You're Ready!

Your complete SPARC development environment is installed, configured, and ready to use. Windows compatibility issues have been fixed, all agents are available, and hooks are working.

**Remember**: Claude Flow coordinates, Claude Code creates! 🚀

---

**Status**: ✅ FULLY OPERATIONAL

**Start building**: `npx claude-flow@alpha hive-mind wizard`
