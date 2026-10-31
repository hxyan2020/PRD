import { Button, Form, Input, Select, Space } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { contractNameOptions } from '../mock/data';

export function AdminAdlPage() {
  const ui = useUi();
  const [form] = Form.useForm();

  return (
    <AdminPageShell title={ui.pageTitle('admin-adl')}>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 10 }}
        style={{ maxWidth: 640, marginTop: 24 }}
        initialValues={{ direction: 'long' }}
      >
        <Form.Item label={ui.contractName} name="contract" rules={[{ required: true }]}>
          <Select placeholder={ui.pleaseSelect} options={contractNameOptions} />
        </Form.Item>
        <Form.Item label={ui.t('合约FID', 'Contract FID')} name="fid" rules={[{ required: true }]}>
          <Input placeholder={ui.pleaseInput} />
        </Form.Item>
        <Form.Item label={ui.t('方向', 'Direction')} name="direction" rules={[{ required: true }]}>
          <Select
            options={[
              { label: ui.t('多', 'Long'), value: 'long' },
              { label: ui.t('空', 'Short'), value: 'short' },
            ]}
          />
        </Form.Item>
        <Form.Item label={ui.t('价格', 'Price')} name="price">
          <Input placeholder={ui.pleaseInput} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Space>
            <Button type="primary">{ui.confirm}</Button>
            <Button type="primary" onClick={() => form.resetFields()}>
              {ui.reset}
            </Button>
            <Button>{ui.t('查看持仓', 'View positions')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
