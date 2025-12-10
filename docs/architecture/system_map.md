# BIZRA System Architecture Map

> **Status:** Living Document
> **Context:** Dual Sovereignty (PAT/SAT)

---

## 1. High-Level Topology

### Dual Sovereignty
*   **PAT (Personal Agent Team):** Represents the individual user. Sovereign, private, local-first.
*   **SAT (System Agent Team):** Represents the collective network. Consensus-driven, public, federated.

### The 5 Operational Pillars
1.  **API Gateway:** Unified entry point (REST/GraphQL/WebSocket).
2.  **WS (WebSocket) Mesh:** Real-time P2P communication.
3.  **Neo4j Graph:** Knowledge graph and relationship mapping.
4.  **Ollama/AI:** Local inference engine (GoT/SAPE).
5.  **Dashboard:** React-based visualization and control plane.

---

## 2. The 7-Layer Stack

| Layer | Component | Responsibility | Ihsān Dimension |
| :--- | :--- | :--- | :--- |
| **L7** | **UI / Experience** | Dashboard, CLI, Voice | Accessibility / Clarity |
| **L6** | **Agentic** | PAT, SAT, Orchestrators | Autonomy / Service |
| **L5** | **Cognition** | GoT, SAPE, Cultural Adapter | Wisdom / Truth |
| **L4** | **Application** | API, Business Logic | Utility / Function |
| **L3** | **Consensus** | Sharding, PoI, BlockGraph | Justice / Agreement |
| **L2** | **Network** | P2P Mesh, Gossip | Connection / Unity |
| **L1** | **Infrastructure** | Docker, K8s, Hardware | Stability / Foundation |

---

## 3. Data Flow & Cognition

### Request Lifecycle
1.  **Ingest:** Request hits API Gateway.
2.  **Auth:** Zero-Trust check (Ed25519).
3.  **Route:** Sharding Manager determines destination.
4.  **Process:**
    *   *Simple:* Direct execution.
    *   *Complex:* Routed to GoT Service for threaded reasoning.
5.  **Verify:** Cultural Adapter checks Ihsān compliance.
6.  **Consensus:** Result hashed and committed to BlockGraph.
7.  **Response:** Returned to user with PoI.

### Cognitive Loop (GoT/SAPE)
*   **Input:** Context/Problem.
*   **Diverge:** Generate interdisciplinary perspectives.
*   **Converge:** Synthesize and filter via Ihsān.
*   **Prove:** Validate against reality and ethics.
*   **Output:** High-SNR Insight.
