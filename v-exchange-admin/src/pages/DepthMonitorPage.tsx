import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
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
  contractCount: number;
  updateTime: string;
  updatedBy: string;
  enabled: boolean;
}

const ALERT_ROWS: AlertRecord[] = [
  { key: '1', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-11-01 00:43:49', method: 'Lark' },
  { key: '2', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-11-01 00:38:12', method: 'Lark' },
  { key: '3', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-11-01 00:33:05', method: 'Lark' },
  { key: '4', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-11-01 00:28:41', method: 'Lark' },
  { key: '5', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-10-31 23:55:18', method: 'Lark' },
  { key: '6', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-10-31 23:50:02', method: 'Lark' },
  { key: '7', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-10-31 23:45:33', method: 'Lark' },
  { key: '8', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-10-31 23:40:11', method: 'Lark' },
  { key: '9', contract: 'XAU_USD', alertType: '档位告警', alertValue: '<=25 档', alertTime: '2026-10-31 23:35:07', method: 'Lark' },
];

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    alertType: '深度告警',
    alertValue: '0.1% <=300 USD',
    contractCount: 1,
    updateTime: '2026-09-25 10:04:12',
    updatedBy: 'natalie.chen@hytechc.com',
    enabled: true,
  },
  {
    key: '2',
    alertType: '档位告警',
    alertValue: '<=25 档',
    contractCount: 1,
    updateTime: '2026-09-22 18:16:29',
    updatedBy: 'natalie.chen@hytechc.com',
    enabled: true,
  },
];

export function DepthMonitorPage() {
  const ui = useUi();
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [tab, setTab] = useState('records');
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState(INITIAL_CONFIGS);
  const enableLevel = Form.useWatch('enableLevel', form);
  const enableDepth = Form.useWatch('enableDepth', form);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ enableLevel: false, enableDepth: false });
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!values.enableLevel && !values.enableDepth) {
        message.warning('请至少选择一种告警类型');
        return;
      }
      if (values.enableLevel && (values.levelCount == null || values.levelCount === '')) {
        message.warning('请填写档位数量');
        return;
      }
      if (values.enableDepth && (values.depthPct == null || values.depthPct === '' || values.depthValue == null || values.depthValue === '')) {
        message.warning('请填写深度价值');
        return;
      }

      const parts: string[] = [];
      if (values.enableLevel) {
        parts.push(`<=${values.levelCount} 档`);
      }
      if (values.enableDepth) {
        parts.push(`${values.depthPct}% <=${values.depthValue} USD`);
      }

      const alertType =
        values.enableLevel && !values.enableDepth
          ? '档位告警'
          : values.enableDepth && !values.enableLevel
            ? '深度告警'
            : '档位/深度告警';

      setConfigs((prev) => [
        {
          key: String(Date.now()),
          alertType,
          alertValue: parts.join(' / ') || '--',
          contractCount: 1,
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
    { title: ui.t('合约', 'Contract'), dataIndex: 'contract', width: 120 },
    { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 120 },
    { title: ui.t('告警值', 'Alert value'), dataIndex: 'alertValue', width: 120 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 180 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 100 },
  ];

  const configColumns = [
    { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 110 },
    { title: ui.t('告警值', 'Alert value'), dataIndex: 'alertValue', width: 160 },
    {
      title: ui.t('关联合约', 'Linked contract'),
      dataIndex: 'contractCount',
      width: 100,
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
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.alertType}`)}>
            {ui.t('编辑', 'Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('depth-monitor')}</div>

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
            scroll={{ x: 720 }}
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
        width={680}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item label={ui.t('告警类型', 'Alert type')} required style={{ marginBottom: 8 }}>
            <div className="alert-type-stack">
              <div className="alert-type-row">
                <Form.Item name="enableLevel" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text className="alert-type-label">档位数量</Text>
                <Form.Item name="levelCount" noStyle className="alert-type-field">
                  <Input
                    placeholder="≤设置的档位数量会告警"
                    disabled={!enableLevel}
                  />
                </Form.Item>
              </div>
              <div className="alert-type-row">
                <Form.Item name="enableDepth" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text className="alert-type-label">深度价值</Text>
                <Form.Item name="depthPct" noStyle className="alert-type-field alert-type-field--sm">
                  <Input
                    placeholder={ui.t('请输入累计深度', 'Enter cumulative depth')}
                    suffix="%"
                    disabled={!enableDepth}
                  />
                </Form.Item>
                <Form.Item name="depthValue" noStyle className="alert-type-field">
                  <Input
                    placeholder="≤设置的深度价值会告警"
                    suffix="USD"
                    disabled={!enableDepth}
                  />
                </Form.Item>
              </div>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              同类型告警最短间隔 5 分钟：档位数量告警与深度价值告警各自独立计时，避免盘口抖动时重复刷屏。
            </Text>
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
            <TextArea rows={4} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
