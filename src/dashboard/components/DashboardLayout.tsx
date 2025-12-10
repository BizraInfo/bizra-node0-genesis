import React, { useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const { Content } = Layout;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        <Header collapsed={collapsed} onToggle={toggleSidebar} />
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "#f0f2f5",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
