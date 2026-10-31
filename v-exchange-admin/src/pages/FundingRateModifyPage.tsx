import { Button, Form, Input, Select, Space } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { contractNameOptions } from '../mock/data';

/** 风控管理 → 资金费率修改（截图中的活动页骨架） */
export function FundingRateModifyPage() {
  const ui = useUi();
  const [form] = Form.useForm();

  return (
    <AdminPageShell title={ui.pageTitle('funding-rate-modify')}>
      <Form
        form={form}
        layout="inline"
        style={{ marginTop: 8, marginBottom: 24, flexWrap: 'wrap', gap: 8 }}
      >
        <Form.Item label={ui.contractName} name="contract" rules={[{ required: true }]}>
          <Select placeholder={ui.pleaseSelect} style={{ width: 200 }} options={contractNameOptions} />
        </Form.Item>
        <Form.Item label={ui.t('本期结算', 'Current settlement')} name="settlement">
          <Input placeholder={ui.pleaseInput} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary">{ui.search}</Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
