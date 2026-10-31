import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Input, Space, Table, Typography } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';

const { Text } = Typography;

export function ApiOpenListPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('api-open-list')}>
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item label={ui.t('用户合约 UID', 'User contract UID')} name="uid">
          <Input style={{ width: 180 }} placeholder={ui.pleaseInput} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />}>
          {ui.add}
        </Button>
      </div>
      <Table
        rowKey="uid"
        size="small"
        columns={[
          { title: ui.t('用户合约 UID', 'User contract UID'), dataIndex: 'uid', width: 160 },
          { title: ui.remark, dataIndex: 'remark', width: 220 },
          { title: ui.creator, dataIndex: 'creator', width: 200 },
          { title: ui.createdAt, dataIndex: 'createdAt', width: 170 },
          {
            title: ui.action,
            key: 'op',
            width: 90,
            render: () => (
              <Button danger size="small">
                {ui.delete}
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={false}
        scroll={{ x: 900 }}
      />
      <Text type="danger" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
        {ui.t(
          '注意：加入白名单的用户以及所有子账户都可以正常使用 API 下单（包括限价单、计划委托、止盈止损和跟踪委托）',
          'Note: Whitelisted users and all sub-accounts can place API orders (limit, trigger, TP/SL, and trailing).',
        )}
      </Text>
    </AdminPageShell>
  );
}

export function ApiRatioConfigPage() {
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('api-ratio-config')}>
      <Table
        rowKey="userType"
        size="small"
        columns={[
          { title: ui.t('系数', 'Ratio'), dataIndex: 'ratio', width: 120 },
          { title: ui.t('用户类型', 'User type'), dataIndex: 'userType', width: 160 },
          {
            title: ui.action,
            key: 'op',
            width: 100,
            render: () => (
              <Button type="primary" size="small">
                {ui.edit}
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
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('api-user-limit-config')}>
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item label={ui.t('用户UID', 'User UID')} name="uid">
          <Input style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />}>
          {ui.add}
        </Button>
      </div>
      <Table
        rowKey="uid"
        size="small"
        scroll={{ x: 900 }}
        columns={[
          { title: 'UID', dataIndex: 'uid', width: 120 },
          { title: 'URI', dataIndex: 'uri', width: 180 },
          { title: ui.t('间隔', 'Interval'), dataIndex: 'interval', width: 100 },
          { title: ui.t('请求次数', 'Request count'), dataIndex: 'requests', width: 120 },
          { title: ui.t('描述', 'Description'), dataIndex: 'description', width: 180 },
          {
            title: ui.action,
            key: 'op',
            width: 90,
            render: () => (
              <Button type="primary" size="small">
                {ui.edit}
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </AdminPageShell>
  );
}

export function ApiUserTakerBlacklistPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('api-user-taker-blacklist')}>
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item name="uid">
          <Input placeholder={ui.t('请输入UID', 'Enter UID')} style={{ width: 180 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary">{ui.t('新增', 'Add')}</Button>
      </div>
      <Table
        rowKey="uid"
        size="small"
        columns={[
          { title: 'UID', dataIndex: 'uid', width: 140 },
          { title: ui.t('Taker 黑名单', 'Taker blacklist'), dataIndex: 'blacklist', width: 200 },
          {
            title: ui.action,
            key: 'op',
            width: 90,
            render: () => (
              <Button danger size="small">
                {ui.delete}
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={false}
      />
      <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
        {ui.t(
          '* 已配置的交易币对，只允许用户下 maker（post only）单',
          '* For configured pairs, users may only place maker (post-only) orders.',
        )}
      </Text>
    </AdminPageShell>
  );
}

export function ApiUserTakerConfigPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('api-user-taker-config')}>
      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Form.Item label={ui.t('用户UID', 'User UID')} name="uid">
          <Input style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Space wrap>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
            <Button>{ui.t('用户限额', 'User limits')}</Button>
            <Button>{ui.t('全局限额', 'Global limits')}</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Space wrap>
          <Button type="primary">{ui.t('Tag管理', 'Tag manage')}</Button>
          <Button type="primary">{ui.t('批量修改用户限额', 'Batch edit user limits')}</Button>
          <Button type="primary">{ui.t('新增 taker 全局限额', 'Add global taker limit')}</Button>
          <Button type="primary">{ui.t('taker 用户限速', 'Taker user rate limit')}</Button>
        </Space>
      </div>
      <Table
        rowKey="uid"
        size="small"
        scroll={{ x: 1100 }}
        columns={[
          { title: ui.t('用户UID', 'User UID'), dataIndex: 'uid', width: 120 },
          { title: ui.t('币对', 'Pair'), dataIndex: 'pair', width: 120 },
          { title: ui.t('间隔', 'Interval'), dataIndex: 'interval', width: 100 },
          { title: ui.t('请求次数', 'Request count'), dataIndex: 'requests', width: 120 },
          { title: ui.t('描述', 'Description'), dataIndex: 'description', width: 160 },
          { title: ui.t('标签', 'Tags'), dataIndex: 'tags', width: 120 },
          {
            title: ui.action,
            key: 'op',
            width: 90,
            render: () => (
              <Button type="primary" size="small">
                {ui.edit}
              </Button>
            ),
          },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </AdminPageShell>
  );
}
