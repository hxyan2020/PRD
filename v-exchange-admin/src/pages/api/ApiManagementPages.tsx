import { Button, Empty, Form, Input, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { ListPageShell } from '../../components/ListPageShell'
import { fh } from '../../components/FieldHelpLabel'

const { Text } = Typography
const emptyLocale = { emptyText: <Empty description="暂无数据" /> }

export function ApiOpenListPage() {
  const [form] = Form.useForm()
  return (
    <>
      <ListPageShell
        title="API 开放白名单"
        filters={
          <Form form={form} layout="inline" style={{ marginBottom: 8 }}>
            <Form.Item label={fh('用户合约 UID')} name="uid">
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary">查询</Button>
            </Form.Item>
          </Form>
        }
        rowKey="uid"
        columns={[
          { title: fh('用户合约 UID'), dataIndex: 'uid' },
          { title: fh('备注'), dataIndex: 'remark' },
          { title: fh('创建者'), dataIndex: 'creator' },
          { title: fh('创建时间'), dataIndex: 'createdAt' },
          { title: fh('操作'), key: 'op', render: () => <Button danger size="small">删除</Button> },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={false}
      />
      <Text type="danger" style={{ display: 'block', marginTop: -8, marginBottom: 16, fontSize: 12 }}>
        注意：加入白名单的用户以及所有子账户都可以正常使用 API 下单（包括限价单、计划委托、止盈止损和跟踪委托）
      </Text>
    </>
  )
}

export function ApiRatioConfigPage() {
  return (
    <ListPageShell
      title="限额系数配置"
      rowKey="userType"
      columns={[
        { title: fh('系数'), dataIndex: 'ratio' },
        { title: fh('用户类型'), dataIndex: 'userType' },
        { title: fh('操作'), key: 'op', render: () => <Button type="primary" size="small">编辑</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={false}
    />
  )
}

export function ApiUserLimitConfigPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="User Limit Config"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      }
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label={fh('用户UID')} name="uid">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="uid"
      columns={[
        { title: fh('UID'), dataIndex: 'uid' },
        { title: fh('uri'), dataIndex: 'uri' },
        { title: fh('间隔'), dataIndex: 'interval' },
        { title: fh('请求次数'), dataIndex: 'requests' },
        { title: fh('描述'), dataIndex: 'description' },
        { title: fh('操作'), key: 'op', render: () => <Button type="primary" size="small">编辑</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}

export function ApiUserTakerBlacklistPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="User Taker Blacklist"
      extra={
        <Button type="primary">新增</Button>
      }
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 8 }}>
          <Form.Item name="uid">
            <Input placeholder="请输入UID" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="uid"
      columns={[
        { title: fh('UID'), dataIndex: 'uid' },
        { title: fh('taker黑名单'), dataIndex: 'blacklist' },
        { title: fh('操作'), key: 'op', render: () => <Button danger size="small">删除</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={false}
    />
  )
}

export function ApiUserTakerBlacklistPageWithNote() {
  return (
    <>
      <ApiUserTakerBlacklistPage />
      <Text type="secondary" style={{ display: 'block', marginTop: -8, fontSize: 12 }}>
        * 已配置的交易币对,只允许用户下maker(post only)单
      </Text>
    </>
  )
}

export function ApiUserTakerConfigPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="User Taker Config"
      extra={
        <Space wrap>
          <Button type="primary">Tag管理</Button>
          <Button type="primary">批量修改用户限额</Button>
          <Button type="primary">新增taker全局限额</Button>
          <Button type="primary">taker用户限速</Button>
        </Space>
      }
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label={fh('用户UID')} name="uid">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">查询</Button>
              <Button>重置</Button>
              <Button>用户限额</Button>
              <Button>全局限额</Button>
            </Space>
          </Form.Item>
        </Form>
      }
      rowKey="uid"
      scroll={{ x: 1200 }}
      columns={[
        { title: fh('用户UID'), dataIndex: 'uid' },
        { title: fh('币对'), dataIndex: 'pair' },
        { title: fh('间隔'), dataIndex: 'interval' },
        { title: fh('请求次数'), dataIndex: 'requests' },
        { title: fh('描述'), dataIndex: 'description' },
        { title: fh('标签'), dataIndex: 'tags' },
        { title: fh('操作'), key: 'op', render: () => <Button type="primary" size="small">编辑</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}
