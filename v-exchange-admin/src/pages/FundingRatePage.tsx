import { Button, Checkbox, Form, Select, Space, Table } from 'antd'
import { CloseOutlined, DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { fundingRateRecords } from '../mock/data'

export function FundingRatePage() {
  const [form] = Form.useForm()

  const columns = [
    { title: '对应合约', dataIndex: 'contract', width: 120, fixed: 'left' as const },
    { title: '合约展示名称', dataIndex: 'displayName', width: 120 },
    { title: '费率收取周期(小时)', dataIndex: 'periodHours', width: 140 },
    { title: '首次收取时间(小时)', dataIndex: 'firstCollectHour', width: 140 },
    { title: '费率浮动上限', dataIndex: 'upperLimit', width: 110 },
    { title: '费率浮动下限', dataIndex: 'lowerLimit', width: 110 },
    { title: '保证金影响额', dataIndex: 'marginImpact', width: 120 },
    {
      title: '自动调整资金费率',
      dataIndex: 'autoAdjust',
      width: 140,
      render: (v: boolean) => (v ? '是' : <CloseOutlined style={{ color: '#ff4d4f' }} />),
    },
    { title: '行情源', dataIndex: 'marketSource', width: 100 },
    { title: '资金费自动调整系数区间', dataIndex: 'adjustFactorRange', width: 180 },
    { title: '费率精度', dataIndex: 'ratePrecision', width: 120 },
    { title: '老算法利率', dataIndex: 'oldAlgoRate', width: 100 },
    { title: '新算法利率', dataIndex: 'newAlgoRate', width: 110 },
    { title: '结算费率', dataIndex: 'settlementRate', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean) => <Checkbox checked={enabled} />,
    },
    {
      title: '操作记录',
      key: 'record',
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
      width: 80,
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ]

  return (
    <PageFrame
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            增加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称" name="contract">
          <Select placeholder="请选择合约名称" allowClear style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择状态" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select placeholder="请选择行情源" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="contract"
        size="small"
        bordered
        scroll={{ x: 2400 }}
        columns={columns}
        dataSource={fundingRateRecords}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />
    </PageFrame>
  )
}
