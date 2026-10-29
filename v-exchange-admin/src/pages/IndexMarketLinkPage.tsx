import { Button, Empty, Form, Select, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { indexNameOptions } from '../config/pairs'
import { fh } from '../components/FieldHelpLabel'

export function IndexMarketLinkPage() {
  const [form] = Form.useForm()

  const columns = [
    { title: fh('指数名称'), dataIndex: 'indexName' },
    { title: fh('目标交易对'), dataIndex: 'targetPair' },
    { title: fh('行情源'), dataIndex: 'marketSource' },
    {
      title: fh('操作'),
      key: 'action',
      width: 100,
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ]

  return (
    <PageFrame
      title="指数价格关联"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label={fh('行情源')} name="source">
          <Select placeholder="请选择" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label={fh('指数名称')} name="indexName">
          <Select placeholder="请选择" allowClear style={{ width: 160 }} options={indexNameOptions} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="indexName"
        size="small"
        bordered
        columns={columns}
        dataSource={[]}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        pagination={false}
      />
    </PageFrame>
  )
}
