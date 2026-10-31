import {
  DownloadOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { indexPriceList, type IndexPriceRecord } from '../mock/data';

const { Text } = Typography;

const MARKET_SOURCE_OPTIONS = [
  'BINANCE',
  'OKEX',
  'BITGET',
  'BYBIT',
  'BINANCE_INDEX',
  'OKEX_INDEX',
  'BYBIT_INDEX',
  'BITGET_INDEX',
  'LMAX',
  'ISPRIME',
  'STARPRIME',
  'VELOCITY',
  'RC_INDEX',
];

type ModalMode = 'create' | 'edit';

function LabelTip({ tip }: { tip: string }) {
  return (
    <Tooltip title={tip}>
      <InfoCircleOutlined style={{ color: '#1677ff', marginLeft: 4, cursor: 'help' }} />
    </Tooltip>
  );
}

/** 放大倍数：生产原文「需输入10的倍」语义不清；按现有数据（含 1）解释为 10 的整数次幂。 */
const MAGNIFICATION_HELP =
  '填写 10 的整数次幂（1、10、100、1000…）。指数价格对外展示/推送时会乘以该倍数（例如原始 0.0123、倍数 100 → 展示 1.23）。创建后不可修改，请确认后再提交。';

const INDEX_FIELD_TIPS = {
  baseCurrency: '指数的基础资产代码，如 BTC、XAU。与计价货币共同组成指数名称。',
  quoteCurrency: '指数的计价货币代码，如 USD、USDT。决定指数价格以何种货币计量。',
  subscriptionCurrency:
    '行情订阅与对账时使用的币种标识，通常与基础货币或报价侧约定一致；须与下游订阅方配置对齐。',
  pricePrecision:
    '指数价格保留的小数位数（精度）。影响展示与下游撮合/风控取值，请与合约价格精度策略保持一致。',
  minMarketSources:
    '合成指数所需的最少有效行情源数量。可用源少于此值时指数将视为不可用或进入降级逻辑。',
  medianDeviationEnabled:
    '开启后，系统会计算各行情源相对中位数的偏离；超出下方比例的源按「调整机制」处理，降低异常报价影响。',
  medianDeviationRatio:
    '相对中位数价格的最大允许偏离比例（如 3%）。超过该比例的行情源将触发剔除或修正。',
  deviationAdjust:
    '行情源偏离超限时的处理：直接剔除（不再参与合成），或将价格修正到允许范围后再纳入计算。',
  calculationMethod:
    '指数合成算法：几何平均对异常值更稳健；手动权重由运营指定各源占比；交易量自动权重按各源成交量动态分配。',
  marketSources:
    '勾选参与本指数合成的行情源。勾选数量须 ≥「最小行情源数」；建议先点「试算」确认结果再保存。',
};

export function IndexPricePage() {
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [trialDone, setTrialDone] = useState(false);

  const medianEnabled = Form.useWatch('medianDeviationEnabled', form);

  const openCreate = () => {
    setMode('create');
    setTrialDone(false);
    form.resetFields();
    form.setFieldsValue({
      magnification: undefined,
      medianDeviationEnabled: true,
      medianDeviationRatio: '3%',
      deviationAdjust: 'exclude',
      calculationMethod: 'geometric',
      marketSources: [],
    });
    setOpen(true);
  };

  const openEdit = (record: IndexPriceRecord) => {
    setMode('edit');
    setTrialDone(false);
    form.setFieldsValue({
      baseCurrency: record.baseCurrency,
      quoteCurrency: record.quoteCurrency,
      subscriptionCurrency: record.subscriptionCurrency,
      magnification: record.magnification,
      pricePrecision: record.pricePrecision.replace(/\s*\(.*\)/, ''),
      minMarketSources: record.minMarketSources,
      medianDeviationEnabled: true,
      medianDeviationRatio: '3%',
      deviationAdjust: 'exclude',
      calculationMethod:
        record.calculationMethod === '交易量自动权重计算'
          ? 'volume'
          : record.calculationMethod === '手动设置权重计算'
            ? 'manual'
            : 'geometric',
      marketSources: record.marketSources,
    });
    setOpen(true);
  };

  const handleTrial = async () => {
    try {
      await form.validateFields(['marketSources', 'minMarketSources', 'calculationMethod']);
      setTrialDone(true);
      message.success('试算完成');
    } catch {
      /* inline validation */
    }
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      if (!trialDone) {
        message.warning('请先完成试算，再操作保存');
        return;
      }
      message.success(mode === 'create' ? '已提交' : '已提交修改审核');
      setOpen(false);
    } catch {
      /* inline validation */
    }
  };

  const columns = [
    { title: '指数名称', dataIndex: 'indexName', width: 100 },
    { title: '基础币种', dataIndex: 'baseCurrency', width: 80 },
    { title: '计价币种', dataIndex: 'quoteCurrency', width: 80 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '最小行情源数', dataIndex: 'minMarketSources', width: 110 },
    {
      title: '行情源',
      dataIndex: 'marketSources',
      width: 200,
      render: (sources: string[]) => sources.join(', '),
    },
    {
      title: '行情源交易量白名单',
      dataIndex: 'volumeWhitelist',
      width: 180,
      render: (list: string[]) =>
        list.map((s) => (
          <Tag color="red" key={s} style={{ marginBottom: 2 }}>
            {s}
          </Tag>
        )),
    },
    { title: '计算方式', dataIndex: 'calculationMethod', width: 160 },
    { title: '订阅币种', dataIndex: 'subscriptionCurrency', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => <Switch checked={v} size="small" />,
    },
    { title: '放大倍数', dataIndex: 'magnification', width: 80 },
    {
      title: '操作记录',
      key: 'log',
      width: 90,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: IndexPriceRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="指数价格">
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label="基础币种" name="base">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="计价币种" name="quote">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="计算方式" name="method">
          <Select allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => filterForm.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
        <Form.Item label="权重展示开关">
          <Switch size="small" />
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Space>
          <Button danger>批量取消行情源</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            添加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            导出
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            下载配置
          </Button>
        </Space>
      </div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={indexPriceList}
        scroll={{ x: 1800 }}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />

      <Modal
        title={mode === 'create' ? '新增指数价格' : '修改指数价格'}
        open={open}
        onCancel={() => setOpen(false)}
        width={720}
        destroyOnClose
        maskClosable={false}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 12 } }}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleOk}>
              {mode === 'create' ? '确定' : '修改审核'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark colon>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    基础货币
                    <LabelTip tip={INDEX_FIELD_TIPS.baseCurrency} />
                  </span>
                }
                name="baseCurrency"
                rules={[{ required: true, message: '请输入基础货币' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    计价货币
                    <LabelTip tip={INDEX_FIELD_TIPS.quoteCurrency} />
                  </span>
                }
                name="quoteCurrency"
                rules={[{ required: true, message: '请输入计价货币' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    订阅币种
                    <LabelTip tip={INDEX_FIELD_TIPS.subscriptionCurrency} />
                  </span>
                }
                name="subscriptionCurrency"
                rules={[{ required: true, message: '请输入订阅币种' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    放大倍数
                    <LabelTip tip={MAGNIFICATION_HELP} />
                  </span>
                }
                name="magnification"
                extra={<Text type="secondary">{MAGNIFICATION_HELP}</Text>}
                rules={[
                  {
                    validator: async (_, value) => {
                      if (value === undefined || value === null || value === '') return;
                      const n = Number(value);
                      if (!Number.isFinite(n) || n <= 0) {
                        throw new Error('请输入正数');
                      }
                      // 1, 10, 100, 1000... （10 的整数次幂）
                      const log10 = Math.log10(n);
                      if (Math.abs(log10 - Math.round(log10)) > 1e-9) {
                        throw new Error('须为 10 的整数次幂，如 1、10、100');
                      }
                    },
                  },
                ]}
              >
                <Input placeholder="请输入" style={{ width: 160 }} disabled={mode === 'edit'} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    价格精度
                    <LabelTip tip={INDEX_FIELD_TIPS.pricePrecision} />
                  </span>
                }
                name="pricePrecision"
                rules={[{ required: true, message: '请输入价格精度' }]}
              >
                <Input style={{ width: 160 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    最小行情源数
                    <LabelTip tip={INDEX_FIELD_TIPS.minMarketSources} />
                  </span>
                }
                name="minMarketSources"
                rules={[{ required: true, message: '请输入最小行情源数' }]}
              >
                <Input style={{ width: 160 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <span>
                中位数偏离限制开关
                <LabelTip tip={INDEX_FIELD_TIPS.medianDeviationEnabled} />
              </span>
            }
            name="medianDeviationEnabled"
            valuePropName="checked"
            rules={[{ required: true }]}
          >
            <Switch />
          </Form.Item>

          {medianEnabled !== false && (
            <Form.Item
              label={
                <span>
                  中位数偏离比例
                  <LabelTip tip={INDEX_FIELD_TIPS.medianDeviationRatio} />
                </span>
              }
              name="medianDeviationRatio"
              rules={[{ required: true, message: '请输入中位数偏离比例' }]}
            >
              <Input style={{ width: 160 }} />
            </Form.Item>
          )}

          <Form.Item
            label={
              <span>
                超出偏离值的调整机制
                <LabelTip tip={INDEX_FIELD_TIPS.deviationAdjust} />
              </span>
            }
            name="deviationAdjust"
            rules={[{ required: true, message: '请选择调整机制' }]}
          >
            <Radio.Group>
              <Radio value="exclude">直接剔除</Radio>
              <Radio value="correct">修正后纳入计算</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={
              <span>
                计算方式
                <LabelTip tip={INDEX_FIELD_TIPS.calculationMethod} />
              </span>
            }
            name="calculationMethod"
            rules={[{ required: true, message: '请选择计算方式' }]}
          >
            <Radio.Group>
              <Radio value="geometric">几何平均计算</Radio>
              <Radio value="manual">手动设置权重计算</Radio>
              <Radio value="volume">交易量自动权重计算</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 行情源仅渲染一次，避免重复展示 */}
          <Form.Item
            label={
              <span>
                行情源
                <LabelTip tip={INDEX_FIELD_TIPS.marketSources} />
              </span>
            }
            name="marketSources"
            rules={[
              { required: true, type: 'array', min: 1, message: '请至少选择一个行情源' },
            ]}
          >
            <Checkbox.Group
              options={MARKET_SOURCE_OPTIONS.map((v) => ({ label: v, value: v }))}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Space align="start" wrap>
              <Button type="primary" onClick={handleTrial}>
                试算
              </Button>
              <div>
                <div style={{ color: '#ff4d4f' }}>请先完成试算，确认合成价格合理后再保存。</div>
                <div style={{ color: '#ff4d4f' }}>
                  建议先在测试环境用极端行情（单源失效、大幅偏离）演练，确认剔除/修正逻辑无误后再上线配置。
                </div>
              </div>
            </Space>
          </div>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
