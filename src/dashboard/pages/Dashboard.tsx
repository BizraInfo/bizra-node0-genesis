import React, { useEffect } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Space } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppSelector } from "../store/store";
import { useMetrics } from "../hooks/useMetrics";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ValidationEvent } from "../types/validation.types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Dashboard: React.FC = () => {
  const { dashboardStats } = useMetrics();
  const { subscribeToValidations, subscribeToSystemHealth } = useWebSocket();
  const recentValidations = useAppSelector((state) =>
    state.validation.validations.slice(0, 10),
  );

  useEffect(() => {
    const unsubscribeValidations = subscribeToValidations();
    const unsubscribeHealth = subscribeToSystemHealth();

    return () => {
      unsubscribeValidations();
      unsubscribeHealth();
    };
  }, [subscribeToValidations, subscribeToSystemHealth]);

  const columns: ColumnsType<ValidationEvent> = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors: Record<string, string> = {
          success: "green",
          failed: "red",
          pending: "orange",
          validating: "blue",
          timeout: "volcano",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Node ID",
      dataIndex: "nodeId",
      key: "nodeId",
      render: (nodeId) => <code>{nodeId.substring(0, 8)}...</code>,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration) => `${duration}ms`,
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp) => dayjs(timestamp).fromNow(),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={dashboardStats?.totalTransactions || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Nodes"
              value={dashboardStats?.activeNodes || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Validation Success"
              value={dashboardStats?.validationSuccess || 0}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={dashboardStats?.avgResponseTime || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Validations" bordered={false}>
            <Table
              columns={columns}
              dataSource={recentValidations}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="System Health" bordered={false}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Statistic
                title="Overall Health"
                value={dashboardStats?.systemHealth || 0}
                suffix="%"
                valueStyle={{
                  color:
                    (dashboardStats?.systemHealth || 0) >= 90
                      ? "#52c41a"
                      : (dashboardStats?.systemHealth || 0) >= 70
                        ? "#faad14"
                        : "#f5222d",
                }}
              />
              <Statistic
                title="Active Alerts"
                value={dashboardStats?.alertsCount || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#f5222d" }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Dashboard;
