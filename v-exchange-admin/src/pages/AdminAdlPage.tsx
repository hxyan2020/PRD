import { Button, Form, Input, Select, Space } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

export function AdminAdlPage() {
  const [form] = Form.useForm();

  return (
    <AdminPageShell title="一键平仓">
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 10 }}
        style={{ maxWidth: 640, marginTop: 24 }}
        initialValues={{ direction: 'long' }}
      >
        <Form.Item label="合约名称" name="contract" rules={[{ required: true }]}>
          <Select placeholder="请选择" options={contractNameOptions} />
        </Form.Item>
        <Form.Item label="合约FID" name="fid" rules={[{ required: true }]}>
          <Input placeholder="请输入" />
        </Form.Item>
        <Form.Item label="方向" name="direction" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '多', value: 'long' },
              { label: '空', value: 'short' },
            ]}
          />
        </Form.Item>
        <Form.Item label="价格" name="price">
          <Input placeholder="请输入" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Space>
            <Button type="primary">确定</Button>
            <Button type="primary" onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button>查看持仓</Button>
          </Space>
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
