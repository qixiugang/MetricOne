import { Layout, Typography, Space, Button, Row, Col } from 'antd';

import { SidebarMenu } from '@/components/SidebarMenu';
import { TopHeader } from '@/components/TopHeader';
import { DashboardStatsCards } from '@/components/DashboardStatsCards';
import { TaskOverviewCard } from '@/components/TaskOverviewCard';
import { RecentUploadsCard } from '@/components/RecentUploadsCard';
import { MetricDetailView } from '@/components/MetricDetailView';
import { MetricListTable } from '@/components/MetricListTable';
import { CaliberManagement } from '@/components/CaliberManagement';
import { DimensionManagement } from '@/components/DimensionManagement';
import { useViewStore } from '@/store/useViewStore';

const { Header, Sider, Content } = Layout;

function DashboardView() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Dashboard 总览
          </Typography.Title>
          <Typography.Text type="secondary">查看当前指标体系的健康度，计算任务与数据接入情况。</Typography.Text>
        </div>
        <Space>
          <Button type="default">导出报表</Button>
        </Space>
      </div>
      <DashboardStatsCards />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <TaskOverviewCard />
        </Col>
        <Col xs={24} lg={8}>
          <RecentUploadsCard />
        </Col>
      </Row>
    </Space>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', background: '#fff', borderRadius: 12 }}>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">建设中，敬请期待。</Typography.Paragraph>
    </div>
  );
}

function ViewRenderer({ view }: { view: string }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'metric-list':
      return <MetricListTable />;
    case 'metric-detail':
      return <MetricDetailView />;
    case 'caliber':
      return <CaliberManagement />;
    case 'dimension':
      return <DimensionManagement />;
    case 'version':
      return <PlaceholderView title="版本管理" />;
    case 'upload':
      return <PlaceholderView title="数据上传向导" />;
    case 'jobs':
      return <PlaceholderView title="计算任务" />;
    case 'system':
      return <PlaceholderView title="系统与权限" />;
    default:
      return <DashboardView />;
  }
}

export default function App() {
  const { activeView } = useViewStore();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <Sider
        width={240}
        style={{
          background: '#111936',
          color: '#cbd5f5',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ padding: '24px 24px 12px' }}>
          <Typography.Title level={4} style={{ color: '#fff', marginBottom: 4 }}>
            指标管理系统
          </Typography.Title>
          <Typography.Text style={{ color: '#93a5ff' }}>Nola Finchley · 内部愿望</Typography.Text>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <SidebarMenu />
        </div>
        <div style={{ padding: 24, borderTop: '1px solid rgba(148, 163, 255, 0.2)', color: '#cbd5f5' }}>
          <Typography.Text style={{ color: '#9fb2ff' }}>当前用户：xiugang qi</Typography.Text>
          <Typography.Paragraph style={{ color: '#7e8bbd', marginBottom: 0 }}>原型仅供产品设计讨论使用</Typography.Paragraph>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: 0,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          }}
        >
          <TopHeader />
        </Header>
        <Content style={{ padding: 32 }}>
          <ViewRenderer view={activeView} />
        </Content>
      </Layout>
    </Layout>
  );
}
