import { Button, Form, Input, Select, Table, Tag } from 'antd'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { marketSourceRecords } from '../mock/data'

export function MarketSourcePage() {
  const [form] = Form.useForm()

  const columns = [
    { title: '市场名称', dataIndex: 'marketName', width: 140 },
    { title: '显示名称', dataIndex: 'displayName', width: 120 },
    { title: '是否需要设置价差监控', dataIndex: 'spreadMonitor', width: 160 },
    { title: '描述信息', dataIndex: 'description', ellipsis: true },
    { title: '进入观察期 (秒)', dataIndex: 'observationSeconds', width: 130 },
    { title: '重新启用 (秒)', dataIndex: 'reenableSeconds', width: 120 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean) => (enabled ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>),
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
      title="行情源"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="市场名称" name="marketName">
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="显示名称" name="displayName">
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="marketName"
        size="small"
        bordered
        columns={columns}
        dataSource={marketSourceRecords}
        pagination={{ total: 17, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />
    </PageFrame>
  )
}
