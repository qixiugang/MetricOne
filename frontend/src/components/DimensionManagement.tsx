import { useState } from 'react';
import { Card, Input, Space, Tabs, Table, Typography, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import {
  useDimensionChannels,
  useDimensionCombos,
  useDimensionCompanies,
  useDimensionProducts,
  type CompanyItem,
  type ProductItem,
  type ChannelItem,
  type ComboItem,
} from '@/api/hooks';

const tabItems = [
  { key: 'company', label: '公司维度' },
  { key: 'product', label: '产品维度' },
  { key: 'channel', label: '渠道维度' },
  { key: 'combo', label: '组合维' },
];

export function DimensionManagement() {
  const [activeTab, setActiveTab] = useState('company');
  const [keyword, setKeyword] = useState('');

  const { data: companies = [], isLoading: loadingCompany } = useDimensionCompanies(keyword);
  const { data: products = [], isLoading: loadingProduct } = useDimensionProducts(keyword);
  const { data: channels = [], isLoading: loadingChannel } = useDimensionChannels(keyword);
  const { data: combos = [], isLoading: loadingCombo } = useDimensionCombos(keyword);

  const companyColumns: ColumnsType<CompanyItem> = [
    { title: '公司ID', dataIndex: 'company_id' },
    { title: '公司编码', dataIndex: 'company_code' },
    { title: '公司名称', dataIndex: 'company_name' },
    { title: '层级', dataIndex: 'level' },
    { title: '上级ID', dataIndex: 'parent_company_id' },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '停用'}</Tag>,
    },
  ];

  const productColumns: ColumnsType<ProductItem> = [
    { title: '产品ID', dataIndex: 'product_id' },
    { title: '产品编码', dataIndex: 'product_code' },
    { title: '产品名称', dataIndex: 'product_name' },
    { title: '类型', dataIndex: 'product_type' },
  ];

  const channelColumns: ColumnsType<ChannelItem> = [
    { title: '渠道ID', dataIndex: 'channel_id' },
    { title: '渠道编码', dataIndex: 'channel_code' },
    { title: '渠道名称', dataIndex: 'channel_name' },
    { title: '类型', dataIndex: 'channel_type' },
  ];

  const comboColumns: ColumnsType<ComboItem> = [
    { title: '组合ID', dataIndex: 'combo_id' },
    { title: '公司', dataIndex: 'company_name', render: (value) => value || '-' },
    { title: '核心企业', dataIndex: 'core_company_name', render: (value) => value || '-' },
    { title: '产品', dataIndex: 'product_name', render: (value) => value || '-' },
    { title: '渠道', dataIndex: 'channel_name', render: (value) => value || '-' },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'company':
        return (
          <Table<CompanyItem>
            rowKey="company_id"
            columns={companyColumns}
            dataSource={companies}
            loading={loadingCompany}
            pagination={{ pageSize: 10 }}
          />
        );
      case 'product':
        return (
          <Table<ProductItem>
            rowKey="product_id"
            columns={productColumns}
            dataSource={products}
            loading={loadingProduct}
            pagination={{ pageSize: 10 }}
          />
        );
      case 'channel':
        return (
          <Table<ChannelItem>
            rowKey="channel_id"
            columns={channelColumns}
            dataSource={channels}
            loading={loadingChannel}
            pagination={{ pageSize: 10 }}
          />
        );
      case 'combo':
        return (
          <Table<ComboItem>
            rowKey="combo_id"
            columns={comboColumns}
            dataSource={combos}
            loading={loadingCombo}
            pagination={{ pageSize: 10 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            维度管理
          </Typography.Title>
          <Typography.Text type="secondary">统一维护公司、产品、渠道以及组合维度数据。</Typography.Text>
        </div>
        <Input.Search
          placeholder="输入关键词（名称/编码）"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          allowClear
          style={{ maxWidth: 320 }}
        />
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
        />
        {renderTable()}
      </Card>
    </Space>
  );
}
