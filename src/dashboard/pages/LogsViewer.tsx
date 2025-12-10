import React, { useEffect, useState, useRef } from "react";
import { Card, Table, Tag, Select, Input, Space, Button, Switch } from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppSelector } from "../store/store";
import { useWebSocket } from "../hooks/useWebSocket";
import type { LogEntry } from "../types/validation.types";
import dayjs from "dayjs";

const LogsViewer: React.FC = () => {
  const logs = useAppSelector((state) => state.validation.logs);
  const { subscribeToLogs } = useWebSocket();

  const [filteredLevel, setFilteredLevel] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLogs();
    return () => unsubscribe();
  }, [subscribeToLogs]);

  useEffect(() => {
    if (autoScroll && tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filteredLevel !== "all" && log.level !== filteredLevel) return false;
    if (
      searchText &&
      !log.message.toLowerCase().includes(searchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      debug: "default",
      info: "blue",
      warn: "orange",
      error: "red",
      fatal: "volcano",
    };
    return colors[level] || "default";
  };

  const columns: ColumnsType<LogEntry> = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp) => dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: 100,
      render: (level) => (
        <Tag color={getLevelColor(level)}>{level.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 150,
      render: (source) => <code>{source}</code>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
    {
      title: "Metadata",
      dataIndex: "metadata",
      key: "metadata",
      width: 100,
      render: (metadata) =>
        metadata ? (
          <Button size="small" type="link">
            View
          </Button>
        ) : (
          "-"
        ),
    },
  ];

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Level", "Source", "Message", "Metadata"],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.level,
        log.source,
        log.message,
        JSON.stringify(log.metadata || {}),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${dayjs().format("YYYY-MM-DD-HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="System Logs"
      extra={
        <Space>
          <span>Auto-scroll:</span>
          <Switch checked={autoScroll} onChange={setAutoScroll} />

          <Select
            style={{ width: 120 }}
            value={filteredLevel}
            onChange={setFilteredLevel}
            placeholder="Log Level"
          >
            <Select.Option value="all">All Levels</Select.Option>
            <Select.Option value="debug">Debug</Select.Option>
            <Select.Option value="info">Info</Select.Option>
            <Select.Option value="warn">Warning</Select.Option>
            <Select.Option value="error">Error</Select.Option>
            <Select.Option value="fatal">Fatal</Select.Option>
          </Select>

          <Input
            style={{ width: 200 }}
            placeholder="Search logs..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Button icon={<ClearOutlined />} onClick={() => setSearchText("")}>
            Clear
          </Button>

          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        </Space>
      }
    >
      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} logs`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>
    </Card>
  );
};

export default LogsViewer;
