import React from 'react';
import { Card, Table, message, Spin, Button, Modal, Form, Input, Space, Popconfirm, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
import { api } from '../../config/api';

const { Text } = Typography;

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  apiKey: string | null;
  appCount: number;
  userCount: number;
  createdAt: string;
}

const OrganizationsPage: React.FC = () => {
  const [data, setData] = React.useState<OrganizationRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingOrg, setEditingOrg] = React.useState<OrganizationRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [apiKeyModalVisible, setApiKeyModalVisible] = React.useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchOrganizations = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/admin/organizations');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      } else {
        message.error('Failed to load organizations');
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      message.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      const res = await api.post('/api/v1/admin/organizations', {
        name: values.name,
        slug: values.slug,
      });
      if (res.data?.success) {
        message.success('Organization created successfully');
        setModalVisible(false);
        form.resetFields();
        // Show the new API key
        if (res.data.data?.apiKey) {
          setNewApiKey(res.data.data.apiKey);
          setApiKeyModalVisible(true);
        }
        fetchOrganizations();
      } else {
        message.error(res.data?.message || 'Failed to create organization');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingOrg) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/api/v1/admin/organizations/${editingOrg.id}`, {
        name: values.name,
        slug: values.slug,
      });
      if (res.data?.success) {
        message.success('Organization updated successfully');
        setEditModalVisible(false);
        setEditingOrg(null);
        editForm.resetFields();
        fetchOrganizations();
      } else {
        message.error(res.data?.message || 'Failed to update organization');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/api/v1/admin/organizations/${id}`);
      if (res.data?.success) {
        message.success('Organization deleted successfully');
        fetchOrganizations();
      } else {
        message.error(res.data?.message || 'Failed to delete organization');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handleRegenerateApiKey = async (id: string) => {
    try {
      const res = await api.post(`/api/v1/admin/organizations/${id}/regenerate-api-key`);
      if (res.data?.success && res.data.data?.apiKey) {
        setNewApiKey(res.data.data.apiKey);
        setApiKeyModalVisible(true);
        fetchOrganizations();
      } else {
        message.error(res.data?.message || 'Failed to regenerate API key');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to regenerate API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const openEditModal = (record: OrganizationRow) => {
    setEditingOrg(record);
    editForm.setFieldsValue({
      name: record.name,
      slug: record.slug,
    });
    setEditModalVisible(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <Card
      title="Organizations"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add Organization
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            {
              title: 'Slug',
              dataIndex: 'slug',
              render: (val: string) => <Text code>{val}</Text>,
            },
            {
              title: 'API Key',
              dataIndex: 'apiKey',
              render: (val: string | null) => val ? <Text code>{val}</Text> : '-',
            },
            { title: 'Apps', dataIndex: 'appCount', width: 80 },
            { title: 'Users', dataIndex: 'userCount', width: 80 },
            {
              title: 'Actions',
              key: 'actions',
              width: 150,
              render: (_: any, record: OrganizationRow) => (
                <Space size="small">
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                  <Tooltip title="Regenerate API Key">
                    <Popconfirm
                      title="Regenerate API Key"
                      description="This will invalidate the current API key. Continue?"
                      onConfirm={() => handleRegenerateApiKey(record.id)}
                      okText="Regenerate"
                    >
                      <Button type="text" icon={<KeyOutlined />} />
                    </Popconfirm>
                  </Tooltip>
                  <Popconfirm
                    title="Delete Organization"
                    description="Are you sure? This cannot be undone."
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

      {/* Create Organization Modal */}
      <Modal
        title="Add Organization"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input
              placeholder="My Company"
              onChange={(e) => form.setFieldValue('slug', generateSlug(e.target.value))}
            />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true },
              { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens' },
            ]}
          >
            <Input placeholder="my-company" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Create</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        title="Edit Organization"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditingOrg(null); editForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="My Company" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true },
              { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens' },
            ]}
          >
            <Input placeholder="my-company" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setEditModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* API Key Modal */}
      <Modal
        title="API Key Generated"
        open={apiKeyModalVisible}
        onCancel={() => { setApiKeyModalVisible(false); setNewApiKey(null); }}
        footer={[
          <Button key="close" onClick={() => { setApiKeyModalVisible(false); setNewApiKey(null); }}>
            Close
          </Button>,
        ]}
      >
        <p style={{ marginBottom: 16 }}>
          <strong>Important:</strong> Copy this API key now. You won't be able to see it again!
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input.TextArea
            value={newApiKey || ''}
            readOnly
            autoSize={{ minRows: 2 }}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => newApiKey && copyToClipboard(newApiKey)}
          >
            Copy
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default OrganizationsPage;
