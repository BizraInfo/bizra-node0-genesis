/**
 * BIZRA NODE-0 WebSocket Server v1.0.0
 * Provides live dashboard updates (RCA events, Ahsan/Ihsan score, controller cycles).
 * Features:
 *  - Heartbeat/keepalive
 *  - Broadcast to all clients (future: per-topic subscriptions)
 *  - Ahsan compliance tracking with threshold alarms
 */

const WebSocket = require("ws");
const EventEmitter = require("events");

/**
 * WebSocket Server Manager
 * Handles client connections, broadcasting, and lifecycle management.
 */
class WebSocketServer extends EventEmitter {
  constructor(httpServer, options = {}) {
    super();

    this.options = {
      path: options.path || "/ws/live-updates",
      heartbeatInterval: options.heartbeatInterval || 30000, // 30s
      maxClients: options.maxClients || 100,
      ahsanThreshold: options.ahsanThreshold || 95.0,
    };

    // Create WebSocket server attached to HTTP server
    this.wss = new WebSocket.Server({
      server: httpServer,
      path: this.options.path,
    });

    // Track active clients
    this.clients = new Map();
    this.clientIdCounter = 0;

    // Metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      ahsan: 100.0,
    };

    this.initialize();
  }

  /**
   * Initialize WebSocket server with event handlers.
   */
  initialize() {
    console.log("[WebSocket] Initializing server...");
    console.log(`[WebSocket] Path: ${this.options.path}`);
    console.log(
      `[WebSocket] Heartbeat interval: ${this.options.heartbeatInterval}ms`,
    );

    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on("error", (error) => {
      console.error("[WebSocket] Server error:", error);
      this.metrics.errors++;
      this.updateAhsanScore();
    });

    // Start heartbeat mechanism
    this.startHeartbeat();

    console.log("[WebSocket] Server initialized successfully");
    console.log(`[WebSocket] Ahsan score: ${this.metrics.ahsan}/100`);

    this.emit("initialized");
  }

  /**
   * Handle new client connection.
   */
  handleConnection(ws, req) {
    const clientId = ++this.clientIdCounter;
    const clientIp = req.socket.remoteAddress;

    console.log(
      `[WebSocket] New connection: Client #${clientId} from ${clientIp}`,
    );

    // Check max clients limit
    if (this.clients.size >= this.options.maxClients) {
      console.warn(
        `[WebSocket] Max clients (${this.options.maxClients}) reached, rejecting connection`,
      );
      ws.close(1008, "Server at capacity");
      return;
    }

    // Store client metadata
    const clientData = {
      id: clientId,
      ws,
      ip: clientIp,
      connectedAt: Date.now(),
      lastPong: Date.now(),
      isAlive: true,
      subscriptions: new Set(), // Future: per-client subscriptions
    };

    this.clients.set(clientId, clientData);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    // Configure WebSocket
    ws.isAlive = true;

    // Send welcome message
    this.sendToClient(clientId, {
      type: "welcome",
      clientId,
      timestamp: Date.now(),
      ahsan: this.metrics.ahsan,
      message: "Connected to BIZRA Node-0 live updates",
    });

    // Handle pong (heartbeat response)
    ws.on("pong", () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
        client.lastPong = Date.now();
      }
    });

    // Handle incoming messages
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error) {
        console.error(
          `[WebSocket] Client #${clientId} sent invalid JSON:`,
          error.message,
        );
        this.metrics.errors++;
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      console.log(`[WebSocket] Client #${clientId} disconnected`);
      this.clients.delete(clientId);
      this.metrics.activeConnections--;
      this.updateAhsanScore();
    });

    // Handle client errors
    ws.on("error", (error) => {
      console.error(`[WebSocket] Client #${clientId} error:`, error.message);
      this.metrics.errors++;
      this.updateAhsanScore();
    });

    this.updateAhsanScore();
    this.emit("client-connected", clientData);
  }

  /**
   * Handle messages from clients (e.g., subscription requests).
   */
  handleClientMessage(clientId, message) {
    this.metrics.messagesReceived++;

    console.log(`[WebSocket] Client #${clientId} message:`, message.type);

    switch (message.type) {
      case "ping":
        this.sendToClient(clientId, { type: "pong", timestamp: Date.now() });
        break;

      case "subscribe": {
        const client = this.clients.get(clientId);
        if (client && message.topics) {
          message.topics.forEach((topic) => client.subscriptions.add(topic));
          this.sendToClient(clientId, {
            type: "subscribed",
            topics: Array.from(client.subscriptions),
          });
        }
        break;
      }

      case "unsubscribe": {
        const clientData = this.clients.get(clientId);
        if (clientData && message.topics) {
          message.topics.forEach((topic) =>
            clientData.subscriptions.delete(topic),
          );
          this.sendToClient(clientId, {
            type: "unsubscribed",
            topics: message.topics,
          });
        }
        break;
      }

      default:
        console.warn(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Send message to specific client.
   */
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(data));
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(
        `[WebSocket] Failed to send to client #${clientId}:`,
        error.message,
      );
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients.
   */
  broadcast(data) {
    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client, clientId) => {
      const success = this.sendToClient(clientId, data);
      if (success) successCount++;
      else failCount++;
    });

    console.log(
      `[WebSocket] Broadcast to ${successCount} clients (${failCount} failed)`,
    );

    return { successCount, failCount };
  }

  /**
   * Broadcast RCA event (primary use case for dashboard).
   */
  broadcastRCAEvent(rcaEvent) {
    const message = {
      type: "rca-event",
      timestamp: Date.now(),
      ahsan: this.metrics.ahsan,
      data: rcaEvent,
    };

    return this.broadcast(message);
  }

  /**
   * Broadcast controller cycle update.
   */
  broadcastControllerCycle(cycleData) {
    const message = {
      type: "controller-cycle",
      timestamp: Date.now(),
      ahsan: this.metrics.ahsan,
      data: cycleData,
    };

    return this.broadcast(message);
  }

  /**
   * Broadcast Ahsan score update.
   */
  broadcastAhsanScore(score, details = {}) {
    const message = {
      type: "ahsan-score",
      timestamp: Date.now(),
      ahsan: score,
      details,
    };

    return this.broadcast(message);
  }

  /**
   * Heartbeat mechanism to detect dead connections.
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const deadClients = [];

      this.clients.forEach((client, clientId) => {
        if (client.isAlive === false) {
          console.log(
            `[WebSocket] Client #${clientId} failed heartbeat, terminating`,
          );
          client.ws.terminate();
          deadClients.push(clientId);
          return;
        }

        // Mark as dead, will be set to alive on pong
        client.isAlive = false;
        client.ws.ping();
      });

      // Remove dead clients
      deadClients.forEach((clientId) => {
        this.clients.delete(clientId);
        this.metrics.activeConnections--;
      });

      if (deadClients.length > 0) {
        this.updateAhsanScore();
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Update Ahsan compliance score based on metrics.
   */
  updateAhsanScore() {
    const { errors, messagesSent } = this.metrics;
    const totalMessages = messagesSent + errors;
    const errorRate = totalMessages > 0 ? (errors / totalMessages) * 100 : 0;

    this.metrics.ahsan = Math.max(0, 100 - errorRate);

    if (this.metrics.ahsan < this.options.ahsanThreshold) {
      console.warn(
        `[WebSocket] Ahsan score ${this.metrics.ahsan.toFixed(
          1,
        )}/100 below threshold ${this.options.ahsanThreshold}`,
      );
      this.emit("ahsan-violation", this.metrics.ahsan);
    }
  }

  /**
   * Get server metrics.
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeConnections: this.clients.size,
      clients: Array.from(this.clients.values()).map((c) => ({
        id: c.id,
        ip: c.ip,
        connectedAt: c.connectedAt,
        lastPong: c.lastPong,
        subscriptions: Array.from(c.subscriptions),
      })),
    };
  }

  /**
   * Graceful shutdown.
   */
  async shutdown() {
    console.log("[WebSocket] Shutting down server...");

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.broadcast({
      type: "server-shutdown",
      message: "Server shutting down gracefully",
      timestamp: Date.now(),
    });

    this.clients.forEach((client) => {
      client.ws.close(1001, "Server shutdown");
    });

    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log("[WebSocket] Server shut down successfully");
        this.emit("shutdown");
        resolve();
      });
    });
  }
}

module.exports = { WebSocketServer };
