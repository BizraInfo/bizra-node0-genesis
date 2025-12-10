import React from "react";
import {
  Layout,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Button,
  Typography,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuth } from "../hooks/useAuth";
import { useAppSelector } from "../store/store";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const alerts = useAppSelector((state) => state.validation.alerts);
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  
  // Observability State (Simple polling for demo)
  const [traceInfo, setTraceInfo] = React.useState<{id: string, agent: string} | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const tid = sessionStorage.getItem('last_trace_id');
      const aid = sessionStorage.getItem('last_agent_id');
      if (tid) setTraceInfo({ id: tid, agent: aid || 'unknown' });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: logout,
    },
  ];

  const notificationMenuItems: MenuProps["items"] =
    unacknowledgedAlerts.length > 0
      ? unacknowledgedAlerts.slice(0, 5).map((alert) => ({
          key: alert.id,
          label: (
            <div style={{ maxWidth: 250 }}>
              <Text strong>{alert.title}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {alert.message}
              </Text>
            </div>
          ),
        }))
      : [
          {
            key: "no-alerts",
            label: <Text type="secondary">No new alerts</Text>,
            disabled: true,
          },
        ];

  if (unacknowledgedAlerts.length > 5) {
    notificationMenuItems.push({
      type: "divider",
    });
    notificationMenuItems.push({
      key: "view-all",
      label: <Text strong>View all alerts</Text>,
    });
  }

  return (
    <AntHeader
      style={{
        padding: "0 24px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ fontSize: 16 }}
        />
        <Text strong style={{ fontSize: 18 }}>
          BIZRA Node-0 Dashboard
        </Text>
        {traceInfo && (
          <Space style={{ marginLeft: 16 }}>
            <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 12 }}>Agent: {traceInfo.agent}</Text>} />
            <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>Trace: {traceInfo.id.substring(0, 8)}...</Text>
          </Space>
        )}
      </Space>

      <Space size="large">
        <Dropdown
          menu={{ items: notificationMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Badge count={unacknowledgedAlerts.length} size="small">
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 20 }} />}
            />
          </Badge>
        </Dropdown>

        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Space style={{ cursor: "pointer" }}>
            <Avatar src={user?.avatar} icon={<UserOutlined />} />
            <div>
              <Text strong>{user?.fullName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user?.role}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
