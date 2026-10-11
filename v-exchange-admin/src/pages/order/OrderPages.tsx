import type { ReactNode } from 'react'
import { Button, DatePicker, Empty, Form, Input, Select } from 'antd'
import { EyeOutlined, UndoOutlined } from '@ant-design/icons'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { ListPageShell } from '../../components/ListPageShell'
import { activeOrderHistoryDeals } from '../../mock/extendedData'

const emptyLocale = { emptyText: <Empty description="暂无数据" /> }

function OrderFilterBar({ children }: { children: ReactNode }) {
  const [form] = Form.useForm()
  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
      {children}
      <Form.Item>
        <QueryResetButtons onReset={() => form.resetFields()} />
      </Form.Item>
    </Form>
  )
}

export function PositionValueStatsPage() {
  return (
    <ListPageShell
      title="仓位价值统计"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约名称" name="contract">
            <Select placeholder="请选择" style={{ width: 160 }} />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="id"
      columns={[
        { title: '合约名称', dataIndex: 'contractName' },
        { title: '多仓价值', dataIndex: 'longValue' },
        { title: '空仓价值', dataIndex: 'shortValue' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
    />
  )
}

export function ActiveOrderPage() {
  return (
    <ListPageShell
      title="当前委托"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约FID" name="fid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="订单ID" name="orderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select placeholder="请选择" style={{ width: 160 }} options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="orderId"
      scroll={{ x: 2800 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid', width: 110 },
        { title: 'UID', dataIndex: 'uid', width: 90 },
        { title: '订单ID', dataIndex: 'orderId', width: 180 },
        { title: '合约名称', dataIndex: 'contractName', width: 120 },
        { title: '订单类型', dataIndex: 'orderType', width: 120 },
        { title: '订单方向', dataIndex: 'direction', width: 100 },
        { title: '委托价格', dataIndex: 'entrustPrice', width: 100 },
        { title: '委托数量', dataIndex: 'entrustQty', width: 90 },
        { title: '订单状态', dataIndex: 'status', width: 90 },
        { title: '创建时间', dataIndex: 'orderTime', width: 160 },
        { title: '操作', key: 'op', width: 80, render: () => <Button type="link" size="small">撤销</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 200, showSizeChanger: true, pageSizeOptions: ['50', '100', '200'] }}
    />
  )
}

export function TriggerOrderPage() {
  return (
    <ListPageShell
      title="计划委托"
      extra={
        <Button icon={<UndoOutlined />}>一键撤销</Button>
      }
      filters={
        <OrderFilterBar>
          <Form.Item label="合约FID" name="fid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="订单ID" name="orderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select defaultValue="BTC_USD永续" style={{ width: 160 }} options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
          <Form.Item label="开仓类型" name="openType">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="订单方向" name="direction">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="价格类型" name="priceType">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="价格保护" name="priceProtect">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="仓位模式" name="positionMode">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="创建时间" name="created">
            <DatePicker.RangePicker showTime />
          </Form.Item>
          <Form.Item label="更新时间" name="updated">
            <DatePicker.RangePicker showTime />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="orderId"
      scroll={{ x: 3600 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid', width: 110 },
        { title: 'UID', dataIndex: 'uid', width: 90 },
        { title: '订单ID', dataIndex: 'orderId', width: 180 },
        { title: '仓位模式', dataIndex: 'positionMode', width: 90 },
        { title: '合约名称', dataIndex: 'contractName', width: 120 },
        { title: '开仓类型', dataIndex: 'openType', width: 90 },
        { title: '订单方向', dataIndex: 'direction', width: 90 },
        { title: '杠杆倍数', dataIndex: 'leverage', width: 90 },
        { title: '触发类型', dataIndex: 'triggerType', width: 90 },
        { title: '执行状态', dataIndex: 'execStatus', width: 90 },
        { title: '触发价格', dataIndex: 'triggerPrice', width: 90 },
        { title: '执行价格', dataIndex: 'execPrice', width: 90 },
        { title: '创建时间', dataIndex: 'createdAt', width: 160 },
        { title: '操作', key: 'op', width: 80, render: () => <Button type="link" size="small">撤销</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10, showSizeChanger: true }}
    />
  )
}

export function StopOrderPage() {
  return (
    <ListPageShell
      title="止盈止损(NEW)"
      extra={<Button icon={<UndoOutlined />}>一键撤销</Button>}
      filters={
        <OrderFilterBar>
          <Form.Item label="合约ID" name="contractId">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="仓位ID" name="positionId">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select defaultValue="BTC_USD永续" style={{ width: 160 }} options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
          <Form.Item label="订单方向" name="direction">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="价差保护" name="spreadProtect">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="日期" name="range">
            <DatePicker.RangePicker />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="orderId"
      scroll={{ x: 1600 }}
      columns={[
        { title: '合约ID', dataIndex: 'contractId' },
        { title: 'UID', dataIndex: 'uid' },
        { title: '订单ID', dataIndex: 'orderId' },
        { title: '仓位ID', dataIndex: 'positionId' },
        { title: '合约名称', dataIndex: 'contractName' },
        { title: '订单方向', dataIndex: 'direction' },
        { title: '委托数量', dataIndex: 'qty' },
        { title: '止盈/止损', dataIndex: 'tpSl' },
        { title: '是否反手', dataIndex: 'reverse' },
        { title: '下单时间', dataIndex: 'orderTime' },
        { title: '操作', key: 'op', render: () => <Button type="link" size="small">撤销</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
    />
  )
}

export function ActiveOrderHistoryDealPage() {
  return (
    <ListPageShell
      title="限价单历史成交"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约FID" name="fid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="订单ID" name="orderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Input style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="订单状态" name="status" initialValue="done">
            <Select style={{ width: 120 }} options={[{ value: 'done', label: '已完成' }]} />
          </Form.Item>
          <Form.Item label="下单时间" name="orderTime">
            <DatePicker.RangePicker showTime />
          </Form.Item>
          <Form.Item label="更新时间" name="updateTime">
            <DatePicker.RangePicker showTime />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="orderId"
      scroll={{ x: 3200 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid', width: 110 },
        { title: 'UID', dataIndex: 'uid', width: 80 },
        { title: '订单ID', dataIndex: 'orderId', width: 180 },
        { title: '合约名称', dataIndex: 'contractName', width: 120 },
        { title: '订单类型', dataIndex: 'orderType', width: 130 },
        { title: '订单方向', dataIndex: 'direction', width: 100 },
        { title: '委托类型', dataIndex: 'entrustType', width: 100 },
        { title: '委托价格', dataIndex: 'entrustPrice', width: 100 },
        { title: '委托数量', dataIndex: 'entrustQty', width: 90 },
        { title: '杠杆倍数', dataIndex: 'leverage', width: 90 },
        { title: '订单状态', dataIndex: 'status', width: 90 },
        { title: '成交数量', dataIndex: 'filledQty', width: 90 },
        { title: '成交均价', dataIndex: 'avgPrice', width: 100 },
        { title: '成交金额', dataIndex: 'filledAmount', width: 100 },
        { title: '成交手续费', dataIndex: 'fee', width: 100 },
        { title: '盈亏', dataIndex: 'pnl', width: 80 },
        {
          title: '成交明细',
          key: 'detail',
          width: 90,
          render: () => (
            <Button type="link" size="small" icon={<EyeOutlined />}>
              查看
            </Button>
          ),
        },
        { title: '只减仓', dataIndex: 'reduceOnly', width: 80 },
        { title: '下单时间', dataIndex: 'orderTime', width: 160 },
        { title: '更新时间', dataIndex: 'updateTime', width: 160 },
      ]}
      dataSource={activeOrderHistoryDeals}
      pagination={{ total: activeOrderHistoryDeals.length, pageSize: 10, showSizeChanger: true }}
    />
  )
}

export function TriggerOrderHistoryDealPage() {
  return (
    <ListPageShell
      title="计划委托历史成交"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约FID" name="fid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="计划委托订单ID" name="triggerOrderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="订单ID" name="orderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select defaultValue="BTC_USD永续" style={{ width: 160 }} options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
          <Form.Item label="执行状态" name="status">
            <Select defaultValue="executed" style={{ width: 120 }} options={[{ value: 'executed', label: '已执行' }]} />
          </Form.Item>
          <Form.Item label="执行时间" name="execTime">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item label="创建时间" name="created">
            <DatePicker.RangePicker />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="orderId"
      scroll={{ x: 3600 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid' },
        { title: 'UID', dataIndex: 'uid' },
        { title: '计划委托订单ID', dataIndex: 'triggerOrderId' },
        { title: '订单ID', dataIndex: 'orderId' },
        { title: '合约名称', dataIndex: 'contractName' },
        { title: '执行状态', dataIndex: 'status' },
        { title: '触发价格', dataIndex: 'triggerPrice' },
        { title: '创建时间', dataIndex: 'createdAt' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}

function liquidationColumns() {
  return [
    { title: 'UID', dataIndex: 'uid', width: 90 },
    { title: '合约名称', dataIndex: 'contractName', width: 120 },
    { title: '平仓账户ID', dataIndex: 'closeAccountId', width: 120 },
    { title: '平仓仓位ID', dataIndex: 'closePositionId', width: 120 },
    { title: '合理价', dataIndex: 'fairPrice', width: 90 },
    { title: '强平价', dataIndex: 'liqPrice', width: 90 },
    { title: '强平张数', dataIndex: 'liqQty', width: 90 },
    { title: '强平状态', dataIndex: 'status', width: 100 },
    { title: '强平开始时间', dataIndex: 'startTime', width: 160 },
    { title: '强平结束时间', dataIndex: 'endTime', width: 160 },
  ]
}

export function LiquidateHistoryPage() {
  return (
    <ListPageShell
      title="强平历史记录"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约ID" name="contractId">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select defaultValue="BTC_USD永续" style={{ width: 160 }} options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select defaultValue="done" style={{ width: 160 }} options={[{ value: 'done', label: '强平流程完成' }]} />
          </Form.Item>
          <Form.Item label="保险基金划出金额 >=" name="fundAmount">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="range">
            <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="uid"
      scroll={{ x: 2400 }}
      columns={liquidationColumns()}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}

export function AdlHistoryPage() {
  return (
    <ListPageShell
      title="ADL历史记录"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约ID" name="contractId">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select defaultValue="BTC_USD永续" style={{ width: 160 }} options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select defaultValue="done" style={{ width: 160 }} options={[{ value: 'done', label: '强平流程完成' }]} />
          </Form.Item>
          <Form.Item name="range">
            <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="uid"
      scroll={{ x: 2600 }}
      columns={[
        ...liquidationColumns(),
        { title: '减仓开始时间', dataIndex: 'adlStart', width: 160 },
        { title: '减仓结束时间', dataIndex: 'adlEnd', width: 160 },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}

export function StopOrderHistoryDealPage() {
  return (
    <ListPageShell
      title="止盈止损历史 (NEW)"
      filters={
        <OrderFilterBar>
          <Form.Item label="合约FID" name="fid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="仓位ID" name="positionId">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="止盈止损订单ID" name="stopOrderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="订单ID" name="orderId">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="下单时间" name="orderTime">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item label="触发时间" name="triggerTime">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item label="合约名称" name="contract">
            <Select defaultValue="BTC_USD_永续" style={{ width: 160 }} options={[{ value: 'BTC_USD_永续', label: 'BTC_USD_永续' }]} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select defaultValue="all" style={{ width: 120 }} options={[{ value: 'all', label: '全部' }]} />
          </Form.Item>
        </OrderFilterBar>
      }
      rowKey="orderId"
      scroll={{ x: 2800 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid' },
        { title: 'UID', dataIndex: 'uid' },
        { title: '止盈止损订单ID', dataIndex: 'stopOrderId' },
        { title: '订单ID', dataIndex: 'orderId' },
        { title: '合约名称', dataIndex: 'contractName' },
        { title: '状态', dataIndex: 'status' },
        { title: '下单时间', dataIndex: 'orderTime' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10, showSizeChanger: true }}
    />
  )
}
