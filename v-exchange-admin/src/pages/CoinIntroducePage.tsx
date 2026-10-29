import { Button, Form, Input, Select, Space, Table } from 'antd'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { coinIntroduceRecords } from '../mock/data'
import { fh } from '../components/FieldHelpLabel'

export function CoinIntroducePage() {
  const [form] = Form.useForm()

  const columns = [
    { title: fh('合约名称'), dataIndex: 'contractName' },
    { title: fh('合约展示名称'), dataIndex: 'displayName' },
    { title: '币种名称', dataIndex: 'currencyName' },
    { title: fh('更新时间'), dataIndex: 'updatedAt', width: 180 },
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
      width: 220,
      render: () => (
        <Space>
          <Button type="primary" size="small">
            详情
          </Button>
          <Button type="primary" size="small">
            编辑
          </Button>
          <Button danger size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageFrame
      title="合约币种概览配置"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约" name="contract">
          <Select placeholder="请选择" allowClear style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="keyword">
          <Input placeholder="请输入币种名称" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="contractName"
        size="small"
        bordered
        columns={columns}
        dataSource={coinIntroduceRecords}
        pagination={{ total: 1, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />
    </PageFrame>
  )
}
