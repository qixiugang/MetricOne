import { Card, Col, Row, Typography } from 'antd';

import type { DashboardOverview } from '@/api/hooks';
import { useDashboardOverview } from '@/api/hooks';

type StatKey = keyof DashboardOverview['stats'];

type CardMetaItem = {
  key: StatKey;
  title: string;
  subtitle: (value: DashboardOverview['stats'][StatKey]) => string;
};

const cardMeta: CardMetaItem[] = [
  {
    key: 'registeredMetrics',
    title: '已注册指标数',
    subtitle: (value) => `含 ${(value as DashboardOverview['stats']['registeredMetrics']).sensitive} 个敏感指标`,
  },
  {
    key: 'activeVersions',
    title: '活跃版本',
    subtitle: (value) => `本周发布 ${(value as DashboardOverview['stats']['activeVersions']).releasedThisWeek} 个版本`,
  },
  {
    key: 'yesterdayJobs',
    title: '昨日计算任务',
    subtitle: (value) => `失败 ${(value as DashboardOverview['stats']['yesterdayJobs']).failed} 个任务`,
  },
  {
    key: 'recentUploads',
    title: '最近上传批次',
    subtitle: (value) => `${(value as DashboardOverview['stats']['recentUploads']).processing} 个在排队处理中`,
  },
];

export function DashboardStatsCards() {
  const { data, isLoading } = useDashboardOverview();

  return (
    <Row gutter={[16, 16]}>
      {cardMeta.map((item) => {
        const stat = data?.stats[item.key];
        return (
          <Col xs={24} md={12} lg={6} key={item.key}>
            <Card loading={isLoading} bordered={false} style={{ borderRadius: 12, minHeight: 120 }}>
              <Typography.Text type="secondary">{item.title}</Typography.Text>
              <Typography.Title level={2} style={{ margin: '8px 0 0' }}>
                {stat?.total ?? '--'}
              </Typography.Title>
              <Typography.Text type="secondary">{stat ? item.subtitle(stat) : '—'}</Typography.Text>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
