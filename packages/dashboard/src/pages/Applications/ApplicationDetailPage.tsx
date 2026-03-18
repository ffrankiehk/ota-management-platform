import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Spin,
  message,
  Button,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Space,
  Popconfirm,
  Upload,
  Progress,
  Drawer,
  Tooltip,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api } from '../../config/api';

const { Title } = Typography;
const { TextArea } = Input;

interface ReleaseRow {
  id: string;
  version: string;
  buildNumber: number;
  bundleUrl: string;
  bundleHash: string;
  bundleSize: number;
  minAppVersion: string | null;
  releaseNotes: string | null;
  rolloutPercentage: number;
  isMandatory: boolean;
  status: string;
  releasedAt: string | null;
  createdAt: string;
}

interface ApplicationDetail {
  id: string;
  name: string;
  bundleId: string;
  platform: string;
  isActive: boolean;
  currentVersion: string | null;
  createdAt: string;
  updatedAt: string;
  organization: { id: string; name: string; slug: string } | null;
  releases: ReleaseRow[];
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

interface UploadedFile {
  url: string;
  hash: string;
  size: number;
  filename: string;
}

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = React.useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>(undefined);
  const [releaseDetailOpen, setReleaseDetailOpen] = React.useState(false);
  const [selectedRelease, setSelectedRelease] = React.useState<ReleaseRow | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingRelease, setEditingRelease] = React.useState<ReleaseRow | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchApplication = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/admin/applications/${id}`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        message.error('Failed to load application');
      }
    } catch (error: any) {
      console.error('Error fetching application:', error);
      message.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadProgress(0);

      const res = await api.post('/api/v1/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        },
      });

      if (res.data?.success && res.data.data) {
        const { url, hash, size, filename } = res.data.data;
        setUploadedFile({ url, hash, size, filename });
        // Auto-fill form fields
        form.setFieldsValue({
          bundleUrl: url,
          bundleHash: hash,
          bundleSize: size,
        });
        message.success('Bundle uploaded successfully');
      } else {
        message.error('Failed to upload bundle');
      }
    } catch (error: any) {
      console.error('Error uploading bundle:', error);
      message.error(error.response?.data?.message || 'Failed to upload bundle');
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleCreateRelease = async (values: any) => {
    if (!id) return;
    try {
      setCreating(true);
      const res = await api.post(`/api/v1/admin/applications/${id}/releases`, {
        version: values.version,
        buildNumber: values.buildNumber,
        bundleUrl: values.bundleUrl,
        bundleHash: values.bundleHash,
        bundleSize: values.bundleSize,
        minAppVersion: values.minAppVersion,
        releaseNotes: values.releaseNotes,
        rolloutPercentage: values.rolloutPercentage || 0,
        isMandatory: values.isMandatory || false,
        status: values.status || 'draft',
      });
      if (res.data?.success) {
        message.success('Release created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchApplication(); // Refresh the list
      } else {
        message.error(res.data?.message || 'Failed to create release');
      }
    } catch (error: any) {
      console.error('Error creating release:', error);
      message.error(error.response?.data?.message || 'Failed to create release');
    } finally {
      setCreating(false);
    }
  };

  const handleEditRelease = async (values: any) => {
    if (!editingRelease) return;
    try {
      setCreating(true);
      const res = await api.put(`/api/v1/admin/releases/${editingRelease.id}`, {
        version: values.version,
        buildNumber: values.buildNumber,
        bundleUrl: values.bundleUrl,
        bundleHash: values.bundleHash,
        bundleSize: values.bundleSize,
        minAppVersion: values.minAppVersion,
        releaseNotes: values.releaseNotes,
        rolloutPercentage: values.rolloutPercentage || 0,
        isMandatory: values.isMandatory || false,
        status: values.status,
      });
      if (res.data?.success) {
        message.success('Release updated successfully');
        setEditModalVisible(false);
        setEditingRelease(null);
        editForm.resetFields();
        fetchApplication();
      } else {
        message.error(res.data?.message || 'Failed to update release');
      }
    } catch (error: any) {
      console.error('Error updating release:', error);
      message.error(error.response?.data?.message || 'Failed to update release');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRelease = async (releaseId: string) => {
    try {
      const res = await api.delete(`/api/v1/admin/releases/${releaseId}`);
      if (res.data?.success) {
        message.success('Release deleted successfully');
        fetchApplication();
      } else {
        message.error(res.data?.message || 'Failed to delete release');
      }
    } catch (error: any) {
      console.error('Error deleting release:', error);
      message.error(error.response?.data?.message || 'Failed to delete release');
    }
  };

  const openEditReleaseModal = (record: ReleaseRow) => {
    setEditingRelease(record);
    editForm.setFieldsValue({
      version: record.version,
      buildNumber: record.buildNumber,
      bundleUrl: record.bundleUrl,
      bundleHash: record.bundleHash,
      bundleSize: record.bundleSize,
      minAppVersion: record.minAppVersion,
      releaseNotes: record.releaseNotes,
      rolloutPercentage: record.rolloutPercentage,
      isMandatory: record.isMandatory,
      status: record.status,
    });
    setEditModalVisible(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p>Application not found</p>
        <Link to="/applications">
          <Button icon={<ArrowLeftOutlined />}>Back to Applications</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/applications">
          <Button icon={<ArrowLeftOutlined />}>Back to Applications</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>{data.name}</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Bundle ID">{data.bundleId}</Descriptions.Item>
          <Descriptions.Item label="Platform">
            <Tag color={data.platform === 'ios' ? 'blue' : data.platform === 'android' ? 'green' : 'purple'}>
              {data.platform.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={data.isActive ? 'success' : 'default'}>{data.isActive ? 'Active' : 'Inactive'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Current Version">{data.currentVersion || '-'}</Descriptions.Item>
          <Descriptions.Item label="Organization">{data.organization?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Created At">{formatDate(data.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Releases Table */}
      <Card
        title={`Releases (${data.releases.length})`}
        extra={
          <Space>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'paused', label: 'Paused' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Create Release
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={statusFilter ? data.releases.filter((r) => r.status === statusFilter) : data.releases}
          tableLayout="fixed"
          scroll={{ x: 1600 }}
          columns={[
            { title: 'Version', dataIndex: 'version', width: 120, ellipsis: true },
            { title: 'Build', dataIndex: 'buildNumber', width: 100 },
            {
              title: 'Size',
              dataIndex: 'bundleSize',
              width: 110,
              render: (val: number) => formatBytes(val),
            },
            {
              title: 'Bundle Hash',
              dataIndex: 'bundleHash',
              width: 180,
              ellipsis: { showTitle: false },
              render: (val: string) => (
                <Tooltip title={val}>
                  <Typography.Text ellipsis style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {val}
                  </Typography.Text>
                </Tooltip>
              ),
            },
            {
              title: 'Min App Ver',
              dataIndex: 'minAppVersion',
              width: 120,
              ellipsis: true,
              render: (val: string | null) => val || '-',
            },
            {
              title: 'Rollout',
              dataIndex: 'rolloutPercentage',
              width: 110,
              render: (val: number) => `${val}%`,
            },
            {
              title: 'Mandatory',
              dataIndex: 'isMandatory',
              width: 110,
              render: (val: boolean) => (val ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 110,
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
              title: 'Released At',
              dataIndex: 'releasedAt',
              width: 180,
              render: (val: string | null) => formatDate(val),
            },
            {
              title: 'Notes',
              key: 'releaseNotes',
              width: 100,
              render: (_: any, record: ReleaseRow) => (
                <Button
                  size="small"
                  disabled={!record.releaseNotes}
                  onClick={() => {
                    setSelectedRelease(record);
                    setReleaseDetailOpen(true);
                  }}
                >
                  View
                </Button>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 110,
              render: (_: any, record: ReleaseRow) => (
                <Space size="small">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEditReleaseModal(record)}
                  />
                  <Popconfirm
                    title="Delete Release"
                    description="Are you sure you want to delete this release?"
                    onConfirm={() => handleDeleteRelease(record.id)}
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
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Release Modal */}
      <Modal
        title="Create New Release"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setUploadedFile(null);
          setUploadProgress(0);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRelease}
          initialValues={{
            rolloutPercentage: 0,
            isMandatory: false,
            status: 'draft',
          }}
        >
          <Form.Item
            name="version"
            label="Version"
            rules={[
              { required: true, message: 'Please enter version' },
              { pattern: /^\d+\.\d+\.\d+$/, message: 'Version format: x.x.x (e.g., 1.2.0)' },
            ]}
          >
            <Input placeholder="e.g., 1.2.0" />
          </Form.Item>

          <Form.Item name="buildNumber" label="Build Number">
            <InputNumber min={1} placeholder="e.g., 10" style={{ width: '100%' }} />
          </Form.Item>

          {/* Bundle Upload Section */}
          <Form.Item label="Bundle File">
            <Upload.Dragger
              accept=".bundle,.js,.jsbundle,.zip"
              beforeUpload={handleUpload}
              showUploadList={false}
              disabled={uploading}
            >
              {uploading ? (
                <div style={{ padding: '20px 0' }}>
                  <Progress percent={uploadProgress} status="active" />
                  <p style={{ marginTop: 8 }}>Uploading...</p>
                </div>
              ) : uploadedFile ? (
                <div style={{ padding: '20px 0', color: '#52c41a' }}>
                  <CheckCircleOutlined style={{ fontSize: 32 }} />
                  <p style={{ marginTop: 8 }}>{uploadedFile.filename}</p>
                  <p style={{ color: '#666', fontSize: 12 }}>{formatBytes(uploadedFile.size)}</p>
                </div>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <p style={{ marginTop: 8 }}>Click or drag bundle file to upload</p>
                  <p style={{ color: '#666', fontSize: 12 }}>.bundle, .js, .jsbundle, .zip</p>
                </div>
              )}
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="bundleUrl"
            label="Bundle URL"
            rules={[{ required: true, message: 'Please upload a bundle or enter URL' }]}
          >
            <Input placeholder="Auto-filled after upload, or enter manually" />
          </Form.Item>

          <Form.Item
            name="bundleHash"
            label="Bundle Hash (SHA256)"
            rules={[{ required: true, message: 'Please upload a bundle or enter hash' }]}
          >
            <Input placeholder="Auto-filled after upload, or enter manually" />
          </Form.Item>

          <Form.Item
            name="bundleSize"
            label="Bundle Size (bytes)"
            rules={[{ required: true, message: 'Please upload a bundle or enter size' }]}
          >
            <InputNumber min={1} placeholder="Auto-filled after upload" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="minAppVersion" label="Minimum App Version">
            <Input placeholder="e.g., 1.0.0 (optional)" />
          </Form.Item>

          <Form.Item name="releaseNotes" label="Release Notes">
            <TextArea rows={3} placeholder="What's new in this release..." />
          </Form.Item>

          <Form.Item name="rolloutPercentage" label="Rollout Percentage">
            <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isMandatory" label="Mandatory Update" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="paused">Paused</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Create Release
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Release Modal */}
      <Modal
        title="Edit Release"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRelease(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditRelease}>
          <Form.Item
            name="version"
            label="Version"
            rules={[
              { required: true, message: 'Please enter version' },
              { pattern: /^\d+\.\d+\.\d+$/, message: 'Version format: x.x.x (e.g., 1.2.0)' },
            ]}
          >
            <Input placeholder="e.g., 1.2.0" />
          </Form.Item>

          <Form.Item name="buildNumber" label="Build Number">
            <InputNumber min={1} placeholder="e.g., 10" style={{ width: '100%' }} />
          </Form.Item>

          {/* Bundle Upload Section */}
          <Form.Item label="Re-upload Bundle File (Optional)">
            <Upload.Dragger
              accept=".bundle,.js,.jsbundle,.zip"
              beforeUpload={handleUpload}
              showUploadList={false}
              disabled={uploading}
            >
              {uploading ? (
                <div style={{ padding: '20px 0' }}>
                  <Progress percent={uploadProgress} status="active" />
                  <p style={{ marginTop: 8 }}>Uploading...</p>
                </div>
              ) : uploadedFile ? (
                <div style={{ padding: '20px 0', color: '#52c41a' }}>
                  <CheckCircleOutlined style={{ fontSize: 32 }} />
                  <p style={{ marginTop: 8 }}>{uploadedFile.filename}</p>
                  <p style={{ color: '#666', fontSize: 12 }}>{formatBytes(uploadedFile.size)}</p>
                </div>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <p style={{ marginTop: 8 }}>Click or drag bundle file to re-upload</p>
                  <p style={{ color: '#666', fontSize: 12 }}>.bundle, .js, .jsbundle, .zip</p>
                </div>
              )}
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="bundleUrl"
            label="Bundle URL"
            rules={[{ required: true, message: 'Please enter bundle URL' }]}
          >
            <Input placeholder="https://example.com/bundles/app-1.2.0.bundle" />
          </Form.Item>

          <Form.Item
            name="bundleHash"
            label="Bundle Hash (SHA256)"
            rules={[{ required: true, message: 'Please enter bundle hash' }]}
          >
            <Input placeholder="sha256 hash of the bundle file" />
          </Form.Item>

          <Form.Item
            name="bundleSize"
            label="Bundle Size (bytes)"
            rules={[{ required: true, message: 'Please enter bundle size' }]}
          >
            <InputNumber min={1} placeholder="e.g., 1234567" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="minAppVersion" label="Minimum App Version">
            <Input placeholder="e.g., 1.0.0 (optional)" />
          </Form.Item>

          <Form.Item name="releaseNotes" label="Release Notes">
            <TextArea rows={3} placeholder="What's new in this release..." />
          </Form.Item>

          <Form.Item name="rolloutPercentage" label="Rollout Percentage">
            <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isMandatory" label="Mandatory Update" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="paused">Paused</Select.Option>
              <Select.Option value="archived">Archived</Select.Option>
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

      {/* Release Detail Drawer */}
      <Drawer
        title={`Release ${selectedRelease?.version} Details`}
        open={releaseDetailOpen}
        width={600}
        onClose={() => {
          setReleaseDetailOpen(false);
          setSelectedRelease(null);
        }}
      >
        {selectedRelease && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Version">{selectedRelease.version}</Descriptions.Item>
              <Descriptions.Item label="Build Number">{selectedRelease.buildNumber}</Descriptions.Item>
              <Descriptions.Item label="Bundle Size">{formatBytes(selectedRelease.bundleSize)}</Descriptions.Item>
              <Descriptions.Item label="Min App Version">{selectedRelease.minAppVersion || '-'}</Descriptions.Item>
              <Descriptions.Item label="Rollout">{selectedRelease.rolloutPercentage}%</Descriptions.Item>
              <Descriptions.Item label="Mandatory">
                {selectedRelease.isMandatory ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedRelease.status === 'active' ? 'green' : 'orange'}>{selectedRelease.status.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Released At">{formatDate(selectedRelease.releasedAt)}</Descriptions.Item>
            </Descriptions>
            <div>
              <Title level={5}>Bundle Hash (SHA256)</Title>
              <Typography.Text code copyable style={{ wordBreak: 'break-all' }}>
                {selectedRelease.bundleHash}
              </Typography.Text>
            </div>
            <div>
              <Title level={5}>Release Notes</Title>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {selectedRelease.releaseNotes || 'No release notes provided.'}
              </Typography.Paragraph>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default ApplicationDetailPage;
