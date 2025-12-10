# BIZRA NODE0 - Operator and Governance Runbook (v1.0)

Status: Draft v1.0  
Governance: SAPE v1.infty (Immutable)  
Audience: Operator-0 (MoMu), SREs, Governance Council

---

## 1) Purpose and Scope
Defines how to operate BIZRA NODE0, a dual-sovereignty, Ihsan-aligned autonomous system. Use this as the authoritative guide to keep integrity, performance, and ethics within thresholds.

## 2) Roles and Responsibilities
- Operator-0 (MoMu): Custodian of hardware, governance decisions, and emergency intervention. Approves TRANS-FINITE mode and federation pilots.
- System Agent Team (SAT): Collective intelligence handling consensus, routing, self-healing, and global optimization.
- Personal Agent Team (PAT): User-aligned intelligence handling local privacy, user intent execution, and interface adaptation.

## 3) Prerequisites and Environment
- Hardware baseline: 8+ CPU cores; 32 GB RAM recommended (16 GB minimum); NVMe SSD for Neo4j/Vector DB; stable network.
- Software stack: Node.js v24+; Python 3.10+; Docker + Docker Compose; Neo4j; npm; PowerShell (for launch scripts).
- Core services: API server, WebSocket, Neo4j, Ollama/LLM backend, Dashboard, P2P mesh, Sharding manager, GoT/SAPE engines.
- Critical scripts and checks:
  - `node bin/bizra doctor` - environment health.
  - `npm run test:meta` - Masterpiece proofs (must pass before merge/deploy).
  - `npm run bench:cb-quick` - performance baseline.
  - `npm run impact:prove` - Ihsan enforcement check.

## 4) Day-0: Bootstrapping NODE0
1) Clone and install
   ```bash
   git clone <repo-url>
   cd BIZRA-NODE0
   npm ci
   ```
2) Verify environment
   ```bash
   node bin/bizra doctor
   ```
   Expect all checks PASS.
3) Validate Masterpiece status
   ```bash
   npm run test:meta
   ```
   Expect all four proofs to pass (Masterpiece, Interdisciplinary, Reality, SAPE).
4) Start core services
   - Default: `docker-compose up -d` (DB/LLM/services) then `npm start`.
   - Full stack: `powershell -File scripts/launch_ultimate_node.ps1` (starts P2P, sharding, GoT workers, dashboard).
5) Verify dashboards
   - Open dashboard (default http://localhost:3000 or configured port).
   - Check SAPE Elevation state is visible; SNR panel active; Ihsan >= 95%.
   - Confirm API/WS endpoints respond (health route 200).

## 5. Day-1: Normal Operations
*   **Health Monitoring:**
    *   Check `node bin/bizra health` daily.
    *   Monitor `logs/error.log` for anomalies.
*   **Observability Mesh:**
    *   **Trace ID:** Every request is stamped with a UUID `traceId`. Use this to correlate logs across services.
    *   **Agent ID:** Identifies the node (e.g., `node0`). Useful in federation.
    *   **Logs:** Structured JSON logs are emitted to stdout.
        ```json
        {"type":"http_request","traceId":"...","agentId":"node0","method":"GET","path":"/","status":200,"durationMs":1.23}
        ```
    *   **Headers:** `X-Trace-Id` and `X-Agent-Id` are returned in responses.
*   **SAPE Elevation States:**
    *   **STRICT:** Normal operation. High validation.
- Logs and dashboards:
  - Dashboards for latency, error rate, SNR, Ihsan.
  - Check logs/ for errors/anomalies; P2P/sharding logs for routing issues.

## 6) Incident Response
- `test:meta` failure: halt deploy; inspect failing proof logs; revert to last green commit if needed; fix before merge.
- Mesh/sharding issues: restart mesh service (for example `npm run mesh:restart` if available, or restart P2P/sharding processes); verify peer discovery and shard assignment.
- Ethics drift (Ihsan < 95%): immediate freeze; run `npm run impact:prove`; review Cultural Adapter weights and recent changes; rollback offending change.
- Suspicious behavior/red-team signals: run SAPE Red-Team Mirror; capture logs; isolate node if needed; file incident in governance log.

## 7) Change Management and Governance
- Pipeline law: no merge to main without passing `npm run test:meta`. High-stakes changes require a SAPE artifact.
- SAPE requirement: for architectural or ethical-impact changes, run a SAPE session (Type C prompt) and store the artifact.
- Proposal flow: Draft -> SAPE session -> Artifact -> Hash and store under `docs/governance/decisions/` -> PR with evidence -> Merge after gates pass.

## 8. Federation & Multi-Node Operations (Preview)
*   **Minimum Viable Federation:** 3 Nodes (1 Main, 2 Satellites).
*   **Pre-Flight:** Ensure all nodes pass `test:meta` independently.
*   **Sync:** Verify BlockGraph consensus across all 3 nodes.

### Federation Pilot (3-Node Experiment)
1.  **Setup:**
    *   **Node A (Main):** Port 8080, Node ID `node-a`
    *   **Node B (Sat 1):** Port 8081, Node ID `node-b`
    *   **Node C (Sat 2):** Port 8082, Node ID `node-c`
2.  **Configuration:**
    *   Create `docker-compose.federation.yml` defining 3 services with different ports and `NODE_ID` env vars.
    *   Configure `PEERS` env var to mesh them (e.g., `node-a` peers with `node-b,node-c`).
3.  **Execution:**
    ```bash
    docker-compose -f docker-compose.federation.yml up -d
    ```
4.  **Validation:**
    *   Check logs for "Peer Connected" messages.
    *   Send transaction to Node A, verify it appears in Node B/C BlockGraph.
    *   Kill Node B, verify network stability.

## 9. Ethics & Ihsān Operations
- Scoring rubric: see `docs/governance/ihsan_rubric.md`.
- Operator duties: review Ihsan trends weekly; investigate near-miss dips (95-96%); document mitigations; ensure Cultural Adapter updates are logged and justified.

## 10) Appendices
- Command cheat-sheet: `/A` (Autonomous), `/S` (System Status), `/C` (Context Reset).
- Key references:
  - `BIZRA_ULTIMATE_MASTERPIECE_BLUEPRINT.md`
  - `COMPREHENSIVE_MULTI_LENS_ANALYSIS_REPORT.md` (v1.1)
  - `docs/architecture/system_map.md`
  - `docs/consensus/sape_v1_infinite.md`

