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
import { useUi } from '../i18n/useUi';
import { contractNameOptions } from '../mock/data';

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
  const ui = useUi();
const MONITOR_TYPE_OPTIONS = [
  { label: ui.t('买一价格', 'Best bid'), value: '买一价格' },
  { label: ui.t('卖一价格', 'Best ask'), value: '卖一价格' },
  { label: ui.t('标记价格', 'Mark price'), value: '标记价格' },
  { label: ui.t('最新成交价', 'Last trade price'), value: '最新成交价' },
  { label: ui.t('买卖中间价', 'Mid price'), value: '买卖中间价' },
  { label: ui.t('指数价格', 'Index price'), value: '指数价格' },
];
const PERIOD_UNIT_OPTIONS = [
  { label: ui.t('秒', 'sec'), value: '秒' },
  { label: ui.t('分钟', 'min'), value: '分钟' },
];
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
    { title: ui.t('合约', 'Contract'), dataIndex: 'contract', width: 110 },
    { title: ui.t('告警值', 'Alert value'), dataIndex: 'alertValue', width: 90 },
    { title: ui.t('监控类型1', 'Monitor type 1'), dataIndex: 'type1', width: 110 },
    { title: ui.t('价格1', 'Price 1'), dataIndex: 'price1', width: 110 },
    { title: ui.t('监控类型2', 'Monitor type 2'), dataIndex: 'type2', width: 110 },
    { title: ui.t('价格2', 'Price 2'), dataIndex: 'price2', width: 110 },
    { title: ui.t('监控周期', 'Monitor period'), dataIndex: 'period', width: 100 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 170 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: ui.t('监控类型1', 'Monitor type 1'), dataIndex: 'type1', width: 120 },
    { title: ui.t('监控类型2', 'Monitor type 2'), dataIndex: 'type2', width: 120 },
    { title: ui.t('告警值', 'Alert value'), dataIndex: 'alertValue', width: 90 },
    { title: ui.t('监控周期', 'Monitor period'), dataIndex: 'period', width: 100 },
    { title: ui.t('关联合约', 'Linked contract'), dataIndex: 'contract', width: 110 },
    { title: ui.t('预警群/通知', 'Alert group / notify'), dataIndex: 'notify', width: 200 },
    {
      title: ui.t('状态', 'Status'),
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="success">生效中</Tag> : <Tag>已停用</Tag>),
    },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      width: 140,
      render: (_: unknown, record: ConfigRecord) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => toggleConfig(record.key)}>
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.contract}`)}>
            {ui.t('编辑', 'Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('spread-alert-monitor')}</div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'records', label: ui.alertRecords },
          { key: 'config', label: ui.monitorConfig },
        ]}
        style={{ marginBottom: 8 }}
      />

      {tab === 'records' && (
        <>
          <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item label={ui.contractName} name="contractName">
              <Input placeholder={ui.t("请输入合约名称", "Enter contract name")} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>
                  {ui.search}
                </Button>
                <Button onClick={() => filterForm.resetFields()}>{ui.reset}</Button>
              </Space>
            </Form.Item>
          </Form>
          <Table
            rowKey="key"
            columns={alertColumns}
            dataSource={ALERT_ROWS}
            scroll={{ x: 1100 }}
            pagination={{ total: ALERT_ROWS.length, showTotal: (t) => ui.total(t), pageSize: 10 }}
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
            pagination={{ total: configs.length, showTotal: (t) => ui.total(t), pageSize: 10 }}
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
            label={ui.t('监控类型1', 'Monitor type 1')}
            name="type1"
            rules={[{ required: true, message: ui.t('请选择监控类型1', 'Select monitor type 1') }]}
          >
            <Select placeholder={ui.t('请选择监控类型1', 'Select monitor type 1')} options={MONITOR_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            label={ui.t('监控类型2', 'Monitor type 2')}
            name="type2"
            rules={[{ required: true, message: ui.t('请选择监控类型2', 'Select monitor type 2') }]}
          >
            <Select placeholder={ui.t('请选择监控类型2', 'Select monitor type 2')} options={MONITOR_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            label={ui.t('告警值', 'Alert value')}
            name="alertValue"
            rules={[{ required: true, message: ui.t('请输入告警值', 'Enter alert value') }]}
          >
            <InputNumber addonAfter="%" style={{ width: '100%' }} placeholder={ui.t('请输入告警值', 'Enter alert value')} min={0} step={0.01} />
          </Form.Item>
          <Form.Item label={ui.t('监控周期', 'Monitor period')} required style={{ marginBottom: 0 }}>
            <Space align="start">
              <Form.Item
                name="periodValue"
                rules={[{ required: true, message: ui.t('请输入周期', 'Enter period') }]}
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
            label={ui.t('关联合约', 'Linked contract')}
            name="contract"
            rules={[{ required: true, message: ui.t('请选择关联合约', 'Select linked contract') }]}
          >
            <Select placeholder={ui.t('请选择关联合约', 'Select linked contract')} options={contractNameOptions} />
          </Form.Item>
          <Form.Item
            label={ui.t('预警群', 'Alert group')}
            name="notify"
            rules={[{ required: true, message: ui.t('请输入 Lark 机器人 URL', 'Enter Lark bot URL') }]}
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
