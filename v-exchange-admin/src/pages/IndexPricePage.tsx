import { useMemo, useState } from 'react'
import {
  Alert,
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
  Tag,
  Typography,
  message,
} from 'antd'
import { DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { baseCoinOptions } from '../config/pairs'
import { indexPriceRecords, marketSourceRecords, type IndexPriceRecord } from '../mock/data'
import { btcVolumeWeights, xauManualWeights } from '../mock/marketSourceDetails'
import { fh } from '../components/FieldHelpLabel'

const { Text } = Typography

const calcMethodOptions = [
  { value: '几何平均计算', label: '几何平均计算' },
  { value: '手动设置权重计算', label: '手动设置权重计算' },
  { value: '交易量自动权重计算', label: '交易量自动权重计算' },
]

const sourceCheckboxOptions = marketSourceRecords.map((s) => ({
  label: s.marketName,
  value: s.marketName,
}))

export function IndexPricePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [weightForm] = Form.useForm()
  const [editOpen, setEditOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
  const [current, setCurrent] = useState<IndexPriceRecord | null>(null)
  const [showWeights, setShowWeights] = useState(false)

  const openEdit = (record: IndexPriceRecord) => {
    setCurrent(record)
    editForm.setFieldsValue({
      baseCoin: record.baseCoin,
      quoteCoin: record.quoteCoin,
      subscriptionCoin: record.subscriptionCoin,
      magnification: '',
      pricePrecision: Number(record.pricePrecision.split(' ')[0]),
      minSourceCount: record.minSourceCount,
      enabled: record.enabled,
      medianDeviationSwitch: true,
      medianDeviationRatio: 1,
      deviationAdjust: '修正后纳入计算',
      calcMethod: record.calcMethod,
      sources: record.priceSources.split(', ').filter(Boolean),
    })
    setEditOpen(true)
  }

  const openWeight = (record: IndexPriceRecord) => {
    setCurrent(record)
    weightForm.setFieldsValue({
      calcMethod: record.calcMethod,
      sources: record.priceSources.split(', ').filter(Boolean),
    })
    setWeightOpen(true)
  }

  const weightRows = useMemo(() => {
    if (!current) return []
    if (current.indexName === 'XAUUSD') return xauManualWeights
    return btcVolumeWeights.map((r) => ({
      source: r.source,
      value: r.coefficient,
      weight: r.weight,
      price: r.price,
    }))
  }, [current])

  const columns = [
    { title: '指数名称', dataIndex: 'indexName', width: 100, fixed: 'left' as const },
    { title: '基础币种', dataIndex: 'baseCoin', width: 90 },
    { title: '计价币种', dataIndex: 'quoteCoin', width: 90 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '最小行情源数', dataIndex: 'minSourceCount', width: 110 },
    {
      title: '行情源',
      dataIndex: 'priceSources',
      width: 280,
      render: (text: string) => (
        <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: '行情源交易量白名单',
      dataIndex: 'whitelist',
      width: 260,
      render: (text: string, record: IndexPriceRecord) => (
        <div>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openWeight(record)}>
            编辑白名单
          </Button>
          <div style={{ fontSize: 12, color: record.indexName === 'XAUUSD' ? '#cf1322' : undefined }}>
            {text}
          </div>
        </div>
      ),
    },
    { title: '计算方式', dataIndex: 'calcMethod', width: 160 },
    { title: '订阅币种', dataIndex: 'subscriptionCoin', width: 90 },
    { title: '放大倍数', dataIndex: 'magnification', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean) =>
        enabled ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag color="error">禁用</Tag>
        ),
    },
    {
      title: '操作记录',
      key: 'record',
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
      fixed: 'right' as const,
      render: (_: unknown, record: IndexPriceRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  const tableColumns = showWeights
    ? [
        ...columns.slice(0, 7),
        {
          title: '权重详情',
          key: 'weights',
          width: 100,
          render: (_: unknown, record: IndexPriceRecord) => (
            <Button type="link" size="small" onClick={() => openWeight(record)}>
              查看权重
            </Button>
          ),
        },
        ...columns.slice(7),
      ]
    : columns

  return (
    <PageFrame
      title="指数价格"
      extra={
        <Space wrap>
          <Button danger>批量取消行情源</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            添加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            指数价格权重详情下载
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            指数差异详情下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item label="基础币种" name="base">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} options={baseCoinOptions} />
        </Form.Item>
        <Form.Item label="计价币种" name="quote">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 120 }}
            options={[{ value: 'USD', label: 'USD' }]}
          />
        </Form.Item>
        <Form.Item label={fh('状态')} name="status">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'on', label: '启用' },
              { value: 'off', label: '禁用' },
            ]}
          />
        </Form.Item>
        <Form.Item label="计算方式" name="calc">
          <Select placeholder="请选择" allowClear style={{ width: 180 }} options={calcMethodOptions} />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 160 }}
            options={marketSourceRecords.map((s) => ({ value: s.marketName, label: s.marketName }))}
          />
        </Form.Item>
        <Form.Item label="权重展示开关">
          <Switch checked={showWeights} onChange={setShowWeights} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="indexName"
        size="small"
        bordered
        scroll={{ x: 2100 }}
        columns={tableColumns}
        dataSource={indexPriceRecords}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title="修改指数价格"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        width={760}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={() => setEditOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              message.success(`已提交审核：${current?.indexName ?? ''}`)
              setEditOpen(false)
            }}
          >
            提交审核
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="基础货币" name="baseCoin">
            <Input disabled />
          </Form.Item>
          <Form.Item label="计价货币" name="quoteCoin">
            <Input disabled />
          </Form.Item>
          <Form.Item label="订阅币种" name="subscriptionCoin">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="放大倍数"
            name="magnification"
            extra="需输入10的倍数，设置后不能修改"
          >
            <InputNumber style={{ width: '100%' }} min={0} step={10} />
          </Form.Item>
          <Form.Item label="价格精度" name="pricePrecision" extra="例如 2 → 0.01">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="最小行情源数" name="minSourceCount">
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled">
            <Radio.Group>
              <Radio value={true}>启用</Radio>
              <Radio value={false}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="中位数偏差限制开关" name="medianDeviationSwitch" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="中位数偏差比例" name="medianDeviationRatio">
            <InputNumber style={{ width: '100%' }} min={0} addonAfter="%" />
          </Form.Item>
          <Form.Item label="超出偏差值的调整机制" name="deviationAdjust">
            <Radio.Group>
              <Radio value="修正后纳入计算">修正后纳入计算</Radio>
              <Radio value="直接剔除">直接剔除</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="计算方式" name="calcMethod">
            <Radio.Group options={calcMethodOptions} />
          </Form.Item>
          <Form.Item
            label="行情源"
            name="sources"
            extra={
              current?.calcMethod === '交易量自动权重计算'
                ? '该计算方式仅支持勾选白名单交易所'
                : undefined
            }
          >
            <Checkbox.Group options={sourceCheckboxOptions} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`指数价格 · 权重配置 (${current?.indexName ?? ''})`}
        open={weightOpen}
        onCancel={() => setWeightOpen(false)}
        width={820}
        destroyOnHidden
        footer={[
          <Button key="trial" type="primary" ghost onClick={() => message.info('试算完成（模拟）')}>
            试算
          </Button>,
          <Button key="cancel" onClick={() => setWeightOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              message.success('已提交审核')
              setWeightOpen(false)
            }}
          >
            提交审核
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="请先完成试算，再操作保存"
          description="建议先在测试环境或模拟盘进行演练，确定无异常再到线上配置"
        />
        <Form form={weightForm} layout="vertical">
          <Form.Item label="计算方式" name="calcMethod">
            <Radio.Group options={calcMethodOptions} />
          </Form.Item>
          <Form.Item label="行情源" name="sources">
            <Checkbox.Group options={sourceCheckboxOptions} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} />
          </Form.Item>
        </Form>
        <Table
          size="small"
          bordered
          pagination={false}
          rowKey="source"
          dataSource={weightRows}
          columns={
            current?.indexName === 'BTCUSD'
              ? [
                  { title: '已选行情源', dataIndex: 'source' },
                  { title: '行情源价格', dataIndex: 'price' },
                  { title: '各行情源交易量加权系数', dataIndex: 'value' },
                  { title: '权重', dataIndex: 'weight' },
                ]
              : [
                  { title: '已选行情源', dataIndex: 'source' },
                  { title: '数值', dataIndex: 'value' },
                  { title: '权重', dataIndex: 'weight' },
                ]
          }
        />
      </Modal>
    </PageFrame>
  )
}
