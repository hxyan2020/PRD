import { Button, Form, Select, Space, Switch, Table, Tag } from 'antd'
import { DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { indexPriceRecords } from '../mock/data'

export function IndexPricePage() {
  const [form] = Form.useForm()

  const columns = [
    { title: '指数名称', dataIndex: 'indexName', width: 100 },
    { title: '基础币种', dataIndex: 'baseCoin', width: 90 },
    { title: '计价币种', dataIndex: 'quoteCoin', width: 90 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '最小行情源数', dataIndex: 'minSourceCount', width: 110 },
    { title: '行情源', dataIndex: 'priceSources', width: 220, ellipsis: true },
    {
      title: '行情源交易量白名单',
      dataIndex: 'whitelist',
      width: 180,
      render: (text: string) => (
        <Space>
          <span>{text}</span>
          <Button type="link" size="small">
            编辑白名单
          </Button>
        </Space>
      ),
    },
    { title: '计算方式', dataIndex: 'calcMethod', width: 160 },
    { title: '订阅币种', dataIndex: 'subscriptionCoin', width: 90 },
    { title: '放大倍数', dataIndex: 'magnification', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean) =>
        enabled ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>,
    },
    {
      title: '操作记录',
      key: 'record',
      width: 100,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ]

  return (
    <PageFrame
      extra={
        <Space wrap>
          <Button danger>批量获取行情源</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            添加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            指数价格权重详情下载
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            指数差异详情下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item label="基础币种" name="base">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="计价币种" name="quote">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="计算方式" name="calc">
          <Select placeholder="请选择" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="权重展示开关">
          <Switch />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="indexName"
        size="small"
        bordered
        scroll={{ x: 2000 }}
        columns={columns}
        dataSource={indexPriceRecords}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
      />
    </PageFrame>
  )
}
