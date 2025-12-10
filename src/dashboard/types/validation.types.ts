export enum ValidationStatus {
  PENDING = "pending",
  VALIDATING = "validating",
  SUCCESS = "success",
  FAILED = "failed",
  TIMEOUT = "timeout",
}

export enum ValidationType {
  TRANSACTION = "transaction",
  BLOCK = "block",
  CONTRACT = "contract",
  SIGNATURE = "signature",
  CONSENSUS = "consensus",
}

export interface ValidationMetrics {
  totalValidations: number;
  successRate: number;
  averageTime: number;
  failureRate: number;
  timeoutRate: number;
  throughput: number;
}

export interface ValidationEvent {
  id: string;
  type: ValidationType;
  status: ValidationStatus;
  timestamp: string;
  duration: number;
  nodeId: string;
  transactionId?: string;
  blockId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  timestamp: string;
}

export interface NodeHealth {
  nodeId: string;
  status: "healthy" | "degraded" | "critical" | "offline";
  uptime: number;
  lastHeartbeat: string;
  version: string;
  metrics: SystemMetrics;
}

export interface LogEntry {
  id: string;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  errorRate: number;
  requestsPerMinute: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  label: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface DashboardStats {
  totalTransactions: number;
  activeNodes: number;
  validationSuccess: number;
  avgResponseTime: number;
  systemHealth: number;
  alertsCount: number;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}
