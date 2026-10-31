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
import { useUi } from '../i18n/useUi';
import { contractNameOptions } from '../mock/data';

const { Text } = Typography;
const { TextArea } = Input;

const COMPETITOR_OPTIONS = [
  { label: 'Binance', value: 'Binance' },
  { label: 'Bybit', value: 'Bybit' },
  { label: 'OKX', value: 'OKX' },
  { label: 'Bitget', value: 'Bitget' },
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
  const ui = useUi();
const PERIOD_UNITS = [
  { label: ui.t('秒', 'sec'), value: '秒' },
  { label: ui.t('分钟', 'min'), value: '分钟' },
];
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
    { title: ui.t('合约', 'Contract'), dataIndex: 'contract', width: 110 },
    { title: ui.t('监控周期', 'Monitor period'), dataIndex: 'period', width: 100 },
    { title: ui.t('监控对标友商', 'Benchmark competitor'), dataIndex: 'competitor', width: 120 },
    { title: ui.t('偏差类型', 'Deviation type'), dataIndex: 'deviationType', width: 100 },
    { title: ui.t('偏差值', 'Deviation'), dataIndex: 'deviationValue', width: 90 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 170 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: ui.t('监控友商', 'Competitor'), dataIndex: 'competitors', width: 220 },
    { title: ui.t('监控信息', 'Monitor info'), dataIndex: 'monitorInfo', width: 240 },
    { title: ui.t('监控周期', 'Monitor period'), dataIndex: 'period', width: 100 },
    {
      title: ui.t('关联合约', 'Linked contract'),
      dataIndex: 'contractCount',
      width: 90,
      render: (v: number) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => message.info(`关联合约：${v}`)}>
          {v}
        </Button>
      ),
    },
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
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.competitors}`)}>
            {ui.t('编辑', 'Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('competitor-spread-monitor')}</div>

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
            scroll={{ x: 900 }}
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
            scroll={{ x: 1300 }}
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
        width={640}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item
            label={ui.t('监控友商', 'Competitor')}
            name="competitors"
            rules={[{ required: true, message: ui.t('请选择监控友商', 'Select competitor') }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder={ui.t('请选择监控友商', 'Select competitor')}
              options={COMPETITOR_OPTIONS}
            />
          </Form.Item>

          <Form.Item label={ui.t('监控信息', 'Monitor info')} required style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="enableLatest" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text style={{ width: LABEL_WIDTH, flexShrink: 0 }}>最新价</Text>
                <Form.Item name="latestPct" noStyle>
                  <Input
                    placeholder={ui.t('请输入最新价偏差阈值', 'Enter last price deviation')}
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
                    placeholder={ui.t('请输入指数价偏差阈值', 'Enter index price deviation')}
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
                    placeholder={ui.t('请输入标记价偏差阈值', 'Enter mark price deviation')}
                    suffix="%"
                    disabled={!enableMark}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </div>
            </div>
          </Form.Item>

          <Form.Item label={ui.t('监控周期', 'Monitor period')} required style={{ marginBottom: 0 }}>
            <Space align="start" style={{ width: '100%' }}>
              <Form.Item
                name="periodValue"
                rules={[{ required: true, message: ui.t('请输入监控周期数值', 'Enter monitor period') }]}
                style={{ flex: 1, marginBottom: 24 }}
              >
                <InputNumber
                  min={1}
                  style={{ width: 240 }}
                  placeholder={ui.t('请输入监控周期数值', 'Enter monitor period')}
                />
              </Form.Item>
              <Form.Item
                name="periodUnit"
                rules={[{ required: true, message: ui.t('请选择监控周期单位', 'Select period unit') }]}
                style={{ marginBottom: 24 }}
              >
                <Select
                  style={{ width: 200 }}
                  placeholder={ui.t('请选择监控周期单位', 'Select period unit')}
                  options={PERIOD_UNITS}
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label={ui.t('关联合约', 'Linked contract')}
            name="contracts"
            rules={[{ required: true, message: ui.t('请选择关联合约', 'Select linked contract') }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder={ui.t('请选择关联合约', 'Select linked contract')}
              options={contractNameOptions}
            />
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
