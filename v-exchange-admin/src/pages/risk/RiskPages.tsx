import { useState } from 'react'
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../../components/PageFrame'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { perpContractOptions, symbolOptions } from '../../config/pairs'
import {
  depthAlertRecords,
  depthMonitorConfigs,
  externalFundingAlerts,
  externalFundingConfigs,
  internalFundingConfigs,
  largeLiqNotifyRecords,
  largeLiqWarningConfigs,
  marketPriceLimits,
  monitorTypeOptions,
  noTradeAlertRecords,
  noTradeConfigs,
  peerExchangeOptions,
  peerSpreadConfigs,
  peerSpreadRecords,
  riskFundDetails,
  riskFundList,
  spreadAlertRecords,
  spreadMonitorConfigs,
} from '../../mock/riskMonitorData'

const { Text } = Typography

const periodUnitOptions = [
  { value: '秒', label: '秒' },
  { value: '分钟', label: '分钟' },
  { value: '小时', label: '小时' },
]

function StatusTag({ status }: { status: string }) {
  return <Tag color={status === '生效中' ? 'success' : 'default'}>{status}</Tag>
}

export function RiskFundingFeeChangePage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="资金费率修改">
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称" name="contract">
          <Select placeholder="请选择" allowClear style={{ width: 180 }} options={perpContractOptions} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        size="small"
        bordered
        rowKey="contract"
        columns={[
          { title: '合约名称', dataIndex: 'contract' },
          { title: '本期结算费率', dataIndex: 'settlementRate' },
          { title: '是否启用', dataIndex: 'enabled' },
          { title: '操作', key: 'action', width: 100 },
        ]}
        dataSource={[]}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        pagination={false}
      />
    </PageFrame>
  )
}

export function RiskLiquidationSwitchPage() {
  const [enabled, setEnabled] = useState(true)
  const [updatedAt, setUpdatedAt] = useState('2026-10-29 23:43:47')

  return (
    <PageFrame title="强平引擎开关">
      <Table
        size="small"
        bordered
        rowKey="key"
        pagination={false}
        dataSource={[
          {
            key: 'liq-switch',
            type: '强平引擎开关设置',
            updatedAt,
            operator: 'SYSTEM',
            status: enabled ? '开启' : '关闭',
          },
        ]}
        columns={[
          { title: '类型', dataIndex: 'type' },
          { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
          { title: '操作人员', dataIndex: 'operator', width: 120 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (status: string) =>
              status === '开启' ? <Tag color="success">开启</Tag> : <Tag>关闭</Tag>,
          },
          {
            title: '操作',
            key: 'action',
            width: 120,
            render: () => (
              <Button
                type="primary"
                danger={enabled}
                onClick={() => {
                  const next = !enabled
                  setEnabled(next)
                  setUpdatedAt(new Date().toISOString().slice(0, 19).replace('T', ' '))
                  message.success(next ? '强平引擎已开启' : '强平引擎已关闭')
                }}
              >
                {enabled ? '关闭' : '开启'}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  )
}

export function RiskMarketPriceLimitPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame
      title="市价交易限制配置"
      extra={
        <Space>
          <Button type="primary">批量编辑</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            增加
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 8 }}>
        <Form.Item name="contract">
          <Input placeholder="请输入合约名称" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Text type="danger" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        新上合约系统会自动插入初始配置
      </Text>
      <Table
        size="small"
        bordered
        rowKey="id"
        scroll={{ x: 1600 }}
        dataSource={marketPriceLimits}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        columns={[
          { title: '合约展示名称', dataIndex: 'displayName', width: 130 },
          { title: '合约名称', dataIndex: 'contractName', width: 100 },
          { title: '大于20F系数', dataIndex: 'gt20f', width: 110 },
          { title: '小于20F系数', dataIndex: 'lt20f', width: 110 },
          { title: '默认档位', dataIndex: 'defaultTier', width: 90 },
          { title: '市价最大吃单档位', dataIndex: 'maxMarketTier', width: 130 },
          { title: '市价单最大偏离系数', dataIndex: 'maxDeviation', width: 140 },
          { title: '市价提示开关及阈值设置', dataIndex: 'alertSwitch', width: 180 },
          { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
          { title: '操作者', dataIndex: 'operator', width: 200, ellipsis: true },
          {
            title: '操作',
            key: 'action',
            width: 80,
            fixed: 'right' as const,
            render: () => (
              <Button type="primary" size="small">
                编辑
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  )
}

export function RiskReserveListPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="风险基金列表">
      <Tabs
        items={[
          {
            key: 'pair',
            label: '币对维度列表',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="币对名称" name="pair">
                    <Input placeholder="请输入" style={{ width: 160 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={riskFundList}
                  pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
                  columns={[
                    { title: '合约展示名称', dataIndex: 'displayName' },
                    { title: '合约名称', dataIndex: 'contractName' },
                    { title: '手续费汇总更新', dataIndex: 'feeSummary' },
                    { title: '可用额度', dataIndex: 'available' },
                    { title: '净值', dataIndex: 'netValue' },
                    { title: '已归集资金', dataIndex: 'collected' },
                    {
                      title: '基金变动明细',
                      key: 'detail',
                      render: () => (
                        <Button type="link" size="small">
                          查看
                        </Button>
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 320,
                      render: (_: unknown, row: (typeof riskFundList)[0]) => (
                        <Space wrap>
                          <Button type="primary" size="small">
                            增加额度
                          </Button>
                          <Button danger size="small">
                            减少额度
                          </Button>
                          {row.canReclaim && (
                            <Button size="small" style={{ color: '#d46b08', borderColor: '#ffd591' }}>
                              回收风险基金
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'coin',
            label: '币种汇总列表',
            children: <Empty description="暂无数据" />,
          },
        ]}
      />
    </PageFrame>
  )
}

export function RiskReserveDetailPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="风险基金明细">
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约" name="contract">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} options={symbolOptions} />
        </Form.Item>
        <Form.Item label="合约展示名称" name="displayName">
          <Input style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="变动记录ID" name="recordId">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        size="small"
        bordered
        rowKey="id"
        dataSource={riskFundDetails}
        pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        columns={[
          { title: '合约展示名称', dataIndex: 'displayName', width: 130 },
          { title: '合约名称', dataIndex: 'contractName', width: 100 },
          { title: '变动记录ID', dataIndex: 'recordId', width: 100 },
          { title: '合约ID', dataIndex: 'contractId', width: 80 },
          { title: '变动类型', dataIndex: 'changeType', width: 160 },
          { title: '变动金额', dataIndex: 'amount', width: 140 },
          { title: '创建时间', dataIndex: 'createdAt', width: 170 },
        ]}
      />
    </PageFrame>
  )
}

export function RiskTradingRestrictionPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame
      title="开平仓限制"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新增限制
        </Button>
      }
    >
      <Tabs
        items={[
          {
            key: 'current',
            label: '当前限制中',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="ID类型" name="idType" initialValue="all">
                    <Select style={{ width: 120 }} options={[{ value: 'all', label: '全部' }]} />
                  </Form.Item>
                  <Form.Item label="ID" name="id">
                    <Input placeholder="账户ID或用户ID" style={{ width: 160 }} />
                  </Form.Item>
                  <Form.Item label="所属Broker" name="broker" initialValue="all">
                    <Select style={{ width: 120 }} options={[{ value: 'all', label: '全部' }]} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={[]}
                  locale={{ emptyText: <Empty description="暂无数据" /> }}
                  pagination={false}
                  columns={[
                    { title: 'ID类型', dataIndex: 'idType' },
                    { title: 'ID', dataIndex: 'id' },
                    { title: '所属Broker', dataIndex: 'broker' },
                    { title: '限制状态', dataIndex: 'status' },
                    { title: '执行来源', dataIndex: 'source' },
                    { title: '最近处置人', dataIndex: 'operator' },
                    { title: '最近处置时间', dataIndex: 'time' },
                    { title: '处置原因', dataIndex: 'reason' },
                    { title: '操作', key: 'action', width: 100 },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'history',
            label: '处置记录',
            children: <Empty description="暂无数据" />,
          },
        ]}
      />
    </PageFrame>
  )
}

export function RiskSpreadAlertPage() {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)

  return (
    <PageFrame title="价差预警监控">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约名称" name="contract">
                    <Input placeholder="请输入合约名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  dataSource={spreadAlertRecords}
                  pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
                  scroll={{ x: 1200 }}
                  columns={[
                    { title: '合约', dataIndex: 'contract', width: 100 },
                    { title: '告警值', dataIndex: 'value', width: 80 },
                    { title: '监控类型1', dataIndex: 'type1', width: 110 },
                    { title: '价格1', dataIndex: 'price1', width: 100 },
                    { title: '监控类型2', dataIndex: 'type2', width: 110 },
                    { title: '价格2', dataIndex: 'price2', width: 100 },
                    { title: '监控周期', dataIndex: 'period', width: 90 },
                    { title: '告警时间', dataIndex: 'time', width: 160 },
                    { title: '告警方式', dataIndex: 'channel', width: 80 },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={spreadMonitorConfigs}
                  pagination={{ total: 7, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  scroll={{ x: 1200 }}
                  columns={[
                    { title: '监控类型1', dataIndex: 'type1', width: 120 },
                    { title: '监控类型2', dataIndex: 'type2', width: 120 },
                    { title: '告警值', dataIndex: 'alarmValue', width: 80 },
                    { title: '监控周期', dataIndex: 'period', width: 90 },
                    { title: '关联合约', dataIndex: 'contracts', width: 90 },
                    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
                    { title: '更新人', dataIndex: 'updatedBy', width: 200, ellipsis: true },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 90,
                      render: (s: string) => <StatusTag status={s} />,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: () => (
                        <Space>
                          <Button type="link" danger size="small">
                            停用
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="新增 — 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success('已新增价差监控配置')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="监控类型1" name="type1" rules={[{ required: true }]}>
            <Select placeholder="请选择监控类型1" options={monitorTypeOptions} />
          </Form.Item>
          <Form.Item label="监控类型2" name="type2" rules={[{ required: true }]}>
            <Select placeholder="请选择监控类型2" options={monitorTypeOptions} />
          </Form.Item>
          <Form.Item label="告警值" name="alarmValue" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} addonAfter="%" placeholder="请输入告警值" />
          </Form.Item>
          <Form.Item label="监控周期" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="periodValue" noStyle rules={[{ required: true, message: '请输入数值' }]}>
                <InputNumber style={{ width: '60%' }} placeholder="请输入监控周期数值" min={1} />
              </Form.Item>
              <Form.Item name="periodUnit" noStyle rules={[{ required: true, message: '请选择单位' }]}>
                <Select style={{ width: '40%' }} placeholder="单位" options={periodUnitOptions} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="关联合约" name="contracts" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择关联合约" options={symbolOptions} />
          </Form.Item>
          <Form.Item
            label="预警群"
            name="webhook"
            rules={[{ required: true }]}
            extra="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔"
          >
            <Input.TextArea rows={3} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function RiskNoTradeMonitorPage() {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)

  return (
    <PageFrame title="无交易监控">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约名称" name="contract">
                    <Input placeholder="请输入合约名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  dataSource={noTradeAlertRecords}
                  pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
                  columns={[
                    { title: '合约', dataIndex: 'contract' },
                    { title: '告警类型', dataIndex: 'type' },
                    { title: '告警值', dataIndex: 'value' },
                    { title: '告警时间', dataIndex: 'time' },
                    { title: '告警方式', dataIndex: 'channel' },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={noTradeConfigs}
                  pagination={{ total: 1, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '告警类型', dataIndex: 'alertType' },
                    { title: '告警值', dataIndex: 'alertValue' },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (s: string) => <StatusTag status={s} />,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: () => (
                        <Space>
                          <Button type="link" danger size="small">
                            停用
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="新增监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success('已新增无交易监控配置')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="持续时长" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="duration" noStyle rules={[{ required: true }]}>
                <InputNumber style={{ width: '60%' }} placeholder="请输入持续时长数值" min={1} />
              </Form.Item>
              <Form.Item name="unit" noStyle rules={[{ required: true }]}>
                <Select style={{ width: '40%' }} placeholder="单位" options={periodUnitOptions} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="关联合约" name="contracts" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择关联合约" options={symbolOptions} />
          </Form.Item>
          <Form.Item
            label="预警群"
            name="webhook"
            rules={[{ required: true }]}
            extra="填写 lark 机器人 token，多个以英文逗号分隔"
          >
            <Input.TextArea rows={3} placeholder="填写 lark 机器人 token，多个以英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function RiskDepthMonitorPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="档位深度监控">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约名称" name="contract">
                    <Input placeholder="请输入合约名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  dataSource={depthAlertRecords}
                  pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
                  columns={[
                    { title: '合约', dataIndex: 'contract' },
                    { title: '告警类型', dataIndex: 'type' },
                    { title: '告警值', dataIndex: 'value' },
                    { title: '告警时间', dataIndex: 'time' },
                    { title: '告警方式', dataIndex: 'channel' },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={depthMonitorConfigs}
                  pagination={{ total: 2, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '告警类型', dataIndex: 'alertType' },
                    { title: '告警值', dataIndex: 'alertValue' },
                    { title: '关联合约', dataIndex: 'contracts' },
                    { title: '更新时间', dataIndex: 'updatedAt' },
                    { title: '更新人', dataIndex: 'updatedBy', ellipsis: true },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (s: string) => <StatusTag status={s} />,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: () => (
                        <Space>
                          <Button type="link" danger size="small">
                            停用
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
    </PageFrame>
  )
}

export function RiskPeerSpreadMonitorPage() {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)

  return (
    <PageFrame title="友商价差监控">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约名称" name="contract">
                    <Input placeholder="请输入合约名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  dataSource={peerSpreadRecords}
                  pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
                  columns={[
                    { title: '合约', dataIndex: 'contract' },
                    { title: '监控周期', dataIndex: 'period' },
                    { title: '监控对标友商', dataIndex: 'peer' },
                    { title: '偏差类型', dataIndex: 'priceType' },
                    { title: '偏差值', dataIndex: 'deviation' },
                    { title: '告警时间', dataIndex: 'time' },
                    { title: '告警方式', dataIndex: 'channel' },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={peerSpreadConfigs}
                  pagination={{ total: 1, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '监控友商', dataIndex: 'peers', width: 220 },
                    { title: '监控信息', dataIndex: 'info', width: 260 },
                    { title: '监控周期', dataIndex: 'period', width: 90 },
                    { title: '关联合约', dataIndex: 'contracts', width: 90 },
                    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
                    { title: '更新人', dataIndex: 'updatedBy', width: 200, ellipsis: true },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 90,
                      render: (s: string) => <Tag>{s}</Tag>,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: () => (
                        <Space>
                          <Button type="link" size="small">
                            启用
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="新增 - 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success('已新增友商价差监控配置')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="监控友商" name="peers" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择监控友商" options={peerExchangeOptions} />
          </Form.Item>
          <Form.Item label="监控信息" required>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="lastPrice" noStyle rules={[{ required: true, message: '请输入最新价偏差阈值' }]}>
                <InputNumber style={{ width: '100%' }} addonBefore="最新价" addonAfter="%" placeholder="请输入最新价偏差阈值" />
              </Form.Item>
              <Form.Item name="indexPrice" noStyle rules={[{ required: true, message: '请输入指数价偏差阈值' }]}>
                <InputNumber style={{ width: '100%' }} addonBefore="指数价" addonAfter="%" placeholder="请输入指数价偏差阈值" />
              </Form.Item>
              <Form.Item name="markPrice" noStyle rules={[{ required: true, message: '请输入标记价偏差阈值' }]}>
                <InputNumber style={{ width: '100%' }} addonBefore="标记价" addonAfter="%" placeholder="请输入标记价偏差阈值" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item label="监控间隔" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="interval" noStyle rules={[{ required: true }]}>
                <InputNumber style={{ width: '60%' }} placeholder="请输入监控间隔数值" min={1} />
              </Form.Item>
              <Form.Item name="intervalUnit" noStyle rules={[{ required: true }]}>
                <Select style={{ width: '40%' }} placeholder="单位" options={periodUnitOptions} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="关联合约" name="contracts" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择关联合约" options={symbolOptions} />
          </Form.Item>
          <Form.Item
            label="报警群"
            name="lark"
            rules={[{ required: true }]}
            extra="请在 Lark 搜索个人/群组，多个以回车、换行或空格分割"
          >
            <Input.TextArea rows={3} placeholder="请在 Lark 搜索个人/群组，多个以回车、换行或空格分割" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

function PlaceholderAlarmPage({ title }: { title: string }) {
  return (
    <PageFrame title={title}>
      <Empty description="页面结构已就绪，等待后续截图补充字段与数据" />
    </PageFrame>
  )
}

export function RiskExternalFundingMonitorPage() {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  return (
    <PageFrame title="外部资金费率监控">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约名称" name="contract">
                    <Input placeholder="请输入合约名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  dataSource={externalFundingAlerts}
                  scroll={{ x: 1200 }}
                  pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
                  columns={[
                    { title: '合约', dataIndex: 'contract', width: 100 },
                    { title: '资金费率数值', dataIndex: 'rate', width: 120 },
                    { title: '收取周期 (Hour)', dataIndex: 'period', width: 120 },
                    { title: '对标交易所', dataIndex: 'peer', width: 110 },
                    { title: '对标交易所资金费率', dataIndex: 'peerRate', width: 150 },
                    { title: '对标交易所收取周期 (Hour)', dataIndex: 'peerPeriod', width: 180 },
                    { title: '告警时间', dataIndex: 'time', width: 160 },
                    { title: '告警方式', dataIndex: 'channel', width: 90 },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={externalFundingConfigs}
                  pagination={{ total: 2, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '合约名称', dataIndex: 'contract', width: 110 },
                    { title: '对标交易所', dataIndex: 'peers', width: 220 },
                    { title: '监控阈值', dataIndex: 'threshold', width: 100 },
                    { title: '监控频率', dataIndex: 'frequency', width: 100 },
                    { title: '预警群', dataIndex: 'alarmGroup', ellipsis: true },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 90,
                      render: (s: string) =>
                        s === '生效中' ? <StatusTag status={s} /> : <Tag>{s}</Tag>,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: (_: unknown, row: (typeof externalFundingConfigs)[0]) => (
                        <Space>
                          <Button type="link" size="small" danger={row.status === '生效中'}>
                            {row.status === '生效中' ? '停用' : '启用'}
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
      <Modal
        title="新增 - 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success('已新增外部资金费率监控')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="合约名称" name="contract" rules={[{ required: true }]}>
            <Select placeholder="请选择合约名称" options={symbolOptions} />
          </Form.Item>
          <Form.Item label="对标交易所" name="peers" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择对标交易所" options={peerExchangeOptions} />
          </Form.Item>
          <Form.Item label="监控阈值" name="threshold" rules={[{ required: true }]}>
            <Input placeholder="请输入监控阈值" />
          </Form.Item>
          <Form.Item label="监控频率" name="frequency" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} addonAfter="min" placeholder="请输入监控频率" min={1} />
          </Form.Item>
          <Form.Item
            label="预警群"
            name="webhook"
            rules={[{ required: true }]}
            extra="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔"
          >
            <Input.TextArea rows={3} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function RiskInternalFundingMonitorPage() {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  return (
    <PageFrame title="内部资金费率监控">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约名称" name="contract">
                    <Input placeholder="请输入合约名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={[]}
                  locale={{ emptyText: <Empty description="暂无数据" /> }}
                  pagination={false}
                  columns={[
                    { title: '合约', dataIndex: 'contract' },
                    { title: '平台资金费率', dataIndex: 'rate' },
                    { title: '监控周期', dataIndex: 'period' },
                    { title: '监控费率上限', dataIndex: 'upper' },
                    { title: '监控费率下限', dataIndex: 'lower' },
                    { title: '告警时间', dataIndex: 'time' },
                    { title: '告警方式', dataIndex: 'channel' },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={internalFundingConfigs}
                  pagination={{ total: 2, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '合约名称', dataIndex: 'contract' },
                    { title: '监控周期', dataIndex: 'period' },
                    { title: '监控费率上限', dataIndex: 'upper' },
                    { title: '监控费率下限', dataIndex: 'lower' },
                    { title: '更新时间', dataIndex: 'updatedAt' },
                    { title: '更新人', dataIndex: 'updatedBy', ellipsis: true },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (s: string) =>
                        s === '生效中' ? <StatusTag status={s} /> : <Tag>{s}</Tag>,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_: unknown, row: (typeof internalFundingConfigs)[0]) => (
                        <Space>
                          <Button type="link" size="small" danger={row.status === '生效中'}>
                            {row.status === '生效中' ? '停用' : '启用'}
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
      <Modal
        title="新增 - 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success('已新增内部资金费率监控')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="合约名称" name="contract" rules={[{ required: true }]}>
            <Select placeholder="请选择合约名称" options={symbolOptions} />
          </Form.Item>
          <Form.Item label="监控费率上限" name="upper">
            <InputNumber style={{ width: '100%' }} addonAfter="%" placeholder="请输入监控费率上限" />
          </Form.Item>
          <Form.Item label="监控费率下限" name="lower">
            <InputNumber style={{ width: '100%' }} addonAfter="%" placeholder="请输入监控费率下限" />
          </Form.Item>
          <Form.Item label="监控周期" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="period" noStyle rules={[{ required: true }]}>
                <InputNumber style={{ width: '60%' }} placeholder="请输入监控周期" min={1} />
              </Form.Item>
              <Form.Item name="periodUnit" noStyle rules={[{ required: true }]}>
                <Select style={{ width: '40%' }} options={periodUnitOptions} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item
            label="报警群"
            name="webhook"
            rules={[{ required: true }]}
            extra="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔"
          >
            <Input.TextArea rows={3} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function RiskLargeLiqWarningPage() {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  return (
    <PageFrame title="大额爆仓预警">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约账户ID" name="accountId">
                    <Input placeholder="请输入合约账户ID" style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={[]}
                  locale={{ emptyText: <Empty description="暂无数据" /> }}
                  pagination={false}
                  columns={[
                    { title: '合约账户ID', dataIndex: 'accountId' },
                    { title: '持仓信息', dataIndex: 'position' },
                    { title: '仓位模式', dataIndex: 'mode' },
                    { title: 'MMR', dataIndex: 'mmr' },
                    { title: '告警时间', dataIndex: 'time' },
                    { title: '告警方式', dataIndex: 'channel' },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                    增加监控
                  </Button>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={largeLiqWarningConfigs}
                  pagination={{ total: 1, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '爆仓预警仓位价值阈值 (USD)', dataIndex: 'valueThreshold' },
                    { title: '爆仓预警MMR阈值', dataIndex: 'mmrThreshold' },
                    { title: '更新时间', dataIndex: 'updatedAt' },
                    { title: '更新人', dataIndex: 'updatedBy', ellipsis: true },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (s: string) => <StatusTag status={s} />,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: () => (
                        <Space>
                          <Button type="link" danger size="small">
                            停用
                          </Button>
                          <Button type="link" size="small">
                            编辑
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
      <Modal
        title="新增 - 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="c" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success('已新增大额爆仓预警配置')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="爆仓预警仓位价值阈值" name="valueThreshold" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} addonAfter="USD" min={0} />
          </Form.Item>
          <Form.Item label="爆仓预警MMR阈值" name="mmrThreshold" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} addonAfter="%" min={0} max={100} />
          </Form.Item>
          <Form.Item
            label="预警群"
            name="webhook"
            rules={[{ required: true }]}
            extra="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔"
          >
            <Input.TextArea rows={3} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function RiskLargeLiqNotifyPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="大额爆仓后通知">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
                  <Form.Item label="合约账户ID" name="accountId">
                    <Input placeholder="请输入合约账户ID" style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  dataSource={largeLiqNotifyRecords}
                  pagination={{ total: 5, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: '合约账户ID', dataIndex: 'accountId' },
                    { title: '持仓信息', dataIndex: 'position' },
                    { title: '仓位模式', dataIndex: 'mode' },
                    { title: '告警时间', dataIndex: 'time' },
                    { title: '告警方式', dataIndex: 'channel' },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'config',
            label: '监控配置',
            children: (
              <>
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />}>
                    增加监控
                  </Button>
                </div>
                <Empty description="等待后续截图补充配置表" />
              </>
            ),
          },
        ]}
      />
    </PageFrame>
  )
}

export function RiskAdlAbnormalPage() {
  return <PlaceholderAlarmPage title="ADL异常记录" />
}
