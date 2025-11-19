import { useMemo, useState } from 'react';
import {
  Button,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Divider,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';

import { apiClient } from '@/api/client';
import { useMetricList, useMetricSummary, type MetricItem } from '@/api/hooks';
import { useViewStore } from '@/store/useViewStore';

type VersionFormValues = {
  version?: string;
  status?: string;
  formula_sql?: string;
  grain?: string;
  data_sources?: string;
  effective_range?: [Dayjs, Dayjs];
  notes?: string;
};

type MetricFormValues = {
  code: string;
  name: string;
  type: string;
  unit?: string;
  subject_area?: string;
  owner?: string;
  sensitivity?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
} & VersionFormValues;

export function MetricListTable() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [subjectAreaFilter, setSubjectAreaFilter] = useState('all');
  const [sensitivityFilter, setSensitivityFilter] = useState('all');
  const filters = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      subject_area: subjectAreaFilter !== 'all' ? subjectAreaFilter : undefined,
      sensitivity: sensitivityFilter !== 'all' ? sensitivityFilter : undefined,
    }),
    [keyword, subjectAreaFilter, sensitivityFilter],
  );
  const { data: metrics = [], isLoading } = useMetricList(filters);
  const { data: summary } = useMetricSummary();
  const subjectAreaOptions = useMemo(() => {
    const values = new Set<string>();
    metrics.forEach((metric) => {
      if (metric.subject_area) values.add(metric.subject_area);
    });
    if (subjectAreaFilter !== 'all') {
      values.add(subjectAreaFilter);
    }
    return Array.from(values);
  }, [metrics, subjectAreaFilter]);
  const [addForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { setActiveView, setSelectedMetricId } = useViewStore();

  const createMetric = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      await apiClient.post('/metrics', payload);
    },
    onSuccess: () => {
      message.success('指标已创建');
      queryClient.invalidateQueries({ queryKey: ['metric-list'] });
      queryClient.invalidateQueries({ queryKey: ['metric-summary'] });
      setAddModalVisible(false);
      addForm.resetFields();
    },
    onError: () => {
      message.error('指标创建失败');
    },
  });

  const deleteMetric = useMutation({
    mutationFn: async (metricId: number) => {
      await apiClient.delete(`/metrics/${metricId}`);
    },
    onSuccess: () => {
      message.success('指标已删除');
      queryClient.invalidateQueries({ queryKey: ['metric-list'] });
      queryClient.invalidateQueries({ queryKey: ['metric-summary'] });
    },
    onError: () => {
      message.error('删除指标失败');
    },
  });

  const columns: ColumnsType<MetricItem> = useMemo(
    () => [
      { title: '指标编码', dataIndex: 'code' },
      { title: '指标名称', dataIndex: 'name' },
      { title: '主题域', dataIndex: 'subject_area' },
      { title: '类型', dataIndex: 'type' },
      { title: '单位', dataIndex: 'unit' },
      { title: 'Owner', dataIndex: 'owner' },
      {
        title: '敏感度',
        dataIndex: 'sensitivity',
        render: (value: string) => <Tag color={value === 'normal' ? 'default' : 'red'}>{value}</Tag>,
      },
      {
        title: '当前版本',
        key: 'currentVersion',
        render: (_, record) => {
          const latest = record.versions?.[0];
          return latest ? `${latest.version} · ${latest.status}` : '—';
        },
      },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              onClick={() => {
                setSelectedMetricId(record.id);
                setActiveView('metric-detail');
              }}
            >
              查看
            </Button>
            <Popconfirm
              title={`确认删除指标 ${record.name}?`}
              description="删除后不可恢复，版本与口径绑定也会一并清理。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deleteMetric.isPending }}
              onConfirm={() => deleteMetric.mutate(record.id)}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [setActiveView, setSelectedMetricId],
  );

  const resetFilters = () => {
    setKeyword('');
    setSubjectAreaFilter('all');
    setSensitivityFilter('all');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            指标列表
          </Typography.Title>
          <Typography.Text type="secondary">
            共 {summary?.total_metrics ?? 0} 个指标，其中敏感 {summary?.sensitive_metrics ?? 0} 个。
          </Typography.Text>
        </div>
        <Space>
          <Tag color="blue">活跃版本 {summary?.active_versions ?? 0}</Tag>
          <Tag>草稿 {summary?.draft_versions ?? 0}</Tag>
          <Button type="primary" onClick={() => setAddModalVisible(true)}>
            新增指标
          </Button>
        </Space>
      </div>

      <div
        style={{
          padding: 16,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        }}
      >
        <Space wrap style={{ width: '100%' }}>
          <Input.Search
            placeholder="指标名称 / 编码 / Owner"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={() => null}
            enterButton
            style={{ maxWidth: 320 }}
          />
          <Select
            value={subjectAreaFilter}
            onChange={(value) => setSubjectAreaFilter(value)}
            style={{ width: 160 }}
          >
            <Select.Option value="all">全部主题域</Select.Option>
            {subjectAreaOptions.map((area) => (
              <Select.Option key={area} value={area}>
                {area}
              </Select.Option>
            ))}
          </Select>
          <Select
            value={sensitivityFilter}
            onChange={(value) => setSensitivityFilter(value)}
            style={{ width: 140 }}
          >
            <Select.Option value="all">全部敏感度</Select.Option>
            <Select.Option value="normal">normal</Select.Option>
            <Select.Option value="confidential">confidential</Select.Option>
            <Select.Option value="secret">secret</Select.Option>
          </Select>
          <Button type="default" onClick={resetFilters}>
            重置
          </Button>
        </Space>
      </div>

      <Table<MetricItem>
        rowKey="id"
        columns={columns}
        dataSource={metrics}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        style={{ background: '#fff', borderRadius: 12 }}
      />

      <Modal
        width={720}
        title="新增指标"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={(values: MetricFormValues) => {
            const payload = {
              code: values.code,
              name: values.name,
              type: values.type,
              unit: values.unit,
              subject_area: values.subject_area,
              owner: values.owner,
              sensitivity: values.sensitivity || 'normal',
              description: values.description,
              created_by: values.created_by,
              updated_by: values.updated_by,
              initial_version: {
                version: values.version,
                status: values.status || 'draft',
                formula_sql: values.formula_sql,
                grain: values.grain
                  ? values.grain
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : undefined,
                data_sources: values.data_sources
                  ? values.data_sources
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : undefined,
                notes: values.notes,
                effective_from: values.effective_range?.[0]?.format('YYYY-MM-DD'),
                effective_to: values.effective_range?.[1]?.format('YYYY-MM-DD'),
              },
            };
            createMetric.mutate(payload);
          }}
        >
          <Typography.Title level={5}>基础信息</Typography.Title>
          <Form.Item name="code" label="指标编码" rules={[{ required: true }]}> 
            <Input placeholder="如 M_GMV" />
          </Form.Item>
          <Form.Item name="name" label="指标名称" rules={[{ required: true }]}> 
            <Input placeholder="如 GMV 总成交额" />
          </Form.Item>
          <Form.Item name="type" label="指标类型" rules={[{ required: true }]}> 
            <Input placeholder="如 财务/KPI" />
          </Form.Item>
          <Form.Item name="unit" label="单位"> 
            <Input placeholder="如 元/百分比" />
          </Form.Item>
          <Form.Item name="subject_area" label="主题域"> 
            <Input placeholder="如 交易/用户" />
          </Form.Item>
          <Form.Item name="owner" label="Owner"> 
            <Input placeholder="责任人" />
          </Form.Item>
          <Form.Item name="sensitivity" label="敏感度"> 
            <Select defaultValue="normal"> 
              <Select.Option value="normal">普通</Select.Option> 
              <Select.Option value="confidential">confidential</Select.Option> 
              <Select.Option value="secret">secret</Select.Option> 
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述"> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Divider />
          <Typography.Title level={5}>版本信息</Typography.Title>
          <Form.Item name="version" label="版本号"> 
            <Input placeholder="如 v1" />
          </Form.Item>
          <Form.Item name="status" label="版本状态" initialValue="draft"> 
            <Select 
              options={[ 
                { label: '草稿', value: 'draft' }, 
                { label: '活跃', value: 'active' }, 
                { label: '废弃', value: 'deprecated' }, 
              ]} 
            />
          </Form.Item>
          <Form.Item 
            name="grain" 
            label="粒度" 
            tooltip="多个粒度使用逗号分隔" 
            rules={[{ required: true, message: '请输入粒度' }]} 
          > 
            <Input placeholder="company,product,channel" />
          </Form.Item>
          <Form.Item name="data_sources" label="数据源"> 
            <Input placeholder="如 dwd_trade_order,dwd_user_profile" />
          </Form.Item>
          <Form.Item name="effective_range" label="生效区间" rules={[{ required: true }]}> 
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="版本备注"> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="formula_sql" label="SQL 公式"> 
            <Input.TextArea rows={3} placeholder="可选" />
          </Form.Item>
          <Form.Item> 
            <Space> 
              <Button type="primary" htmlType="submit" loading={createMetric.isPending}> 
                创建指标 
              </Button> 
              <Button onClick={() => setAddModalVisible(false)}> 
                取消 
              </Button> 
            </Space> 
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
