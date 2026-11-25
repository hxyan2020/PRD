import { SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

interface RiskFundDetailRow {
  key: string;
  displayName: string;
  contractName: string;
  pnlRecordId: string;
  contractFid: string;
  changeType: string;
  changeAmount: string;
  createTime: string;
}

const DETAIL_ROWS: RiskFundDetailRow[] = [
  {
    key: '1',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    pnlRecordId: '1009',
    contractFid: '1',
    changeType: '代管账户资金清空',
    changeAmount: '0.00455688USD',
    createTime: '2026-10-26 22:58:08',
  },
  {
    key: '2',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    pnlRecordId: '1008',
    contractFid: '1',
    changeType: '代管账户资金清空',
    changeAmount: '-0.00000576USD',
    createTime: '2026-10-26 18:12:41',
  },
  {
    key: '3',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    pnlRecordId: '1005',
    contractFid: '2',
    changeType: '代管账户资金清空',
    changeAmount: '0.00120450USD',
    createTime: '2026-10-16 09:33:20',
  },
  {
    key: '4',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    pnlRecordId: '1004',
    contractFid: '1',
    changeType: '代管账户资金清空',
    changeAmount: '-0.00012000USD',
    createTime: '2026-10-16 08:01:05',
  },
  {
    key: '5',
    displayName: 'BTC_USD永续',
    contractName: 'BTC_USD',
    pnlRecordId: '1003',
    contractFid: '10',
    changeType: '代管账户资金清空',
    changeAmount: '0.00000000USD',
    createTime: '2026-10-15 21:44:12',
  },
];

const CHANGE_TYPE_OPTIONS = [
  { label: '代管账户资金清空', value: '代管账户资金清空' },
  { label: '手动充值', value: '手动充值' },
  { label: '回收风险基金', value: '回收风险基金' },
];

export function RiskFundDetailPage() {
  const [form] = Form.useForm();

  const columns = [
    { title: '合约展示名称', dataIndex: 'displayName', width: 140 },
    { title: '合约名称', dataIndex: 'contractName', width: 120 },
    { title: '盈平记录的ID', dataIndex: 'pnlRecordId', width: 120 },
    { title: '合约FID', dataIndex: 'contractFid', width: 100 },
    { title: '变动类型', dataIndex: 'changeType', width: 160 },
    { title: '变动金额', dataIndex: 'changeAmount', width: 160 },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
  ];

  return (
    <AdminPageShell title="风险基金明细">
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: 'wrap' }}
        initialValues={{ contractName: 'XAU_USD' }}
      >
        <Form.Item label="合约名称" name="contractName">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 160 }}
            options={contractNameOptions}
          />
        </Form.Item>
        <Form.Item label="合约FID" name="contractFid">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="变动类型" name="changeType">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 180 }}
            options={CHANGE_TYPE_OPTIONS}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                form.setFieldsValue({ contractName: undefined });
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="key"
        columns={columns}
        dataSource={DETAIL_ROWS}
        scroll={{ x: 1100 }}
        pagination={{
          total: DETAIL_ROWS.length,
          showTotal: (t) => `共 ${t} 条`,
          pageSize: 10,
        }}
        size="small"
      />
    </AdminPageShell>
  );
}
