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

const { TextArea } = Input;

interface ConfigRecord {
  key: string;
  contract: string;
  period: string;
  upperLimit: string;
  lowerLimit: string;
  updateTime: string;
  updatedBy: string;
  enabled: boolean;
}

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    contract: 'XAU_USD',
    period: '10 分钟',
    upperLimit: '0.45%',
    lowerLimit: '-0.45%',
    updateTime: '2026-09-22 13:37:03',
    updatedBy: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '2',
    contract: 'BTC_USD',
    period: '10 分钟',
    upperLimit: '0.25%',
    lowerLimit: '-0.25%',
    updateTime: '2026-09-22 18:18:23',
    updatedBy: 'natalie.chen@hytechc.com',
    enabled: false,
  },
];

export function InternalFundingRateMonitorPage() {
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

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ periodUnit: '分钟' });
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const fmt = (v: unknown) => {
        if (v == null || v === '') return '--';
        const s = String(v);
        return s.includes('%') ? s : `${s}%`;
      };
      setConfigs((prev) => [
        {
          key: String(Date.now()),
          contract: values.contract,
          period: `${values.periodValue} ${values.periodUnit}`,
          upperLimit: fmt(values.upperLimit),
          lowerLimit: fmt(values.lowerLimit),
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
    { title: ui.t('平台资金费率', 'Platform funding rate'), dataIndex: 'platformRate', width: 130 },
    { title: ui.t('监控周期', 'Monitor period'), dataIndex: 'period', width: 110 },
    { title: ui.t('监控费率上限', 'Rate upper limit'), dataIndex: 'upperLimit', width: 130 },
    { title: ui.t('监控费率下限', 'Rate lower limit'), dataIndex: 'lowerLimit', width: 130 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 170 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: ui.t('合约名称', 'Contract'), dataIndex: 'contract', width: 110 },
    { title: ui.t('监控周期', 'Monitor period'), dataIndex: 'period', width: 110 },
    { title: ui.t('监控费率上限', 'Rate upper limit'), dataIndex: 'upperLimit', width: 130 },
    { title: ui.t('监控费率下限', 'Rate lower limit'), dataIndex: 'lowerLimit', width: 130 },
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
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('internal-funding-rate-monitor')}</div>

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
            dataSource={[]}
            locale={{ emptyText: ui.empty }}
            pagination={{ showTotal: (t) => ui.total(t), pageSize: 10 }}
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

          <Form.Item label={ui.t('监控费率上限', 'Rate upper limit')} name="upperLimit">
            <Input placeholder={ui.t('请输入监控费率上限', 'Enter rate upper limit')} suffix="%" />
          </Form.Item>

          <Form.Item label={ui.t('监控费率下限', 'Rate lower limit')} name="lowerLimit">
            <Input placeholder={ui.t('请输入监控费率下限', 'Enter rate lower limit')} suffix="%" />
          </Form.Item>

          <Form.Item label={ui.t('监控周期', 'Monitor period')} required style={{ marginBottom: 0 }}>
            <Space align="start">
              <Form.Item
                name="periodValue"
                rules={[{ required: true, message: ui.t('请输入监控周期', 'Enter monitor period') }]}
                style={{ marginBottom: 24 }}
              >
                <InputNumber min={1} style={{ width: 220 }} placeholder={ui.t('请输入监控周期', 'Enter monitor period')} />
              </Form.Item>
              <Form.Item
                name="periodUnit"
                rules={[{ required: true, message: ui.t('请选择监控周期单位', 'Select period unit') }]}
                style={{ marginBottom: 24 }}
              >
                <Select style={{ width: 180 }} placeholder={ui.t('请输入监控周期', 'Enter monitor period')} options={PERIOD_UNITS} />
              </Form.Item>
            </Space>
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
