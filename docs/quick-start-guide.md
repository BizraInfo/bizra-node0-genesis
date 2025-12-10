# Claude Flow Quick Start Guide

## Installation Complete! ✅

Your SPARC development environment is fully configured with:

- ✅ Claude Flow v2.7.0-alpha.10
- ✅ 64 specialized agents
- ✅ Mesh swarm topology (ID: swarm-1760711675026)
- ✅ MCP servers: ruv-swarm, flow-nexus, agentic-payments
- ✅ Hive Mind system with collective memory
- ✅ Automated hooks integration
- ✅ ReasoningBank memory database

## Quick Commands

### 🚀 Start a Swarm

```bash
npx claude-flow@alpha swarm "Build REST API with authentication" --claude
```

### 🐝 Hive Mind (Recommended)

```bash
# Interactive setup wizard
npx claude-flow@alpha hive-mind wizard

# Spawn intelligent swarm
npx claude-flow@alpha hive-mind spawn "Build full-stack application"

# Check status
npx claude-flow@alpha hive-mind status
```

### 📋 List Available Agents

```bash
# View agent categories
ls .claude/agents

# Available categories:
# - core: coder, reviewer, tester, planner, researcher
# - swarm: hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
# - sparc: specification, pseudocode, architecture, refinement, sparc-coder
# - github: pr-manager, code-review-swarm, issue-tracker
# - development: backend-dev, mobile-dev, ml-developer
# - consensus: byzantine-coordinator, raft-manager, gossip-coordinator
```

### 🎯 SPARC TDD Workflow

```bash
# Run complete TDD workflow
npx claude-flow@alpha sparc tdd "User authentication feature"

# Individual phases
npx claude-flow@alpha sparc run spec-pseudocode "User login"
npx claude-flow@alpha sparc run architect "Database schema"
```

### 🔧 Agent Management

```bash
# Spawn specific agent
npx claude-flow@alpha agent spawn researcher --name "APIResearcher"

# List active agents
npx claude-flow@alpha agent list

# Check system status
npx claude-flow@alpha status
```

### 💾 Memory Operations

```bash
# Initialize ReasoningBank
npx claude-flow@alpha agent memory init

# Check memory status
npx claude-flow@alpha agent memory status

# List stored memories
npx claude-flow@alpha agent memory list
```

### 🪝 Hooks Examples

```bash
# Pre-task hook
npx claude-flow@alpha hooks pre-task --description "Build API"

# Post-edit hook with memory
npx claude-flow@alpha hooks post-edit --file "server.js" --update-memory true

# Session management
npx claude-flow@alpha hooks session-restore --session-id "swarm-123"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## Parallel Agent Execution Pattern

### ✅ CORRECT: All agents in one message

```javascript
// Single message with all Task calls
Task("Backend Dev", "Build REST API with Express...", "backend-dev")
Task("Frontend Dev", "Create React UI...", "coder")
Task("Database Arch", "Design PostgreSQL schema...", "system-architect")
Task("Tester", "Write comprehensive tests...", "tester")
Task("DevOps", "Setup Docker and CI/CD...", "cicd-engineer")
Task("Reviewer", "Review code quality...", "reviewer")

// Batch all todos together
TodoWrite { todos: [...8-10 todos...] }

// Parallel file operations
Write "backend/server.js"
Write "frontend/App.jsx"
Write "tests/api.test.js"
```

### ❌ WRONG: Multiple messages

```javascript
Message 1: Task("agent 1")
Message 2: Task("agent 2")
Message 3: TodoWrite
// This breaks parallel coordination!
```

## Directory Structure

```
C:\BIZRA-NODE0\
├── .claude/
│   ├── agents/          # 64 specialized agents
│   ├── commands/        # Command documentation
│   ├── settings.json    # Hooks configuration
│   └── settings.local.json
├── .swarm/
│   └── memory.db        # ReasoningBank database
├── src/                 # Source code
├── tests/               # Test files
├── docs/                # Documentation
├── config/              # Configuration
├── scripts/             # Utility scripts
└── examples/            # Example workflows
```

## MCP Tools Available

### ruv-swarm (90 tools)

- Swarm coordination: `swarm_init`, `swarm_status`
- Agent management: `agent_spawn`, `agent_list`
- Task orchestration: `task_orchestrate`, `task_status`
- Memory: `memory_usage`, `neural_status`
- DAA: `daa_agent_create`, `daa_workflow_execute`

### flow-nexus (70+ tools)

- Sandboxes: `sandbox_create`, `sandbox_execute`
- Neural AI: `neural_train`, `neural_predict`
- Templates: `template_list`, `template_deploy`
- GitHub: `github_repo_analyze`
- Queen Seraphina: `seraphina_chat`

### claude-flow (87 tools)

- Query control: `query_control`, `query_list`
- Parallel spawning: `agents_spawn_parallel`

## Next Steps

1. **Try the Hive Mind wizard**: `npx claude-flow@alpha hive-mind wizard`
2. **Start your first swarm**: `npx claude-flow@alpha swarm "your objective"`
3. **Explore examples**: Check `examples/` directory
4. **Read agent docs**: Browse `.claude/agents/` categories
5. **Configure hooks**: Review `.claude/settings.json`

## Performance Tips

- Use **parallel agent execution** (10-20x faster)
- Enable **hooks automation** for auto-formatting
- Leverage **ReasoningBank memory** for context
- Use **batch operations** for efficiency
- Apply **SPARC methodology** for TDD

## Support

- 📚 Documentation: https://github.com/ruvnet/claude-flow
- 🐛 Issues: https://github.com/ruvnet/claude-flow/issues
- 💬 Discord: https://discord.agentics.org
- 🌐 Flow Nexus: https://flow-nexus.ruv.io

## Example Projects

See `examples/` directory for:

- `parallel-agent-demo.md` - Parallel execution patterns
- `sparc-workflow-config.json` - SPARC configuration
- `hooks-integration-guide.md` - Hooks automation

---

**Remember**: Claude Flow coordinates, Claude Code creates! 🚀
