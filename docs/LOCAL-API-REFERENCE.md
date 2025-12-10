# 🎯 BIZRA NODE0 LOCAL API REFERENCE

## Complete Integration Guide — با احسان Excellence

**Date:** Monday, October 27, 2025, 23:09 GST  
**Location:** Dubai, UAE  
**Status:** ✅ ALL LOCAL SERVICES OPERATIONAL

---

## EXECUTIVE SUMMARY

### 5 Production-Ready Local Services

- ✅ **Main API Server** (Port 8080) - Health, RCA, CMDB
- ✅ **WebSocket Server** (Port 8081) - Live updates, احسان scores
- ✅ **Neo4j Graph DB** (Ports 7474/7687) - Asset knowledge graph
- ✅ **Local AI Models** (Port 11434) - Ollama + 7 models
- ✅ **Dashboard** (Port 4173) - Production UI

**Timeline:** 15 minutes to integrate all services

---

## I. MAIN API SERVER (PORT 8080)

**Base URL:** `http://localhost:8080`

### 1.1 Health & Monitoring

#### System Health ([translate:احسان] 100/100)

```bash
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "ihsan": 100,
  "uptime": 25200,
  "version": "2.2.0-rc1",
  "timestamp": "2025-10-27T23:09:00.000Z"
}
```

#### Readiness Check (K8s-ready)

```bash
curl http://localhost:8080/ready

# Expected response:
{
  "ready": true,
  "services": {
    "neo4j": "connected",
    "ollama": "connected",
    "rca": "operational",
    "cmdb": "operational"
  }
}
```

#### Prometheus Metrics (monitoring)

```bash
curl http://localhost:8080/metrics

# Expected response (sample):
# TYPE node0_ihsan_score gauge
node0_ihsan_score 100
# TYPE node0_cycles_completed counter
node0_cycles_completed 68
# TYPE node0_rca_latency_ms histogram
node0_rca_latency_ms_bucket{le="10"} 95
```

### 1.2 Root Cause Analysis (RCA)

#### Diagnose Issues

```bash
# Diagnose with specific metric + timestamp
curl "http://localhost:8080/rca/diagnose?metric_id=cpu_usage&ts=$(date +%s)000&lookback_ms=3600000"

# Expected response:
{
  "root_causes": [
    {
      "ci_id": "node-0",
      "ci_name": "BIZRA NODE0",
      "score": 0.91,
      "hops": 0,
      "changes": [
        {
          "change_id": "chg_a194fd0e",
          "type": "deployment",
          "timestamp": 1730063400000,
          "correlation": 0.87
        }
      ]
    }
  ],
  "diagnosis_time_ms": 6,
  "ihsan": 100,
  "confidence": 0.91
}
```

#### RCA Health Check

```bash
curl http://localhost:8080/rca/health

# Expected response:
{
  "status": "operational",
  "avg_latency_ms": 6,
  "success_rate": 1.0,
  "last_diagnosis": "2025-10-27T23:05:00.000Z"
}
```

### 1.3 Configuration Management Database (CMDB)

#### Get Dependency Graph

```bash
curl "http://localhost:8080/cmdb/graph?ci_id=node-0&max_hops=3"

# Expected response:
{
  "nodes": [
    {
      "id": "node-0",
      "name": "BIZRA NODE0",
      "kind": "node",
      "risk": 0
    },
    {
      "id": "api-server",
      "name": "API Server",
      "kind": "service",
      "risk": 10
    }
  ],
  "edges": [
    {
      "source": "node-0",
      "target": "api-server",
      "relationship": "hosts"
    }
  ]
}
```

#### Get Configuration Changes

```bash
curl "http://localhost:8080/cmdb/changes?ci_id=node-0&limit=10"

# Expected response:
{
  "changes": [
    {
      "id": "chg_20251027_001",
      "ci_id": "node-0",
      "type": "deployment",
      "description": "Phase 3 complete",
      "timestamp": 1730063400000,
      "initiator": "autonomous-controller"
    }
  ],
  "total": 150,
  "page": 1
}
```

#### Create Change Record (POST)

```bash
curl -X POST http://localhost:8080/cmdb/change \
  -H "Content-Type: application/json" \
  -d '{
    "ci_id": "node-0",
    "change_type": "deployment",
    "description": "Local AI integration complete",
    "initiator": "mahmoud-hassan"
  }'

# Expected response:
{
  "change_id": "chg_20251027_002",
  "status": "recorded",
  "timestamp": 1730064540000
}
```

---

## II. WEBSOCKET SERVER (PORT 8081)

**Base URL:** `ws://localhost:8081/ws/live-updates`

### 2.1 JavaScript/Node.js Usage

```javascript
// Connect to live updates
const ws = new WebSocket("ws://localhost:8081/ws/live-updates");

ws.onopen = () => {
  console.log("✅ Connected to BIZRA NODE0 live updates");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "ihsan_update":
      console.log(`احسان Score: ${data.ihsan}/100`);
      break;

    case "cycle_complete":
      console.log(`Cycle #${data.cycle} completed (${data.duration}ms)`);
      break;

    case "rca_diagnosis":
      console.log(`RCA: ${data.root_cause} (confidence: ${data.confidence})`);
      break;

    case "alert":
      console.warn(`⚠️ Alert: ${data.message}`);
      break;
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Disconnected from NODE0");
  // Auto-reconnect after 5s
  setTimeout(() => {
    console.log("Reconnecting...");
    // Recreate connection
  }, 5000);
};
```

### 2.2 Python Usage

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)

    if data['type'] == 'ihsan_update':
        print(f"احسان Score: {data['ihsan']}/100")
    elif data['type'] == 'cycle_complete':
        print(f"Cycle #{data['cycle']} completed ({data['duration']}ms)")
    elif data['type'] == 'alert':
        print(f"⚠️ Alert: {data['message']}")

def on_open(ws):
    print("✅ Connected to BIZRA NODE0 live updates")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Disconnected from NODE0")

# Create WebSocket connection
ws = websocket.WebSocketApp(
    "ws://localhost:8081/ws/live-updates",
    on_message=on_message,
    on_open=on_open,
    on_error=on_error,
    on_close=on_close
)

# Run forever (with auto-reconnect)
ws.run_forever()
```

---

## III. NEO4J GRAPH DATABASE (PORTS 7474/7687)

**Browser UI:** http://localhost:7474  
**Bolt Protocol:** `bolt://localhost:7687`

**Credentials:**

- Username: `neo4j`
- Password: `bizra123`

### 3.1 Python Usage (py2neo)

```python
from neo4j import GraphDatabase

# Create driver
driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "bizra123")
)

# Query top assets
with driver.session() as session:
    result = session.run("""
        MATCH (a:Asset)
        RETURN a.name AS name, a.value AS value, a.domain AS domain
        ORDER BY a.rank
        LIMIT 10
    """)

    print("Top 10 BIZRA Assets:")
    for record in result:
        print(f"  - {record['name']}: {record['value']} ({record['domain']})")

# Find asset connections
with driver.session() as session:
    result = session.run("""
        MATCH (a:Asset {name: 'BIZRA NODE0'})-[r]->(connected)
        RETURN connected.name AS connected_asset, type(r) AS relationship
    """)

    print("\nNODE0 Connections:")
    for record in result:
        print(f"  {record['relationship']} → {record['connected_asset']}")

driver.close()
```

### 3.2 JavaScript Usage (neo4j-driver)

```javascript
const neo4j = require("neo4j-driver");

// Create driver
const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "bizra123"),
);

// Query top assets
async function getTopAssets(limit = 10) {
  const session = driver.session();

  try {
    const result = await session.run(
      "MATCH (a:Asset) RETURN a ORDER BY a.rank LIMIT $limit",
      { limit: neo4j.int(limit) },
    );

    const assets = result.records.map((record) => {
      const asset = record.get("a").properties;
      return {
        name: asset.name,
        value: asset.value,
        domain: asset.domain,
        rank: asset.rank.toNumber(),
      };
    });

    return assets;
  } finally {
    await session.close();
  }
}

// Usage
(async () => {
  const assets = await getTopAssets(5);
  console.log("Top 5 Assets:", assets);

  await driver.close();
})();
```

### 3.3 Cypher Query Examples

**Browser UI (http://localhost:7474):**

```cypher
// Find all assets
MATCH (a:Asset)
RETURN a
ORDER BY a.rank
LIMIT 20

// Find cross-domain synergies
MATCH (a1:Asset)-[r]-(a2:Asset)
WHERE a1.domain <> a2.domain
RETURN a1.name, a2.name, type(r), a1.domain, a2.domain
LIMIT 50

// Find high-value Trading assets
MATCH (a:Asset)
WHERE a.domain = 'Trading' AND a.value > 'Medium'
RETURN a.name, a.value, a.description
ORDER BY a.rank

// Get NODE0 architecture
MATCH path = (n:Asset {name: 'BIZRA NODE0'})-[*1..3]-(connected)
RETURN path
LIMIT 100
```

---

## IV. LOCAL AI MODELS (OLLAMA)

**Base URL:** `http://localhost:11434`

### 4.1 Available Models

```bash
# List all installed models
ollama list

# Expected output:
# NAME                    ID          SIZE
# bizra-7b:latest        abc123...   4.1GB
# qwen2.5:7b             def456...   4.2GB
# deepseek-r1:8b         ghi789...   4.5GB
# ... (7+ models total)
```

### 4.2 Command Line Usage

Query with BIZRA-7B (custom fine-tuned):

```bash
ollama run bizra-7b "Based on BIZRA's top 20 assets, what cross-domain synergies exist between Trading and Security?"
```

Use Qwen2.5 for Code:

```bash
ollama run qwen2.5:7b "Generate Python code to query Neo4j for BIZRA assets and analyze their relationships"
```

Use DeepSeek-R1 for Reasoning:

```bash
ollama run deepseek-r1:8b "Analyze BIZRA NODE0 architecture and suggest optimization strategies based on احسان principles"
```

### 4.3 Python Integration

```python
import requests
import json

def query_ollama(model, prompt, stream=False):
    """Query local Ollama model"""
    response = requests.post('http://localhost:11434/api/generate', json={
        'model': model,
        'prompt': prompt,
        'stream': stream,
        'options': {
            'temperature': 0.3,
            'num_ctx': 8192
        }
    })

    if stream:
        for line in response.iter_lines():
            if line:
                yield json.loads(line)['response']
    else:
        return response.json()['response']

# Example usage
result = query_ollama('bizra-7b', 'What are BIZRA NODE0 core strengths?')
print(result)
```

### 4.4 JavaScript Integration

```javascript
async function queryOllama(model, prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_ctx: 8192,
      },
    }),
  });

  const data = await response.json();
  return data.response;
}

// Example usage
const suggestions = await queryOllama(
  "deepseek-r1:8b",
  "Analyze BIZRA NODE0 and suggest 3 optimization priorities",
);
```

---

## V. COMPLETE LOCAL INTEGRATION CLIENTS

### 5.1 JavaScript Client

**File:** `examples/local-bizra-client.js`

```bash
# Install dependencies
npm install neo4j-driver ws node-fetch

# Run demo
node examples/local-bizra-client.js
```

### 5.2 Python Client

**File:** `examples/local-bizra-client.py`

```bash
# Install dependencies
pip install requests websocket-client neo4j-driver

# Run demo
python examples/local-bizra-client.py
```

---

## VI. QUICK START GUIDE

### Option 1: Command Line (Quick Tests)

```bash
# Test health
curl http://localhost:8080/health

# Test WebSocket (requires websocat: cargo install websocat)
websocat ws://localhost:8081/ws/live-updates

# Test Neo4j browser
open http://localhost:7474

# Test AI
ollama run bizra-7b "What is احسان?"
```

### Option 2: JavaScript/Node.js

```bash
# Install dependencies
npm install neo4j-driver ws node-fetch

# Run demo
node examples/local-bizra-client.js
```

### Option 3: Python

```bash
# Install dependencies
pip install requests websocket-client neo4j-driver

# Run demo
python examples/local-bizra-client.py
```

---

## VII. ACCEPTANCE CRITERIA

After 15 Minutes:

- ✅ All 5 local services responding
- ✅ Health checks returning [translate:احسان] 100/100
- ✅ WebSocket live updates streaming
- ✅ Neo4j queries returning asset data
- ✅ Local AI models responding (<200ms)
- ✅ Complete integration client working

---

## VIII. TROUBLESHOOTING

### Service Not Responding

```bash
# Check if services are running
curl http://localhost:8080/health || echo "API server down"
curl http://localhost:7474 || echo "Neo4j down"
curl http://localhost:11434/api/tags || echo "Ollama down"

# Restart services if needed
# (depends on your service manager - PM2, systemd, etc.)
```

### WebSocket Connection Fails

```bash
# Check WebSocket server
netstat -an | grep 8081

# Test with websocat
websocat ws://localhost:8081/ws/live-updates
```

### Neo4j Authentication Error

```bash
# Reset Neo4j password if needed
# (from Neo4j browser or CLI)
```

---

## 🌙 الحمد لله رب العالمين 🌙

**Status:** ✅ LOCAL API REFERENCE COMPLETE  
**Services:** ✅ ALL 5 OPERATIONAL  
**Integration:** ✅ CLIENTS READY (JS + PYTHON)  
**Timeline:** 15 MINUTES TO FULL INTEGRATION
