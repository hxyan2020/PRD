import { Button, DatePicker, Form, Input, Select } from 'antd'
import { PageFrame } from '../components/PageFrame'
import { symbolOptions } from '../config/pairs'

export function KlineManagePage() {
  const [form] = Form.useForm()

  return (
    <PageFrame title="K线管理">
      <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
        <Form.Item label="交易对" name="pair" rules={[{ required: true }]}>
          <Select placeholder="请选择" options={symbolOptions} />
        </Form.Item>
        <Form.Item label="周期" name="period" rules={[{ required: true }]}>
          <Select placeholder="请选择" options={[{ value: '1m', label: '1m' }, { value: '5m', label: '5m' }, { value: '1h', label: '1h' }]} />
        </Form.Item>
        <Form.Item
          label="窗口时间"
          name="windowTime"
          extra="可选 (为空代表修改最后一个点)"
        >
          <DatePicker showTime placeholder="请选择日期" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="修改属性" name="attr" rules={[{ required: true }]}>
          <Select placeholder="请选择" options={[{ value: 'open', label: 'open' }, { value: 'high', label: 'high' }, { value: 'low', label: 'low' }, { value: 'close', label: 'close' }]} />
        </Form.Item>
        <Form.Item label="修改属性值" name="value" rules={[{ required: true }]}>
          <Input placeholder="请输入" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={() => form.validateFields()}>
            修改K线
          </Button>
        </Form.Item>
      </Form>
    </PageFrame>
  )
}
