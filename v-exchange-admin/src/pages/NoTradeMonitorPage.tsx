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
  alertType: string;
  alertValue: string;
  alertTime: string;
  method: string;
}

interface ConfigRecord {
  key: string;
  alertType: string;
  alertValue: string;
  contract: string;
  notify: string;
  enabled: boolean;
}

const ALERT_ROWS: AlertRecord[] = [
  {
    key: '1',
    contract: 'XAU_USD',
    alertType: '长时间无交易',
    alertValue: '40 秒',
    alertTime: '2026-10-31 20:38:40',
    method: 'Lark',
  },
  {
    key: '2',
    contract: 'XAU_USD',
    alertType: '长时间无交易',
    alertValue: '40 秒',
    alertTime: '2026-10-31 20:28:12',
    method: 'Lark',
  },
  {
    key: '3',
    contract: 'XAU_USD',
    alertType: '长时间无交易',
    alertValue: '40 秒',
    alertTime: '2026-10-31 19:55:03',
    method: 'Lark',
  },
  {
    key: '4',
    contract: 'BTC_USD',
    alertType: '长时间无交易',
    alertValue: '60 秒',
    alertTime: '2026-10-31 18:11:22',
    method: 'Lark',
  },
];

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    alertType: '超时未成交',
    alertValue: '40 秒',
    contract: 'XAU_USD',
    notify: 'https://open.larksuite.com/open-apis/bot/v2/hook/xxx',
    enabled: true,
  },
];

export function NoTradeMonitorPage() {
  const ui = useUi();
const DURATION_UNITS = [
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
    form.setFieldsValue({ durationUnit: '秒', durationValue: 40 });
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfigs((prev) => [
        {
          key: String(Date.now()),
          alertType: '超时未成交',
          alertValue: `${values.durationValue} ${values.durationUnit}`,
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
    { title: ui.t('合约', 'Contract'), dataIndex: 'contract', width: 120 },
    { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 140 },
    { title: ui.t('告警值', 'Alert value'), dataIndex: 'alertValue', width: 100 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 180 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 100 },
  ];

  const configColumns = [
    { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 140 },
    { title: ui.t('告警值', 'Alert value'), dataIndex: 'alertValue', width: 120 },
    { title: ui.t('关联合约', 'Linked contract'), dataIndex: 'contract', width: 120 },
    {
      title: ui.t('状态', 'Status'),
      dataIndex: 'enabled',
      width: 100,
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
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('no-trade-monitor')}</div>

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
        width={520}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item label={ui.t('持续时长', 'Duration')} required style={{ marginBottom: 0 }}>
            <Space align="start">
              <Form.Item
                name="durationValue"
                rules={[{ required: true, message: ui.t('请输入持续时长数值', 'Enter duration value') }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: 200 }}
                  placeholder={ui.t('请输入持续时长数值', 'Enter duration value')}
                />
              </Form.Item>
              <Form.Item
                name="durationUnit"
                rules={[{ required: true, message: ui.t('请选择持续时长单位', 'Select duration unit') }]}
              >
                <Select
                  style={{ width: 180 }}
                  placeholder={ui.t('请选择持续时长单位', 'Select duration unit')}
                  options={DURATION_UNITS}
                />
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
            rules={[{ required: true, message: '请填写 Lark 机器人 URL' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔"
            />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
