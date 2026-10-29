import { Button, Form, Input, Select, Space } from 'antd'
import { PageFrame } from '../components/PageFrame'
import { perpContractOptions } from '../config/pairs'
import { fh } from '../components/FieldHelpLabel'

export function AdminAdlPage() {
  const [form] = Form.useForm()

  return (
    <PageFrame title="一键平仓">
      <Form form={form} layout="vertical" style={{ maxWidth: 480 }} initialValues={{ direction: 'long' }}>
        <Form.Item label={fh('合约名称')} name="contractName" rules={[{ required: true }]}>
          <Select placeholder="合约名称" options={perpContractOptions} />
        </Form.Item>
        <Form.Item label={fh('合约FID')} name="contractFid" rules={[{ required: true }]}>
          <Input placeholder="合约FID" />
        </Form.Item>
        <Form.Item label={fh('方向')} name="direction" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'long', label: '多' },
              { value: 'short', label: '空' },
            ]}
          />
        </Form.Item>
        <Form.Item label={fh('价格')} name="price">
          <Input placeholder="价格" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary">确定</Button>
            <Button type="primary" ghost>
              重置
            </Button>
            <Button>查看持仓</Button>
          </Space>
        </Form.Item>
      </Form>
    </PageFrame>
  )
}
