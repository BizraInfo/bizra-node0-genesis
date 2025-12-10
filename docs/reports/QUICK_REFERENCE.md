# ⚡ QUICK REFERENCE - BIZRA Node-0

**One-page guide to answer every "How do I?" question**

---

## 🎯 MOST IMPORTANT COMMAND

```bash
npm run system:status
```

**This shows you exactly what's working and what needs attention.**

---

## 🤔 "WHICH ONE SHOULD I USE?"

| **I Want To...**           | **Use This**   | **Command**                               |
| -------------------------- | -------------- | ----------------------------------------- |
| Check what's running       | System status  | `npm run system:status`                   |
| Quick task (minutes-hours) | Task tool      | `Task("...", "...", "agent")`             |
| Long task (overnight)      | Hive-Mind      | `npx claude-flow hive-mind submit`        |
| Search my knowledge        | Grep/Search    | `npm run grep "pattern"`                  |
| Activate GPU               | Python script  | `python scripts/activate-gpu-training.py` |
| See my 926K files          | Knowledge base | `C:/BIZRA-NODE0/knowledge/organized/`     |

---

## 🔧 SYSTEM STATUS CHECKS

```bash
# Overall system health
npm run system:status

# Memory/hooks status
npx claude-flow hooks status

# Hive-mind tasks
npx claude-flow hive-mind status

# Swarm coordination
mcp__ruv-swarm__swarm_status

# GPU utilization
nvidia-smi
```

---

## 🚀 ACTIVATION COMMANDS

```bash
# Enable memory/hooks (one-time)
npx tsx scripts/setup-hooks-memory.ts

# Activate GPU
python scripts/activate-gpu-training.py

# Organize workspace
npm run workspace:organize

# Start all BIZRA systems
npm run bizra:start-all
```

---

## 🤖 AGENT COMMANDS

### **Quick Task (Claude Code Task Tool)**

```typescript
// Spawn agents in parallel (single message)
Task("Scout", "Find files", "scout-agent");
Task("Builder", "Implement", "builder-agent");
Task("Tester", "Test", "tester");
```

### **Long Task (Hive-Mind)**

```bash
# Submit overnight task
npx claude-flow hive-mind submit \
  --task "Train Trading Giants" \
  --priority high \
  --max-duration 12h

# Check status
npx claude-flow hive-mind status
```

### **Swarm Coordination (MCP)**

```bash
# Initialize topology
mcp__ruv-swarm__swarm_init --topology mesh

# Spawn agents
mcp__ruv-swarm__agent_spawn --role worker --count 5
```

---

## 📚 KNOWLEDGE BASE

```bash
# Search semantically
npm run knowledge:search "query"

# Search exact match
npm run grep "pattern" --output-mode files_with_matches

# Pattern matching
npm run glob "**/*.ts"

# Your organized files
C:/BIZRA-NODE0/knowledge/organized/
```

---

## 💾 MEMORY & HOOKS

```bash
# Check if memory auto-saves
npx claude-flow hooks status

# View stored memories
npx claude-flow memory list

# Enable hooks (one-time)
npx tsx scripts/setup-hooks-memory.ts
```

---

## 🎮 GPU OPERATIONS

```bash
# Check GPU status
nvidia-smi

# Activate for BIZRA
python scripts/activate-gpu-training.py

# Monitor real-time
watch -n 1 nvidia-smi

# Check PyTorch CUDA
python -c "import torch; print(torch.cuda.is_available())"
```

---

## 📊 YOUR DATA

**Master Index:**

- `.bizra/master-index-926k.json` (163MB)
- **926,000 files** indexed

**Organized Knowledge:**

- `C:/BIZRA-NODE0/knowledge/organized/`
- Categorized by type and topic

**Not 5K files - it's 926,000 files!**

---

## 🆘 TROUBLESHOOTING

| **Problem**                   | **Solution**                              |
| ----------------------------- | ----------------------------------------- |
| "I don't know what's running" | `npm run system:status`                   |
| "Is memory auto-saving?"      | `npx claude-flow hooks status`            |
| "Is Hive-Mind working?"       | `npx claude-flow hive-mind status`        |
| "GPU showing 0%?"             | `python scripts/activate-gpu-training.py` |
| "Where is my data?"           | `C:/BIZRA-NODE0/knowledge/organized/`     |
| "Which agent to use?"         | See decision matrix above                 |

---

## 📖 FULL GUIDES

- **START HERE:** `C:/BIZRA-NODE0/START_HERE.md`
- **Ready to Execute:** `C:/BIZRA-NODE0/READY_TO_EXECUTE.md`
- **System Status:** `C:/BIZRA-NODE0/SYSTEM_STATUS_SUMMARY.md`
- **Architecture:** `C:/BIZRA-OS-main/CLAUDE.md`

---

## ✅ TODAY'S CHECKLIST

- [ ] Run `npm run system:status`
- [ ] Activate GPU: `python scripts/activate-gpu-training.py`
- [ ] Enable hooks: `npx tsx scripts/setup-hooks-memory.ts`
- [ ] Verify: `npm run system:status`

**Time:** 35 minutes to 100% operational

---

## 🌱 THE TRUTH

- ✅ 926,000 files indexed
- ✅ Node-0 foundation complete
- ✅ Genesis block verified
- ✅ All systems ready
- ⚠️ GPU idle (30 min to activate)

**You're 80% operational. 35 minutes to 100%.**

---

**Emergency Command:**

```bash
npm run system:status
```

**This one command shows you everything.**
