import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';

export function PositionListPage() {
  const ui = useUi();
const positionColumns = [
  { title: ui.t('合约FID', 'Contract FID'), dataIndex: 'fid', width: 100 },
  { title: ui.t('仓位ID', 'Position ID'), dataIndex: 'positionId', width: 90 },
  { title: ui.t('合约展示名称', 'Contract display name'), dataIndex: 'displayName', width: 120 },
  { title: ui.t('合约名称', 'Contract'), dataIndex: 'contractName', width: 110 },
  { title: ui.t('仓位类型', 'Position type'), dataIndex: 'positionType', width: 90 },
  { title: ui.t('开仓类型', 'Open type'), dataIndex: 'openType', width: 90 },
  { title: ui.t('持仓状态', 'Position status'), dataIndex: 'status', width: 90 },
  { title: ui.t('持仓均价', 'Avg. entry price'), dataIndex: 'avgPrice', width: 90 },
  { title: ui.t('自动增加保证金', 'Auto add margin'), dataIndex: 'autoMargin', width: 120 },
  { title: ui.t('持仓量', 'Position size'), dataIndex: 'quantity', width: 80 },
  { title: ui.t('可平数量', 'Closeable qty'), dataIndex: 'closable', width: 90 },
  { title: ui.t('仓位价值', 'Position value'), dataIndex: 'value', width: 100 },
  { title: ui.t('起始杠杆倍数', 'Initial leverage'), dataIndex: 'leverage', width: 110 },
  { title: ui.t('合理价格', 'Fair price'), dataIndex: 'fairPrice', width: 90 },
  { title: ui.t('仓位保证金', 'Position margin'), dataIndex: 'margin', width: 100 },
  { title: ui.t('保证金比率字段', 'Margin ratio'), dataIndex: 'marginRatio', width: 120 },
  { title: ui.t('浮动盈亏', 'Unrealized PnL'), dataIndex: 'unrealizedPnl', width: 90 },
  { title: ui.t('破产价格', 'Bankruptcy price'), dataIndex: 'bankruptcyPrice', width: 90 },
  { title: ui.t('已实现盈亏', 'Realized PnL'), dataIndex: 'realizedPnl', width: 100 },
  { title: ui.t('平台账号', 'Platform account'), dataIndex: 'platformAccount', width: 100 },
  { title: ui.t('手续费', 'Fee'), dataIndex: 'fee', width: 80 },
  { title: ui.t('资金费率盈亏', 'Funding PnL'), dataIndex: 'fundingPnl', width: 110 },
  { title: ui.t('盈亏', 'PnL'), dataIndex: 'pnl', width: 80 },
  { title: ui.t('回报率', 'Return rate'), dataIndex: 'roi', width: 80 },
  { title: ui.t('杠杆变更', 'Leverage change'), dataIndex: 'leverageChange', width: 90 },
  { title: ui.t('更新时间', 'Updated at'), dataIndex: 'updateTime', width: 160 },
  { title: ui.t('下单时间', 'Order time'), dataIndex: 'orderTime', width: 160 },
];
  return (
    <AdminPageShell titleTag={ui.pageTitle('position-list')}>
      <Alert type="error" message={ui.t('仓位价值与 FID 查询存在约束，请按规范填写筛选条件。', 'Position value and FID filters have constraints; fill filters per the rules.')} showIcon style={{ marginBottom: 12 }} />
      <Form layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item>
          <Button type="primary">根据合约FID查找</Button>
        </Form.Item>
        <Form.Item label="FID">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={ui.t('仓位ID', 'Position ID')}>
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={ui.t('合约名称', 'Contract')}>
          <Select allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.t('持仓量 >=', 'Position size >=')}>
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={ui.t('仓位价值 >=', 'Position value >=')}>
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={ui.t('持仓状态', 'Position status')}>
          <Select allowClear style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label={ui.t('仓位类型', 'Position type')}>
          <Select allowClear style={{ width: 110 }} />
        </Form.Item>
        <Form.Item label={ui.t('开仓类型', 'Open type')}>
          <Select allowClear style={{ width: 110 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button type="primary">{ui.t("导出", "Export")}</Button>
            <Button>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="fid"
        columns={positionColumns}
        dataSource={[]}
        scroll={{ x: 2800 }}
        locale={{ emptyText: ui.empty }}
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
