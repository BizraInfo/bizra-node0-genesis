import React from "react";
import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ApiOutlined,
  HeartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { usePermissions } from "../hooks/usePermissions";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canCreateUser, canViewMetrics, canManageSystem } = usePermissions();

  const menuItems: MenuProps["items"] = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    canCreateUser && {
      key: "/users",
      icon: <UserOutlined />,
      label: "User Management",
    },
    {
      key: "/validation",
      icon: <CheckCircleOutlined />,
      label: "Validation Monitor",
    },
    canViewMetrics && {
      key: "/analytics",
      icon: <BarChartOutlined />,
      label: "Analytics",
    },
    {
      key: "/logs",
      icon: <FileTextOutlined />,
      label: "Logs Viewer",
    },
    {
      key: "/api-metrics",
      icon: <ApiOutlined />,
      label: "API Metrics",
    },
    {
      key: "/system-health",
      icon: <HeartOutlined />,
      label: "System Health",
    },
    {
      type: "divider",
    },
    canManageSystem && {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ].filter(Boolean) as MenuProps["items"];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
  };

  const selectedKey = location.pathname;

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: collapsed ? 16 : 20,
          fontWeight: "bold",
        }}
      >
        {collapsed ? "B0" : "BIZRA Node-0"}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;
