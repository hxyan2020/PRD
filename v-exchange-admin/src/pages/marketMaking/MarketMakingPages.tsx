import { useState, type ReactNode } from 'react'
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
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
import {
  dbAlarmAddTypeOptions,
  dbAlarmConfigs,
  dbAlarmRecords,
  dbAlarmTypeOptions,
  dbFundFlowRecords,
  dbFundFlowTypes,
  dbTakeoverAccount,
} from '../../mock/marketMakingData'
import { fh, fhStyled } from '../../components/FieldHelpLabel'

const { Text } = Typography

function Metric({ label, value }: { label: ReactNode; value: string }) {
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
            <Metric label={fh('账户ID')} value={a.accountId} />
          </Col>
          <Col span={6}>
            <Metric label={fh('钱包余额')} value={a.walletBalance} />
          </Col>
          <Col span={6}>
            <Metric label={fh('最大可转金额')} value={a.maxTransferable} />
          </Col>
          <Col span={6}>
            <Metric label={fh('当前注资金额')} value={a.injectedAmount} />
          </Col>
        </Row>
      </Card>

      <Card size="small" title="参数设置" style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <span>
            <Text type="secondary">{fh('自动注资水位线')}: </Text>
            <Text strong>{a.autoInjectWaterline}</Text>{' '}
            <Button type="link" size="small" onClick={() => setEditOpen('auto')}>
              编辑
            </Button>
          </span>
          <span>
            <Text type="secondary">{fh('注资目标水位线')}: </Text>
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
            <Metric label={fh('总占用保证金')} value={a.totalMargin} />
          </Col>
          <Col span={4}>
            <Metric label={fh('持仓总额')} value={a.totalPosition} />
          </Col>
          <Col span={5}>
            <Metric label={fh('总未实现盈亏')} value={a.totalUnrealizedPnl} />
          </Col>
          <Col span={5}>
            <Metric label={fh('账户权益')} value={a.accountEquity} />
          </Col>
          <Col span={5}>
            <Metric label={fh('账户MMR')} value={a.accountMmr} />
          </Col>
        </Row>
        <Form form={form} layout="inline" style={{ marginBottom: 12 }}>
          <Form.Item label={fh('合约名称')} name="contract">
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
            { title: fh('合约名称'), dataIndex: 'contract' },
            { title: fh('持仓方向'), dataIndex: 'side' },
            { title: fh('持仓均价'), dataIndex: 'avgPrice' },
            {
              title: fhStyled('持仓合约价值 (USD)', { color: '#cf1322' }),
              dataIndex: 'contractValue',
            },
            { title: fh('占用保证金 (USD)'), dataIndex: 'margin' },
            { title: fh('未实现盈亏 (USD)'), dataIndex: 'upnl' },
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
          <Form.Item label={fh('水位线 (USD)')} name="value" rules={[{ required: true }]}>
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
        <Form.Item label={fh('流水类型')} name="type">
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
          { title: fh('账户ID'), dataIndex: 'accountId', width: 120 },
          { title: fh('流水ID'), dataIndex: 'flowId', width: 120 },
          { title: fh('流水类型'), dataIndex: 'type', width: 120 },
          {
            title: fh('金额 (USD)'),
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
          { title: fh('更新时间'), dataIndex: 'time', width: 180 },
        ]}
      />
    </PageFrame>
  )
}

export function DbAccountAlarmPage() {
  const [form] = Form.useForm()
  const [configForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const [open, setOpen] = useState(false)

  return (
    <PageFrame title="DB账户告警">
      <Tabs
        items={[
          {
            key: 'records',
            label: '告警记录',
            children: (
              <>
                <Form form={form} layout="inline" style={{ marginBottom: 16 }} initialValues={{ type: '全部' }}>
                  <Form.Item label={fh('告警类型')} name="type">
                    <Select style={{ width: 200 }} options={dbAlarmTypeOptions} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => form.resetFields()} />
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={dbAlarmRecords}
                  pagination={{ showTotal: (t) => `共 ${t} 条`, pageSize: 20 }}
                  columns={[
                    { title: fh('告警类型'), dataIndex: 'type', width: 160 },
                    { title: fh('告警信息'), dataIndex: 'info' },
                    { title: fh('告警时间'), dataIndex: 'time', width: 180 },
                    { title: fh('告警方式'), dataIndex: 'channel', width: 100 },
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
                <Form form={configForm} layout="inline" style={{ marginBottom: 12 }} initialValues={{ type: '全部' }}>
                  <Form.Item label={fh('告警类型')} name="type">
                    <Select style={{ width: 200 }} options={dbAlarmTypeOptions} />
                  </Form.Item>
                  <Form.Item>
                    <QueryResetButtons onReset={() => configForm.resetFields()} />
                  </Form.Item>
                  <Form.Item style={{ marginLeft: 'auto' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                      增加监控
                    </Button>
                  </Form.Item>
                </Form>
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  dataSource={dbAlarmConfigs}
                  pagination={{ total: 8, showTotal: (t) => `共 ${t} 条记录`, pageSize: 20 }}
                  columns={[
                    { title: fh('告警类型'), dataIndex: 'type', width: 160 },
                    { title: fh('告警值'), dataIndex: 'value' },
                    { title: fh('更新时间'), dataIndex: 'updatedAt', width: 170 },
                    { title: fh('更新人'), dataIndex: 'updatedBy', ellipsis: true, width: 200 },
                    {
                      title: fh('状态'),
                      dataIndex: 'status',
                      width: 90,
                      render: (s: string) => <Tag color="success">{s}</Tag>,
                    },
                    {
                      title: fh('操作'),
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
              message.success('已新增 DB 账户告警监控')
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label={fh('告警类型')} name="type" rules={[{ required: true }]}>
            <Select placeholder="请选择告警类型" options={dbAlarmAddTypeOptions} />
          </Form.Item>
          <Form.Item
            label={fh('预警群')}
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
