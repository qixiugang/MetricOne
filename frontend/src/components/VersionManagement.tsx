import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { useMetricDetail, useMetricList, useMetricVersions, type MetricVersion } from '@/api/hooks';
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
  effective_range?: [dayjs.Dayjs, dayjs.Dayjs];
  notes?: string;
};

const toList = (value?: string) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined);

export function VersionManagement() {
  const { selectedMetricId, setSelectedMetricId, setSelectedVersionId } = useViewStore();
  const { data: metrics = [] } = useMetricList();
  const [metricId, setMetricId] = useState<number | null>(selectedMetricId ?? metrics[0]?.id ?? null);

  useEffect(() => {
    if (metrics.length && !metricId) {
      setMetricId(metrics[0].id);
    }
  }, [metrics, metricId]);

  useEffect(() => {
    if (metricId && metricId !== selectedMetricId) {
      setSelectedMetricId(metricId);
    }
  }, [metricId, selectedMetricId, setSelectedMetricId]);

  const { data: metric } = useMetricDetail(metricId ?? undefined, Boolean(metricId));
  const { data: versions = [], refetch: refetchVersions } = useMetricVersions(metricId ?? 0, Boolean(metricId));
  const queryClient = useQueryClient();
  const [editForm] = Form.useForm<VersionFormValues>();
  const [editingVersion, setEditingVersion] = useState<MetricVersion | null>(null);

  const updateVersion = useMutation({
    mutationFn: async ({ versionId, payload }: { versionId: number; payload: Record<string, unknown> }) => {
      if (!metricId) throw new Error('缺少指标');
      const { data } = await apiClient.patch(`/metrics/${metricId}/versions/${versionId}`, payload);
      return data;
    },
    onSuccess: () => {
      message.success('版本信息已更新');
      setEditingVersion(null);
      editForm.resetFields();
      refetchVersions();
      queryClient.invalidateQueries({ queryKey: ['metric-detail', metricId] });
    },
  });

  const columns: ColumnsType<MetricVersion> = useMemo(
    () => [
      { title: '版本', dataIndex: 'version' },
      { title: '状态', dataIndex: 'status', render: (value) => <Tag color={statusColor[value] || 'default'}>{value}</Tag> },
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
            {/* <Button type="link" onClick={() => setSelectedVersionId(record.id)}>
              设为当前
            </Button> */}
            <Button
              type="link"
              onClick={() => {
                setEditingVersion(record);
                editForm.setFieldsValue({
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
                });
              }}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [editForm, setSelectedVersionId],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="版本管理" bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={metricId ?? undefined}
            placeholder="选择指标"
            style={{ minWidth: 260 }}
            options={metrics.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            onChange={(value) => {
              setMetricId(value);
              setSelectedVersionId(null);
            }}
          />
          {metric && <Typography.Text type="secondary">当前 Owner：{metric.owner || '—'}</Typography.Text>}
        </Space>
        <Table<MetricVersion>
          rowKey="id"
          columns={columns}
          dataSource={versions}
          pagination={false}
        />
      </Card>

      <Modal
        title={`编辑版本 · ${editingVersion?.version || ''}`}
        open={Boolean(editingVersion)}
        footer={null}
        onCancel={() => {
          setEditingVersion(null);
          editForm.resetFields();
        }}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editingVersion) return;
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
            updateVersion.mutate({ versionId: editingVersion.id, payload });
          }}
        >
          <Form.Item name="version" label="版本号">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已发布', value: 'active' },
                { label: '已废弃', value: 'deprecated' },
              ]}
            />
          </Form.Item>
          <Form.Item name="grain" label="粒度">
            <Input placeholder="company,product" />
          </Form.Item>
          <Form.Item name="data_sources" label="数据源">
            <Input placeholder="dwd_order" />
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
            <Space>
              <Button type="primary" htmlType="submit" loading={updateVersion.isPending}>
                保存
              </Button>
              <Button onClick={() => editForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
