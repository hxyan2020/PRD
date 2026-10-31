import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
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

const { TextArea } = Input;

const EXCHANGE_OPTIONS = [
  { label: 'OKX', value: 'OKX' },
  { label: 'Bybit', value: 'Bybit' },
  { label: 'Bitget', value: 'Bitget' },
  { label: 'Binance', value: 'Binance' },
];

interface AlertRecord {
  key: string;
  contract: string;
  fundingRate: string;
  cycle: string;
  exchange: string;
  exchangeRate: string;
  exchangeCycle: string;
  alertTime: string;
  method: string;
}

interface ConfigRecord {
  key: string;
  contract: string;
  exchanges: string;
  threshold: string;
  frequency: number;
  updateTime: string;
  updatedBy: string;
  enabled: boolean;
}

const ALERT_ROWS: AlertRecord[] = [
  { key: '1', contract: 'XAU_USD', fundingRate: '-0.0874%', cycle: '4h', exchange: 'OKEX', exchangeRate: '0.0149270155499%', exchangeCycle: '8h', alertTime: '2026-10-30 15:30:39', method: 'Lark' },
  { key: '2', contract: 'XAU_USD', fundingRate: '-0.1039%', cycle: '4h', exchange: 'BINANCE', exchangeRate: '0%', exchangeCycle: '4h', alertTime: '2026-10-30 15:20:39', method: 'Lark' },
  { key: '3', contract: 'XAU_USD', fundingRate: '-0.1039%', cycle: '4h', exchange: 'BITGET', exchangeRate: '0.0024%', exchangeCycle: '4h', alertTime: '2026-10-30 15:20:39', method: 'Lark' },
  { key: '4', contract: 'XAU_USD', fundingRate: '-0.1039%', cycle: '4h', exchange: 'BYBIT', exchangeRate: '0%', exchangeCycle: '4h', alertTime: '2026-10-30 15:20:39', method: 'Lark' },
  { key: '5', contract: 'XAU_USD', fundingRate: '-0.1216%', cycle: '4h', exchange: 'OKEX', exchangeRate: '0.0127241548651%', exchangeCycle: '8h', alertTime: '2026-10-30 15:10:39', method: 'Lark' },
  { key: '6', contract: 'XAU_USD', fundingRate: '-0.1216%', cycle: '4h', exchange: 'BINANCE', exchangeRate: '0%', exchangeCycle: '4h', alertTime: '2026-10-30 15:10:39', method: 'Lark' },
  { key: '7', contract: 'XAU_USD', fundingRate: '-0.1216%', cycle: '4h', exchange: 'BITGET', exchangeRate: '0.0018%', exchangeCycle: '4h', alertTime: '2026-10-30 15:10:39', method: 'Lark' },
  { key: '8', contract: 'XAU_USD', fundingRate: '-0.1216%', cycle: '4h', exchange: 'BYBIT', exchangeRate: '0%', exchangeCycle: '4h', alertTime: '2026-10-30 15:10:39', method: 'Lark' },
];

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    contract: 'XAU_USD',
    exchanges: 'OKX, Bybit, Bitget, Binance',
    threshold: '0.1%',
    frequency: 10,
    updateTime: '2026-09-22 13:47:57',
    updatedBy: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '2',
    contract: 'BTC_USD',
    exchanges: 'OKX, Bybit, Bitget, Binance',
    threshold: '0.1%',
    frequency: 10,
    updateTime: '2026-09-22 18:16:51',
    updatedBy: 'natalie.chen@hytechc.com',
    enabled: false,
  },
];

export function ExternalFundingRateMonitorPage() {
  const ui = useUi();
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [tab, setTab] = useState('records');
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState(INITIAL_CONFIGS);

  const openCreate = () => {
    form.resetFields();
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const exchanges = Array.isArray(values.exchanges)
        ? values.exchanges.join(', ')
        : values.exchanges || '--';
      const threshold = String(values.threshold).includes('%')
        ? String(values.threshold)
        : `${values.threshold}%`;

      setConfigs((prev) => [
        {
          key: String(Date.now()),
          contract: values.contract,
          exchanges,
          threshold,
          frequency: Number(values.frequency),
          updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedBy: 'Haixiang Yan',
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
    { title: ui.t('资金费率数值', 'Funding rate value'), dataIndex: 'fundingRate', width: 120 },
    { title: ui.t('收取周期 (Hour)', 'Fee cycle (Hour)'), dataIndex: 'cycle', width: 130 },
    { title: ui.t('对标交易所', 'Benchmark exchange'), dataIndex: 'exchange', width: 110 },
    { title: ui.t('对标交易所资金费率', 'Benchmark funding rate'), dataIndex: 'exchangeRate', width: 180 },
    { title: ui.t('对标交易所收取周期 (Hour)', 'Benchmark fee cycle (Hour)'), dataIndex: 'exchangeCycle', width: 190 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 170 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: ui.t('合约名称', 'Contract'), dataIndex: 'contract', width: 110 },
    { title: ui.t('对标交易所', 'Benchmark exchange'), dataIndex: 'exchanges', width: 220 },
    { title: ui.t('监控阈值', 'Monitor threshold'), dataIndex: 'threshold', width: 100 },
    { title: ui.t('监控频率 (min)', 'Monitor frequency (min)'), dataIndex: 'frequency', width: 130 },
    { title: ui.t('更新时间', 'Updated at'), dataIndex: 'updateTime', width: 170 },
    { title: ui.t('更新人', 'Updated by'), dataIndex: 'updatedBy', width: 220 },
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
          <Button
            type="link"
            size="small"
            danger={record.enabled}
            onClick={() => toggleConfig(record.key)}
          >
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
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('external-funding-rate-monitor')}</div>

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
          <div className="filter-toolbar">
            <Form form={filterForm} layout="inline" style={{ flex: 1 }}>
              <Form.Item label={ui.contractName} name="contractName">
                <Input placeholder={ui.t("请输入合约名称", "Enter contract name")} style={{ width: 200 }} />
              </Form.Item>
            </Form>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}>
                {ui.search}
              </Button>
              <Button onClick={() => filterForm.resetFields()}>{ui.reset}</Button>
            </Space>
          </div>
          <Table
            rowKey="key"
            columns={alertColumns}
            dataSource={ALERT_ROWS}
            scroll={{ x: 1200 }}
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
            scroll={{ x: 1200 }}
            pagination={{
              total: configs.length,
              showTotal: (t) => ui.total(t),
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
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
            label={ui.contractName}
            name="contract"
            rules={[{ required: true, message: ui.t('请选择合约名称', 'Select contract') }]}
          >
            <Select placeholder={ui.t('请选择合约名称', 'Select contract')} options={contractNameOptions} />
          </Form.Item>

          <Form.Item label={ui.t('对标交易所', 'Benchmark exchange')} name="exchanges">
            <Select
              mode="multiple"
              allowClear
              placeholder={ui.t('请选择对标交易所', 'Select benchmark exchange')}
              options={EXCHANGE_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label={ui.t('监控阈值', 'Monitor threshold')}
            name="threshold"
            rules={[{ required: true, message: ui.t('请输入监控阈值', 'Enter monitor threshold') }]}
          >
            <Input placeholder={ui.t('请输入监控阈值', 'Enter monitor threshold')} />
          </Form.Item>

          <Form.Item
            label={ui.t('监控频率', 'Monitor frequency')}
            name="frequency"
            rules={[{ required: true, message: ui.t('请输入监控频率', 'Enter monitor frequency') }]}
          >
            <Input placeholder={ui.t('请输入监控频率', 'Enter monitor frequency')} suffix="min" />
          </Form.Item>

          <Form.Item
            label={ui.t('预警群', 'Alert group')}
            name="notify"
            rules={[{ required: true, message: '请填写 Lark 机器人 URL' }]}
          >
            <TextArea rows={4} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
