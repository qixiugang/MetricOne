import { Breadcrumb, Avatar, Badge, Space, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';

export function TopHeader() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px',
        padding: '0 24px',
      }}
    >
      <div>
        <Breadcrumb
          items={[
            { title: '指标管理中心' }
          ]}
        />
      </div>
      <Space size="large" align="center">
        <Typography.Text type="secondary">环境：DEV</Typography.Text>
        <Badge dot>
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
        <Avatar size="large">QX</Avatar>
      </Space>
    </div>
  );
}
