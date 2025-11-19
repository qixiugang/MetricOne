import type { ReactNode } from 'react';
import { Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  ProfileOutlined,
  DatabaseOutlined,
  PartitionOutlined,
  DeploymentUnitOutlined,
  CloudUploadOutlined,
  ScheduleOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import { useViewStore } from '@/store/useViewStore';
import type { ViewKey } from '@/store/useViewStore';

const iconMap: Record<ViewKey, ReactNode> = {
  dashboard: <DashboardOutlined />,
  'metric-list': <UnorderedListOutlined />,
  'metric-detail': <ProfileOutlined />,
  caliber: <DatabaseOutlined />,
  dimension: <PartitionOutlined />,
  version: <DeploymentUnitOutlined />,
  upload: <CloudUploadOutlined />,
  jobs: <ScheduleOutlined />,
  system: <SettingOutlined />,
};

const labelMap: Record<ViewKey, string> = {
  dashboard: 'Dashboard',
  'metric-list': '指标列表',
  'metric-detail': '指标详情',
  caliber: '口径库',
  dimension: '维度管理',
  version: '版本管理',
  upload: '数据上传向导',
  jobs: '计算任务',
  system: '系统与权限',
};

const groupedMenu: { label: string; keys: ViewKey[] }[] = [
  { label: '总览', keys: ['dashboard'] },
  { label: '指标治理', keys: ['metric-list', 'metric-detail', 'caliber', 'dimension', 'version'] },
  { label: '数据与任务', keys: ['upload', 'jobs'] },
  { label: '系统与配置', keys: ['system'] },
];

export function SidebarMenu() {
  const { activeView, setActiveView } = useViewStore();

  const items: MenuProps['items'] = groupedMenu.flatMap((group) => [
    {
      type: 'group',
      label: <Typography.Text style={{ color: '#94a3b8', fontSize: 12 }}>{group.label}</Typography.Text>,
      key: group.label,
      children: group.keys.map((key) => ({
        key,
        icon: iconMap[key],
        label: labelMap[key],
      })),
    },
  ]);

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[activeView]}
      items={items}
      onClick={(info) => setActiveView(info.key as ViewKey)}
      style={{
        flex: 1,
        borderRight: 0,
        background: 'transparent',
      }}
    />
  );
}
