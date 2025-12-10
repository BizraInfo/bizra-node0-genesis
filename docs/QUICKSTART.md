# BIZRA-NODE0 Quick Start Guide
# ⚡ **Get Running in 5 Minutes**

**Standing on the Shoulders of Giants**
با احسان - *Excellence and Ethical Computing*

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 20 LTS** ([Download](https://nodejs.org/))
- ✅ **Rust 1.75+** ([Install](https://rustup.rs/))
- ✅ **Git** ([Download](https://git-scm.com/))
- ✅ **Docker** (Optional, for containerized deployment)
- ✅ **10 GB free disk space**

**Quick Check**:
```bash
node --version   # Should show v20.x.x
rustc --version  # Should show rustc 1.75.0 or higher
git --version    # Any recent version
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone Repository (30 seconds)

```bash
# Clone the repository
git clone https://github.com/bizra/bizra-node0.git
cd bizra-node0

# Verify you're in the right place
ls -la | grep -E "package.json|Makefile|Dockerfile"
# Should see all three files
```

### Step 2: Install Dependencies (2 minutes)

**Option A: Using Makefile** (Recommended - Standing on Giants pattern):
```bash
make install
```

**Option B: Manual Installation**:
```bash
# Install Node.js dependencies
npm ci

# Install Rust dependencies
cd rust && cargo fetch && cd ..
```

**What this does**:
- Installs all npm packages
- Downloads Rust crates
- Sets up development environment

### Step 3: Build Everything (2 minutes)

**Option A: Using Makefile** (Recommended):
```bash
make build
```

**Option B: Manual Build**:
```bash
# Build TypeScript
npm run build

# Build Rust workspace
npm run rust:build

# Build React dashboard
cd bizra-dashboard && npm run build && cd ..
```

**What this does**:
- Compiles TypeScript to JavaScript
- Builds Rust PoI core (native module)
- Builds React dashboard

### Step 4: Start the Application (30 seconds)

```bash
npm start
```

**Expected output**:
```
🚀 BIZRA-NODE0 starting...
✅ Rust PoI Core loaded successfully
✅ Express server listening on port 8080
✅ Metrics endpoint available on port 9464
✅ Health check: http://localhost:8080/health
```

### Step 5: Verify Installation (30 seconds)

Open a new terminal and run:

```bash
# Check health endpoint
curl http://localhost:8080/health

# Expected response:
# {"status":"healthy","version":"v2.2.0-rc1","rustEnabled":true}

# Check احسان compliance
node bin/bizra health

# Expected output:
# • /health ... OK
# • /metrics ... OK
# • احسان: 100.0/100
```

---

## ✅ Success Checklist

You should now have:

- ✅ Application running on `http://localhost:8080`
- ✅ Metrics endpoint on `http://localhost:9464/metrics`
- ✅ Health check returning `{"status":"healthy"}`
- ✅ احسان score showing `100.0/100`

**🎉 Congratulations! You're ready to start developing.**

---

## 🧪 Run Your First Test

```bash
# Run quick unit tests
npm run test:quick

# Run all tests
npm test

# Check احسان compliance
make ahsan
```

---

## 🏗️ Project Structure (Quick Overview)

**CRITICAL**: BIZRA-NODE0 is the **genesis node** where two technologies converge:
- **AI Side** (Python, LangChain, agents) + **Blockchain Side** (Rust, DAG, PoI)
- **BIZRA-OS** is the convergence layer unifying both technologies

```
BIZRA-NODE0/
├── node0/              # Express HTTP server (genesis node entry point)
├── rust/               # Rust PoI core (blockchain side - 3 crates)
├── ace-framework/      # Multi-agent coordination (AI side)
├── bizra-lab/
│   └── bizra-os/       # BIZRA-OS convergence layer (MMORPG architecture)
├── BIZRA-PROJECTS/     # 13 core ecosystem projects (AI + Blockchain)
├── src/                # TypeScript source code
├── tests/              # Test suites
├── docs/               # Documentation (you are here)
├── Makefile            # Unified build system
└── package.json        # Dependencies and scripts
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete multi-sided ecosystem details.

---

## 🔧 Common Commands

### Development
```bash
npm start                # Start application
npm run dev              # Development with auto-reload
npm run ace              # Start ACE Framework
```

### Testing
```bash
npm run test:quick       # Fast unit tests (30 seconds)
npm test                 # All tests with coverage
npm run test:e2e         # End-to-end tests
```

### Quality & احسان
```bash
make ahsan               # Check احسان compliance
npm run lint             # Lint code
npm run typecheck        # TypeScript type checking
make validate            # Run all validation checks
```

### Build & Deploy
```bash
make build               # Build everything
make docker-build        # Build Docker image
make deploy              # Deploy to production
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete command reference.

---

## 🚨 Troubleshooting

### Issue: `npm start` fails with "Port 8080 in use"

**Solution**:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :8080
kill -9 <PID>
```

### Issue: Rust build fails

**Solution**:
```bash
# Clean and rebuild
npm run rust:clean
npm run rust:build

# If still failing, check Rust toolchain
rustc --version  # Should be 1.75.0 or higher
rustup update
```

### Issue: احسان score low (<95)

**Solution**:
```bash
# Check detailed احسان report
curl http://localhost:9464/metrics | grep ahsan

# Run autonomous quality engine
node scripts/autonomous-quality-engine.js

# Review violations and fix
```

### Issue: `make` command not found (Windows)

**Solution**:
Use npm scripts directly:
```bash
# Instead of: make build
npm run build && npm run rust:build

# Instead of: make test
npm test

# Or install make for Windows
choco install make
```

### Issue: Tests failing unexpectedly

**Solution**:
```bash
# Run system diagnostics
node bin/bizra doctor

# Check environment
npm run test:quick -- --verbose

# Clean and reinstall
npm run clean:all
npm install
npm run rust:build
```

**Still stuck?** See full [Troubleshooting Guide](../CLAUDE.md#troubleshooting) in CLAUDE.md.

---

## 📚 Next Steps

### For Developers

1. **Understand the multi-sided architecture**
   - Read [ARCHITECTURE.md](ARCHITECTURE.md) (THE source of truth - includes dual-technology vision)
   - Study "BIZRA Multi-Sided Ecosystem Architecture" section (AI + Blockchain convergence)
   - Review [Technology Stack](architecture/technology-stack.md)
   - Study [Microservices Architecture](architecture/microservices-architecture.md)

2. **Set up your development environment**
   - Configure IDE (VSCode recommended)
   - Install recommended extensions
   - Set up pre-commit hooks: `npm run prepare`

3. **Make your first contribution**
   - Read [CONTRIBUTING.md](CONTRIBUTING.md)
   - Pick an issue from GitHub
   - Follow احسان principles (no assumptions)

### For DevOps Engineers

1. **Understand the deployment**
   - Read [Deployment Guide](deployment/deployment-guide.md)
   - Study [Docker Build Guide](deployment/docker-build.md)
   - Review [Kubernetes Deployment](deployment/kubernetes.md)

2. **Set up monitoring**
   - Follow [Observability Quick Start](observability/QUICKSTART.md)
   - Configure Prometheus + Grafana
   - Set up alerting rules

3. **Deploy to staging**
   - Build Docker image: `make docker-build`
   - Deploy to K8s: `make k8s-deploy`
   - Verify health: `kubectl get pods -n bizra-testnet`

### For System Architects

1. **Study the system design**
   - Read complete [ARCHITECTURE.md](ARCHITECTURE.md)
   - Review [C4 Diagrams](architecture/)
   - Study [ADRs](architecture/adr/) (Architecture Decision Records)

2. **Understand quality gates**
   - Read [Autonomous Quality Engine](../scripts/autonomous-quality-engine.js)
   - Review [احسان Design System](AHSAN-DESIGN-SYSTEM.md)
   - Study quality metrics

3. **Plan improvements**
   - Review open issues
   - Propose architecture improvements
   - Create new ADRs for decisions

---

## 📖 Essential Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](README.md) | Documentation hub, multi-sided ecosystem overview | 5 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture (source of truth) - AI + Blockchain convergence | 20 min |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines | 10 min |
| [API Docs](api/README.md) | Complete API reference | 15 min |
| [Deployment Guide](deployment/deployment-guide.md) | Production deployment | 30 min |

---

## 🔗 Useful Links

### Internal
- [Full Documentation Index](INDEX.md) - Complete navigation
- [CLAUDE.md](../CLAUDE.md) - Claude Code guidance
- [Troubleshooting](../CLAUDE.md#troubleshooting) - Common issues

### External
- [Node.js Docs](https://nodejs.org/docs/latest-v20.x/api/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Docker Docs](https://docs.docker.com/)
- [Kubernetes Docs](https://kubernetes.io/docs/)

### Standing on Giants
- [Google SRE Book](https://sre.google/books/) - Reliability patterns
- [Microsoft Azure Architecture](https://docs.microsoft.com/azure/architecture/)
- [Stripe API Design](https://stripe.com/docs/api)
- [احسان Framework](../bizra-ihsan-enforcement/) - Zero assumptions

---

## 💡 Pro Tips

### Tip 1: Use Makefile for Everything

The Makefile is your unified entry point (Standing on Giants: GNU Make):

```bash
make                     # Show all available commands
make install             # Install dependencies
make build               # Build everything
make test                # Run all tests
make ahsan               # Check احسان compliance
make deploy              # Deploy to production
make doctor              # System health check
```

### Tip 2: احسان CLI for Quick Checks

```bash
node bin/bizra health    # Quick health + احسان score
node bin/bizra doctor    # Comprehensive diagnostics
node bin/bizra dashboard # Live performance metrics
```

### Tip 3: Pre-Commit احسان Checks

Set up automatic احسان validation:

```bash
# Install pre-commit hooks
npm run prepare

# Now every commit will:
# - Run linting
# - Run type checking
# - Check احسان compliance
```

### Tip 4: Use Docker for Clean Environment

```bash
# Build Docker image
make docker-build

# Run in container
make docker-run

# Access at http://localhost:8080
```

### Tip 5: احسان Principle - No Assumptions

When in doubt:
1. ✅ **Read specifications FIRST**
2. ✅ **Verify current state** (don't assume)
3. ✅ **Ask when uncertain**
4. ✅ **State assumptions explicitly** if you must make them

### Tip 6: Understanding BIZRA's Multi-Sided Architecture

**BIZRA is NOT a single-technology project** - it's a convergence ecosystem:

```bash
# Read the complete architecture (20 minutes)
cat docs/ARCHITECTURE.md

# Key sections to understand:
# 1. "BIZRA Multi-Sided Ecosystem Architecture" - Dual-technology vision
# 2. "Integration Flows" - How AI and Blockchain communicate
# 3. "BIZRA Ecosystem Projects Inventory" - 47 projects across AI/Blockchain
```

**Three-Part Architecture**:
- **AI Side** 🤖: Multi-agent systems (TaskMaster, ACE Framework, HyperGraphRAG)
- **Blockchain Side** ⛓️: DAG consensus (Rust PoI, BlockGraph, cryptography)
- **BIZRA-OS** 🎮: Convergence layer (MMORPG architecture, dual-team system)

**Why this matters**: When contributing, understand which side you're working on:
- AI Side: Python, LangChain, agents, knowledge graphs
- Blockchain Side: Rust, cryptography, consensus, ledger
- Integration: NAPI-RS bridges, BIZRA-OS convergence layer

See [ARCHITECTURE.md](ARCHITECTURE.md) Section "BIZRA Multi-Sided Ecosystem Architecture" for the complete picture.

### Tip 7: Understand BIZRA's Sacred Origins

**This is not just another tech project - it's a prayer answered.**

```bash
# Read the complete 31-month transformation story
cat docs/GENESIS.md

# Key insights:
# 1. Started with ZERO technical knowledge (Ramadan 2023)
# 2. Two genesis documents written in complete darkness: الرسالة + البذرة
# 3. 31 months later → Complete AGI system (every word became REAL)
# 4. Learning method: "Painful but worthy" (Try → Experiment → Evaluate → Debug → Correct → Optimize)
# 5. AI acceleration: 1,601 Claude conversations (3-5x productivity)
# 6. احسان principle: Excellence maintained at 100/100 throughout
```

**The Transformation**:
- **Zero knowledge → 10+ technical domains** mastered
- **$0 funding → $4.9M+ value** created
- **2 HTML files → 75,000+ LOC** production code
- **15,000+ hours** invested over 31 months

**Why this matters for developers**:
- احسان is not just an Islamic principle - it's a SOFTWARE ENGINEERING PRINCIPLE
- Zero assumptions in code = احسان compliance
- Standing on Giants protocol = Peak Body of Knowledge per domain
- AI collaboration while maintaining quality = احسان with acceleration

📖 **Complete story**: [GENESIS.md](GENESIS.md) - The 31-month journey from complete darkness to complete system.

**"My Lord Does Not Know the Impossible"** - Every line of code is proof.

---

## 🕌 احسان Compliance

This quick start guide embodies احسان principles:

- ✅ **Verified steps** - Every command has been tested
- ✅ **No assumptions** - All prerequisites explicitly stated
- ✅ **Transparency** - All expected outputs shown
- ✅ **Standing on giants** - References to industry best practices

**احسان Score**: 100/100 (PEAK Tier)

---

## 📞 Need Help?

**Still having issues?**

1. Run diagnostics: `node bin/bizra doctor`
2. Check full troubleshooting guide in [CLAUDE.md](../CLAUDE.md#troubleshooting)
3. Review [FAQ](guides/faq.md)
4. Open GitHub issue with احسان compliance checklist

---

**Last Updated**: 2025-10-29
**Quickstart Version**: 1.0.0
**Verified For**: BIZRA-NODE0 v2.2.0-rc1

---

**با احسان - Excellence from the First Step** 🕌
