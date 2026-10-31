import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';

const { TextArea } = Input;

interface ConfigRecord {
  key: string;
  positionValue: string;
  mmrThreshold: string;
  updateTime: string;
  updatedBy: string;
  enabled: boolean;
}

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    positionValue: '100,000',
    mmrThreshold: '95%',
    updateTime: '2026-09-22 13:37:59',
    updatedBy: 'alex.huang@hytechc.com',
    enabled: true,
  },
];

export function LargeLiquidationAlertPage() {
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
      const positionValue = Number(String(values.positionValue).replace(/,/g, '')).toLocaleString('en-US');
      const mmr = String(values.mmrThreshold).includes('%')
        ? String(values.mmrThreshold)
        : `${values.mmrThreshold}%`;

      setConfigs((prev) => [
        {
          key: String(Date.now()),
          positionValue,
          mmrThreshold: mmr,
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
    { title: ui.t('合约账户ID', 'Contract account ID'), dataIndex: 'accountId', width: 140 },
    { title: ui.t('持仓信息', 'Position info'), dataIndex: 'positionInfo', width: 180 },
    { title: ui.t('仓位模式', 'Position mode'), dataIndex: 'positionMode', width: 110 },
    { title: 'MMR', dataIndex: 'mmr', width: 100 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 170 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 90 },
  ];

  const configColumns = [
    { title: ui.t('爆仓预警仓位价值阈值 (USD)', 'Liq. alert position value (USD)'), dataIndex: 'positionValue', width: 220 },
    { title: ui.t('爆仓预警MMR阈值', 'Liq. alert MMR threshold'), dataIndex: 'mmrThreshold', width: 160 },
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
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.positionValue}`)}>
            {ui.t('编辑', 'Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('large-liquidation-alert')}</div>

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
              <Form.Item label={ui.t("合约账户ID", "Account ID")} name="accountId">
                <Input placeholder={ui.t("请输入合约账户ID", "Enter account ID")} style={{ width: 220 }} />
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
            scroll={{ x: 1000 }}
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
            label={ui.t('爆仓预警仓位价值阈值', 'Liq. alert position value')}
            name="positionValue"
            rules={[{ required: true, message: ui.t('请输入爆仓预警仓位价值阈值', 'Enter liq. alert position value') }]}
          >
            <Input placeholder={ui.t('请输入爆仓预警仓位价值阈值', 'Enter liq. alert position value')} suffix="USD" />
          </Form.Item>

          <Form.Item
            label={ui.t('爆仓预警MMR阈值', 'Liq. alert MMR threshold')}
            name="mmrThreshold"
            rules={[{ required: true, message: ui.t('请输入爆仓预警MMR阈值', 'Enter liq. alert MMR') }]}
          >
            <Input placeholder={ui.t('请输入爆仓预警MMR阈值', 'Enter liq. alert MMR')} suffix="%" />
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
