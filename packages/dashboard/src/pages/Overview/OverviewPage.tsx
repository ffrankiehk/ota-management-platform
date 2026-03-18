import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import {
  AppstoreOutlined,
  RocketOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../config/api';

interface OverviewData {
  applications: { total: number; active: number };
  releases: { total: number; active: number; draft: number };
  devices: { total: number };
  updates: {
    last24Hours: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
  };
  recentReleases: Array<{
    id: string;
    version: string;
    status: string;
    createdAt: string;
    application: { name: string; bundleId: string; platform: string } | null;
  }>;
}

const OverviewPage: React.FC = () => {
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchOverview = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/admin/overview');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        message.error('Failed to load overview data');
      }
    } catch (error: any) {
      console.error('Error fetching overview:', error);
      message.error('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <Card>No data available</Card>;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Applications"
              value={data.applications.total}
              prefix={<AppstoreOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>({data.applications.active} active)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Releases"
              value={data.releases.total}
              prefix={<RocketOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>({data.releases.active} active)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Devices"
              value={data.devices.total}
              prefix={<MobileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Update Success Rate (24h)"
              value={data.updates.last24Hours.successRate}
              suffix="%"
              valueStyle={{
                color: data.updates.last24Hours.successRate >= 90 ? '#52c41a' : data.updates.last24Hours.successRate >= 70 ? '#faad14' : '#ff4d4f',
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Updates (Last 24 Hours)">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total"
                  value={data.updates.last24Hours.total}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Successful"
                  value={data.updates.last24Hours.successful}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Failed"
                  value={data.updates.last24Hours.failed}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Releases (Last 7 Days)">
            <Table
              rowKey="id"
              dataSource={data.recentReleases}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'App',
                  dataIndex: ['application', 'name'],
                  render: (name: string) => name || '-',
                },
                { title: 'Version', dataIndex: 'version' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (val: string) => {
                    const colorMap: Record<string, string> = {
                      active: 'green',
                      draft: 'orange',
                      paused: 'gold',
                      archived: 'default',
                    };
                    return <Tag color={colorMap[val] || 'default'}>{val.toUpperCase()}</Tag>;
                  },
                },
                {
                  title: 'Created',
                  dataIndex: 'createdAt',
                  render: (val: string) => new Date(val).toLocaleDateString(),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewPage;
