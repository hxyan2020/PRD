import { Button, Form, Input, Select, Space } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

/** 风控管理 → 资金费率修改（截图中的活动页骨架） */
export function FundingRateModifyPage() {
  const [form] = Form.useForm();

  return (
    <AdminPageShell title="资金费率修改">
      <Form
        form={form}
        layout="inline"
        style={{ marginTop: 8, marginBottom: 24, flexWrap: 'wrap', gap: 8 }}
      >
        <Form.Item label="合约名称" name="contract" rules={[{ required: true }]}>
          <Select placeholder="请选择" style={{ width: 200 }} options={contractNameOptions} />
        </Form.Item>
        <Form.Item label="本期结算" name="settlement">
          <Input placeholder="请输入" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary">查询</Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
