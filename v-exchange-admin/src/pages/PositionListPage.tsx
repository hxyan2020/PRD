import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';

const positionColumns = [
  { title: '合约FID', dataIndex: 'fid', width: 100 },
  { title: '仓位ID', dataIndex: 'positionId', width: 90 },
  { title: '合约展示名称', dataIndex: 'displayName', width: 120 },
  { title: '合约名称', dataIndex: 'contractName', width: 110 },
  { title: '仓位类型', dataIndex: 'positionType', width: 90 },
  { title: '开仓类型', dataIndex: 'openType', width: 90 },
  { title: '持仓状态', dataIndex: 'status', width: 90 },
  { title: '持仓均价', dataIndex: 'avgPrice', width: 90 },
  { title: '自动增加保证金', dataIndex: 'autoMargin', width: 120 },
  { title: '持仓量', dataIndex: 'quantity', width: 80 },
  { title: '可平数量', dataIndex: 'closable', width: 90 },
  { title: '仓位价值', dataIndex: 'value', width: 100 },
  { title: '起始杠杆倍数', dataIndex: 'leverage', width: 110 },
  { title: '合理价格', dataIndex: 'fairPrice', width: 90 },
  { title: '仓位保证金', dataIndex: 'margin', width: 100 },
  { title: '保证金比率字段', dataIndex: 'marginRatio', width: 120 },
  { title: '浮动盈亏', dataIndex: 'unrealizedPnl', width: 90 },
  { title: '破产价格', dataIndex: 'bankruptcyPrice', width: 90 },
  { title: '已实现盈亏', dataIndex: 'realizedPnl', width: 100 },
  { title: '平台账号', dataIndex: 'platformAccount', width: 100 },
  { title: '手续费', dataIndex: 'fee', width: 80 },
  { title: '资金费率盈亏', dataIndex: 'fundingPnl', width: 110 },
  { title: '盈亏', dataIndex: 'pnl', width: 80 },
  { title: '回报率', dataIndex: 'roi', width: 80 },
  { title: '杠杆变更', dataIndex: 'leverageChange', width: 90 },
  { title: '更新时间', dataIndex: 'updateTime', width: 160 },
  { title: '下单时间', dataIndex: 'orderTime', width: 160 },
];

export function PositionListPage() {
  return (
    <AdminPageShell titleTag="持仓列表">
      <Alert type="error" message="仓位价值与 FID 查询存在约束，请按规范填写筛选条件。" showIcon style={{ marginBottom: 12 }} />
      <Form layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item>
          <Button type="primary">根据合约FID查找</Button>
        </Form.Item>
        <Form.Item label="FID">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="仓位ID">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="合约名称">
          <Select allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="持仓量 >=">
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="仓位价值 >=">
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="持仓状态">
          <Select allowClear style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="仓位类型">
          <Select allowClear style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label="开仓类型">
          <Select allowClear style={{ width: 110 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button type="primary">导出</Button>
            <Button>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="fid"
        columns={positionColumns}
        dataSource={[]}
        scroll={{ x: 2800 }}
        locale={{ emptyText: '暂无数据' }}
        pagination={{
          showSizeChanger: true,
          pageSize: 200,
          pageSizeOptions: ['200'],
          showQuickJumper: false,
          itemRender: (_, type) => {
            if (type === 'prev') return <a>上一页</a>;
            if (type === 'next') return <a>下一页</a>;
            return null;
          },
        }}
        size="small"
      />
    </AdminPageShell>
  );
}
