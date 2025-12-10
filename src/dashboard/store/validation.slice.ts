import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  ValidationEvent,
  ValidationMetrics,
  DashboardStats,
  LogEntry,
  Alert,
  NodeHealth,
} from "../types/validation.types";

interface ValidationState {
  validations: ValidationEvent[];
  metrics: ValidationMetrics | null;
  dashboardStats: DashboardStats | null;
  logs: LogEntry[];
  alerts: Alert[];
  nodeHealth: NodeHealth[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ValidationState = {
  validations: [],
  metrics: null,
  dashboardStats: null,
  logs: [],
  alerts: [],
  nodeHealth: [],
  isLoading: false,
  error: null,
};

const validationSlice = createSlice({
  name: "validation",
  initialState,
  reducers: {
    // Validation events
    addValidation: (state, action: PayloadAction<ValidationEvent>) => {
      state.validations.unshift(action.payload);
      // Keep only last 100 validations
      if (state.validations.length > 100) {
        state.validations = state.validations.slice(0, 100);
      }
    },
    setValidations: (state, action: PayloadAction<ValidationEvent[]>) => {
      state.validations = action.payload;
    },
    clearValidations: (state) => {
      state.validations = [];
    },

    // Metrics
    updateMetrics: (state, action: PayloadAction<ValidationMetrics>) => {
      state.metrics = action.payload;
    },

    // Dashboard stats
    updateDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
      state.dashboardStats = action.payload;
    },

    // Logs
    addLog: (state, action: PayloadAction<LogEntry>) => {
      state.logs.unshift(action.payload);
      // Keep only last 500 logs
      if (state.logs.length > 500) {
        state.logs = state.logs.slice(0, 500);
      }
    },
    setLogs: (state, action: PayloadAction<LogEntry[]>) => {
      state.logs = action.payload;
    },
    clearLogs: (state) => {
      state.logs = [];
    },

    // Alerts
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
    },
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
    },
    acknowledgeAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert) {
        alert.acknowledged = true;
      }
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },

    // Node health
    updateNodeHealth: (state, action: PayloadAction<NodeHealth[]>) => {
      state.nodeHealth = action.payload;
    },
    updateSingleNodeHealth: (state, action: PayloadAction<NodeHealth>) => {
      const index = state.nodeHealth.findIndex(
        (n) => n.nodeId === action.payload.nodeId,
      );
      if (index !== -1) {
        state.nodeHealth[index] = action.payload;
      } else {
        state.nodeHealth.push(action.payload);
      }
    },

    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetState: () => initialState,
  },
});

export const {
  addValidation,
  setValidations,
  clearValidations,
  updateMetrics,
  updateDashboardStats,
  addLog,
  setLogs,
  clearLogs,
  addAlert,
  setAlerts,
  acknowledgeAlert,
  removeAlert,
  clearAlerts,
  updateNodeHealth,
  updateSingleNodeHealth,
  setLoading,
  setError,
  clearError,
  resetState,
} = validationSlice.actions;

export default validationSlice.reducer;
