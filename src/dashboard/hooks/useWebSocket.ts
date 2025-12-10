import { useEffect, useCallback, useState } from "react";
import { useAppDispatch } from "../store/store";
import websocketService, {
  WebSocketEvent,
} from "../services/websocket.service";
import {
  addValidation,
  updateMetrics,
  addLog,
  addAlert,
  updateSingleNodeHealth,
  updateDashboardStats,
} from "../store/validation.slice";
import type {
  ValidationEvent,
  ValidationMetrics,
  LogEntry,
  Alert,
  NodeHealth,
  DashboardStats,
} from "../types/validation.types";

export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        await websocketService.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (error: any) {
        setConnectionError(error.message || "Failed to connect to WebSocket");
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Subscribe to validation updates
  const subscribeToValidations = useCallback(() => {
    return websocketService.subscribeToValidations((data: ValidationEvent) => {
      dispatch(addValidation(data));
    });
  }, [dispatch]);

  // Subscribe to metrics updates
  const subscribeToMetrics = useCallback(() => {
    return websocketService.subscribeToMetrics((data: ValidationMetrics) => {
      dispatch(updateMetrics(data));
    });
  }, [dispatch]);

  // Subscribe to log entries
  const subscribeToLogs = useCallback(() => {
    return websocketService.subscribeToLogs((data: LogEntry) => {
      dispatch(addLog(data));
    });
  }, [dispatch]);

  // Subscribe to alerts
  const subscribeToAlerts = useCallback(() => {
    return websocketService.subscribeToAlerts((data: Alert) => {
      dispatch(addAlert(data));
    });
  }, [dispatch]);

  // Subscribe to node status updates
  const subscribeToNodeStatus = useCallback(() => {
    return websocketService.subscribeToNodeStatus((data: NodeHealth) => {
      dispatch(updateSingleNodeHealth(data));
    });
  }, [dispatch]);

  // Subscribe to system health updates
  const subscribeToSystemHealth = useCallback(() => {
    return websocketService.subscribeToSystemHealth((data: DashboardStats) => {
      dispatch(updateDashboardStats(data));
    });
  }, [dispatch]);

  // Generic subscribe method
  const subscribe = useCallback(
    (event: WebSocketEvent | string, callback: (data: any) => void) => {
      websocketService.on(event, callback);
      return () => websocketService.off(event, callback);
    },
    [],
  );

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    websocketService.emit(event, data);
  }, []);

  return {
    isConnected,
    connectionError,
    subscribeToValidations,
    subscribeToMetrics,
    subscribeToLogs,
    subscribeToAlerts,
    subscribeToNodeStatus,
    subscribeToSystemHealth,
    subscribe,
    emit,
  };
};

export default useWebSocket;
