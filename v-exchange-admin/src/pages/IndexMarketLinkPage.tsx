import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';

export function IndexMarketLinkPage() {
  const columns = [
    { title: '指数名称', dataIndex: 'indexName' },
    { title: '目标交易对', dataIndex: 'targetPair' },
    { title: '行情源', dataIndex: 'marketSource' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell titleTag="指数价格关联">
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="行情源">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Input placeholder="指数名称" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      </div>
      <Table rowKey="indexName" columns={columns} dataSource={[]} locale={{ emptyText: '暂无数据' }} size="small" />
    </AdminPageShell>
  );
}
