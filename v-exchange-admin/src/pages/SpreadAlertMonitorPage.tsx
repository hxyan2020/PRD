import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

const MONITOR_TYPE_OPTIONS = [
  { label: '买一价格', value: '买一价格' },
  { label: '卖一价格', value: '卖一价格' },
  { label: '标记价格', value: '标记价格' },
  { label: '最新成交价', value: '最新成交价' },
  { label: '买卖中间价', value: '买卖中间价' },
  { label: '指数价格', value: '指数价格' },
];

const PERIOD_UNIT_OPTIONS = [
  { label: '秒', value: '秒' },
  { label: '分钟', value: '分钟' },
];

interface AlertRecord {
  key: string;
  contract: string;
  alertValue: string;
  type1: string;
  price1: string;
  type2: string;
  price2: string;
  period: string;
  alertTime: string;
  method: string;
}

interface ConfigRecord {
  key: string;
  type1: string;
  type2: string;
  alertValue: string;
  period: string;
  contract: string;
  notify: string;
  enabled: boolean;
}

const ALERT_ROWS: AlertRecord[] = [
  {
    key: '1',
    contract: 'XAU_USD',
    alertValue: '0.1%',
    type1: '买一价格',
    price1: '3887.24',
    type2: '卖一价格',
    price2: '3894.51',
    period: '5分钟',
    alertTime: '2026-10-31 01:34:30',
    method: 'Lark',
  },
  {
    key: '2',
    contract: 'XAU_USD',
    alertValue: '0.1%',
    type1: '买一价格',
    price1: '3886.10',
    type2: '卖一价格',
    price2: '3893.80',
    period: '5分钟',
    alertTime: '2026-10-31 01:29:12',
    method: 'Lark',
  },
  {
    key: '3',
    contract: 'XAU_USD',
    alertValue: '0.1%',
    type1: '买一价格',
    price1: '3885.02',
    type2: '卖一价格',
    price2: '3892.40',
    period: '5分钟',
    alertTime: '2026-10-31 01:24:05',
    method: 'Lark',
  },
  {
    key: '4',
    contract: 'BTC_USD',
    alertValue: '0.05%',
    type1: '标记价格',
    price1: '67210.5',
    type2: '指数价格',
    price2: '67245.2',
    period: '1分钟',
    alertTime: '2026-10-30 22:11:08',
    method: 'Lark',
  },
];

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    type1: '买一价格',
    type2: '卖一价格',
    alertValue: '0.1%',
    period: '5分钟',
    contract: 'XAU_USD',
    notify: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '2',
    type1: '标记价格',
    type2: '指数价格',
    alertValue: '0.05%',
    period: '1分钟',
    contract: 'BTC_USD',
    notify: 'gary.liang@hytechc.com',
    enabled: true,
  },
  {
    key: '3',
    type1: '最新成交价',
    type2: '标记价格',
    alertValue: '0.2%',
    period: '5分钟',
    contract: 'XAU_USD',
    notify: 'natalie.chen@hytechc.com',
    enabled: true,
  },
];

export function SpreadAlertMonitorPage() {
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [tab, setTab] = useState('records');
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState(INITIAL_CONFIGS);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ periodUnit: '分钟', periodValue: 5 });
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfigs((prev) => [
        {
          key: String(Date.now()),
          type1: values.type1,
          type2: values.type2,
          alertValue: `${values.alertValue}%`,
          period: `${values.periodValue}${values.periodUnit}`,
          contract: values.contract,
          notify: values.notify,
          enabled: true,
        },
        ...prev,
      ]);
      message.success('已新增监控');
      setOpen(false);
    } catch {
      /* inline */
    }
  };

  const toggleConfig = (key: string) => {
    setConfigs((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const enabled = !row.enabled;
        message.success(enabled ? '已启用' : '已停用');
        return { ...row, enabled };
      }),
    );
  };

  const alertColumns = [
    { title: '合约', dataIndex: 'contract', width: 110 },
    { title: '告警值', dataIndex: 'alertValue', width: 90 },
    { title: '监控类型1', dataIndex: 'type1', width: 110 },
    { title: '价格1', dataIndex: 'price1', width: 110 },
    { title: '监控类型2', dataIndex: 'type2', width: 110 },
    { title: '价格2', dataIndex: 'price2', width: 110 },
    { title: '监控周期', dataIndex: 'period', width: 100 },
    { title: '告警时间', dataIndex: 'alertTime', width: 170 },
    { title: '告警方式', dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: '监控类型1', dataIndex: 'type1', width: 120 },
    { title: '监控类型2', dataIndex: 'type2', width: 120 },
    { title: '告警值', dataIndex: 'alertValue', width: 90 },
    { title: '监控周期', dataIndex: 'period', width: 100 },
    { title: '关联合约', dataIndex: 'contract', width: 110 },
    { title: '预警群/通知', dataIndex: 'notify', width: 200 },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="success">生效中</Tag> : <Tag>已停用</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: ConfigRecord) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => toggleConfig(record.key)}>
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.contract}`)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>监控告警 / 价差预警监控</div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'records', label: '告警记录' },
          { key: 'config', label: '监控配置' },
        ]}
        style={{ marginBottom: 8 }}
      />

      {tab === 'records' && (
        <>
          <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item label="合约名称" name="contractName">
              <Input placeholder="请输入合约名称" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={() => filterForm.resetFields()}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
          <Table
            rowKey="key"
            columns={alertColumns}
            dataSource={ALERT_ROWS}
            scroll={{ x: 1100 }}
            pagination={{ total: ALERT_ROWS.length, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
            size="small"
          />
        </>
      )}

      {tab === 'config' && (
        <>
          <div className="table-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              增加监控
            </Button>
          </div>
          <Table
            rowKey="key"
            columns={configColumns}
            dataSource={configs}
            scroll={{ x: 1100 }}
            pagination={{ total: configs.length, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
            size="small"
          />
        </>
      )}

      <Modal
        title="新增 - 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText="确定"
        cancelText="取消"
        width={560}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item
            label="监控类型1"
            name="type1"
            rules={[{ required: true, message: '请选择监控类型1' }]}
          >
            <Select placeholder="请选择监控类型1" options={MONITOR_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            label="监控类型2"
            name="type2"
            rules={[{ required: true, message: '请选择监控类型2' }]}
          >
            <Select placeholder="请选择监控类型2" options={MONITOR_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            label="告警值"
            name="alertValue"
            rules={[{ required: true, message: '请输入告警值' }]}
          >
            <InputNumber addonAfter="%" style={{ width: '100%' }} placeholder="请输入告警值" min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="监控周期" required style={{ marginBottom: 0 }}>
            <Space align="start">
              <Form.Item
                name="periodValue"
                rules={[{ required: true, message: '请输入周期' }]}
              >
                <InputNumber min={1} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item
                name="periodUnit"
                rules={[{ required: true, message: '请选择单位' }]}
              >
                <Select style={{ width: 100 }} options={PERIOD_UNIT_OPTIONS} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item
            label="关联合约"
            name="contract"
            rules={[{ required: true, message: '请选择关联合约' }]}
          >
            <Select placeholder="请选择关联合约" options={contractNameOptions} />
          </Form.Item>
          <Form.Item
            label="预警群"
            name="notify"
            rules={[{ required: true, message: '请输入 Lark 机器人 URL' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="输入 Lark robot URL，多个用英文逗号分隔"
            />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
