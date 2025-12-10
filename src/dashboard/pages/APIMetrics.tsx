import React from "react";
import { Card, Table, Tag, Row, Col, Statistic, Space } from "antd";
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMetrics } from "../hooks/useMetrics";
import MetricsChart from "../components/MetricsChart";
import type { APIMetric } from "../types/validation.types";

const APIMetrics: React.FC = () => {
  const { apiMetrics, isLoading } = useMetrics();

  // Calculate aggregated metrics
  const totalRequests =
    apiMetrics?.reduce((sum, m) => sum + m.requestsPerMinute, 0) || 0;
  const avgResponseTime =
    apiMetrics?.reduce((sum, m) => sum + m.responseTime, 0) /
      (apiMetrics?.length || 1) || 0;
  const avgErrorRate =
    apiMetrics?.reduce((sum, m) => sum + m.errorRate, 0) /
      (apiMetrics?.length || 1) || 0;

  const columns: ColumnsType<APIMetric> = [
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      width: 300,
      render: (endpoint) => <code>{endpoint}</code>,
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 100,
      render: (method) => {
        const colors: Record<string, string> = {
          GET: "blue",
          POST: "green",
          PUT: "orange",
          PATCH: "purple",
          DELETE: "red",
        };
        return <Tag color={colors[method]}>{method}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "statusCode",
      key: "statusCode",
      width: 100,
      render: (statusCode) => {
        const color =
          statusCode < 400 ? "green" : statusCode < 500 ? "orange" : "red";
        return <Tag color={color}>{statusCode}</Tag>;
      },
    },
    {
      title: "Response Time",
      dataIndex: "responseTime",
      key: "responseTime",
      width: 150,
      sorter: (a, b) => a.responseTime - b.responseTime,
      render: (time) => `${time}ms`,
    },
    {
      title: "Requests/min",
      dataIndex: "requestsPerMinute",
      key: "requestsPerMinute",
      width: 130,
      sorter: (a, b) => a.requestsPerMinute - b.requestsPerMinute,
      render: (rpm) => rpm.toFixed(2),
    },
    {
      title: "Error Rate",
      dataIndex: "errorRate",
      key: "errorRate",
      width: 120,
      sorter: (a, b) => a.errorRate - b.errorRate,
      render: (rate) => {
        const color = rate < 1 ? "green" : rate < 5 ? "orange" : "red";
        return <Tag color={color}>{(rate * 100).toFixed(2)}%</Tag>;
      },
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp) => new Date(timestamp).toLocaleString(),
    },
  ];

  // Prepare chart data
  const chartData =
    apiMetrics?.slice(0, 20).map((m) => ({
      timestamp: m.endpoint.substring(0, 20),
      value: m.responseTime,
    })) || [];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Requests"
              value={totalRequests}
              suffix="/min"
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={avgResponseTime.toFixed(0)}
              suffix="ms"
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color: avgResponseTime < 500 ? "#52c41a" : "#faad14",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Error Rate"
              value={(avgErrorRate * 100).toFixed(2)}
              suffix="%"
              prefix={<CloseCircleOutlined />}
              valueStyle={{
                color: avgErrorRate < 0.01 ? "#52c41a" : "#f5222d",
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Response Time by Endpoint">
        <MetricsChart
          data={chartData}
          type="bar"
          height={300}
          colors={["#1890ff"]}
        />
      </Card>

      <Card title="API Endpoint Metrics">
        <Table
          columns={columns}
          dataSource={apiMetrics}
          rowKey={(record) => `${record.endpoint}-${record.timestamp}`}
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} endpoints`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </Space>
  );
};

export default APIMetrics;
