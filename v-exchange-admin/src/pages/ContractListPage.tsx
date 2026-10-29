import { Button, Form, Input, Select, Table, Tag } from 'antd'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { baseCoinOptions } from '../config/pairs'
import { contractRecords } from '../mock/data'
import { fh } from '../components/FieldHelpLabel'

export function ContractListPage() {
  const [form] = Form.useForm()

  const columns = [
    { title: '合约ID', dataIndex: 'id', width: 80, fixed: 'left' as const },
    { title: '合约名', dataIndex: 'symbol', width: 100 },
    { title: '显示名称(中文)', dataIndex: 'displayNameZh', width: 140 },
    { title: '显示名称(英文)', dataIndex: 'displayNameEn', width: 160 },
    { title: '关联指数', dataIndex: 'relatedIndex', width: 100 },
    { title: '杠杆倍数', dataIndex: 'leverage', width: 90 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '数量精度', dataIndex: 'amountPrecision', width: 100 },
    { title: '最小步进', dataIndex: 'minTick', width: 90 },
    { title: '订单张数下限', dataIndex: 'orderMin', width: 110 },
    { title: '订单张数上限', dataIndex: 'orderMax', width: 110 },
    { title: '默认Taker费率', dataIndex: 'takerFee', width: 120 },
    { title: '默认Maker费率', dataIndex: 'makerFee', width: 120 },
    {
      title: fh('状态'),
      dataIndex: 'status',
      width: 90,
      render: (status: string) =>
        status === '启用中' ? <Tag color="success">启用中</Tag> : <Tag color="default">下架</Tag>,
    },
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
  ]

  return (
    <PageFrame title="合约列表">
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item label="合约类型" name="contractType">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} options={[{ value: 'perp', label: '永续' }]} />
        </Form.Item>
        <Form.Item label="基础币种" name="base">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} options={baseCoinOptions} />
        </Form.Item>
        <Form.Item label="计价币种" name="quote">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} options={[{ value: 'USD', label: 'USD' }]} />
        </Form.Item>
        <Form.Item label={fh('状态')} name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} options={[{ value: 'on', label: '启用中' }, { value: 'off', label: '下架' }]} />
        </Form.Item>
        <Form.Item label="考核区状态" name="assessment">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="定时结算状态" name="settlement">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={fh('合约名称')} name="name">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="方向" name="direction">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1800 }}
        columns={columns}
        dataSource={contractRecords}
        pagination={{ total: contractRecords.length, showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
      />
    </PageFrame>
  )
}
