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

const { TextArea } = Input;

const PERIOD_UNITS = [
  { label: '秒', value: '秒' },
  { label: '分钟', value: '分钟' },
];

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
    { title: '合约', dataIndex: 'contract', width: 110 },
    { title: '平台资金费率', dataIndex: 'platformRate', width: 130 },
    { title: '监控周期', dataIndex: 'period', width: 110 },
    { title: '监控费率上限', dataIndex: 'upperLimit', width: 130 },
    { title: '监控费率下限', dataIndex: 'lowerLimit', width: 130 },
    { title: '告警时间', dataIndex: 'alertTime', width: 170 },
    { title: '告警方式', dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: '合约名称', dataIndex: 'contract', width: 110 },
    { title: '监控周期', dataIndex: 'period', width: 110 },
    { title: '监控费率上限', dataIndex: 'upperLimit', width: 130 },
    { title: '监控费率下限', dataIndex: 'lowerLimit', width: 130 },
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
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>监控告警 / 内部资金费率监控</div>

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
            dataSource={[]}
            locale={{ emptyText: '暂无数据' }}
            pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
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

          <Form.Item label="监控费率上限" name="upperLimit">
            <Input placeholder="请输入监控费率上限" suffix="%" />
          </Form.Item>

          <Form.Item label="监控费率下限" name="lowerLimit">
            <Input placeholder="请输入监控费率下限" suffix="%" />
          </Form.Item>

          <Form.Item label="监控周期" required style={{ marginBottom: 0 }}>
            <Space align="start">
              <Form.Item
                name="periodValue"
                rules={[{ required: true, message: '请输入监控周期' }]}
                style={{ marginBottom: 24 }}
              >
                <InputNumber min={1} style={{ width: 220 }} placeholder="请输入监控周期" />
              </Form.Item>
              <Form.Item
                name="periodUnit"
                rules={[{ required: true, message: '请选择监控周期单位' }]}
                style={{ marginBottom: 24 }}
              >
                <Select style={{ width: 180 }} placeholder="请输入监控周期" options={PERIOD_UNITS} />
              </Form.Item>
            </Space>
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
