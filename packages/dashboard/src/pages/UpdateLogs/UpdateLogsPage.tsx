import React from 'react';
import {
  Card,
  Table,
  Tag,
  message,
  Spin,
  Select,
  Row,
  Col,
  Statistic,
  DatePicker,
  Drawer,
  Button,
  Tooltip,
  Space,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../config/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface UpdateLogRow {
  id: string;
  status: string;
  errorMessage: string | null;
  downloadTimeMs: number | null;
  installTimeMs: number | null;
  deviceId: string;
  deviceInfo: any | null;
  installedAt: string | null;
  createdAt: string;
  release: {
    id: string;
    version: string;
    application: {
      id: string;
      name: string;
      bundleId: string;
    } | null;
  } | null;
}

interface ApplicationOption {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  downloading: number;
  successRate: number;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
};

const formatDuration = (ms: number | null): string => {
  if (ms === null || ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  started: { color: 'processing', icon: <SyncOutlined spin /> },
  downloaded: { color: 'processing', icon: <SyncOutlined /> },
  verified: { color: 'processing', icon: <CheckCircleOutlined /> },
  installed: { color: 'success', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', icon: <CloseCircleOutlined /> },
  pending: { color: 'default', icon: <ClockCircleOutlined /> },
};

const UpdateLogsPage: React.FC = () => {
  const [data, setData] = React.useState<UpdateLogRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [applications, setApplications] = React.useState<ApplicationOption[]>([]);
  const [selectedApp, setSelectedApp] = React.useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = React.useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = React.useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [deviceInfoOpen, setDeviceInfoOpen] = React.useState(false);
  const [deviceInfoRecord, setDeviceInfoRecord] = React.useState<UpdateLogRow | null>(null);
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

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/update-logs/stats', {
        params: { days: 7 },
      });
      if (res.data?.success && res.data.data) {
        setStats(res.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchLogs = React.useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: any = { page, limit: pagination.pageSize };
        if (selectedApp) params.applicationId = selectedApp;
        if (selectedStatus) params.status = selectedStatus;
        if (dateRange) {
          params.startDate = dateRange[0].startOf('day').toISOString();
          params.endDate = dateRange[1].endOf('day').toISOString();
        }

        const res = await api.get('/api/v1/admin/update-logs', { params });
        if (res.data?.success) {
          setData(res.data.data);
          setPagination((prev) => ({
            ...prev,
            current: res.data.pagination.page,
            total: res.data.pagination.total,
          }));
        } else {
          message.error('Failed to load update logs');
        }
      } catch (error: any) {
        console.error('Error fetching update logs:', error);
        message.error('Failed to load update logs');
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize, selectedApp, selectedStatus, dateRange]
  );

  React.useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  React.useEffect(() => {
    fetchLogs(1);
  }, [selectedApp, selectedStatus, dateRange]);

  const handleTableChange = (pag: any) => {
    fetchLogs(pag.current);
  };

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic title="Total Updates" value={stats.total} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Successful"
                value={stats.successful}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Failed"
                value={stats.failed}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={stats.successRate}
                suffix="%"
                valueStyle={{
                  color: stats.successRate >= 90 ? '#52c41a' : stats.successRate >= 70 ? '#faad14' : '#ff4d4f',
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Logs Table */}
      <Card
        title="Update Logs"
        extra={
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Select
              placeholder="Application"
              allowClear
              style={{ width: 160 }}
              value={selectedApp}
              onChange={setSelectedApp}
              options={applications.map((app) => ({ value: app.id, label: app.name }))}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'started', label: 'Started' },
                { value: 'downloaded', label: 'Downloaded' },
                { value: 'verified', label: 'Verified' },
                { value: 'installed', label: 'Installed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </div>
        }
      >
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            dataSource={data}
            tableLayout="fixed"
            scroll={{ x: 1500 }}
            pagination={{
              ...pagination,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} logs`,
            }}
            onChange={handleTableChange}
            columns={[
              {
                title: 'Status',
                dataIndex: 'status',
                width: 120,
                render: (val: string) => {
                  const config = statusConfig[val] || { color: 'default', icon: null };
                  return (
                    <Tag color={config.color} icon={config.icon}>
                      {val?.toUpperCase()}
                    </Tag>
                  );
                },
              },
              {
                title: 'Application',
                dataIndex: ['release', 'application', 'name'],
                width: 200,
                ellipsis: true,
                render: (name: string, record: UpdateLogRow) => (
                  <Space direction="vertical" size={0}>
                    <Text ellipsis style={{ maxWidth: 180 }} title={name || '-'}>{name || '-'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis title={record.release?.application?.bundleId || '-'}>{record.release?.application?.bundleId || '-'}</Text>
                  </Space>
                ),
              },
              {
                title: 'Version',
                dataIndex: ['release', 'version'],
                width: 120,
                ellipsis: true,
                render: (val: string) => <Text ellipsis title={val || '-'}>{val || '-'}</Text>,
              },
              {
                title: 'Device',
                dataIndex: 'deviceId',
                width: 200,
                ellipsis: true,
                render: (val: string) =>
                  val ? (
                    <Tooltip title={val}>
                      <Text style={{ fontFamily: 'monospace', fontSize: 11 }} ellipsis>{val}</Text>
                    </Tooltip>
                  ) : (
                    '-'
                  ),
              },
              {
                title: 'Platform',
                width: 90,
                render: () => '-',
              },
              {
                title: 'Download',
                dataIndex: 'downloadTimeMs',
                width: 110,
                render: (val: number | null) => formatDuration(val),
              },
              {
                title: 'Install',
                dataIndex: 'installTimeMs',
                width: 110,
                render: (val: number | null) => formatDuration(val),
              },
              {
                title: 'Installed At',
                dataIndex: 'installedAt',
                width: 170,
                render: (val: string | null) => formatDate(val),
              },
              {
                title: 'Time',
                dataIndex: 'createdAt',
                width: 170,
                render: (val: string) => formatDate(val),
              },
              {
                title: 'Device Info',
                key: 'deviceInfo',
                width: 120,
                render: (_: any, record: UpdateLogRow) => (
                  <Button
                    size="small"
                    disabled={!record.deviceInfo}
                    onClick={() => {
                      setDeviceInfoRecord(record);
                      setDeviceInfoOpen(true);
                    }}
                  >
                    View
                  </Button>
                ),
              },
              {
                title: 'Error',
                dataIndex: 'errorMessage',
                width: 260,
                ellipsis: { showTitle: false },
                render: (val: string | null) =>
                  val ? (
                    <Tooltip title={val}>
                      <Text style={{ color: '#ff4d4f' }} ellipsis>{val}</Text>
                    </Tooltip>
                  ) : (
                    '-'
                  ),
              },
            ]}
          />
        </Spin>
      </Card>

      <Drawer
        title="Device Info"
        open={deviceInfoOpen}
        width={520}
        onClose={() => {
          setDeviceInfoOpen(false);
          setDeviceInfoRecord(null);
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text type="secondary">Device ID</Text>
            <div>
              <Text style={{ fontFamily: 'monospace' }}>{deviceInfoRecord?.deviceId || '-'}</Text>
            </div>
          </div>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              overflow: 'auto',
              maxHeight: 520,
            }}
          >
            {JSON.stringify(deviceInfoRecord?.deviceInfo ?? null, null, 2)}
          </pre>
        </Space>
      </Drawer>
    </div>
  );
};

export default UpdateLogsPage;
