import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table, Typography, message } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { globalFrequencyGroups } from '../mock/financialData';
import { contractNameOptions } from '../mock/data';

const { Text, Title } = Typography;

export function ClosePositionPage() {
  const [form] = Form.useForm();
  const ui = useUi();

  return (
    <AdminPageShell title={ui.pageTitle('tools-close-position')}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24, border: '1px solid #f0f0f0' }}>
        <Title level={5}>{ui.t('账户平台', 'Account platform')}</Title>
        <Form form={form} layout="vertical">
          <Form.Item
            label={ui.contractName}
            name="contract"
            rules={[{ required: true, message: ui.t('请选择合约名称', 'Please select a contract') }]}
          >
            <Select placeholder={ui.pleaseSelect} options={contractNameOptions} />
          </Form.Item>
          <Form.Item
            label={ui.t('多仓UID', 'Long UID')}
            name="longUid"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {ui.t('uid 与空仓 uid 相同为自成交', 'Same UID as short means self-trade')}{' '}
                <Button type="link" size="small" style={{ padding: 0 }}>
                  {ui.t('查看多仓持仓', 'View long position')}
                </Button>
              </Text>
            }
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={ui.t('空仓UID', 'Short UID')}
            name="shortUid"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {ui.t('uid 与多仓 uid 相同为自成交', 'Same UID as long means self-trade')}{' '}
                <Button type="link" size="small" style={{ padding: 0 }}>
                  {ui.t('查看空仓持仓', 'View short position')}
                </Button>
              </Text>
            }
          >
            <Input />
          </Form.Item>
          <Form.Item label={ui.t('成交价格', 'Fill price')} name="price">
            <Input placeholder={ui.t('当前合理价', 'Current fair price')} />
          </Form.Item>
          <Form.Item
            label={ui.t('数量', 'Quantity')}
            name="qty"
            extra={ui.t('若不输入，取多空最小值', 'If empty, uses the min of long/short')}
          >
            <Input placeholder={ui.t('请输入数量', 'Enter quantity')} />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => form.resetFields()}>{ui.cancel}</Button>
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    await form.validateFields();
                    message.success(ui.t('已提交', 'Submitted'));
                  } catch {
                    /* validation */
                  }
                }}
              >
                {ui.confirm}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </AdminPageShell>
  );
}

export function GlobalFrequencyPage() {
  const ui = useUi();

  return (
    <AdminPageShell title={ui.pageTitle('tools-global-frequency')}>
      <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
        <Text>
          {ui.t('安全水位线', 'Safe watermark')}: <Text strong>30000/s</Text>
        </Text>
        <Button type="primary" icon={<PlusOutlined />}>
          {ui.t('增加', 'Add')}
        </Button>
      </div>
      <Table
        rowKey="key"
        size="small"
        columns={[
          { title: ui.t('组名', 'Group'), dataIndex: 'groupName', width: 120 },
          { title: ui.t('占比', 'Share'), dataIndex: 'ratio', width: 180 },
          { title: ui.operator, dataIndex: 'operator', width: 200 },
          { title: ui.createdAt, dataIndex: 'createdAt', width: 170 },
          { title: ui.updatedAt, dataIndex: 'updatedAt', width: 170 },
          {
            title: ui.action,
            key: 'op',
            width: 160,
            render: () => (
              <Space>
                <Button type="primary" size="small">
                  {ui.edit}
                </Button>
                <Button danger size="small">
                  {ui.delete}
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={globalFrequencyGroups}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </AdminPageShell>
  );
}

export function OpenBottomPositionPage() {
  const [form] = Form.useForm();
  const ui = useUi();

  return (
    <AdminPageShell title={ui.pageTitle('tools-open-bottom-position')}>
      <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item
          label={ui.contractName}
          name="contract"
          rules={[{ required: true, message: ui.t('请选择合约名称', 'Please select a contract') }]}
        >
          <Select placeholder={ui.pleaseSelect} options={contractNameOptions} />
        </Form.Item>
        <Form.Item
          label="UID"
          name="uid"
          rules={[{ required: true, message: ui.t('请输入 UID', 'Please enter UID') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={async () => {
              try {
                await form.validateFields();
                message.success(ui.t('已提交', 'Submitted'));
              } catch {
                /* validation */
              }
            }}
          >
            {ui.submit}
          </Button>
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
