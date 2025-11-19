import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';

import { apiClient } from '@/api/client';
import {
  useCalibers,
  useMetricDetail,
  useMetricVersions,
  useVersionCalibers,
  type MetricVersion,
  type VersionCaliber,
} from '@/api/hooks';
import { useViewStore } from '@/store/useViewStore';

const statusColor: Record<string, string> = {
  draft: 'default',
  pending_review: 'blue',
  published: 'green',
};

type VersionFormValues = {
  version?: string;
  status?: string;
  formula_sql?: string;
  grain?: string;
  data_sources?: string;
  effective_range?: [Dayjs, Dayjs];
  notes?: string;
};

interface BindingFormValues {
  caliber_id?: number;
  status?: string;
  order_index?: number;
  override_expr_sql?: string;
  override_expr_dsl?: string;
  override_data_sources?: string;
  notes?: string;
}

const parseDsl = (value?: string) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    message.error('DSL JSON 格式不正确');
    throw error;
  }
};

const toList = (value?: string) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined);

export function MetricDetailView() {
  const { selectedMetricId, setActiveView, setSelectedMetricId } = useViewStore();
  const metricId = selectedMetricId;
  const queryClient = useQueryClient();

  const { data: metric, isLoading: loadingMetric, refetch: refetchMetric } = useMetricDetail(metricId ?? undefined);
  const { data: versions = [], refetch: refetchVersions } = useMetricVersions(metricId ?? 0, Boolean(metricId));

  const [basicForm] = Form.useForm();
  const [newVersionForm] = Form.useForm();
  const [bindingCreateForm] = Form.useForm<BindingFormValues>();
  const [bindingEditForm] = Form.useForm<BindingFormValues>();

  const { data: calibers = [] } = useCalibers();

  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [bindingModalVisible, setBindingModalVisible] = useState(false);
  const [editingBinding, setEditingBinding] = useState<VersionCaliber | null>(null);

  useEffect(() => {
    if (versions.length && !selectedVersionId) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId]);

  useEffect(() => {
    if (!metric) return;
    basicForm.setFieldsValue({
      name: metric.name,
      type: metric.type,
      unit: metric.unit,
      subject_area: metric.subject_area,
      owner: metric.owner,
      sensitivity: metric.sensitivity,
      description: metric.description,
    });
  }, [metric, basicForm]);

  const currentVersion = versions.find((v) => v.id === (selectedVersionId ?? versions[0]?.id));
  const currentVersionId = currentVersion?.id;

  const { data: versionCalibers = [], refetch: refetchBindings } = useVersionCalibers(
    metricId ?? 0,
    currentVersionId ?? 0,
    Boolean(metricId && currentVersionId),
  );

  const updateMetric = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!metricId) throw new Error('缺少指标 ID');
      const { data } = await apiClient.patch(`/metrics/${metricId}`, payload);
      return data;
    },
    onSuccess: () => {
      message.success('基础信息已保存');
      queryClient.invalidateQueries({ queryKey: ['metric-list'] });
      refetchMetric();
    },
  });

  const createVersion = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!metricId) throw new Error('缺少指标 ID');
      const { data } = await apiClient.post(`/metrics/${metricId}/versions`, payload);
      return data;
    },
    onSuccess: () => {
      message.success('新版本已发布');
      newVersionForm.resetFields();
      refetchVersions();
      queryClient.invalidateQueries({ queryKey: ['metric-list'] });
    },
  });

  const updateVersion = useMutation({
    mutationFn: async ({ versionId, payload }: { versionId: number; payload: Record<string, unknown> }) => {
      if (!metricId) throw new Error('缺少指标 ID');
      const { data } = await apiClient.patch(`/metrics/${metricId}/versions/${versionId}`, payload);
      return data;
    },
    onSuccess: () => {
      message.success('版本信息已更新');
      refetchVersions();
      queryClient.invalidateQueries({ queryKey: ['metric-detail', metricId] });
    },
  });

  const createBinding = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!metricId || !currentVersionId) throw new Error('缺少指标版本');
      const { data } = await apiClient.post(
        `/metrics/${metricId}/versions/${currentVersionId}/calibers`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      message.success('已绑定口径');
      bindingCreateForm.resetFields();
      setBindingModalVisible(false);
      refetchBindings();
      queryClient.invalidateQueries({ queryKey: ['metric-detail', metricId] });
    },
  });

  const updateBinding = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!metricId || !currentVersionId || !editingBinding) throw new Error('缺少绑定信息');
      const { data } = await apiClient.patch(
        `/metrics/${metricId}/versions/${currentVersionId}/calibers/${editingBinding.id}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      message.success('口径绑定已更新');
      setEditingBinding(null);
      bindingEditForm.resetFields();
      refetchBindings();
      queryClient.invalidateQueries({ queryKey: ['metric-detail', metricId] });
    },
  });

  const deleteBinding = useMutation({
    mutationFn: async (bindingId: number) => {
      if (!metricId || !currentVersionId) throw new Error('缺少绑定');
      await apiClient.delete(`/metrics/${metricId}/versions/${currentVersionId}/calibers/${bindingId}`);
    },
    onSuccess: () => {
      message.success('已移除口径');
      refetchBindings();
      queryClient.invalidateQueries({ queryKey: ['metric-detail', metricId] });
    },
  });

  const versionColumns: ColumnsType<MetricVersion> = useMemo(
    () => [
      { title: '版本', dataIndex: 'version' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (value) => <Tag color={statusColor[value] || 'default'}>{value}</Tag>,
      },
      {
        title: '生效区间',
        render: (_, record) => `${record.effective_from || '—'} → ${record.effective_to || '—'}`,
      },
      {
        title: '粒度',
        dataIndex: 'grain',
        render: (value: string[] | undefined) => (value?.length ? value.join(' / ') : '—'),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => setSelectedVersionId(record.id)}>
              设为当前
            </Button>
            <Button
              type="link"
              onClick={() =>
                setExpandedRows((prev) =>
                  prev.includes(record.id) ? prev.filter((id) => id !== record.id) : [...prev, record.id],
                )
              }
            >
              {expandedRows.includes(record.id) ? '收起' : '编辑'}
            </Button>
          </Space>
        ),
      },
    ],
    [expandedRows],
  );

  const bindingColumns: ColumnsType<VersionCaliber> = useMemo(
    () => [
      { title: '顺序', dataIndex: 'order_index' },
      {
        title: '口径',
        render: (_, record) => `${record.caliber?.code || ''} · ${record.caliber?.name || '—'}`,
      },
      { title: '类别', dataIndex: ['caliber', 'category'], render: (value) => value || '—' },
      { title: '状态', dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditingBinding(record);
                bindingEditForm.setFieldsValue({
                  status: record.status,
                  order_index: record.order_index,
                  override_expr_sql: record.override_expr_sql || undefined,
                  override_expr_dsl: record.override_expr_dsl ? JSON.stringify(record.override_expr_dsl, null, 2) : undefined,
                  override_data_sources: record.override_data_sources?.join(', '),
                  notes: record.notes || undefined,
                });
              }}
            >
              编辑
            </Button>
            <Button danger type="link" loading={deleteBinding.isPending} onClick={() => deleteBinding.mutate(record.id)}>
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [bindingEditForm, deleteBinding.isPending],
  );

  const expandedRowRender = (record: MetricVersion) => {
    const initialValues: VersionFormValues = {
      version: record.version,
      status: record.status,
      formula_sql: record.formula_sql || undefined,
      grain: record.grain ? record.grain.join(', ') : undefined,
      data_sources: record.data_sources ? record.data_sources.join(', ') : undefined,
      notes: record.notes || undefined,
      effective_range:
        record.effective_from && record.effective_to
          ? [dayjs(record.effective_from), dayjs(record.effective_to)]
          : undefined,
    };

    return (
      <Form
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => {
          const payload = {
            version: values.version,
            status: values.status,
            formula_sql: values.formula_sql,
            grain: toList(values.grain),
            data_sources: toList(values.data_sources),
            effective_from: values.effective_range?.[0]?.format('YYYY-MM-DD'),
            effective_to: values.effective_range?.[1]?.format('YYYY-MM-DD'),
            notes: values.notes,
          };
          updateVersion.mutate({ versionId: record.id, payload });
        }}
      >
        <Space wrap align="start">
          <Form.Item label="版本号" name="version" style={{ minWidth: 160 }}>
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status" style={{ minWidth: 180 }}>
            <Select
              options={[
                { label: '草稿', value: 'draft' },
                { label: '活跃', value: 'active' },
                { label: '废弃', value: 'deprecated' },
              ]}
            />
          </Form.Item>
          <Form.Item label="粒度" name="grain" style={{ minWidth: 220 }}>
            <Input placeholder="company,product" />
          </Form.Item>
          <Form.Item label="数据源" name="data_sources" style={{ minWidth: 220 }}>
            <Input placeholder="dwd_order" />
          </Form.Item>
          <Form.Item label="SQL" name="formula_sql" style={{ minWidth: 280 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="生效区间" name="effective_range">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item label="备注" name="notes" style={{ minWidth: 240 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateVersion.isPending}>
              保存
            </Button>
          </Form.Item>
        </Space>
      </Form>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        loading={loadingMetric}
        title={
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {metric?.name} · {metric?.code}
              </Typography.Title>
              <Typography.Text type="secondary">{metric?.description || '暂无描述'}</Typography.Text>
            </div>
            <Button
              onClick={() => {
                setSelectedMetricId(null);
                setActiveView('metric-list');
              }}
            >
              返回列表
            </Button>
          </Space>
        }
      >
        <Descriptions column={3} layout="vertical">
          <Descriptions.Item label="主题域">{metric?.subject_area || '—'}</Descriptions.Item>
          <Descriptions.Item label="类型">{metric?.type || '—'}</Descriptions.Item>
          <Descriptions.Item label="单位">{metric?.unit || '—'}</Descriptions.Item>
          <Descriptions.Item label="敏感度">
            <Tag color={metric?.sensitivity === 'normal' ? 'default' : 'red'}>{metric?.sensitivity}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Owner">{metric?.owner || '—'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {metric ? dayjs(metric.created_at).format('YYYY-MM-DD HH:mm') : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编辑基础信息" bordered={false} style={{ borderRadius: 12 }}>
        <Form form={basicForm} layout="vertical" onFinish={(values) => updateMetric.mutate(values)}>
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
            <Select
              options={[
                { label: 'normal', value: 'normal' },
                { label: 'confidential', value: 'confidential' },
                { label: 'secret', value: 'secret' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="描述"> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMetric.isPending}>
              保存基础信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="版本记录" bordered={false} style={{ borderRadius: 12 }}>
        <Table<MetricVersion>
          rowKey="id"
          columns={versionColumns}
          dataSource={versions}
          pagination={false}
          expandable={{
            expandedRowKeys: expandedRows,
            expandedRowRender,
            onExpand: (expanded, record) =>
              setExpandedRows((prev) => (expanded ? [...prev, record.id] : prev.filter((id) => id !== record.id))),
          }}
        />
        <Divider />
        <Typography.Title level={5}>发布新版本</Typography.Title>
        <Form form={newVersionForm} layout="vertical" onFinish={(values) => {
            if (!values.grain || !values.effective_range) {
              message.error('请填写必填字段：粒度和生效区间');
              return;
            }
            const payload = {
              version: values.version,
              status: values.status || 'draft',
              formula_sql: values.formula_sql,
              grain: toList(values.grain) ?? [],
              data_sources: toList(values.data_sources),
              effective_from: values.effective_range?.[0]?.format('YYYY-MM-DD'),
              effective_to: values.effective_range?.[1]?.format('YYYY-MM-DD'),
              notes: values.notes,
            };
          createVersion.mutate(payload);
        }}>
          <Form.Item name="version" label="版本号">
            <Input placeholder="如 v2" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ label: '草稿', value: 'draft' }, { label: '活跃', value: 'active' }, { label: '废弃', value: 'deprecated' }]} />
          </Form.Item>
          <Form.Item name="grain" label="粒度">
            <Input placeholder="company,product,channel" />
          </Form.Item>
          <Form.Item name="data_sources" label="数据源">
            <Input placeholder="dwd_order,dwd_user" />
          </Form.Item>
          <Form.Item name="formula_sql" label="SQL">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="effective_range" label="生效区间">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createVersion.isPending}>
              发布新版本
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="版本口径" bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16 }}>
          <Typography.Text>
            当前版本：{currentVersion ? currentVersion.version : '未选择'}
          </Typography.Text>
          <Button type="primary" onClick={() => setBindingModalVisible(true)} disabled={!currentVersionId}>
            新增口径绑定
          </Button>
        </Space>
        <Table<VersionCaliber>
          rowKey="id"
          dataSource={versionCalibers}
          pagination={false}
          columns={bindingColumns}
        />
      </Card>

      <Modal
        title="新增版本口径"
        open={bindingModalVisible}
        footer={null}
        onCancel={() => setBindingModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={bindingCreateForm}
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              caliber_id: values.caliber_id,
              status: values.status || 'active',
              order_index: values.order_index ?? 0,
              override_expr_sql: values.override_expr_sql,
              override_expr_dsl: parseDsl(values.override_expr_dsl),
              override_data_sources: toList(values.override_data_sources),
              notes: values.notes,
            };
            createBinding.mutate(payload);
          }}
        >
          <Form.Item name="caliber_id" label="口径" rules={[{ required: true }]}>
            <Select
              placeholder="选择口径"
              options={calibers.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select options={[{ label: 'active', value: 'active' }, { label: 'inactive', value: 'inactive' }]} />
          </Form.Item>
          <Form.Item name="order_index" label="执行顺序" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="override_expr_sql" label="覆盖 SQL">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="override_expr_dsl" label="覆盖 DSL(JSON)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="override_data_sources" label="覆盖数据源">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createBinding.isPending}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`编辑口径绑定 · ${editingBinding?.caliber?.code || ''}`}
        open={Boolean(editingBinding)}
        footer={null}
        onCancel={() => setEditingBinding(null)}
        destroyOnClose
      >
        <Form
          form={bindingEditForm}
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              status: values.status,
              order_index: values.order_index,
              override_expr_sql: values.override_expr_sql,
              override_expr_dsl: parseDsl(values.override_expr_dsl),
              override_data_sources: toList(values.override_data_sources),
              notes: values.notes,
            };
            updateBinding.mutate(payload);
          }}
        >
          <Form.Item name="status" label="状态">
            <Select options={[{ label: 'active', value: 'active' }, { label: 'inactive', value: 'inactive' }]} />
          </Form.Item>
          <Form.Item name="order_index" label="执行顺序">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="override_expr_sql" label="覆盖 SQL">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="override_expr_dsl" label="覆盖 DSL(JSON)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="override_data_sources" label="覆盖数据源">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateBinding.isPending}>
                保存
              </Button>
              <Button onClick={() => bindingEditForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
