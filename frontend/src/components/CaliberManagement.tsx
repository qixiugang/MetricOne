import { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { useCalibers, type CaliberItem } from '@/api/hooks';

const categoryOptions = [
  { label: '过滤', value: 'filter' },
  { label: '聚合', value: 'aggregate' },
  { label: '计算', value: 'calculate' },
  { label: '其它', value: 'others' },
];

interface CaliberFormValues {
  code?: string;
  name?: string;
  category?: string;
  expr_sql?: string;
  expr_dsl_text?: string;
  value_format?: string;
  unit_override?: string;
  notes?: string;
}

export function CaliberManagement() {
  const { data: calibers = [], isLoading } = useCalibers();
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CaliberItem | null>(null);
  const [createForm] = Form.useForm<CaliberFormValues>();
  const [editForm] = Form.useForm<CaliberFormValues>();
  const queryClient = useQueryClient();

  const parseExprDsl = (value?: string) => {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch (error) {
      message.error('DSL JSON 格式不正确');
      throw error;
    }
  };

  const buildPayload = (values: CaliberFormValues, includeCode = false) => {
    const payload: Record<string, unknown> = {
      name: values.name,
      category: values.category,
      expr_sql: values.expr_sql,
      expr_dsl: parseExprDsl(values.expr_dsl_text),
      value_format: values.value_format,
      unit_override: values.unit_override,
      notes: values.notes,
    };
    if (includeCode) {
      payload.code = values.code;
    }
    return payload;
  };

  const createCaliber = useMutation({
    mutationFn: async (values: CaliberFormValues) => {
      const payload = buildPayload(values, true);
      await apiClient.post('/calibers', payload);
    },
    onSuccess: () => {
      message.success('已新增口径');
      queryClient.invalidateQueries({ queryKey: ['calibers'] });
      createForm.resetFields();
      setCreateVisible(false);
    },
  });

  const updateCaliber = useMutation({
    mutationFn: async (values: CaliberFormValues) => {
      if (!editingRecord) throw new Error('缺少口径 ID');
      const payload = buildPayload(values, false);
      await apiClient.patch(`/calibers/${editingRecord.id}`, payload);
    },
    onSuccess: () => {
      message.success('口径信息已更新');
      queryClient.invalidateQueries({ queryKey: ['calibers'] });
      setEditVisible(false);
      setEditingRecord(null);
    },
  });

  const columns: ColumnsType<CaliberItem> = useMemo(
    () => [
      { title: '编码', dataIndex: 'code' },
      { title: '名称', dataIndex: 'name' },
      { title: '类别', dataIndex: 'category', render: (value) => <Tag>{value}</Tag> },
      { title: '值格式', dataIndex: 'value_format', render: (value) => value || '—' },
      { title: '单位覆盖', dataIndex: 'unit_override', render: (value) => value || '—' },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => (
          <Button
            type="link"
            onClick={() => {
              setEditingRecord(record);
              editForm.setFieldsValue({
                name: record.name,
                category: record.category,
                expr_sql: record.expr_sql || undefined,
                expr_dsl_text: record.expr_dsl ? JSON.stringify(record.expr_dsl, null, 2) : undefined,
                value_format: record.value_format || undefined,
                unit_override: record.unit_override || undefined,
                notes: record.notes || undefined,
              });
              setEditVisible(true);
            }}
          >
            编辑
          </Button>
        ),
      },
    ],
    [editForm],
  );

  const renderForm = (form: typeof createForm, includeCode = false) => (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => {
        if (includeCode) {
          createCaliber.mutate(values);
        } else {
          updateCaliber.mutate(values);
        }
      }}
    >
      {includeCode && (
        <Form.Item name="code" label="口径编码" rules={[{ required: true }]}> 
          <Input placeholder="如 CALC_ORDER_FILTER" />
        </Form.Item>
      )}
      <Form.Item name="name" label="口径名称" rules={[{ required: true }]}> 
        <Input placeholder="如 有效订单过滤" />
      </Form.Item>
      <Form.Item name="category" label="类别" rules={[{ required: true }]}> 
        <Select options={categoryOptions} placeholder="选择类别" />
      </Form.Item>
      {/* <Form.Item name="expr_sql" label="SQL 表达式"> 
        <Input.TextArea rows={3} placeholder="可选" />
      </Form.Item> */}
      {/* <Form.Item name="expr_dsl_text" label="DSL(JSON)"> 
        <Input.TextArea rows={3} placeholder='{"func":"sum","field":"amount"}' />
      </Form.Item> */}
      <Form.Item name="value_format" label="值格式"> 
        <Input placeholder="如 percentage / currency" />
      </Form.Item>
      {/* <Form.Item name="unit_override" label="单位覆盖"> 
        <Input placeholder="如 %" />
      </Form.Item> */}
      <Form.Item name="notes" label="备注"> 
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={includeCode ? createCaliber.isPending : updateCaliber.isPending}>
            保存
          </Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            口径库
          </Typography.Title>
          <Typography.Text type="secondary">管理口径组件，可复用到多个指标版本。</Typography.Text>
        </div>
        <Button type="primary" onClick={() => setCreateVisible(true)}>
          新建口径
        </Button>
      </div>

      <Table<CaliberItem>
        rowKey="id"
        columns={columns}
        dataSource={calibers}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        style={{ background: '#fff', borderRadius: 12 }}
      />

      <Modal
        title="新建口径"
        width={640}
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
        destroyOnClose
      >
        {renderForm(createForm, true)}
      </Modal>

      <Modal
        title={`编辑口径 · ${editingRecord?.code || ''}`}
        width={640}
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingRecord(null);
        }}
        footer={null}
        destroyOnClose
      >
        {renderForm(editForm, false)}
      </Modal>
    </Space>
  );
}
