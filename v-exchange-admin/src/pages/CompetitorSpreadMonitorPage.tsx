import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

const { Text } = Typography;
const { TextArea } = Input;

const COMPETITOR_OPTIONS = [
  { label: 'Binance', value: 'Binance' },
  { label: 'Bybit', value: 'Bybit' },
  { label: 'OKX', value: 'OKX' },
  { label: 'Bitget', value: 'Bitget' },
];

const PERIOD_UNITS = [
  { label: '秒', value: '秒' },
  { label: '分钟', value: '分钟' },
];

const LABEL_WIDTH = 56;

interface AlertRecord {
  key: string;
  contract: string;
  period: string;
  competitor: string;
  deviationType: string;
  deviationValue: string;
  alertTime: string;
  method: string;
}

interface ConfigRecord {
  key: string;
  competitors: string;
  monitorInfo: string;
  period: string;
  contractCount: number;
  updateTime: string;
  updatedBy: string;
  enabled: boolean;
}

const ALERT_ROWS: AlertRecord[] = [
  { key: '1', contract: 'XAU_USD', period: '5分钟', competitor: 'Binance', deviationType: '标记价', deviationValue: '0.5%', alertTime: '2026-09-23 10:55:07', method: 'Lark' },
  { key: '2', contract: 'XAU_USD', period: '5分钟', competitor: 'Bybit', deviationType: '标记价', deviationValue: '0.5%', alertTime: '2026-09-23 10:55:07', method: 'Lark' },
  { key: '3', contract: 'XAU_USD', period: '5分钟', competitor: 'Binance', deviationType: '指数价', deviationValue: '0.3%', alertTime: '2026-09-23 10:55:07', method: 'Lark' },
  { key: '4', contract: 'XAU_USD', period: '5分钟', competitor: 'OKX', deviationType: '指数价', deviationValue: '0.3%', alertTime: '2026-09-23 10:55:07', method: 'Lark' },
  { key: '5', contract: 'XAU_USD', period: '5分钟', competitor: 'OKX', deviationType: '标记价', deviationValue: '0.5%', alertTime: '2026-09-23 10:55:07', method: 'Lark' },
  { key: '6', contract: 'XAU_USD', period: '5分钟', competitor: 'Bitget', deviationType: '标记价', deviationValue: '0.5%', alertTime: '2026-09-23 10:50:12', method: 'Lark' },
  { key: '7', contract: 'XAU_USD', period: '5分钟', competitor: 'Bybit', deviationType: '指数价', deviationValue: '0.3%', alertTime: '2026-09-23 10:50:12', method: 'Lark' },
  { key: '8', contract: 'XAU_USD', period: '5分钟', competitor: 'Bitget', deviationType: '指数价', deviationValue: '0.3%', alertTime: '2026-09-23 10:45:01', method: 'Lark' },
];

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    competitors: 'OKX, Bybit, Bitget, Binance',
    monitorInfo: '最新价 1%, 指数价 0.3%, 标记价 0.5%',
    period: '5 分钟',
    contractCount: 1,
    updateTime: '2026-09-23 10:58:51',
    updatedBy: 'natalie.chen@hytechc.com',
    enabled: false,
  },
];

export function CompetitorSpreadMonitorPage() {
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [tab, setTab] = useState('records');
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState(INITIAL_CONFIGS);
  const enableLatest = Form.useWatch('enableLatest', form);
  const enableIndex = Form.useWatch('enableIndex', form);
  const enableMark = Form.useWatch('enableMark', form);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      enableLatest: false,
      enableIndex: false,
      enableMark: false,
      periodUnit: '分钟',
    });
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!values.enableLatest && !values.enableIndex && !values.enableMark) {
        message.warning('请至少选择一种监控信息');
        return;
      }

      const infoParts: string[] = [];
      if (values.enableLatest) {
        if (values.latestPct == null || values.latestPct === '') {
          message.warning('请填写最新价偏差阈值');
          return;
        }
        infoParts.push(`最新价 ${values.latestPct}%`);
      }
      if (values.enableIndex) {
        if (values.indexPct == null || values.indexPct === '') {
          message.warning('请填写指数价偏差阈值');
          return;
        }
        infoParts.push(`指数价 ${values.indexPct}%`);
      }
      if (values.enableMark) {
        if (values.markPct == null || values.markPct === '') {
          message.warning('请填写标记价偏差阈值');
          return;
        }
        infoParts.push(`标记价 ${values.markPct}%`);
      }

      const competitors = (values.competitors as string[]).join(', ');
      setConfigs((prev) => [
        {
          key: String(Date.now()),
          competitors,
          monitorInfo: infoParts.join(', '),
          period: `${values.periodValue} ${values.periodUnit}`,
          contractCount: Array.isArray(values.contracts) ? values.contracts.length : 1,
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
    { title: '监控周期', dataIndex: 'period', width: 100 },
    { title: '监控对标友商', dataIndex: 'competitor', width: 120 },
    { title: '偏差类型', dataIndex: 'deviationType', width: 100 },
    { title: '偏差值', dataIndex: 'deviationValue', width: 90 },
    { title: '告警时间', dataIndex: 'alertTime', width: 170 },
    { title: '告警方式', dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: '监控友商', dataIndex: 'competitors', width: 220 },
    { title: '监控信息', dataIndex: 'monitorInfo', width: 240 },
    { title: '监控周期', dataIndex: 'period', width: 100 },
    {
      title: '关联合约',
      dataIndex: 'contractCount',
      width: 90,
      render: (v: number) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => message.info(`关联合约：${v}`)}>
          {v}
        </Button>
      ),
    },
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
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.competitors}`)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>监控告警 / 友商价差监控</div>

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
            scroll={{ x: 900 }}
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
            scroll={{ x: 1300 }}
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
        width={640}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item
            label="监控友商"
            name="competitors"
            rules={[{ required: true, message: '请选择监控友商' }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择监控友商"
              options={COMPETITOR_OPTIONS}
            />
          </Form.Item>

          <Form.Item label="监控信息" required style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="enableLatest" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text style={{ width: LABEL_WIDTH, flexShrink: 0 }}>最新价</Text>
                <Form.Item name="latestPct" noStyle>
                  <Input
                    placeholder="请输入最新价偏差阈值"
                    suffix="%"
                    disabled={!enableLatest}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="enableIndex" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text style={{ width: LABEL_WIDTH, flexShrink: 0 }}>指数价</Text>
                <Form.Item name="indexPct" noStyle>
                  <Input
                    placeholder="请输入指数价偏差阈值"
                    suffix="%"
                    disabled={!enableIndex}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="enableMark" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text style={{ width: LABEL_WIDTH, flexShrink: 0 }}>标记价</Text>
                <Form.Item name="markPct" noStyle>
                  <Input
                    placeholder="请输入标记价偏差阈值"
                    suffix="%"
                    disabled={!enableMark}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </div>
            </div>
          </Form.Item>

          <Form.Item label="监控周期" required style={{ marginBottom: 0 }}>
            <Space align="start" style={{ width: '100%' }}>
              <Form.Item
                name="periodValue"
                rules={[{ required: true, message: '请输入监控周期数值' }]}
                style={{ flex: 1, marginBottom: 24 }}
              >
                <InputNumber
                  min={1}
                  style={{ width: 240 }}
                  placeholder="请输入监控周期数值"
                />
              </Form.Item>
              <Form.Item
                name="periodUnit"
                rules={[{ required: true, message: '请选择监控周期单位' }]}
                style={{ marginBottom: 24 }}
              >
                <Select
                  style={{ width: 200 }}
                  placeholder="请选择监控周期单位"
                  options={PERIOD_UNITS}
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label="关联合约"
            name="contracts"
            rules={[{ required: true, message: '请选择关联合约' }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择关联合约"
              options={contractNameOptions}
            />
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
