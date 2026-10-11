import { DownloadOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Select, Space, Switch, Table, Tag } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { indexPriceList } from '../mock/data';

export function IndexPricePage() {
  const columns = [
    { title: '指数名称', dataIndex: 'indexName', width: 100 },
    { title: '基础币种', dataIndex: 'baseCurrency', width: 80 },
    { title: '计价币种', dataIndex: 'quoteCurrency', width: 80 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '最小行情源数', dataIndex: 'minMarketSources', width: 110 },
    {
      title: '行情源',
      dataIndex: 'marketSources',
      width: 200,
      render: (sources: string[]) => sources.join(', '),
    },
    {
      title: '行情源交易量白名单',
      dataIndex: 'volumeWhitelist',
      width: 180,
      render: (list: string[]) =>
        list.map((s) => (
          <Tag color="red" key={s} style={{ marginBottom: 2 }}>
            {s}
          </Tag>
        )),
    },
    { title: '计算方式', dataIndex: 'calculationMethod', width: 160 },
    { title: '订阅币种', dataIndex: 'subscriptionCurrency', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => <Switch checked={v} size="small" />,
    },
    { title: '放大倍数', dataIndex: 'magnification', width: 80 },
    {
      title: '操作记录',
      key: 'log',
      width: 90,
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
  ];

  return (
    <AdminPageShell title="指数价格">
      <Form layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label="基础币种">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="计价币种">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="状态">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="计算方式">
          <Select allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="行情源">
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </Form.Item>
        <Form.Item label="权重展示开关">
          <Switch size="small" />
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Space>
          <Button danger>批量取消行情源</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            添加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            导出
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            下载配置
          </Button>
        </Space>
      </div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={indexPriceList}
        scroll={{ x: 1800 }}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
