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
    { title: '合约', dataIndex: 'contract', width: 110 },
    { title: '资金费率数值', dataIndex: 'fundingRate', width: 120 },
    { title: '收取周期 (Hour)', dataIndex: 'cycle', width: 130 },
    { title: '对标交易所', dataIndex: 'exchange', width: 110 },
    { title: '对标交易所资金费率', dataIndex: 'exchangeRate', width: 180 },
    { title: '对标交易所收取周期 (Hour)', dataIndex: 'exchangeCycle', width: 190 },
    { title: '告警时间', dataIndex: 'alertTime', width: 170 },
    { title: '告警方式', dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: '合约名称', dataIndex: 'contract', width: 110 },
    { title: '对标交易所', dataIndex: 'exchanges', width: 220 },
    { title: '监控阈值', dataIndex: 'threshold', width: 100 },
    { title: '监控频率 (min)', dataIndex: 'frequency', width: 130 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    { title: '更新人', dataIndex: 'updatedBy', width: 220 },
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
          <Button
            type="link"
            size="small"
            danger={record.enabled}
            onClick={() => toggleConfig(record.key)}
          >
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
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>监控告警 / 外部资金费率监控</div>

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
              gap: 16,
            }}
          >
            <Form form={filterForm} layout="inline" style={{ flex: 1 }}>
              <Form.Item label="合约名称" name="contractName">
                <Input placeholder="请输入合约名称" style={{ width: 200 }} />
              </Form.Item>
            </Form>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => filterForm.resetFields()}>重置</Button>
            </Space>
          </div>
          <Table
            rowKey="key"
            columns={alertColumns}
            dataSource={ALERT_ROWS}
            scroll={{ x: 1200 }}
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
            scroll={{ x: 1200 }}
            pagination={{
              total: configs.length,
              showTotal: (t) => `共 ${t} 条记录`,
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
            label="合约名称"
            name="contract"
            rules={[{ required: true, message: '请选择合约名称' }]}
          >
            <Select placeholder="请选择合约名称" options={contractNameOptions} />
          </Form.Item>

          <Form.Item label="对标交易所" name="exchanges">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择对标交易所"
              options={EXCHANGE_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label="监控阈值"
            name="threshold"
            rules={[{ required: true, message: '请输入监控阈值' }]}
          >
            <Input placeholder="请输入监控阈值" />
          </Form.Item>

          <Form.Item
            label="监控频率"
            name="frequency"
            rules={[{ required: true, message: '请输入监控频率' }]}
          >
            <Input placeholder="请输入监控频率" suffix="min" />
          </Form.Item>

          <Form.Item
            label="预警群"
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
