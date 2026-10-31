import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { coinIntroduceList } from '../mock/data';

export function CoinIntroducePage() {
  const columns = [
    { title: '合约名称', dataIndex: 'contractName' },
    { title: '合约显示名称', dataIndex: 'contractDisplayName' },
    { title: '币种名称', dataIndex: 'currencyName' },
    { title: '更新时间', dataIndex: 'updateTime' },
    {
      title: '操作记录',
      key: 'log',
      render: () => (
        <Button type="link" size="small">
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="primary" size="small">
            查看
          </Button>
          <Button type="primary" size="small">
            编辑
          </Button>
          <Button danger size="small">
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell title="合约币种概览配置" titleTag="币种介绍">
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称">
          <Select placeholder="请选择" style={{ width: 160 }} allowClear />
        </Form.Item>
        <Form.Item>
          <Input placeholder="请输入币种名称" style={{ width: 180 }} />
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
          新增
        </Button>
      </div>
      <Table
        rowKey="contractName"
        columns={columns}
        dataSource={coinIntroduceList}
        pagination={{ total: 1, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
