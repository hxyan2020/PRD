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
import { useUi } from '../i18n/useUi';

const { TextArea } = Input;

export function OpenCloseLimitPage() {
  const ui = useUi();
const ID_TYPE_OPTIONS = [
  { label: ui.t('全部', 'All'), value: 'all' },
  { label: ui.t('账户ID', 'Account ID'), value: 'account' },
  { label: ui.t('用户ID', 'User ID'), value: 'user' },
];
const BROKER_OPTIONS = [
  { label: ui.t('全部', 'All'), value: 'all' },
  { label: ui.t('默认Broker', 'Default broker'), value: 'default' },
];
const LIMIT_STATUS_OPTIONS = [
  { label: ui.t('禁止开仓', 'Forbid open'), value: 'forbid-open' },
  { label: ui.t('禁止平仓', 'Forbid close'), value: 'forbid-close' },
  { label: ui.t('禁止开平仓', 'Forbid open/close'), value: 'forbid-both' },
];
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
    { title: ui.t('ID类型', 'ID type'), dataIndex: 'idType', width: 100 },
    { title: 'ID', dataIndex: 'id', width: 140 },
    { title: ui.t('所属Broker', 'Broker'), dataIndex: 'broker', width: 120 },
    { title: ui.t('限制状态', 'Limit status'), dataIndex: 'limitStatus', width: 120 },
    { title: ui.t('执行来源', 'Exec source'), dataIndex: 'execSource', width: 120 },
    { title: ui.t('最近处置人', 'Last handler'), dataIndex: 'handler', width: 140 },
    { title: ui.t('最近处置时间', 'Last handle time'), dataIndex: 'handleTime', width: 170 },
    { title: ui.t('处置原因', 'Handle reason'), dataIndex: 'reason', width: 180 },
    {
      title: ui.t('操作', 'Action'),
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
    <AdminPageShell title={ui.pageTitle('open-close-limit')}>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'current', label: ui.t('当前限制中', 'Currently limited') },
          { key: 'records', label: ui.t('处置记录', 'Handle records') },
        ]}
        style={{ marginBottom: 8 }}
      />

      <Form
        form={filterForm}
        layout="inline"
        style={{ marginBottom: 12, flexWrap: 'wrap' }}
        initialValues={{ idType: 'all', broker: 'all' }}
      >
        <Form.Item label={ui.t('ID类型', 'ID type')} name="idType">
          <Select style={{ width: 140 }} options={ID_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item label="ID" name="id">
          <Input placeholder="账户ID或用户ID" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label={ui.t('所属Broker', 'Broker')} name="broker">
          <Select style={{ width: 140 }} options={BROKER_OPTIONS} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => filterForm.resetFields()}>{ui.reset}</Button>
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
        locale={{ emptyText: ui.empty }}
        pagination={{ showTotal: (t) => ui.total(t), pageSize: 10 }}
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
            label={ui.t('所属Broker', 'Broker')}
            name="broker"
            rules={[{ required: true, message: ui.t('请选择Broker', 'Select broker') }]}
          >
            <Select
              placeholder={ui.t('请选择Broker', 'Select broker')}
              options={BROKER_OPTIONS.filter((o) => o.value !== 'all')}
            />
          </Form.Item>

          <Form.Item
            label={ui.t('ID类型', 'ID type')}
            name="idType"
            rules={[{ required: true, message: ui.t('请选择ID类型', 'Select ID type') }]}
          >
            <Select
              placeholder={ui.t('请选择ID类型', 'Select ID type')}
              options={ID_TYPE_OPTIONS.filter((o) => o.value !== 'all')}
            />
          </Form.Item>

          <Form.Item
            label="ID"
            name="ids"
            rules={[{ required: true, message: ui.t('请输入ID', 'Enter ID') }]}
            extra="填写账户 ID 或用户 ID（与上方 ID 类型一致）。单个直接输入；批量用中文或英文逗号分隔，例如 10001,10002。"
          >
            <TextArea
              rows={4}
              placeholder="单个直接输入；批量用中英文逗号分隔，如 10001,10002"
            />
          </Form.Item>

          <Form.Item
            label={ui.t('限制状态', 'Limit status')}
            name="limitStatus"
            rules={[{ required: true, message: ui.t('请选择限制类型', 'Select limit type') }]}
          >
            <Select placeholder={ui.t('请选择限制类型', 'Select limit type')} options={LIMIT_STATUS_OPTIONS} />
          </Form.Item>

          <Form.Item
            label={ui.t('处置原因', 'Handle reason')}
            name="reason"
            rules={[
              { required: true, message: ui.t('请输入处置原因', 'Enter handle reason') },
              { max: 200, message: '最多 200 字' },
            ]}
          >
            <TextArea rows={4} showCount maxLength={200} placeholder={ui.t('请输入处置原因', 'Enter handle reason')} />
          </Form.Item>
        </Form>
      </Drawer>
    </AdminPageShell>
  );
}
