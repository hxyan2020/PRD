import { useState } from 'react'
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Table, Typography, message } from 'antd'
import { PageFrame } from '../../components/PageFrame'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { dbFundFlowRecords, dbFundFlowTypes, dbTakeoverAccount } from '../../mock/marketMakingData'

const { Text, Title } = Typography

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ marginRight: 8 }}>
        {label}:
      </Text>
      <Text strong>{value}</Text>
    </div>
  )
}

export function DbTakeoverAccountPage() {
  const [form] = Form.useForm()
  const [editOpen, setEditOpen] = useState<'auto' | 'target' | null>(null)
  const [editForm] = Form.useForm()
  const a = dbTakeoverAccount

  return (
    <PageFrame title="DB接仓账户管理">
      <Card size="small" title="账户基础信息" style={{ marginBottom: 16 }} extra={<Button type="primary">回笼资金</Button>}>
        <Row gutter={24}>
          <Col span={6}>
            <Metric label="账户ID" value={a.accountId} />
          </Col>
          <Col span={6}>
            <Metric label="钱包余额" value={a.walletBalance} />
          </Col>
          <Col span={6}>
            <Metric label="最大可转金额" value={a.maxTransferable} />
          </Col>
          <Col span={6}>
            <Metric label="当前注资金额" value={a.injectedAmount} />
          </Col>
        </Row>
      </Card>

      <Card size="small" title="参数设置" style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <span>
            <Text type="secondary">自动注资水位线: </Text>
            <Text strong>{a.autoInjectWaterline}</Text>{' '}
            <Button type="link" size="small" onClick={() => setEditOpen('auto')}>
              编辑
            </Button>
          </span>
          <span>
            <Text type="secondary">注资目标水位线: </Text>
            <Text strong>{a.injectTargetWaterline}</Text>{' '}
            <Button type="link" size="small" onClick={() => setEditOpen('target')}>
              编辑
            </Button>
          </span>
        </Space>
      </Card>

      <Card size="small" title="账户持仓信息">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={5}>
            <Metric label="总占用保证金" value={a.totalMargin} />
          </Col>
          <Col span={4}>
            <Metric label="持仓总额" value={a.totalPosition} />
          </Col>
          <Col span={5}>
            <Metric label="总未实现盈亏" value={a.totalUnrealizedPnl} />
          </Col>
          <Col span={5}>
            <Metric label="账户权益" value={a.accountEquity} />
          </Col>
          <Col span={5}>
            <Metric label="账户MMR" value={a.accountMmr} />
          </Col>
        </Row>
        <Form form={form} layout="inline" style={{ marginBottom: 12 }}>
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
            { title: '合约名称', dataIndex: 'contract' },
            { title: '持仓方向', dataIndex: 'side' },
            { title: '持仓均价', dataIndex: 'avgPrice' },
            {
              title: <span style={{ color: '#cf1322' }}>持仓合约价值 (USD)</span>,
              dataIndex: 'contractValue',
            },
            { title: '占用保证金 (USD)', dataIndex: 'margin' },
            { title: '未实现盈亏 (USD)', dataIndex: 'upnl' },
          ]}
        />
      </Card>

      <Modal
        title={editOpen === 'auto' ? '编辑自动注资水位线' : '编辑注资目标水位线'}
        open={!!editOpen}
        onCancel={() => setEditOpen(null)}
        destroyOnHidden
        onOk={() => {
          message.success('已更新水位线')
          setEditOpen(null)
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="水位线 (USD)" name="value" rules={[{ required: true }]}>
            <Input placeholder="请输入金额" addonAfter="USD" />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function DbTakeoverFundFlowPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="DB接仓账户资金流水">
      <Form form={form} layout="inline" style={{ marginBottom: 16 }} initialValues={{ type: '全部' }}>
        <Form.Item label="流水类型" name="type">
          <Select style={{ width: 160 }} options={dbFundFlowTypes} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        size="small"
        bordered
        rowKey="flowId"
        dataSource={dbFundFlowRecords}
        pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
        columns={[
          { title: '账户ID', dataIndex: 'accountId', width: 120 },
          { title: '流水ID', dataIndex: 'flowId', width: 120 },
          { title: '流水类型', dataIndex: 'type', width: 120 },
          {
            title: '金额 (USD)',
            dataIndex: 'amount',
            width: 160,
            render: (v: number) => {
              const positive = v >= 0
              return (
                <Text style={{ color: positive ? '#389e0d' : '#cf1322' }}>
                  {positive ? `+${v}` : String(v)}
                </Text>
              )
            },
          },
          { title: '更新时间', dataIndex: 'time', width: 180 },
        ]}
      />
    </PageFrame>
  )
}

export function DbAccountAlarmPage() {
  return (
    <PageFrame title="DB账户告警">
      <Title level={5} style={{ marginTop: 0 }}>
        DB账户告警
      </Title>
      <Empty description="等待后续截图补充" />
    </PageFrame>
  )
}
