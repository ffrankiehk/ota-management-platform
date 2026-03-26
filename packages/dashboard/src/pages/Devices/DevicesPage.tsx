import React from 'react';
import { Card, Table, Tag, message, Spin, Button, Popconfirm, Select, Tabs, Modal, Form, Input, Space } from 'antd';
import { DeleteOutlined, ReloadOutlined, PlusOutlined, TeamOutlined, MobileOutlined } from '@ant-design/icons';
import { api } from '../../config/api';

interface DeviceRow {
  id: string;
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  bundleVersion: string;
  lastSeenAt: string;
  lastUpdateStatus?: string | null;
  lastUpdateAt?: string | null;
  lastReleaseVersion?: string | null;
  createdAt: string;
  application: {
    id: string;
    name: string;
    bundleId: string;
    platform: string;
  } | null;
}

interface ApplicationOption {
  id: string;
  name: string;
}

interface TestGroup {
  id: string;
  name: string;
  description?: string;
  deviceIds: string[];
  applicationId: string;
  application?: { name: string };
  createdAt: string;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

const renderUpdateStatus = (status?: string | null) => {
  if (!status) return '-';
  const colorMap: Record<string, string> = {
    started: 'processing',
    downloaded: 'processing',
    verified: 'processing',
    installed: 'success',
    failed: 'error',
  };
  return <Tag color={colorMap[status] || 'default'}>{status.toUpperCase()}</Tag>;
};

const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const DevicesPage: React.FC = () => {
  const [data, setData] = React.useState<DeviceRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [applications, setApplications] = React.useState<ApplicationOption[]>([]);
  const [selectedApp, setSelectedApp] = React.useState<string | undefined>(undefined);
  const [groups, setGroups] = React.useState<TestGroup[]>([]);
  const [groupLoading, setGroupLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [form] = Form.useForm();
  
  const [pagination, setPagination] = React.useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchApplications = React.useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/applications');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setApplications(
          res.data.data.map((app: any) => ({ id: app.id, name: app.name }))
        );
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, []);

  const fetchDevices = React.useCallback(async (page = 1, appId?: string) => {
    try {
      setLoading(true);
      const params: any = { page, limit: pagination.pageSize };
      if (appId) params.applicationId = appId;

      const res = await api.get('/api/v1/admin/devices', { params });
      if (res.data?.success) {
        setData(res.data.data);
        setPagination((prev) => ({
          ...prev,
          current: res.data.pagination.page,
          total: res.data.pagination.total,
        }));
      } else {
        message.error('Failed to load devices');
      }
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      message.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  const fetchGroups = React.useCallback(async () => {
    try {
      setGroupLoading(true);
      const res = await api.get('/api/v1/admin/test-groups');
      if (res.data?.success) {
        setGroups(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setGroupLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApplications();
    fetchDevices(1, selectedApp);
    fetchGroups();
  }, []);

  const handleCreateGroup = async (values: any) => {
    try {
      const deviceIds = values.deviceIds.split('\n').map((id: string) => id.trim()).filter(Boolean);
      const res = await api.post('/api/v1/admin/test-groups', {
        ...values,
        deviceIds,
      });
      if (res.data?.success) {
        message.success('Group created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchGroups();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await api.delete(`/api/v1/admin/test-groups/${id}`);
      if (res.data?.success) {
        message.success('Group deleted');
        fetchGroups();
      }
    } catch (error) {
      message.error('Failed to delete group');
    }
  };

  const deviceColumns = [
    {
      title: 'Device ID',
      dataIndex: 'deviceId',
      width: 200,
      ellipsis: true,
      render: (val: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{val}</span>
      ),
    },
    {
      title: 'Application',
      dataIndex: ['application', 'name'],
      width: 220,
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'ios' ? 'blue' : val === 'android' ? 'green' : 'default'}>
          {val?.toUpperCase() || '-'}
        </Tag>
      ),
    },
    {
      title: 'OS Version',
      dataIndex: 'osVersion',
      width: 100,
    },
    {
      title: 'App Version',
      dataIndex: 'appVersion',
      width: 100,
    },
    {
      title: 'Bundle Version',
      dataIndex: 'bundleVersion',
      width: 120,
    },
    {
      title: 'Last Update',
      dataIndex: 'lastUpdateStatus',
      width: 120,
      render: (val: string | null) => renderUpdateStatus(val),
    },
    {
      title: 'Last Release',
      dataIndex: 'lastReleaseVersion',
      width: 120,
      ellipsis: true,
      render: (val: string | null) => val || '-',
    },
    {
      title: 'Updated',
      dataIndex: 'lastUpdateAt',
      width: 160,
      render: (val: string | null) => (
        <span title={formatDate(val)}>{formatRelativeTime(val)}</span>
      ),
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      width: 120,
      render: (val: string) => (
        <span title={formatDate(val)}>{formatRelativeTime(val)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: DeviceRow) => (
        <Popconfirm
          title="Delete Device"
          description="Are you sure you want to delete this device?"
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          okType="danger"
          cancelText="Cancel"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const handleTableChange = (pag: any) => {
    fetchDevices(pag.current, selectedApp);
  };

  const handleAppFilter = (value: string | undefined) => {
    setSelectedApp(value);
    fetchDevices(1, value);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/api/v1/admin/devices/${id}`);
      if (res.data?.success) {
        message.success('Device deleted successfully');
        fetchDevices(pagination.current, selectedApp);
      } else {
        message.error(res.data?.message || 'Failed to delete device');
      }
    } catch (error: any) {
      console.error('Error deleting device:', error);
      message.error(error.response?.data?.message || 'Failed to delete device');
    }
  };

  const groupColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Application', dataIndex: ['application', 'name'], key: 'appName' },
    { title: 'Devices', dataIndex: 'deviceIds', key: 'devices', render: (ids: string[]) => ids.length },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (val: string) => formatDate(val) },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TestGroup) => (
        <Popconfirm title="Delete Group?" onConfirm={() => handleDeleteGroup(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Tabs
        type="card"
        items={[
          {
            key: 'devices',
            label: <span><MobileOutlined />Devices</span>,
            children: (
              <Card
                extra={
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Select
                      placeholder="Filter by Application"
                      allowClear
                      style={{ width: 200 }}
                      value={selectedApp}
                      onChange={handleAppFilter}
                      options={applications.map((app) => ({ value: app.id, label: app.name }))}
                    />
                    <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                      Refresh
                    </Button>
                  </div>
                }
              >
                <Spin spinning={loading}>
                  <Table
                    rowKey="id"
                    dataSource={data}
                    tableLayout="fixed"
                    scroll={{ x: 1400 }}
                    pagination={{
                      ...pagination,
                      showSizeChanger: false,
                      showTotal: (total) => `Total ${total} devices`,
                    }}
                    onChange={handleTableChange}
                    columns={deviceColumns}
                  />
                </Spin>
              </Card>
            ),
          },
          {
            key: 'groups',
            label: <span><TeamOutlined />Test Groups</span>,
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Create New Group
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  loading={groupLoading}
                  dataSource={groups}
                  columns={groupColumns}
                />
              </Card>
            ),
          },
        ]}
      />
      <Modal
        title="Create New Test Group"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: 'Please enter group name' }]}
          >
            <Input placeholder="e.g. Internal Testers" />
          </Form.Item>
          <Form.Item
            name="applicationId"
            label="Application"
            rules={[{ required: true, message: 'Please select an application' }]}
          >
            <Select
              options={applications.map((app) => ({ value: app.id, label: app.name }))}
              placeholder="Select application"
            />
          </Form.Item>
          <Form.Item
            name="deviceIds"
            label="Device IDs (One per line)"
            rules={[{ required: true, message: 'Please enter at least one Device ID' }]}
          >
            <Input.TextArea rows={6} placeholder="Paste Device IDs here..." />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional group description" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DevicesPage;
