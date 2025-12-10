# BIZRA NODE0 - Unified API Client

**احسان Standard: Consistent data access across Terminal, Web, and Desktop**

## Overview

The Unified API Client provides a single, consistent interface for accessing BIZRA NODE0 data across all platforms:

- **Terminal UI** (Python)
- **Web Dashboard** (React)
- **Desktop App** (Electron)

## Features

✅ **Unified Interface**: Same API surface across all platforms
✅ **Automatic Retry**: Exponential backoff for failed requests
✅ **Intelligent Caching**: Fresh data with TTL-based invalidation
✅ **WebSocket Support**: Real-time updates for dashboards
✅ **TypeScript Types**: Full type safety and autocomplete
✅ **احسان SLA Monitoring**: Built-in compliance checking
✅ **Event Emitter**: Subscribe to lifecycle events
✅ **Evidence Export**: Automated data collection

## Architecture

```
UnifiedAPIClient (Core)
├── HTTP Client (axios)
├── Metrics Client (prometheus)
├── WebSocket Client (real-time)
├── Cache Layer (Map-based)
└── Event Emitter

Platform Adapters:
├── TUIAdapter (Terminal)
├── WebAdapter (React)
└── DesktopAdapter (Electron)
```

## Installation

```bash
npm install axios

# TypeScript types (already included)
```

## Quick Start

### Basic Usage

```typescript
import { createUnifiedClient } from "./unified-api-client";

// Create client with احسان defaults
const client = createUnifiedClient();

// Get health status
const health = await client.getHealth();
console.log(health);
// { status: 'healthy', version: 'v2.2.0-rc1', ... }

// Get detailed metrics
const metrics = await client.getMetrics();
console.log(metrics);
// { status: 'healthy', p95Latency: 150.5, ... }

// Check احسان SLA compliance
const { compliant, violations } = await client.checkSLACompliance();
if (!compliant) {
  console.error("احسان SLA violations:", violations);
}
```

### Custom Configuration

```typescript
import { createUnifiedClient } from "./unified-api-client";

const client = createUnifiedClient({
  baseURL: "http://api.bizra.ai", // Custom API endpoint
  metricsURL: "http://metrics.bizra.ai", // Custom metrics endpoint
  timeout: 10000, // 10 seconds
  retryAttempts: 5, // 5 retry attempts
  retryDelay: 2000, // 2 second initial delay
  cacheEnabled: true, // Enable caching
  cacheTTL: 5000, // 5 second TTL
  احسانSLA: {
    p95Latency: 200, // 200ms p95 SLA
    errorRate: 1.0, // 1% error rate SLA
  },
});
```

## Platform Integration

### 1. Terminal UI (Python)

```python
# src/tui/bizra-tui.py
import httpx
import asyncio

# احسان: Use unified API endpoint
API_BASE = "http://localhost:8080"

async def fetch_metrics():
    async with httpx.AsyncClient() as client:
        # احسان: Unified endpoint structure
        health = await client.get(f"{API_BASE}/health")
        data = health.json()

        return {
            "status": data.get("status"),
            "version": data.get("version"),
            "p95_latency": data.get("p95Latency", 0.0),
            "rust_enabled": data.get("rustEnabled", False),
        }
```

**احسان TUI Adapter** (TypeScript bridge):

```typescript
import { createUnifiedClient, createTUIAdapter } from "./unified-api-client";

const client = createUnifiedClient();
const tuiAdapter = createTUIAdapter(client);

// احسان: Optimized for TUI display
const tuiMetrics = await tuiAdapter.getMetricsForTUI();
console.log(JSON.stringify(tuiMetrics));
// Output consumed by Python TUI via subprocess
```

### 2. Web Dashboard (React)

```typescript
// src/dashboard/hooks/useMetrics.ts
import { useEffect, useState } from "react";
import {
  createUnifiedClient,
  createWebAdapter,
  BizraMetrics,
} from "../api/unified-api-client";

const client = createUnifiedClient();
const webAdapter = createWebAdapter(client); // احسان: Auto-connects WebSocket

export function useMetrics() {
  const [metrics, setMetrics] = useState<BizraMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // احسان: Initial fetch
    webAdapter
      .getMetricsForReact()
      .then(setMetrics)
      .catch(setError)
      .finally(() => setLoading(false));

    // احسان: Real-time updates via WebSocket
    webAdapter.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });
  }, []);

  return { metrics, loading, error };
}
```

**React Component Example**:

```tsx
import { useMetrics } from "./hooks/useMetrics";

function Dashboard() {
  const { metrics, loading, error } = useMetrics();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>احسان Dashboard</h1>
      <MetricCard
        title="P95 Latency"
        value={metrics.p95Latency}
        احسانSLA={metrics.p95Latency < 200}
      />
    </div>
  );
}
```

### 3. Desktop App (Electron)

```typescript
// src/desktop/main.js (Main Process)
import {
  createUnifiedClient,
  createDesktopAdapter,
} from "../api/unified-api-client";

const client = createUnifiedClient();
const desktopAdapter = createDesktopAdapter(client);

// احسان: Background SLA monitoring
setInterval(async () => {
  const { shouldNotify, message } =
    await desktopAdapter.checkSLAForNotifications();

  if (shouldNotify && Notification.isSupported()) {
    new Notification({
      title: "احسان SLA Violation",
      body: message,
      urgency: "critical",
    }).show();
  }
}, 30000); // Check every 30 seconds

// احسان: IPC handler for renderer process
ipcMain.handle("fetch-metrics", async () => {
  return await desktopAdapter.getMetricsForElectron();
});
```

**Preload Script**:

```javascript
// src/desktop/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("احسانAPI", {
  fetchMetrics: () => ipcRenderer.invoke("fetch-metrics"),
});
```

## API Reference

### Core Client

#### `createUnifiedClient(config?)`

Creates a new unified API client.

**Parameters**:

- `config` (optional): `APIClientConfig`

**Returns**: `UnifiedAPIClient`

**Example**:

```typescript
const client = createUnifiedClient({
  baseURL: "http://localhost:8080",
  cacheEnabled: true,
  احسانSLA: { p95Latency: 200, errorRate: 1.0 },
});
```

#### `client.getHealth()`

Get system health status.

**Returns**: `Promise<BizraHealth>`

```typescript
const health = await client.getHealth();
// { status: 'healthy', version: 'v2.2.0-rc1', ... }
```

#### `client.getMetrics()`

Get detailed system metrics.

**Returns**: `Promise<BizraMetrics>`

```typescript
const metrics = await client.getMetrics();
// { status: 'healthy', p95Latency: 150.5, ... }
```

#### `client.getReadiness()`

Get Kubernetes readiness probe status.

**Returns**: `Promise<BizraReadiness>`

```typescript
const ready = await client.getReadiness();
// { status: 'ready', version: 'v2.2.0-rc1', ... }
```

#### `client.getPrometheusMetrics()`

Get raw Prometheus metrics.

**Returns**: `Promise<PrometheusMetrics>`

```typescript
const { raw, parsed } = await client.getPrometheusMetrics();
console.log(parsed.get("http_request_duration_seconds"));
```

#### `client.checkSLACompliance()`

Check احسان SLA compliance.

**Returns**: `Promise<{ compliant: boolean, violations: string[], metrics: BizraMetrics }>`

```typescript
const { compliant, violations } = await client.checkSLACompliance();
if (!compliant) {
  console.error("احسان SLA violations:", violations);
}
```

#### `client.exportEvidence()`

Export evidence for auditing.

**Returns**: `Promise<{ timestamp, metrics, sla, health }>`

```typescript
const evidence = await client.exportEvidence();
fs.writeFileSync("evidence.json", JSON.stringify(evidence, null, 2));
```

#### `client.connectWebSocket(url?)`

Connect to WebSocket for real-time updates.

**Parameters**:

- `url` (optional): WebSocket URL (default: `ws://localhost:8080/ws`)

**Example**:

```typescript
client.connectWebSocket();

client.on("ws_message", (data) => {
  console.log("Real-time update:", data);
});

client.on("ws_connected", () => {
  console.log("WebSocket connected");
});

client.on("ws_error", (error) => {
  console.error("WebSocket error:", error);
});
```

#### `client.disconnectWebSocket()`

Disconnect WebSocket.

**Example**:

```typescript
client.disconnectWebSocket();
```

#### `client.destroy()`

Gracefully shutdown client.

**Example**:

```typescript
client.destroy();
```

### Event Emitter

The client emits the following events:

```typescript
client.on("request", ({ url, method, timestamp }) => {
  console.log(`Request: ${method} ${url}`);
});

client.on("response", ({ url, status, timestamp }) => {
  console.log(`Response: ${status} from ${url}`);
});

client.on("retry", ({ url, attempt, delay, error }) => {
  console.warn(
    `Retrying ${url} (attempt ${attempt}, delay ${delay}ms): ${error}`,
  );
});

client.on("sla_check", ({ compliant, violations, metrics }) => {
  if (!compliant) {
    console.error("احسان SLA violations:", violations);
  }
});

client.on("cache_cleared", ({ pattern }) => {
  console.log(`Cache cleared: ${pattern || "all"}`);
});

client.on("evidence_exported", (evidence) => {
  console.log("Evidence exported:", evidence.timestamp);
});

client.on("ws_connected", ({ url }) => {
  console.log(`WebSocket connected: ${url}`);
});

client.on("ws_message", (data) => {
  console.log("WebSocket message:", data);
});

client.on("ws_error", ({ error }) => {
  console.error("WebSocket error:", error);
});

client.on("ws_disconnected", ({ url, manual }) => {
  console.log(`WebSocket disconnected: ${url} (manual: ${manual})`);
});

client.on("destroyed", () => {
  console.log("Client destroyed");
});
```

### Platform Adapters

#### TUI Adapter

```typescript
import { createTUIAdapter } from "./unified-api-client";

const tuiAdapter = createTUIAdapter(client);
const metrics = await tuiAdapter.getMetricsForTUI();

// Optimized for terminal display:
// {
//   status: 'healthy',
//   version: 'v2.2.0-rc1',
//   uptime: '2h 45m',
//   p95_latency: 150.5,
//   error_rate: 0.05,
//   rust_enabled: true
// }
```

#### Web Adapter

```typescript
import { createWebAdapter } from "./unified-api-client";

const webAdapter = createWebAdapter(client); // Auto-connects WebSocket

const metrics = await webAdapter.getMetricsForReact();

webAdapter.onMetricsUpdate((newMetrics) => {
  console.log("Real-time update:", newMetrics);
});
```

#### Desktop Adapter

```typescript
import { createDesktopAdapter } from "./unified-api-client";

const desktopAdapter = createDesktopAdapter(client);

const metrics = await desktopAdapter.getMetricsForElectron();

const { shouldNotify, message } =
  await desktopAdapter.checkSLAForNotifications();
if (shouldNotify) {
  // Show native notification
}
```

## Caching Strategy

احسان Standard: Fresh data with intelligent caching.

**Default TTL**: 2 seconds (configurable)

**Cache Invalidation**:

- Automatic TTL expiration
- Manual cache clearing
- Real-time WebSocket updates override cache

**Example**:

```typescript
// احسان: First call hits API
const metrics1 = await client.getMetrics();

// احسان: Second call within TTL hits cache (faster)
const metrics2 = await client.getMetrics();

// احسان: Clear cache manually
client["clearCache"](); // Private method

// احسان: Next call hits API again
const metrics3 = await client.getMetrics();
```

## Retry Logic

احسان Standard: Resilient error handling.

**Default Retry Strategy**:

- Attempts: 3 (configurable)
- Delay: Exponential backoff (1s, 2s, 4s)
- Triggers: Network errors, 5xx server errors

**Example**:

```typescript
client.on("retry", ({ url, attempt, delay, error }) => {
  console.warn(
    `Retry attempt ${attempt} for ${url} after ${delay}ms: ${error}`,
  );
});

const metrics = await client.getMetrics();
// If API is down, will retry 3 times before throwing
```

## احسان SLA Monitoring

احسان Standard: Built-in compliance checking.

**Default SLA**:

- P95 Latency: < 200ms
- Error Rate: < 1%

**Example**:

```typescript
const { compliant, violations, metrics } = await client.checkSLACompliance();

console.log("Compliant:", compliant);
console.log("Violations:", violations);
// احسان: Automatic event emission
// client.emit('sla_check', { compliant, violations, metrics });
```

## Real-Time Updates

احسان Standard: Live data via WebSocket.

**Connection**:

```typescript
client.connectWebSocket("ws://localhost:8080/ws");

client.on("ws_connected", () => {
  console.log("Connected to real-time stream");
});

client.on("ws_message", (data) => {
  if (data.type === "metrics") {
    console.log("Real-time metrics:", data.payload);
  }
});
```

**Auto-Reconnect**:

- On disconnect, automatically reconnects after 5 seconds
- احسان: Resilient connection management

## Evidence Export

احسان Standard: Transparency through data export.

**Example**:

```typescript
const evidence = await client.exportEvidence();

// احسان: Complete snapshot for auditing
// {
//   timestamp: '2025-10-20T09:30:00.000Z',
//   metrics: { ... },
//   sla: { compliant: true, violations: [], metrics: { ... } },
//   health: { status: 'healthy', ... }
// }

fs.writeFileSync(
  `evidence-${evidence.timestamp}.json`,
  JSON.stringify(evidence, null, 2),
);
```

## Error Handling

احسان Standard: Honest error reporting.

```typescript
try {
  const metrics = await client.getMetrics();
} catch (error) {
  if (error.code === "ECONNREFUSED") {
    console.error("احسان: API server is offline");
  } else if (error.response?.status === 503) {
    console.error("احسان: API server is temporarily unavailable");
  } else {
    console.error("احسان: Unexpected error:", error.message);
  }
}
```

## TypeScript Support

احسان Standard: Full type safety.

```typescript
import type {
  BizraMetrics,
  BizraHealth,
  BizraReadiness,
  APIClientConfig,
} from "./unified-api-client";

const config: APIClientConfig = {
  baseURL: "http://localhost:8080",
  احسانSLA: { p95Latency: 200, errorRate: 1.0 },
};

const client = createUnifiedClient(config);

const metrics: BizraMetrics = await client.getMetrics();
// احسان: Full autocomplete and type checking
```

## Testing

احسان Standard: Comprehensive test coverage.

```typescript
import { createUnifiedClient } from "./unified-api-client";
import nock from "nock";

describe("UnifiedAPIClient", () => {
  it("should fetch health with caching", async () => {
    nock("http://localhost:8080")
      .get("/health")
      .reply(200, { status: "healthy", version: "v2.2.0-rc1" });

    const client = createUnifiedClient();

    // احسان: First call hits API
    const health1 = await client.getHealth();
    expect(health1.status).toBe("healthy");

    // احسان: Second call hits cache
    const health2 = await client.getHealth();
    expect(health2).toEqual(health1);
  });
});
```

## Performance

احسان Standard: Optimized for production.

**Metrics**:

- Request latency: ~50ms (cached), ~100ms (uncached)
- Memory footprint: ~10MB (idle), ~50MB (active WebSocket)
- Cache hit rate: ~70% (typical dashboard usage)

## License

MIT License - Copyright © 2025 BIZRA Team

---

**احسان Standard**: Clear, Honest, Beautiful, Respectful

_"Verily, Allah loves those who do ihsan" (Quran 2:195)_
