import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

const { Text } = Typography;

export interface MarketTradeLimitRecord {
  key: string;
  displayName: string;
  contractName: string;
  coefOver20: string;
  coefUnder20: string;
  defaultLevel: number;
  maxTakerLevel: number;
  maxDeviation: string;
  promptStatus: string;
  updateTime: string;
  operator: string;
}

const INITIAL_ROWS: MarketTradeLimitRecord[] = [
  {
    key: '1',
    displayName: 'BTC_USD永续',
    contractName: 'BTC_USD',
    coefOver20: '20%',
    coefUnder20: '0.5%',
    defaultLevel: 15,
    maxTakerLevel: 20,
    maxDeviation: '0.1%',
    promptStatus: '已关闭/-- USD',
    updateTime: '2026-09-15 22:11:10',
    operator: 'evan.bi@hytechc.com',
  },
  {
    key: '2',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    coefOver20: '1%',
    coefUnder20: '0.5%',
    defaultLevel: 15,
    maxTakerLevel: 10,
    maxDeviation: '0.1%',
    promptStatus: '已关闭/-- USD',
    updateTime: '2026-09-15 22:11:10',
    operator: 'vincent.you@hytechc.com',
  },
];

const DEFAULT_LEVEL_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

const PROMPT_POSITIONS = [
  { key: '1', label: '提示位置一' },
  { key: '2', label: '提示位置二' },
  { key: '3', label: '提示位置三' },
  { key: '4', label: '提示位置四' },
  { key: '5', label: '提示位置五' },
];

export function MarketTradeLimitPage() {
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [promptPos, setPromptPos] = useState('1');

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      maxDeviation: 0.1,
      promptEnabled: false,
      promptPos: '1',
    });
    setPromptPos('1');
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      message.success('已提交审核');
      setOpen(false);
    } catch {
      /* inline */
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'key',
      width: 48,
      render: (_: string, record: MarketTradeLimitRecord) => (
        <Checkbox
          checked={selectedKeys.includes(record.key)}
          onChange={(e) => {
            setSelectedKeys((prev) =>
              e.target.checked ? [...prev, record.key] : prev.filter((k) => k !== record.key),
            );
          }}
        />
      ),
    },
    { title: '合约展示名称', dataIndex: 'displayName', width: 130 },
    { title: '合约名称', dataIndex: 'contractName', width: 110 },
    { title: '大于20档系数', dataIndex: 'coefOver20', width: 120 },
    { title: '小于20档系数', dataIndex: 'coefUnder20', width: 120 },
    { title: '默认档位', dataIndex: 'defaultLevel', width: 90 },
    { title: '市价最大吃单档位', dataIndex: 'maxTakerLevel', width: 140 },
    { title: '市价单最大偏离系数', dataIndex: 'maxDeviation', width: 150 },
    { title: '市价提示开关及阈值设置', dataIndex: 'promptStatus', width: 180 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    { title: '操作者', dataIndex: 'operator', width: 200 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 80,
      render: () => (
        <Button type="link" size="small">
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="市价交易限制配置">
      <Text type="secondary" style={{ display: 'block', marginBottom: 12, color: '#1677ff' }}>
        新上线合约会由系统自动写入默认市价交易限制（系数、档位、偏离与提示开关等）；上线后请按品种流动性复核并按需调整。
      </Text>

      <Form form={filterForm} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label="合约名称" name="contractName">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 160 }}
            options={contractNameOptions}
          />
        </Form.Item>
        <Form.Item label="市价提示开关" name="promptSwitch">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 140 }}
            options={[
              { label: '开启', value: 'on' },
              { label: '关闭', value: 'off' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => filterForm.resetFields()}>重置</Button>
            <Button
              disabled={!selectedKeys.length}
              onClick={() => message.info(`批量编辑 ${selectedKeys.length} 条`)}
            >
              批量编辑
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              增加
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="key"
        columns={columns}
        dataSource={INITIAL_ROWS}
        scroll={{ x: 1700 }}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />

      <Modal
        title="新增市价交易限制"
        open={open}
        onCancel={() => setOpen(false)}
        width={560}
        destroyOnClose
        maskClosable={false}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              提交审核
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark colon style={{ marginTop: 8 }}>
          <Form.Item
            label="合约名称"
            name="contractName"
            rules={[{ required: true, message: '请选择合约名称' }]}
          >
            <Select placeholder="合约名称" options={contractNameOptions} />
          </Form.Item>

          <Form.Item
            label="大于20档系数"
            name="coefOver20"
            rules={[{ required: true, message: '请输入大于20档系数' }]}
          >
            <InputNumber addonAfter="%" style={{ width: '100%' }} placeholder="%" min={0} />
          </Form.Item>

          <Form.Item
            label="小于20档系数"
            name="coefUnder20"
            rules={[{ required: true, message: '请输入小于20档系数' }]}
          >
            <InputNumber addonAfter="%" style={{ width: '100%' }} placeholder="%" min={0} />
          </Form.Item>

          <Form.Item
            label="默认档位"
            name="defaultLevel"
            rules={[{ required: true, message: '请选择默认档位' }]}
          >
            <Select placeholder="请选择默认档位" options={DEFAULT_LEVEL_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="市价最大吃单档位"
            name="maxTakerLevel"
            rules={[{ required: true, message: '请输入市价最大吃单档位' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>

          <Form.Item
            label="市价单最大偏离系数"
            name="maxDeviation"
            rules={[{ required: true, message: '请输入市价单最大偏离系数' }]}
          >
            <InputNumber addonAfter="%" style={{ width: '100%' }} min={0} step={0.1} />
          </Form.Item>

          <Form.Item
            label="市价提示开关及阈值设置"
            required
            style={{ marginBottom: 8 }}
          >
            <Radio.Group
              value={promptPos}
              onChange={(e) => {
                setPromptPos(e.target.value);
                form.setFieldValue('promptPos', e.target.value);
              }}
              optionType="button"
              buttonStyle="solid"
              style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}
              options={PROMPT_POSITIONS.map((p) => ({ label: p.label, value: p.key }))}
            />
          </Form.Item>

          <Form.Item label="开关" name="promptEnabled" valuePropName="checked" rules={[{ required: true }]}>
            <Switch />
          </Form.Item>
          <Form.Item name="promptPos" hidden initialValue="1">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
