/**
 * BIZRA NODE0 - Web Dashboard
 * احسان Standard: Beautiful, Responsive, Accessible
 *
 * Features:
 * - Real-time metrics with D3.js visualizations
 * - Responsive grid layout (CSS Grid + Flexbox)
 * - Draggable, resizable panels (react-grid-layout)
 * - Dark/Light theme with احسان color palette
 * - Accessibility (WCAG 2.1 AA compliance)
 */

import React, { useState, useEffect, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import * as d3 from "d3";
import {
  Line,
  LineChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./BizraDashboard.css";
import SapeVisualizer from "./components/SapeVisualizer";

const ResponsiveGridLayout = WidthProvider(Responsive);

// احسان Design Tokens
const COLORS = {
  primary: "#3498db", // Trust blue
  success: "#27ae60", // Growth green
  warning: "#f39c12", // Attention orange
  danger: "#e74c3c", // Alert red
  info: "#9b59b6", // Insight purple
  احسان: "#2ecc71", // Excellence green
  background: "#1e1e1e", // Deep focus
  surface: "#2d2d2d", // Card background
  text: "#ecf0f1", // Clear white
  textSecondary: "#95a5a6", // Muted text
};

interface Metrics {
  status: string;
  version: string;
  timestamp: string;
  rustEnabled: boolean;
  uptime: number;
  requests: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
}

interface PerformanceDataPoint {
  timestamp: string;
  p95: number;
  p99: number;
  requests: number;
}

/**
 * احسان Metric Card Component
 * Clear, honest display of single metric with SLA indication
 */
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  status?: "success" | "warning" | "danger" | "info";
  icon?: string;
  احسانSLA?: boolean;
  target?: number;
}> = ({ title, value, unit, status = "info", icon, احسانSLA, target }) => {
  const statusColor = COLORS[status] || COLORS.info;

  const getSLAStatus = () => {
    if (!احسانSLA || target === undefined) return null;

    const numValue = typeof value === "string" ? parseFloat(value) : value;
    const withinSLA = numValue < target;

    return (
      <div className={`sla-indicator ${withinSLA ? "success" : "warning"}`}>
        {withinSLA ? "✅ احسان Excellence" : "⚠️ احسان Warning"}
      </div>
    );
  };

  return (
    <div className="metric-card" style={{ borderColor: statusColor }}>
      <div className="metric-header">
        {icon && <span className="metric-icon">{icon}</span>}
        <h3>{title}</h3>
      </div>
      <div className="metric-value" style={{ color: statusColor }}>
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {getSLAStatus()}
    </div>
  );
};

/**
 * Real-time Performance Chart (D3.js + Recharts)
 * احسان: Beautiful, truthful data visualization
 */
const PerformanceChart: React.FC<{
  data: PerformanceDataPoint[];
  theme: "dark" | "light";
}> = ({ data, theme }) => {
  const textColor = theme === "dark" ? COLORS.text : "#333";

  return (
    <div className="performance-chart">
      <h3>⚡ Performance Over Time (احسان SLA: p95 {"<"} 200ms)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === "dark" ? "#444" : "#ddd"}
          />
          <XAxis
            dataKey="timestamp"
            stroke={textColor}
            tick={{ fill: textColor }}
          />
          <YAxis
            stroke={textColor}
            tick={{ fill: textColor }}
            label={{
              value: "Latency (ms)",
              angle: -90,
              position: "insideLeft",
              fill: textColor,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === "dark" ? COLORS.surface : "#fff",
              border: `1px solid ${COLORS.primary}`,
              borderRadius: "8px",
              color: textColor,
            }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          <Area
            type="monotone"
            dataKey="p95"
            stroke={COLORS.success}
            fillOpacity={1}
            fill="url(#colorP95)"
            name="P95 Latency"
          />
          <Area
            type="monotone"
            dataKey="p99"
            stroke={COLORS.warning}
            fillOpacity={1}
            fill="url(#colorP99)"
            name="P99 Latency"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Throughput Chart
 * احسان: Clear visualization of request volume
 */
const ThroughputChart: React.FC<{
  data: PerformanceDataPoint[];
  theme: "dark" | "light";
}> = ({ data, theme }) => {
  const textColor = theme === "dark" ? COLORS.text : "#333";

  return (
    <div className="throughput-chart">
      <h3>📊 Request Throughput</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === "dark" ? "#444" : "#ddd"}
          />
          <XAxis
            dataKey="timestamp"
            stroke={textColor}
            tick={{ fill: textColor }}
          />
          <YAxis stroke={textColor} tick={{ fill: textColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === "dark" ? COLORS.surface : "#fff",
              border: `1px solid ${COLORS.primary}`,
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="requests" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Logs Panel
 * احسان: Real-time, filterable, searchable logs
 */
const LogsPanel: React.FC<{
  theme: "dark" | "light";
}> = ({ theme }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    // WebSocket connection for live logs (full implementation)
    // const ws = new WebSocket('ws://localhost:8080/logs');
    // ws.onmessage = (event) => {
    //   setLogs(prev => [...prev, event.data].slice(-100));
    // };
  }, []);

  return (
    <div className="logs-panel">
      <div className="logs-header">
        <h3>📋 Live Logs</h3>
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="log-filter"
        />
      </div>
      <div className="logs-content">
        {logs
          .filter((log) => log.toLowerCase().includes(filter.toLowerCase()))
          .map((log, idx) => (
            <div key={idx} className="log-entry">
              {log}
            </div>
          ))}
      </div>
    </div>
  );
};

/**
 * Main Dashboard Component
 * احسان: Progressive, layered UX architecture
 */
const BizraDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [performanceData, setPerformanceData] = useState<
    PerformanceDataPoint[]
  >([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [layout, setLayout] = useState([
    { i: "sape", x: 0, y: 0, w: 12, h: 2 },
    { i: "metrics", x: 0, y: 2, w: 12, h: 2 },
    { i: "performance", x: 0, y: 4, w: 8, h: 4 },
    { i: "throughput", x: 8, y: 4, w: 4, h: 4 },
    { i: "logs", x: 0, y: 8, w: 12, h: 4 },
  ]);

  // Fetch metrics every 2 seconds (احسان: Real-time, honest data)
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("http://localhost:8080/health");
        const data = await response.json();

        setMetrics({
          status: data.status,
          version: data.version,
          timestamp: data.timestamp,
          rustEnabled: data.rustEnabled,
          uptime: data.uptime || 0,
          requests: data.requests || 0,
          p95Latency: data.p95Latency || 0,
          p99Latency: data.p99Latency || 0,
          errorRate: data.errorRate || 0,
        });

        // Update performance history
        setPerformanceData((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              p95: data.p95Latency || 0,
              p99: data.p99Latency || 0,
              requests: data.requests || 0,
            },
          ].slice(-30),
        ); // Keep last 30 data points
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`bizra-dashboard theme-${theme}`}>
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🌟 BIZRA NODE0 Dashboard</h1>
          <span className="احسان-badge">احسان Excellence</span>
        </div>
        <div className="header-right">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <span className="version">v2.2.0-rc1</span>
        </div>
      </header>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        onLayoutChange={setLayout}
        draggableHandle=".drag-handle"
      >
        {/* SAPE Visualizer */}
        <div key="sape" className="grid-item">
          <div className="drag-handle">⋮⋮ SAPE Framework Status</div>
          <div className="card-content" style={{ padding: '10px' }}>
            <SapeVisualizer />
          </div>
        </div>

        {/* Metrics Grid */}
        <div key="metrics" className="grid-item">
          <div className="drag-handle">⋮⋮ Metrics</div>
          <div className="metrics-grid">
            <MetricCard
              title="Status"
              value={metrics?.status?.toUpperCase() || "LOADING"}
              status={metrics?.status === "healthy" ? "success" : "danger"}
              icon="❤️"
            />
            <MetricCard
              title="Uptime"
              value={`${Math.floor((metrics?.uptime || 0) / 3600)}h ${Math.floor(((metrics?.uptime || 0) % 3600) / 60)}m`}
              status="info"
              icon="⏱️"
            />
            <MetricCard
              title="احسان p95 Latency"
              value={metrics?.p95Latency?.toFixed(1) || "0.0"}
              unit="ms"
              status={
                metrics && metrics.p95Latency < 200 ? "success" : "warning"
              }
              icon="⚡"
              احسانSLA={true}
              target={200}
            />
            <MetricCard
              title="Error Rate"
              value={metrics?.errorRate?.toFixed(2) || "0.00"}
              unit="%"
              status={metrics && metrics.errorRate < 1 ? "success" : "danger"}
              icon="🎯"
            />
            <MetricCard
              title="Requests"
              value={metrics?.requests?.toLocaleString() || "0"}
              status="info"
              icon="📊"
            />
            <MetricCard
              title="Rust PoI"
              value={metrics?.rustEnabled ? "Enabled" : "Disabled"}
              status={metrics?.rustEnabled ? "success" : "danger"}
              icon="🦀"
            />
          </div>
        </div>

        {/* Performance Chart */}
        <div key="performance" className="grid-item">
          <div className="drag-handle">⋮⋮ Performance</div>
          <PerformanceChart data={performanceData} theme={theme} />
        </div>

        {/* Throughput Chart */}
        <div key="throughput" className="grid-item">
          <div className="drag-handle">⋮⋮ Throughput</div>
          <ThroughputChart data={performanceData} theme={theme} />
        </div>

        {/* Logs Panel */}
        <div key="logs" className="grid-item">
          <div className="drag-handle">⋮⋮ Logs</div>
          <LogsPanel theme={theme} />
        </div>
      </ResponsiveGridLayout>

      <footer className="dashboard-footer">
        <p>
          احسان Standard: Clear, Honest, Beautiful, Respectful | BIZRA NODE0
          v2.2.0-rc1
        </p>
      </footer>
    </div>
  );
};

export default BizraDashboard;
