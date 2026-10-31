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
import { useUi } from '../i18n/useUi';
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
  marketName:
    '行情源在系统内的唯一标识（如 BINANCE、OKEX_INDEX）。创建后会被指数价格、映射等配置引用，一般不可随意改名。',
  displayName:
    '后台列表与筛选项中展示的名称，可与市场名称不同（例如市场名 OKEX、显示名 OKX），便于运营识别。',
  observationPeriodSec:
    '行情源出现异常后进入观察期的时长（秒）。观察期内该源不参与指数合成，避免瞬时脏数据污染价格。',
  reEnableSec:
    '观察期结束后，重新启用该行情源前仍需等待的秒数。用于确认源已恢复稳定，再重新纳入计算。',
  marketUrl:
    '行情价格订阅或拉取地址。可填完整 HTTP(S) URL，或内部约定的路由标识；指数合成依赖此地址取价。',
  volumeUrl:
    '交易量数据拉取地址，用于「交易量自动权重」类指数计算。不需要按量加权时可留空。',
  positiveFundingUrl:
    '正向（U 本位）合约资金费率拉取地址。若该源不提供资金费率或暂不接入，可留空。',
  inverseFundingUrl:
    '反向（币本位）合约资金费率拉取地址。若该源不提供或暂不接入，可留空。',
  spreadMonitoring:
    '勾选后，系统会监控本行情源与其他已接入源之间的价差；超出阈值时触发运维告警。',
  description: '运维备注，说明该行情源用途、接入环境或特殊注意事项，仅后台可见。',
};

export function MarketSourcePage() {
  const ui = useUi();
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');

  const openCreate = () => {
    setMode('create');
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
      message.success(mode === 'create' ? ui.t('新增成功', 'Created') : ui.t('修改成功', 'Updated'));
      setOpen(false);
    } catch {
      /* validation errors shown inline */
    }
  };

  const columns = [
    { title: ui.t('市场名称', 'Market name'), dataIndex: 'marketName', width: 140 },
    { title: ui.t('显示名称', 'Display name'), dataIndex: 'displayName', width: 120 },
    {
      title: ui.t('是否需要设置价差监控', 'Spread monitoring'),
      dataIndex: 'spreadMonitoring',
      width: 160,
      render: (v: boolean) => (v ? ui.t('是', 'Yes') : ui.t('否', 'No')),
    },
    { title: ui.t('描述信息', 'Description'), dataIndex: 'description', width: 220 },
    { title: ui.t('进入观察期 (秒)', 'Observation (sec)'), dataIndex: 'observationPeriodSec', width: 130 },
    { title: ui.t('重新启用 (秒)', 'Re-enable (sec)'), dataIndex: 'reEnableSec', width: 120 },
    {
      title: ui.t('是否启用', 'Enabled'),
      dataIndex: 'enabled',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <Space size={4}>
            <span style={{ color: '#1677ff' }}>{ui.enable}</span>
            <EditOutlined style={{ color: '#1677ff' }} />
          </Space>
        ) : (
          ui.t('禁用', 'Disabled')
        ),
    },
    {
      title: ui.t('操作记录', 'Op log'),
      key: 'log',
      width: 100,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          {ui.t('查看', 'View')}
        </Button>
      ),
    },
    {
      title: ui.action,
      key: 'action',
      width: 90,
      render: (_: unknown, record: MarketSourceRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          {ui.t('编辑', 'Edit')}
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title={ui.pageTitle('market-source')}>
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label={ui.t('市场名称', 'Market name')} name="marketName">
          <Input placeholder={ui.pleaseInput} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.t('显示名称', 'Display name')} name="displayName">
          <Input placeholder={ui.pleaseInput} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.status} name="status">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => filterForm.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {ui.add}
        </Button>
      </div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={marketSourceList}
        scroll={{ x: 1200 }}
        pagination={{ total: 17, showTotal: (t) => ui.total(t), pageSize: 10 }}
        size="small"
      />

      <Modal
        title={mode === 'create' ? ui.t('新增指数市场', 'Add market source') : ui.t('修改指数市场', 'Edit market source')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText={ui.confirm}
        cancelText={ui.cancel}
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
                label={<LabelWithTip label={ui.t('市场名称', 'Market name')} tip={FIELD_TIPS.marketName} />}
                name="marketName"
                rules={[{ required: true, message: ui.t('请输入市场名称', 'Enter market name') }]}
              >
                <Input placeholder={ui.pleaseInput} disabled={mode === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label={ui.t('显示名称', 'Display name')} tip={FIELD_TIPS.displayName} />}
                name="displayName"
                rules={[{ required: true, message: ui.t('请输入显示名称', 'Enter display name') }]}
              >
                <Input placeholder={ui.pleaseInput} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label={ui.t('进入观察期 (秒)', 'Observation period (sec)')} tip={FIELD_TIPS.observationPeriodSec} />}
                name="observationPeriodSec"
                rules={[{ required: true, message: ui.t('请输入进入观察期', 'Enter observation period') }]}
              >
                <Input placeholder={ui.pleaseInput} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<LabelWithTip label={ui.t('重新启用 (秒)', 'Re-enable (sec)')} tip={FIELD_TIPS.reEnableSec} />}
                name="reEnableSec"
                rules={[{ required: true, message: ui.t('请输入重新启用秒数', 'Enter re-enable seconds') }]}
              >
                <Input placeholder={ui.pleaseInput} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<LabelWithTip label={ui.t('市场url', 'Market URL')} tip={FIELD_TIPS.marketUrl} />}
            name="marketUrl"
            rules={[{ required: true, message: ui.t('请输入市场url', 'Enter market URL') }]}
          >
            <TextArea placeholder={ui.pleaseInput} rows={3} />
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label={ui.t('交易量url', 'Volume URL')} tip={FIELD_TIPS.volumeUrl} />}
            name="volumeUrl"
          >
            <TextArea placeholder={ui.pleaseInput} rows={3} />
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label={ui.t('正向资金费率URL', 'Positive funding URL')} tip={FIELD_TIPS.positiveFundingUrl} />}
            name="positiveFundingUrl"
          >
            <TextArea placeholder={ui.pleaseInput} rows={3} />
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label={ui.t('反向资金费率URL', 'Inverse funding URL')} tip={FIELD_TIPS.inverseFundingUrl} />}
            name="inverseFundingUrl"
          >
            <TextArea placeholder={ui.pleaseInput} rows={3} />
          </Form.Item>

          <Form.Item
            name="spreadMonitoring"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Space>
              <LabelWithTip label={ui.t('是否需要设置价差监控', 'Need spread monitoring')} tip={FIELD_TIPS.spreadMonitoring} />
              <Checkbox />
            </Space>
          </Form.Item>

          <Form.Item
            label={<LabelWithTip label={ui.t('描述信息', 'Description')} tip={FIELD_TIPS.description} />}
            name="description"
          >
            <TextArea placeholder={ui.pleaseInput} rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
