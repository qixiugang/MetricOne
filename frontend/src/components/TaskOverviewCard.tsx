import { Card, Typography } from 'antd';

import { useDashboardOverview } from '@/api/hooks';

export function TaskOverviewCard() {
  const { data, isLoading } = useDashboardOverview();

  return (
    <Card title={data?.taskSummary.title || '任务概览'} bordered={false} loading={isLoading} style={{ borderRadius: 12 }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {data?.taskSummary.description || '可在此展示执行指标、趋势图等内容。'}
      </Typography.Paragraph>
    </Card>
  );
}
