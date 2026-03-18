import React from 'react';
import { Card, Table, Tag, message, Spin, Button, Popconfirm, Select } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
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

  React.useEffect(() => {
    fetchApplications();
    fetchDevices(1, selectedApp);
  }, []);

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

  const handleRefresh = () => {
    fetchDevices(pagination.current, selectedApp);
  };

  return (
    <Card
      title="Devices"
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
          columns={[
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
          ]}
        />
      </Spin>
    </Card>
  );
};

export default DevicesPage;
