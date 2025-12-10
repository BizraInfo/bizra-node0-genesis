import React, { useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Space,
  Descriptions,
  Table,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppSelector } from "../store/store";
import { useWebSocket } from "../hooks/useWebSocket";
import type { NodeHealth } from "../types/validation.types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

import { MeshTopologyPanel } from "../components/MeshTopologyPanel";
import { MeshResilienceTimelinePanel } from "../components/MeshResilienceTimelinePanel";
import { MeshResilienceSLOPanel } from "../components/MeshResilienceSLOPanel";

const SystemHealth: React.FC = () => {
  const nodeHealth = useAppSelector((state) => state.validation.nodeHealth);
  const { subscribeToNodeStatus } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribeToNodeStatus();
    return () => unsubscribe();
  }, [subscribeToNodeStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
        );
      case "degraded":
        return <WarningOutlined style={{ color: "#faad14", fontSize: 24 }} />;
      case "critical":
        return (
          <CloseCircleOutlined style={{ color: "#f5222d", fontSize: 24 }} />
        );
      case "offline":
        return (
          <CloseCircleOutlined style={{ color: "#8c8c8c", fontSize: 24 }} />
        );
      default:
        return <WarningOutlined style={{ color: "#d9d9d9", fontSize: 24 }} />;
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      healthy: "green",
      degraded: "orange",
      critical: "red",
      offline: "default",
    };
    return colors[status] || "default";
  };

  const formatUptime = (seconds: number): string => {
    const d = dayjs.duration(seconds, "seconds");
    return `${d.days()}d ${d.hours()}h ${d.minutes()}m`;
  };

  const columns: ColumnsType<NodeHealth> = [
    {
      title: "Node ID",
      dataIndex: "nodeId",
      key: "nodeId",
      render: (nodeId) => <code>{nodeId.substring(0, 12)}</code>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
        </Space>
      ),
    },
    {
      title: "CPU",
      key: "cpu",
      render: (_, record) => (
        <Progress
          percent={Math.round(record.metrics.cpu)}
          size="small"
          status={record.metrics.cpu > 80 ? "exception" : "normal"}
        />
      ),
    },
    {
      title: "Memory",
      key: "memory",
      render: (_, record) => (
        <Progress
          percent={Math.round(record.metrics.memory)}
          size="small"
          status={record.metrics.memory > 80 ? "exception" : "normal"}
        />
      ),
    },
    {
      title: "Disk",
      key: "disk",
      render: (_, record) => (
        <Progress
          percent={Math.round(record.metrics.disk)}
          size="small"
          status={record.metrics.disk > 80 ? "exception" : "normal"}
        />
      ),
    },
    {
      title: "Network",
      key: "network",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>
            In: {(record.metrics.network.bytesIn / 1024 / 1024).toFixed(2)} MB/s
          </span>
          <span>
            Out: {(record.metrics.network.bytesOut / 1024 / 1024).toFixed(2)}{" "}
            MB/s
          </span>
        </Space>
      ),
    },
    {
      title: "Uptime",
      dataIndex: "uptime",
      key: "uptime",
      render: (uptime) => formatUptime(uptime),
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (version) => <Tag>{version}</Tag>,
    },
    {
      title: "Last Heartbeat",
      dataIndex: "lastHeartbeat",
      key: "lastHeartbeat",
      render: (heartbeat) => dayjs(heartbeat).fromNow(),
    },
  ];

  // Calculate overall health
  const healthyNodes = nodeHealth.filter((n) => n.status === "healthy").length;
  const totalNodes = nodeHealth.length;
  const overallHealth = totalNodes > 0 ? (healthyNodes / totalNodes) * 100 : 0;

  // Calculate average metrics
  const avgCpu =
    nodeHealth.reduce((sum, n) => sum + n.metrics.cpu, 0) /
    (nodeHealth.length || 1);
  const avgMemory =
    nodeHealth.reduce((sum, n) => sum + n.metrics.memory, 0) /
    (nodeHealth.length || 1);
  const avgDisk =
    nodeHealth.reduce((sum, n) => sum + n.metrics.disk, 0) /
    (nodeHealth.length || 1);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <MeshTopologyPanel />
      <MeshResilienceSLOPanel />
      <MeshResilienceTimelinePanel limit={80} refreshIntervalMs={5000} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <h3>Overall System Health</h3>
              <Progress
                type="circle"
                percent={Math.round(overallHealth)}
                status={
                  overallHealth >= 90
                    ? "success"
                    : overallHealth >= 70
                      ? "normal"
                      : "exception"
                }
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": overallHealth >= 90 ? "#87d068" : "#f5222d",
                }}
              />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Total Nodes">
                  {totalNodes}
                </Descriptions.Item>
                <Descriptions.Item label="Healthy Nodes">
                  {healthyNodes}
                </Descriptions.Item>
                <Descriptions.Item label="Degraded Nodes">
                  {nodeHealth.filter((n) => n.status === "degraded").length}
                </Descriptions.Item>
                <Descriptions.Item label="Offline Nodes">
                  {nodeHealth.filter((n) => n.status === "offline").length}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Average Resource Usage">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: "center" }}>
                  <h4>CPU Usage</h4>
                  <Progress
                    type="dashboard"
                    percent={Math.round(avgCpu)}
                    status={avgCpu > 80 ? "exception" : "normal"}
                  />
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: "center" }}>
                  <h4>Memory Usage</h4>
                  <Progress
                    type="dashboard"
                    percent={Math.round(avgMemory)}
                    status={avgMemory > 80 ? "exception" : "normal"}
                  />
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: "center" }}>
                  <h4>Disk Usage</h4>
                  <Progress
                    type="dashboard"
                    percent={Math.round(avgDisk)}
                    status={avgDisk > 80 ? "exception" : "normal"}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="Node Health Status">
        <Table
          columns={columns}
          dataSource={nodeHealth}
          rowKey="nodeId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </Space>
  );
};

export default SystemHealth;
