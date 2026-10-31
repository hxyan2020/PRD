import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { marketSourceList, type MarketSourceRecord } from '../mock/data';

const { TextArea } = Input;

type ModalMode = 'create' | 'edit';

function LabelWithTip({ label, tip }: { label: string; tip: string }) {
  return (
    <span>
      {label}{' '}
      <Tooltip title={tip}>
        <QuestionCircleOutlined style={{ color: '#999', cursor: 'help' }} />
      </Tooltip>
    </span>
  );
}

const FIELD_TIPS = {
  marketName: '行情源唯一标识，如 BINANCE、OKEX_INDEX，创建后一般不可随意修改。',
  displayName: '后台列表与配置中展示的名称，可与市场名称不同（如 OKEX 显示为 OKX）。',
  observationPeriodSec: '行情源异常后进入观察期的时长（秒）。观察期内不参与指数计算。',
  reEnableSec: '观察期结束后，重新启用该行情源前需等待的秒数。',
  marketUrl: '行情价格订阅/拉取地址，支持填写完整 HTTP(S) URL 或内部路由。',
  volumeUrl: '交易量数据拉取地址，用于交易量权重计算；可留空。',
  positiveFundingUrl: '正向合约资金费率拉取地址；可留空。',
  inverseFundingUrl: '反向/币本位合约资金费率拉取地址；可留空。',
  spreadMonitoring: '勾选后启用该行情源与其他源之间的价差监控告警。',
  description: '备注说明，便于运维识别该行情源用途。',
};

export function MarketSourcePage() {
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [editing, setEditing] = useState<MarketSourceRecord | null>(null);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      observationPeriodSec: 120,
      reEnableSec: 120,
      spreadMonitoring: false,
    });
    setOpen(true);
  };

  const openEdit = (record: MarketSourceRecord) => {
    setMode('edit');
    setEditing(record);
    form.setFieldsValue({
      marketName: record.marketName,
      displayName: record.displayName,
      observationPeriodSec: record.observationPeriodSec,
      reEnableSec: record.reEnableSec,
      marketUrl: record.marketUrl,
      volumeUrl: record.volumeUrl,
      positiveFundingUrl: record.positiveFundingUrl,
      inverseFundingUrl: record.inverseFundingUrl,
      spreadMonitoring: record.spreadMonitoring,
      description: record.description,
    });
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success(mode === 'create' ? '新增成功' : '修改成功');
      setOpen(false);
    } catch {
      /* validation errors shown inline */
    }
  };

  const columns = [
    { title: '市场名称', dataIndex: 'marketName', width: 140 },
    { title: '显示名称', dataIndex: 'displayName', width: 120 },
    {
      title: '是否需要设置价差监控',
      dataIndex: 'spreadMonitoring',
      width: 160,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    { title: '描述信息', dataIndex: 'description', width: 220 },
    { title: '进入观察期 (秒)', dataIndex: 'observationPeriodSec', width: 130 },
    { title: '重新启用 (秒)', dataIndex: 'reEnableSec', width: 120 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <Space size={4}>
            <span style={{ color: '#1677ff' }}>启用</span>
            <EditOutlined style={{ color: '#1677ff' }} />
          </Space>
        ) : (
          '禁用'
        ),
    },
    {
      title: '操作记录',
      key: 'log',
      width: 100,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, record: MarketSourceRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="行情源">
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="市场名称" name="marketName">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="显示名称" name="displayName">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => filterForm.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加
        </Button>
      </div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={marketSourceList}
        pagination={{ total: 17, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />

      <Modal
        title={mode === 'create' ? '新增指数市场' : '修改指数市场'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText="确定"
        cancelText="取消"
        width={640}
        destroyOnClose
        maskClosable={false}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark
          colon
          initialValues={{ spreadMonitoring: false }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label="市场名称" tip={FIELD_TIPS.marketName} />}
                name="marketName"
                rules={[{ required: true, message: '请输入市场名称' }]}
              >
                <Input placeholder="请输入" disabled={mode === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label="显示名称" tip={FIELD_TIPS.displayName} />}
                name="displayName"
                rules={[{ required: true, message: '请输入显示名称' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label="进入观察期 (秒)" tip={FIELD_TIPS.observationPeriodSec} />}
                name="observationPeriodSec"
                rules={[{ required: true, message: '请输入进入观察期' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label="重新启用 (秒)" tip={FIELD_TIPS.reEnableSec} />}
                name="reEnableSec"
                rules={[{ required: true, message: '请输入重新启用秒数' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<LabelWithTip label="市场url" tip={FIELD_TIPS.marketUrl} />}
            name="marketUrl"
            rules={[{ required: true, message: '请输入市场url' }]}
          >
            <TextArea placeholder="请输入" rows={3} />
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label="交易量url" tip={FIELD_TIPS.volumeUrl} />}
            name="volumeUrl"
          >
            <TextArea placeholder="请输入" rows={3} />
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label="正向资金费率URL" tip={FIELD_TIPS.positiveFundingUrl} />}
            name="positiveFundingUrl"
          >
            <TextArea placeholder="请输入" rows={3} />
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label="反向资金费率URL" tip={FIELD_TIPS.inverseFundingUrl} />}
            name="inverseFundingUrl"
          >
            <TextArea placeholder="请输入" rows={3} />
          </Form.Item>

          <Form.Item
            name="spreadMonitoring"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Space>
              <LabelWithTip label="是否需要设置价差监控" tip={FIELD_TIPS.spreadMonitoring} />
              <Checkbox />
            </Space>
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label="描述信息" tip={FIELD_TIPS.description} />}
            name="description"
          >
            <TextArea placeholder="请输入" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
