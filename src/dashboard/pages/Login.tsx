import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Space,
  Checkbox,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { LoginRequest } from "../types/user.types";

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginRequest) => {
    const success = await login(values);
    if (success) {
      message.success("Login successful!");
    } else {
      message.error(error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card style={{ width: 400, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              BIZRA Node-0
            </Title>
            <Text type="secondary">Admin Dashboard</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="admin@bizra.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item name="rememberMe" valuePropName="checked">
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isLoading}
              >
                Login
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Link to="/forgot-password">
                <Text type="secondary">Forgot password?</Text>
              </Link>
            </div>
          </Form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text type="secondary">
              Don't have an account? <Link to="/register">Register</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
