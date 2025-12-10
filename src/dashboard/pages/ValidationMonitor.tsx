import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppSelector } from "../store/store";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMetrics } from "../hooks/useMetrics";
import type {
  ValidationEvent,
  ValidationType,
  ValidationStatus,
} from "../types/validation.types";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const ValidationMonitor: React.FC = () => {
  const validations = useAppSelector((state) => state.validation.validations);
  const { validationMetrics } = useMetrics();
  const { subscribeToValidations } = useWebSocket();

  const [filteredType, setFilteredType] = useState<ValidationType | "all">(
    "all",
  );
  const [filteredStatus, setFilteredStatus] = useState<
    ValidationStatus | "all"
  >("all");

  useEffect(() => {
    const unsubscribe = subscribeToValidations();
    return () => unsubscribe();
  }, [subscribeToValidations]);

  const filteredValidations = validations.filter((v) => {
    if (filteredType !== "all" && v.type !== filteredType) return false;
    if (filteredStatus !== "all" && v.status !== filteredStatus) return false;
    return true;
  });

  const columns: ColumnsType<ValidationEvent> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id) => <code>{id.substring(0, 8)}</code>,
    },
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
        const config: Record<
          ValidationStatus,
          { color: string; icon: React.ReactNode }
        > = {
          success: { color: "green", icon: <CheckCircleOutlined /> },
          failed: { color: "red", icon: <CloseCircleOutlined /> },
          pending: { color: "orange", icon: <ClockCircleOutlined /> },
          validating: { color: "blue", icon: <ClockCircleOutlined /> },
          timeout: { color: "volcano", icon: <CloseCircleOutlined /> },
        };
        return (
          <Tag color={config[status].color} icon={config[status].icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Node ID",
      dataIndex: "nodeId",
      key: "nodeId",
      render: (nodeId) => <code>{nodeId.substring(0, 12)}</code>,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      sorter: (a, b) => a.duration - b.duration,
      render: (duration) => `${duration}ms`,
    },
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      render: (txId) => (txId ? <code>{txId.substring(0, 12)}...</code> : "-"),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      render: (timestamp) => dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Error",
      dataIndex: "errorMessage",
      key: "errorMessage",
      render: (error) => (error ? <Tag color="red">{error}</Tag> : "-"),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Validations"
              value={validationMetrics?.totalValidations || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Success Rate"
              value={(validationMetrics?.successRate || 0) * 100}
              suffix="%"
              precision={2}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Avg Time"
              value={validationMetrics?.averageTime || 0}
              suffix="ms"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Validation Events"
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              value={filteredType}
              onChange={setFilteredType}
              placeholder="Filter by type"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="transaction">Transaction</Select.Option>
              <Select.Option value="block">Block</Select.Option>
              <Select.Option value="contract">Contract</Select.Option>
              <Select.Option value="signature">Signature</Select.Option>
              <Select.Option value="consensus">Consensus</Select.Option>
            </Select>

            <Select
              style={{ width: 150 }}
              value={filteredStatus}
              onChange={setFilteredStatus}
              placeholder="Filter by status"
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="success">Success</Select.Option>
              <Select.Option value="failed">Failed</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="validating">Validating</Select.Option>
              <Select.Option value="timeout">Timeout</Select.Option>
            </Select>

            <RangePicker showTime />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredValidations}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} validations`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </Space>
  );
};

export default ValidationMonitor;
