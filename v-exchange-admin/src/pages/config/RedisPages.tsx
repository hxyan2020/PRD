import { Button, Form, Input, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { ListPageShell } from '../../components/ListPageShell'
import { redisKeyRecords, redisValueRecords } from '../../mock/extendedData'
import { fh } from '../../components/FieldHelpLabel'

export function RedisKeyManagePage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="合约Redis Key管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      }
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label={fh('Key')} name="key">
            <Input style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <QueryResetButtons onReset={() => form.resetFields()} />
              <Button type="primary">刷新数据</Button>
            </Space>
          </Form.Item>
        </Form>
      }
      rowKey="key"
      columns={[
        { title: fh('Key'), dataIndex: 'key', ellipsis: true },
        { title: fh('类型'), dataIndex: 'type', width: 100 },
        { title: fh('Tag'), dataIndex: 'tag', width: 80 },
        { title: fh('备注'), dataIndex: 'remark', ellipsis: true },
        { title: fh('创建时间'), dataIndex: 'createdAt', width: 170 },
        {
          title: fh('操作'),
          key: 'op',
          width: 160,
          render: () => (
            <Space>
              <Button danger size="small">
                删除
              </Button>
              <Button size="small">修改Tag</Button>
            </Space>
          ),
        },
      ]}
      dataSource={redisKeyRecords}
      pagination={{
        total: 224,
        pageSize: 10,
        showTotal: (t) => `共 ${t} 条`,
        showSizeChanger: true,
      }}
    />
  )
}

export function RedisValueManagePage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="合约Redis Value管理"
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label={fh('Key')} name="key">
            <Input style={{ width: 280 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <QueryResetButtons onReset={() => form.resetFields()} />
              <Button type="primary">刷新数据</Button>
            </Space>
          </Form.Item>
        </Form>
      }
      rowKey="key"
      columns={[
        { title: fh('Key'), dataIndex: 'key', width: 280 },
        { title: fh('Value'), dataIndex: 'value', width: 120 },
        { title: fh('备注'), dataIndex: 'remark', ellipsis: true },
        {
          title: fh('操作'),
          key: 'op',
          width: 140,
          render: () => (
            <Space>
              <Button type="primary" size="small">
                编辑
              </Button>
              <Button danger size="small">
                删除
              </Button>
            </Space>
          ),
        },
      ]}
      dataSource={redisValueRecords}
      pagination={{
        total: 36,
        pageSize: 10,
        showTotal: (t) => `共 ${t} 条`,
        showSizeChanger: true,
      }}
    />
  )
}
