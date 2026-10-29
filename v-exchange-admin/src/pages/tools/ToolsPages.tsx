import { Button, Form, Input, Select, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ListPageShell } from '../../components/ListPageShell'
import { PageFrame } from '../../components/PageFrame'
import { globalFrequencyGroups } from '../../mock/openapiFinancialData'
import { fh } from '../../components/FieldHelpLabel'

const { Text } = Typography

export function ClosePositionPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="Close Position">
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24, border: '1px solid #f0f0f0' }}>
        <Typography.Title level={5}>账户平台</Typography.Title>
        <Form form={form} layout="vertical">
          <Form.Item label={fh('合约名称')} name="contract" rules={[{ required: true }]}>
            <Select placeholder="请选择" options={[{ value: 'BTC_USD永续', label: 'BTC_USD永续' }]} />
          </Form.Item>
          <Form.Item
            label="多仓UID"
            name="longUid"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                uid与空仓uid相同为自成交{' '}
                <Button type="link" size="small" style={{ padding: 0 }}>
                  查看多仓持仓
                </Button>
              </Text>
            }
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="空仓UID"
            name="shortUid"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                uid与空仓uid相同为自成交{' '}
                <Button type="link" size="small" style={{ padding: 0 }}>
                  查看空仓持仓
                </Button>
              </Text>
            }
          >
            <Input />
          </Form.Item>
          <Form.Item label="成交价格" name="price">
            <Input placeholder="当前合理价" />
          </Form.Item>
          <Form.Item label="数量" name="qty" extra="若不输入，取多空最小值">
            <Input placeholder="请输入数量" />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button>取消</Button>
              <Button type="primary">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </PageFrame>
  )
}

export function GlobalFrequencyPage() {
  return (
    <ListPageShell
      title="全局频率分组配置"
      extra={
        <Space>
          <Text>
            安全水位线: <Text strong>30000/s</Text>
          </Text>
          <Button type="primary" icon={<PlusOutlined />}>
            增加
          </Button>
        </Space>
      }
      rowKey="groupName"
      columns={[
        { title: '组名', dataIndex: 'groupName' },
        { title: '占比', dataIndex: 'ratio' },
        { title: '操作人', dataIndex: 'operator' },
        { title: '创建时间', dataIndex: 'createdAt', width: 170 },
        { title: fh('更新时间'), dataIndex: 'updatedAt', width: 170 },
        {
          title: '操作',
          key: 'op',
          width: 200,
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
      dataSource={globalFrequencyGroups}
      pagination={{ pageSize: 10 }}
    />
  )
}

export function OpenBottomPositionPage() {
  return (
    <PageFrame title="Open Bottom Position">
      <Form layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item label={fh('合约名称')} name="contract">
          <Select placeholder="请选择" />
        </Form.Item>
        <Form.Item label="UID" name="uid">
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary">提交</Button>
        </Form.Item>
      </Form>
    </PageFrame>
  )
}
