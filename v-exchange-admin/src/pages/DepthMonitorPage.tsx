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

const LABEL_WIDTH = 72;

export function DepthMonitorPage() {
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
    { title: '合约', dataIndex: 'contract', width: 120 },
    { title: '告警类型', dataIndex: 'alertType', width: 120 },
    { title: '告警值', dataIndex: 'alertValue', width: 120 },
    { title: '告警时间', dataIndex: 'alertTime', width: 180 },
    { title: '告警方式', dataIndex: 'method', width: 100 },
  ];

  const configColumns = [
    { title: '告警类型', dataIndex: 'alertType', width: 110 },
    { title: '告警值', dataIndex: 'alertValue', width: 160 },
    {
      title: '关联合约',
      dataIndex: 'contractCount',
      width: 100,
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
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.alertType}`)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>监控告警 / 档位深度监控</div>

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
        width={680}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item label="告警类型" required style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="enableLevel" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text style={{ width: LABEL_WIDTH, flexShrink: 0 }}>档位数量</Text>
                <Form.Item name="levelCount" noStyle>
                  <Input
                    placeholder="≤设置的档位数量会告警"
                    disabled={!enableLevel}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="enableDepth" valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <Text style={{ width: LABEL_WIDTH, flexShrink: 0 }}>深度价值</Text>
                <Form.Item name="depthPct" noStyle>
                  <Input
                    placeholder="请输入累计深度"
                    suffix="%"
                    disabled={!enableDepth}
                    style={{ width: 160 }}
                  />
                </Form.Item>
                <Form.Item name="depthValue" noStyle>
                  <Input
                    placeholder="≤设置的深度价值会告警"
                    suffix="USD"
                    disabled={!enableDepth}
                    style={{ flex: 1 }}
                  />
                </Form.Item>
              </div>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              同类型的告警间隔最少5分钟
            </Text>
          </Form.Item>

          <Form.Item
            label="关联合约"
            name="contract"
            rules={[{ required: true, message: '请选择关联合约' }]}
          >
            <Select placeholder="请选择关联合约" options={contractNameOptions} />
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
