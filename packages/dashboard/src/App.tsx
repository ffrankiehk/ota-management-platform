import React from 'react';
import { Layout, Menu, Spin, Button, Dropdown } from 'antd';
import { AppstoreOutlined, DashboardOutlined, UserOutlined, LogoutOutlined, MobileOutlined, HistoryOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons';
import { Link, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import OverviewPage from './pages/Overview/OverviewPage';
import ApplicationsPage from './pages/Applications/ApplicationsPage';
import ApplicationDetailPage from './pages/Applications/ApplicationDetailPage';
import DevicesPage from './pages/Devices/DevicesPage';
import UpdateLogsPage from './pages/UpdateLogs/UpdateLogsPage';
import UsersPage from './pages/Users/UsersPage';
import OrganizationsPage from './pages/Organizations/OrganizationsPage';
import LoginPage from './pages/Login/LoginPage';
import TutorialPage from './pages/Tutorial/TutorialPage';
import { BookOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main layout for authenticated users
const MainLayout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const selectedKey = React.useMemo(() => {
    if (location.pathname.startsWith('/applications')) return 'applications';
    if (location.pathname.startsWith('/devices')) return 'devices';
    if (location.pathname.startsWith('/update-logs')) return 'update-logs';
    if (location.pathname.startsWith('/users')) return 'users';
    if (location.pathname.startsWith('/organizations')) return 'organizations';
    if (location.pathname.startsWith('/tutorial')) return 'tutorial';
    if (location.pathname.startsWith('/overview')) return 'overview';
    return 'overview';
  }, [location.pathname]);

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
        <div style={{ fontSize: 18 }}>OTA Management Dashboard</div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" style={{ color: '#fff' }} icon={<UserOutlined />}>
            {user?.email}
          </Button>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={220} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              { key: 'overview', icon: <DashboardOutlined />, label: <Link to="/overview">Overview</Link> },
              { key: 'applications', icon: <AppstoreOutlined />, label: <Link to="/applications">Applications</Link> },
              { key: 'devices', icon: <MobileOutlined />, label: <Link to="/devices">Devices</Link> },
              { key: 'update-logs', icon: <HistoryOutlined />, label: <Link to="/update-logs">Update Logs</Link> },
              { type: 'divider' },
              { key: 'users', icon: <TeamOutlined />, label: <Link to="/users">Users</Link> },
              { key: 'organizations', icon: <BankOutlined />, label: <Link to="/organizations">Organizations</Link> },
              { type: 'divider' },
              { key: 'tutorial', icon: <BookOutlined />, label: <Link to="/tutorial">Tutorial Center</Link> },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '16px' }}>
          <Content style={{ background: '#fff', padding: 24, minHeight: 280 }}>
            <Routes>
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/:id" element={<ApplicationDetailPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/update-logs" element={<UpdateLogsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/tutorial" element={<TutorialPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/overview" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
