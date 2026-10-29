import { useState } from 'react'
import { Button, Empty, Form, Select, Space, Switch, Table, Tag, message } from 'antd'
import { PageFrame } from '../../components/PageFrame'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { perpContractOptions } from '../../config/pairs'

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

  const rows = [
    {
      key: 'liq-switch',
      type: '强平引擎开关设置',
      updatedAt,
      operator: 'SYSTEM',
      status: enabled ? '开启' : '关闭',
    },
  ]

  return (
    <PageFrame title="强平引擎开关">
      <Table
        size="small"
        bordered
        rowKey="key"
        pagination={false}
        dataSource={rows}
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
  return (
    <PageFrame title="市价交易限制">
      <Table
        size="small"
        bordered
        rowKey="id"
        columns={[
          { title: '合约名称', dataIndex: 'contract' },
          { title: '限制类型', dataIndex: 'limitType' },
          { title: '状态', dataIndex: 'status' },
          { title: '操作', key: 'action', width: 100 },
        ]}
        dataSource={[]}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        pagination={false}
      />
    </PageFrame>
  )
}

export function RiskReserveListPage() {
  return (
    <PageFrame title="风险基金列表">
      <Table
        size="small"
        bordered
        rowKey="id"
        columns={[
          { title: '合约', dataIndex: 'contract' },
          { title: '风险基金余额', dataIndex: 'balance' },
          { title: '更新时间', dataIndex: 'updatedAt' },
          { title: '操作', key: 'action', width: 100 },
        ]}
        dataSource={[
          { id: '1', contract: 'XAU_USD永续', balance: '1,250,000.00 USDT', updatedAt: '2026-10-29 22:10:00' },
          { id: '2', contract: 'BTC_USD永续', balance: '8,420,500.00 USDT', updatedAt: '2026-10-29 22:10:00' },
        ]}
        pagination={{ showTotal: (t) => `共 ${t} 条` }}
      />
    </PageFrame>
  )
}

export function RiskReserveDetailPage() {
  return (
    <PageFrame title="风险基金明细">
      <Table
        size="small"
        bordered
        rowKey="id"
        columns={[
          { title: '合约', dataIndex: 'contract' },
          { title: '变动类型', dataIndex: 'type' },
          { title: '金额', dataIndex: 'amount' },
          { title: '时间', dataIndex: 'time' },
        ]}
        dataSource={[]}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        pagination={false}
      />
    </PageFrame>
  )
}

export function RiskTradingRestrictionPage() {
  return (
    <PageFrame title="开平仓限制">
      <Table
        size="small"
        bordered
        rowKey="id"
        columns={[
          { title: '合约名称', dataIndex: 'contract' },
          { title: '限制方向', dataIndex: 'direction' },
          { title: '是否启用', dataIndex: 'enabled', render: (v: boolean) => <Switch checked={v} size="small" /> },
          { title: '操作', key: 'action', width: 100 },
        ]}
        dataSource={[]}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        pagination={false}
      />
    </PageFrame>
  )
}

function MonitorShell({
  title,
  columns,
  dataSource,
}: {
  title: string
  columns: { title: string; dataIndex?: string; key?: string; width?: number; render?: (...args: never[]) => unknown }[]
  dataSource: Record<string, unknown>[]
}) {
  const [form] = Form.useForm()
  return (
    <PageFrame title={title}>
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称" name="contract">
          <Select placeholder="请输入合约名称" allowClear style={{ width: 180 }} options={perpContractOptions} />
        </Form.Item>
        <Form.Item>
          <Space>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Space>
        </Form.Item>
      </Form>
      <Table
        size="small"
        bordered
        rowKey={(_, i) => String(i)}
        columns={columns as never}
        dataSource={dataSource}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
      />
    </PageFrame>
  )
}

export function RiskSpreadAlertPage() {
  return (
    <MonitorShell
      title="价差预警监控"
      columns={[
        { title: '合约', dataIndex: 'contract' },
        { title: '告警值', dataIndex: 'value' },
        { title: '监控类型', dataIndex: 'type' },
        { title: '告警时间', dataIndex: 'time' },
        { title: '告警方式', dataIndex: 'channel' },
      ]}
      dataSource={[
        { contract: 'XAU_USD', value: '0.1%', type: '买一价格', time: '2026-09-22 00:50:01', channel: 'Lark' },
        { contract: 'BTC_USD', value: '0.08%', type: '卖一价格', time: '2026-09-22 00:48:11', channel: 'Lark' },
      ]}
    />
  )
}

export function RiskNoTradeMonitorPage() {
  return (
    <MonitorShell
      title="无交易监控"
      columns={[
        { title: '合约', dataIndex: 'contract' },
        { title: '告警类型', dataIndex: 'type' },
        { title: '告警值', dataIndex: 'value' },
        { title: '告警时间', dataIndex: 'time' },
        { title: '告警方式', dataIndex: 'channel' },
      ]}
      dataSource={[
        { contract: 'XAU_USD', type: '长时间无交易', value: '30秒', time: '2026-09-18 17:38:51', channel: 'Lark' },
        { contract: 'BTC_USD', type: '长时间无交易', value: '30秒', time: '2026-09-18 17:40:02', channel: 'Lark' },
      ]}
    />
  )
}

export function RiskDepthMonitorPage() {
  return (
    <MonitorShell
      title="档位深度监控"
      columns={[
        { title: '合约', dataIndex: 'contract' },
        { title: '类型', dataIndex: 'type' },
        { title: '阈值', dataIndex: 'threshold' },
        { title: '时间', dataIndex: 'time' },
        { title: '方式', dataIndex: 'channel' },
      ]}
      dataSource={[
        { contract: 'XAU_USD', type: '深度告警', threshold: '0.1% < ~50,000 USD', time: '2026-09-22 07:38:16', channel: 'Lark' },
        { contract: 'BTC_USD', type: '档位告警', threshold: '<=25 档', time: '2026-09-22 07:38:16', channel: 'Lark' },
      ]}
    />
  )
}

export function RiskPeerSpreadMonitorPage() {
  return (
    <MonitorShell
      title="友商价差监控"
      columns={[
        { title: '合约', dataIndex: 'contract' },
        { title: '监控周期', dataIndex: 'period' },
        { title: '对标友商', dataIndex: 'peer' },
        { title: '价格类型', dataIndex: 'priceType' },
        { title: '偏差值', dataIndex: 'deviation' },
        { title: '告警时间', dataIndex: 'time' },
        { title: '方式', dataIndex: 'channel' },
      ]}
      dataSource={[
        { contract: 'XAU_USD', period: '5分钟', peer: 'Binance', priceType: '标记价', deviation: '0.5%', time: '2024-09-23 10:55:07', channel: 'Lark' },
        { contract: 'BTC_USD', period: '5分钟', peer: 'Bybit', priceType: '标记价', deviation: '0.5%', time: '2024-09-23 10:55:07', channel: 'Lark' },
      ]}
    />
  )
}
