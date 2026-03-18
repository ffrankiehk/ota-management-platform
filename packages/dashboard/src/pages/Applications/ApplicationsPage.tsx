import React from 'react';
import { Card, Table, Tag, message, Spin, Button, Modal, Form, Input, Select, Space, Popconfirm } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../../config/api';

interface ApplicationRow {
  id: string;
  name: string;
  bundleId: string;
  platform: string;
  currentVersion: string | null;
  isActive: boolean;
}

const ApplicationsPage: React.FC = () => {
  const [data, setData] = React.useState<ApplicationRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingApp, setEditingApp] = React.useState<ApplicationRow | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/admin/applications');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows: ApplicationRow[] = res.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          bundleId: item.bundleId,
          platform: item.platform,
          currentVersion: item.currentVersion || item.latestRelease?.version || '-',
          isActive: item.isActive,
        }));
        setData(rows);
      } else {
        message.error('Failed to load applications');
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleCreateApplication = async (values: any) => {
    try {
      setCreating(true);
      const res = await api.post('/api/v1/admin/applications', {
        name: values.name,
        bundleId: values.bundleId,
        platform: values.platform,
      });
      if (res.data?.success) {
        message.success('Application created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchApplications();
      } else {
        message.error(res.data?.message || 'Failed to create application');
      }
    } catch (error: any) {
      console.error('Error creating application:', error);
      message.error(error.response?.data?.message || 'Failed to create application');
    } finally {
      setCreating(false);
    }
  };

  const handleEditApplication = async (values: any) => {
    if (!editingApp) return;
    try {
      setCreating(true);
      const res = await api.put(`/api/v1/admin/applications/${editingApp.id}`, {
        name: values.name,
        bundleId: values.bundleId,
        platform: values.platform,
        isActive: values.isActive,
      });
      if (res.data?.success) {
        message.success('Application updated successfully');
        setEditModalVisible(false);
        setEditingApp(null);
        editForm.resetFields();
        fetchApplications();
      } else {
        message.error(res.data?.message || 'Failed to update application');
      }
    } catch (error: any) {
      console.error('Error updating application:', error);
      message.error(error.response?.data?.message || 'Failed to update application');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      const res = await api.delete(`/api/v1/admin/applications/${id}`);
      if (res.data?.success) {
        message.success('Application deleted successfully');
        fetchApplications();
      } else {
        message.error(res.data?.message || 'Failed to delete application');
      }
    } catch (error: any) {
      console.error('Error deleting application:', error);
      message.error(error.response?.data?.message || 'Failed to delete application');
    }
  };

  const openEditModal = (record: ApplicationRow) => {
    setEditingApp(record);
    editForm.setFieldsValue({
      name: record.name,
      bundleId: record.bundleId,
      platform: record.platform,
      isActive: record.isActive,
    });
    setEditModalVisible(true);
  };

  return (
    <Card
      title="Applications"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Create Application
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              render: (name: string, record: ApplicationRow) => (
                <Link to={`/applications/${record.id}`}>{name}</Link>
              ),
            },
            { title: 'Bundle ID', dataIndex: 'bundleId' },
            {
              title: 'Platform',
              dataIndex: 'platform',
              render: (val: string) => (
                <Tag color={val === 'ios' ? 'blue' : val === 'android' ? 'green' : 'purple'}>
                  {val.toUpperCase()}
                </Tag>
              ),
            },
            { title: 'Current Version', dataIndex: 'currentVersion' },
            {
              title: 'Status',
              dataIndex: 'isActive',
              render: (val: boolean) => (
                <Tag color={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Tag>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 120,
              render: (_: any, record: ApplicationRow) => (
                <Space size="small">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(record)}
                  />
                  <Popconfirm
                    title="Delete Application"
                    description="Are you sure? This will also delete all releases."
                    onConfirm={() => handleDeleteApplication(record.id)}
                    okText="Delete"
                    okType="danger"
                    cancelText="Cancel"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Spin>

      {/* Create Application Modal */}
      <Modal
        title="Create New Application"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateApplication}
          initialValues={{ platform: 'ios' }}
        >
          <Form.Item
            name="name"
            label="Application Name"
            rules={[{ required: true, message: 'Please enter application name' }]}
          >
            <Input placeholder="e.g., My Awesome App" />
          </Form.Item>

          <Form.Item
            name="bundleId"
            label="Bundle ID"
            rules={[
              { required: true, message: 'Please enter bundle ID' },
              {
                pattern: /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i,
                message: 'Invalid bundle ID format (e.g., com.company.app)',
              },
            ]}
          >
            <Input placeholder="e.g., com.company.myapp" />
          </Form.Item>

          <Form.Item
            name="platform"
            label="Platform"
            rules={[{ required: true, message: 'Please select platform' }]}
          >
            <Select>
              <Select.Option value="ios">iOS</Select.Option>
              <Select.Option value="android">Android</Select.Option>
              <Select.Option value="both">Both</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Create Application
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Application Modal */}
      <Modal
        title="Edit Application"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingApp(null);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditApplication}>
          <Form.Item
            name="name"
            label="Application Name"
            rules={[{ required: true, message: 'Please enter application name' }]}
          >
            <Input placeholder="e.g., My Awesome App" />
          </Form.Item>

          <Form.Item
            name="bundleId"
            label="Bundle ID"
            rules={[
              { required: true, message: 'Please enter bundle ID' },
              {
                pattern: /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i,
                message: 'Invalid bundle ID format (e.g., com.company.app)',
              },
            ]}
          >
            <Input placeholder="e.g., com.company.myapp" />
          </Form.Item>

          <Form.Item
            name="platform"
            label="Platform"
            rules={[{ required: true, message: 'Please select platform' }]}
          >
            <Select>
              <Select.Option value="ios">iOS</Select.Option>
              <Select.Option value="android">Android</Select.Option>
              <Select.Option value="both">Both</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Status">
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setEditModalVisible(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ApplicationsPage;
