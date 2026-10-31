import { DownOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';

const { TextArea } = Input;

const ID_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '账户ID', value: 'account' },
  { label: '用户ID', value: 'user' },
];

const BROKER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '默认Broker', value: 'default' },
];

const LIMIT_STATUS_OPTIONS = [
  { label: '禁止开仓', value: 'forbid-open' },
  { label: '禁止平仓', value: 'forbid-close' },
  { label: '禁止开平仓', value: 'forbid-both' },
];

export function OpenCloseLimitPage() {
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [tab, setTab] = useState('current');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const openCreate = () => {
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await form.validateFields();
      message.success('限制已设置');
      setDrawerOpen(false);
    } catch {
      /* inline */
    }
  };

  const columns = [
    { title: 'ID类型', dataIndex: 'idType', width: 100 },
    { title: 'ID', dataIndex: 'id', width: 140 },
    { title: '所属Broker', dataIndex: 'broker', width: 120 },
    { title: '限制状态', dataIndex: 'limitStatus', width: 120 },
    { title: '执行来源', dataIndex: 'execSource', width: 120 },
    { title: '最近处置人', dataIndex: 'handler', width: 140 },
    { title: '最近处置时间', dataIndex: 'handleTime', width: 170 },
    { title: '处置原因', dataIndex: 'reason', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: () => (
        <Button type="link" size="small">
          解除
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="开平仓限制">
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'current', label: '当前限制中' },
          { key: 'records', label: '处置记录' },
        ]}
        style={{ marginBottom: 8 }}
      />

      <Form
        form={filterForm}
        layout="inline"
        style={{ marginBottom: 12, flexWrap: 'wrap' }}
        initialValues={{ idType: 'all', broker: 'all' }}
      >
        <Form.Item label="ID类型" name="idType">
          <Select style={{ width: 140 }} options={ID_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item label="ID" name="id">
          <Input placeholder="账户ID或用户ID" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label="所属Broker" name="broker">
          <Select style={{ width: 140 }} options={BROKER_OPTIONS} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => filterForm.resetFields()}>重置</Button>
            <Button type="link" onClick={() => setExpanded((v) => !v)}>
              {expanded ? '收起' : '展开'} <DownOutlined rotate={expanded ? 180 : 0} />
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {expanded && (
        <div style={{ marginBottom: 12, color: '#999', fontSize: 12 }}>
          可扩展更多筛选条件（预留）
        </div>
      )}

      {tab === 'current' && (
        <div className="table-toolbar">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增限制
          </Button>
        </div>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={[]}
        scroll={{ x: 1300 }}
        locale={{ emptyText: '暂无数据' }}
        pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />

      <Drawer
        title="新增限制"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleConfirm}>
                确认设置
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark>
          <Form.Item
            label="所属Broker"
            name="broker"
            rules={[{ required: true, message: '请选择Broker' }]}
          >
            <Select
              placeholder="请选择Broker"
              options={BROKER_OPTIONS.filter((o) => o.value !== 'all')}
            />
          </Form.Item>

          <Form.Item
            label="ID类型"
            name="idType"
            rules={[{ required: true, message: '请选择ID类型' }]}
          >
            <Select
              placeholder="请选择ID类型"
              options={ID_TYPE_OPTIONS.filter((o) => o.value !== 'all')}
            />
          </Form.Item>

          <Form.Item
            label="ID"
            name="ids"
            rules={[{ required: true, message: '请输入ID' }]}
            extra="填写账户 ID 或用户 ID（与上方 ID 类型一致）。单个直接输入；批量用中文或英文逗号分隔，例如 10001,10002。"
          >
            <TextArea
              rows={4}
              placeholder="单个直接输入；批量用中英文逗号分隔，如 10001,10002"
            />
          </Form.Item>

          <Form.Item
            label="限制状态"
            name="limitStatus"
            rules={[{ required: true, message: '请选择限制类型' }]}
          >
            <Select placeholder="请选择限制类型" options={LIMIT_STATUS_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="处置原因"
            name="reason"
            rules={[
              { required: true, message: '请输入处置原因' },
              { max: 200, message: '最多 200 字' },
            ]}
          >
            <TextArea rows={4} showCount maxLength={200} placeholder="请输入处置原因" />
          </Form.Item>
        </Form>
      </Drawer>
    </AdminPageShell>
  );
}
