import React from 'react';
import { Card, Table, Tag, message, Spin, Button, Modal, Form, Input, Select, Space, Popconfirm, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../../config/api';

interface UserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  organization: { id: string; name: string; slug: string } | null;
}

interface OrganizationOption {
  id: string;
  name: string;
}

const UsersPage: React.FC = () => {
  const [data, setData] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [organizations, setOrganizations] = React.useState<OrganizationOption[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchOrganizations = React.useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/organizations');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrganizations(res.data.data.map((org: any) => ({ id: org.id, name: org.name })));
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, []);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/admin/users');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      } else {
        message.error('Failed to load users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      const res = await api.post('/api/v1/admin/users', {
        email: values.email,
        password: values.password,
        role: values.role,
        organizationId: values.organizationId,
        isActive: values.isActive ?? true,
      });
      if (res.data?.success) {
        message.success('User created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchUsers();
      } else {
        message.error(res.data?.message || 'Failed to create user');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingUser) return;
    try {
      setSubmitting(true);
      const payload: any = {
        email: values.email,
        role: values.role,
        organizationId: values.organizationId,
        isActive: values.isActive,
      };
      if (values.password) {
        payload.password = values.password;
      }
      const res = await api.put(`/api/v1/admin/users/${editingUser.id}`, payload);
      if (res.data?.success) {
        message.success('User updated successfully');
        setEditModalVisible(false);
        setEditingUser(null);
        editForm.resetFields();
        fetchUsers();
      } else {
        message.error(res.data?.message || 'Failed to update user');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/api/v1/admin/users/${id}`);
      if (res.data?.success) {
        message.success('User deleted successfully');
        fetchUsers();
      } else {
        message.error(res.data?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openEditModal = (record: UserRow) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      email: record.email,
      role: record.role,
      organizationId: record.organization?.id,
      isActive: record.isActive,
      password: '',
    });
    setEditModalVisible(true);
  };

  const roleColors: Record<string, string> = {
    admin: 'red',
    editor: 'blue',
    viewer: 'default',
  };

  return (
    <Card
      title="Users"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add User
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={[
            { title: 'Email', dataIndex: 'email' },
            {
              title: 'Role',
              dataIndex: 'role',
              width: 100,
              render: (val: string) => (
                <Tag color={roleColors[val] || 'default'}>{val?.toUpperCase()}</Tag>
              ),
            },
            {
              title: 'Organization',
              dataIndex: ['organization', 'name'],
              render: (name: string) => name || '-',
            },
            {
              title: 'Status',
              dataIndex: 'isActive',
              width: 100,
              render: (val: boolean) => (
                <Tag color={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Tag>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 100,
              render: (_: any, record: UserRow) => (
                <Space size="small">
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                  <Popconfirm
                    title="Delete User"
                    description="Are you sure?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Delete"
                    okType="danger"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Spin>

      {/* Create User Modal */}
      <Modal
        title="Add User"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ role: 'viewer', isActive: true }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Minimum 6 characters" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="editor">Editor</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="organizationId" label="Organization">
            <Select placeholder="Select organization" allowClear>
              {organizations.map((org) => (
                <Select.Option key={org.id} value={org.id}>{org.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Create</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditingUser(null); editForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="password" label="New Password (leave blank to keep current)">
            <Input.Password placeholder="Leave blank to keep current" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="editor">Editor</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="organizationId" label="Organization">
            <Select placeholder="Select organization" allowClear>
              {organizations.map((org) => (
                <Select.Option key={org.id} value={org.id}>{org.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setEditModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UsersPage;
