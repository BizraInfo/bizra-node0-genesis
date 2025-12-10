import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  setSelectedUser,
} from "../store/user.slice";
import { usePermissions } from "../hooks/usePermissions";
import type { User, UserRole, UserStatus } from "../types/user.types";
import dayjs from "dayjs";

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, pagination, isLoading } = useAppSelector(
    (state) => state.user,
  );
  const { canCreateUser, canUpdateUser, canDeleteUser } = usePermissions();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      message.success("User deleted successfully");
    } catch (error: any) {
      message.error(error || "Failed to delete user");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await dispatch(
          updateUser({ userId: editingUser.id, data: values }),
        ).unwrap();
        message.success("User updated successfully");
      } else {
        await dispatch(createUser(values)).unwrap();
        message.success("User created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      dispatch(fetchUsers({ page: pagination.page, limit: pagination.limit }));
    } catch (error: any) {
      if (error.errorFields) {
        return; // Validation error
      }
      message.error(error || "Failed to save user");
    }
  };

  const handleSearch = () => {
    dispatch(
      fetchUsers({ search: searchText, page: 1, limit: pagination.limit }),
    );
  };

  const handleTableChange = (newPagination: any) => {
    dispatch(
      fetchUsers({
        page: newPagination.current,
        limit: newPagination.pageSize,
        search: searchText,
      }),
    );
  };

  const columns: ColumnsType<User> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: true,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: UserRole) => {
        const colors: Record<UserRole, string> = {
          admin: "red",
          moderator: "orange",
          user: "blue",
          viewer: "default",
        };
        return <Tag color={colors[role]}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: UserStatus) => {
        const colors: Record<UserStatus, string> = {
          active: "green",
          inactive: "default",
          suspended: "red",
          pending: "orange",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: User) => (
        <Space size="small">
          {canUpdateUser && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            >
              Edit
            </Button>
          )}
          {canDeleteUser && (
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 300 }}
            />
            <Button icon={<SearchOutlined />} onClick={handleSearch}>
              Search
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchUsers({ page: 1, limit: 10 }))}
            >
              Refresh
            </Button>
          </Space>
        </Col>
        <Col>
          {canCreateUser && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          )}
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter username" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter valid email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select role" }]}
          >
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="moderator">Moderator</Select.Option>
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="suspended">Suspended</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
