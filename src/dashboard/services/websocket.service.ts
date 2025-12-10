import { io, Socket } from "socket.io-client";
import { AuthService } from "./auth.service";

type EventCallback = (data: any) => void;

export enum WebSocketEvent {
  VALIDATION_UPDATE = "validation:update",
  METRICS_UPDATE = "metrics:update",
  LOG_ENTRY = "log:entry",
  ALERT_NEW = "alert:new",
  NODE_STATUS = "node:status",
  SYSTEM_HEALTH = "system:health",
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    this.maxReconnectAttempts = parseInt(
      import.meta.env.VITE_WS_RECONNECT_ATTEMPTS || "5",
    );
    this.reconnectInterval = parseInt(
      import.meta.env.VITE_WS_RECONNECT_INTERVAL || "3000",
    );
  }

  // Connect to WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
      const token = AuthService.getAccessToken();

      if (!token) {
        reject(new Error("No authentication token available"));
        return;
      }

      this.socket = io(wsUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        transports: ["websocket", "polling"],
      });

      this.setupEventHandlers();

      this.socket.on("connect", () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error("Max reconnection attempts reached"));
        }
      });
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log("WebSocket disconnected");
    }
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("WebSocket reconnection error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
    });
  }

  // Subscribe to an event
  on(event: WebSocketEvent | string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from an event
  off(event: WebSocketEvent | string, callback?: EventCallback): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  // Emit an event
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Cannot emit event: WebSocket not connected");
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Subscribe to validation updates
  subscribeToValidations(callback: EventCallback): () => void {
    this.on(WebSocketEvent.VALIDATION_UPDATE, callback);
    return () => this.off(WebSocketEvent.VALIDATION_UPDATE, callback);
  }

  // Subscribe to metrics updates
  subscribeToMetrics(callback: EventCallback): () => void {
    this.on(WebSocketEvent.METRICS_UPDATE, callback);
    return () => this.off(WebSocketEvent.METRICS_UPDATE, callback);
  }

  // Subscribe to log entries
  subscribeToLogs(callback: EventCallback): () => void {
    this.on(WebSocketEvent.LOG_ENTRY, callback);
    return () => this.off(WebSocketEvent.LOG_ENTRY, callback);
  }

  // Subscribe to alerts
  subscribeToAlerts(callback: EventCallback): () => void {
    this.on(WebSocketEvent.ALERT_NEW, callback);
    return () => this.off(WebSocketEvent.ALERT_NEW, callback);
  }

  // Subscribe to node status updates
  subscribeToNodeStatus(callback: EventCallback): () => void {
    this.on(WebSocketEvent.NODE_STATUS, callback);
    return () => this.off(WebSocketEvent.NODE_STATUS, callback);
  }

  // Subscribe to system health updates
  subscribeToSystemHealth(callback: EventCallback): () => void {
    this.on(WebSocketEvent.SYSTEM_HEALTH, callback);
    return () => this.off(WebSocketEvent.SYSTEM_HEALTH, callback);
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
