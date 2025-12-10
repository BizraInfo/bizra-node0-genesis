import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TimeSeriesData, ChartDataPoint } from "../types/validation.types";

interface MetricsChartProps {
  data: TimeSeriesData[] | ChartDataPoint[];
  type?: "line" | "area" | "bar" | "pie";
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  type = "line",
  height = 300,
  colors = COLORS,
  showLegend = true,
  showGrid = true,
}) => {
  // Handle time series data (multiple series)
  const isTimeSeries =
    Array.isArray(data) && data.length > 0 && "label" in data[0];

  const renderLineChart = () => {
    if (isTimeSeries) {
      const timeSeriesData = data as TimeSeriesData[];
      // Merge all data points by timestamp
      const mergedData: Record<string, any> = {};

      timeSeriesData.forEach((series) => {
        series.data.forEach((point) => {
          if (!mergedData[point.timestamp]) {
            mergedData[point.timestamp] = { timestamp: point.timestamp };
          }
          mergedData[point.timestamp][series.label] = point.value;
        });
      });

      const chartData = Object.values(mergedData);

      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {timeSeriesData.map((series, index) => (
              <Line
                key={series.label}
                type="monotone"
                dataKey={series.label}
                stroke={series.color || colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Single series data
    const chartData = data as ChartDataPoint[];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => {
    if (isTimeSeries) {
      const timeSeriesData = data as TimeSeriesData[];
      const mergedData: Record<string, any> = {};

      timeSeriesData.forEach((series) => {
        series.data.forEach((point) => {
          if (!mergedData[point.timestamp]) {
            mergedData[point.timestamp] = { timestamp: point.timestamp };
          }
          mergedData[point.timestamp][series.label] = point.value;
        });
      });

      const chartData = Object.values(mergedData);

      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {timeSeriesData.map((series, index) => (
              <Area
                key={series.label}
                type="monotone"
                dataKey={series.label}
                stackId="1"
                stroke={series.color || colors[index % colors.length]}
                fill={series.color || colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    const chartData = data as ChartDataPoint[];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    const chartData = data as ChartDataPoint[];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Bar dataKey="value" fill={colors[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    const chartData = data as ChartDataPoint[];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  switch (type) {
    case "area":
      return renderAreaChart();
    case "bar":
      return renderBarChart();
    case "pie":
      return renderPieChart();
    case "line":
    default:
      return renderLineChart();
  }
};

export default MetricsChart;
