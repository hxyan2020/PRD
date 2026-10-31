import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Input, Space, Table, Typography } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';

const { Text } = Typography;
const emptyLocale = { emptyText: <Empty description="暂无数据" /> };

export function ApiOpenListPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="API开放白名单">
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item label="用户合约 UID" name="uid">
          <Input style={{ width: 180 }} placeholder="请输入" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      </div>
      <Table
        rowKey="uid"
        size="small"
        columns={[
          { title: '用户合约 UID', dataIndex: 'uid', width: 160 },
          { title: '备注', dataIndex: 'remark', width: 220 },
          { title: '创建者', dataIndex: 'creator', width: 200 },
          { title: '创建时间', dataIndex: 'createdAt', width: 170 },
          {
            title: '操作',
            key: 'op',
            width: 90,
            render: () => (
              <Button danger size="small">
                删除
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={false}
      />
      <Text type="danger" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
        注意：加入白名单的用户以及所有子账户都可以正常使用 API 下单（包括限价单、计划委托、止盈止损和跟踪委托）
      </Text>
    </AdminPageShell>
  );
}

export function ApiRatioConfigPage() {
  return (
    <AdminPageShell title="限额系数配置">
      <Table
        rowKey="userType"
        size="small"
        columns={[
          { title: '系数', dataIndex: 'ratio', width: 120 },
          { title: '用户类型', dataIndex: 'userType', width: 160 },
          {
            title: '操作',
            key: 'op',
            width: 100,
            render: () => (
              <Button type="primary" size="small">
                编辑
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={false}
      />
    </AdminPageShell>
  );
}

export function ApiUserLimitConfigPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="用户限额配置">
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item label="用户UID" name="uid">
          <Input style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      </div>
      <Table
        rowKey="uid"
        size="small"
        scroll={{ x: 900 }}
        columns={[
          { title: 'UID', dataIndex: 'uid', width: 120 },
          { title: 'uri', dataIndex: 'uri', width: 180 },
          { title: '间隔', dataIndex: 'interval', width: 100 },
          { title: '请求次数', dataIndex: 'requests', width: 100 },
          { title: '描述', dataIndex: 'description', width: 180 },
          {
            title: '操作',
            key: 'op',
            width: 90,
            render: () => (
              <Button type="primary" size="small">
                编辑
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </AdminPageShell>
  );
}

export function ApiUserTakerBlacklistPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="用户 Taker 黑名单">
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item name="uid">
          <Input placeholder="请输入UID" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary">新增</Button>
      </div>
      <Table
        rowKey="uid"
        size="small"
        columns={[
          { title: 'UID', dataIndex: 'uid', width: 140 },
          { title: 'Taker 黑名单', dataIndex: 'blacklist', width: 200 },
          {
            title: '操作',
            key: 'op',
            width: 90,
            render: () => (
              <Button danger size="small">
                删除
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={false}
      />
      <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
        * 已配置的交易币对，只允许用户下 maker（post only）单
      </Text>
    </AdminPageShell>
  );
}

export function ApiUserTakerConfigPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="用户 Taker 配置">
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item label="用户UID" name="uid">
          <Input style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Space wrap>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
            <Button>用户限额</Button>
            <Button>全局限额</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Space wrap>
          <Button type="primary">Tag管理</Button>
          <Button type="primary">批量修改用户限额</Button>
          <Button type="primary">新增 taker 全局限额</Button>
          <Button type="primary">taker 用户限速</Button>
        </Space>
      </div>
      <Table
        rowKey="uid"
        size="small"
        scroll={{ x: 1100 }}
        columns={[
          { title: '用户UID', dataIndex: 'uid', width: 120 },
          { title: '币对', dataIndex: 'pair', width: 120 },
          { title: '间隔', dataIndex: 'interval', width: 100 },
          { title: '请求次数', dataIndex: 'requests', width: 100 },
          { title: '描述', dataIndex: 'description', width: 160 },
          { title: '标签', dataIndex: 'tags', width: 120 },
          {
            title: '操作',
            key: 'op',
            width: 90,
            render: () => (
              <Button type="primary" size="small">
                编辑
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </AdminPageShell>
  );
}
