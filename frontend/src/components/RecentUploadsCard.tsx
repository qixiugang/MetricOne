import { Button, Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useDashboardOverview } from '@/api/hooks';

interface UploadRow {
  batchId: string;
  source: string;
  filename: string;
  status: string;
}

const statusColor: Record<string, string> = {
  已完成: 'green',
  排队中: 'blue',
};

export function RecentUploadsCard() {
  const { data, isLoading } = useDashboardOverview();

  const columns: ColumnsType<UploadRow> = [
    { title: '批次ID', dataIndex: 'batchId' },
    { title: '来源', dataIndex: 'source' },
    { title: '文件名', dataIndex: 'filename' },
    { title: '状态', dataIndex: 'status', render: (value) => <Tag color={statusColor[value] || 'default'}>{value}</Tag> },
  ];

  return (
    <Card
      title="最近上传记录"
      bordered={false}
      loading={isLoading}
      style={{ borderRadius: 12 }}
      extra={<Button type="default">新建上传</Button>}
    >
      <Table<UploadRow> rowKey="batchId" columns={columns} dataSource={data?.uploads || []} pagination={false} />
    </Card>
  );
}
