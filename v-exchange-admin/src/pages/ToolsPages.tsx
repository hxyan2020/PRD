import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table, Typography, message } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { globalFrequencyGroups } from '../mock/financialData';
import { contractNameOptions } from '../mock/data';

const { Text, Title } = Typography;

export function ClosePositionPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="平仓工具">
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24, border: '1px solid #f0f0f0' }}>
        <Title level={5}>账户平台</Title>
        <Form form={form} layout="vertical">
          <Form.Item label="合约名称" name="contract" rules={[{ required: true, message: '请选择合约名称' }]}>
            <Select placeholder="请选择" options={contractNameOptions} />
          </Form.Item>
          <Form.Item
            label="多仓UID"
            name="longUid"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                uid 与空仓 uid 相同为自成交{' '}
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
                uid 与多仓 uid 相同为自成交{' '}
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
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => form.resetFields()}>取消</Button>
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    await form.validateFields();
                    message.success('已提交');
                  } catch {
                    /* validation */
                  }
                }}
              >
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </AdminPageShell>
  );
}

export function GlobalFrequencyPage() {
  return (
    <AdminPageShell title="全局频率分组">
      <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
        <Text>
          安全水位线: <Text strong>30000/s</Text>
        </Text>
        <Button type="primary" icon={<PlusOutlined />}>
          增加
        </Button>
      </div>
      <Table
        rowKey="key"
        size="small"
        columns={[
          { title: '组名', dataIndex: 'groupName', width: 120 },
          { title: '占比', dataIndex: 'ratio', width: 180 },
          { title: '操作人', dataIndex: 'operator', width: 200 },
          { title: '创建时间', dataIndex: 'createdAt', width: 170 },
          { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
          {
            title: '操作',
            key: 'op',
            width: 160,
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
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </AdminPageShell>
  );
}

export function OpenBottomPositionPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="开底仓">
      <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item label="合约名称" name="contract" rules={[{ required: true, message: '请选择合约名称' }]}>
          <Select placeholder="请选择" options={contractNameOptions} />
        </Form.Item>
        <Form.Item label="UID" name="uid" rules={[{ required: true, message: '请输入 UID' }]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={async () => {
              try {
                await form.validateFields();
                message.success('已提交');
              } catch {
                /* validation */
              }
            }}
          >
            提交
          </Button>
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
