import { SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
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

export function RiskFundDetailPage() {
  const ui = useUi();
const CHANGE_TYPE_OPTIONS = [
  { label: ui.t('代管账户资金清空', 'Clear managed account funds'), value: '代管账户资金清空' },
  { label: ui.t('手动充值', 'Manual top-up'), value: '手动充值' },
  { label: ui.t('回收风险基金', 'Recycle risk fund'), value: '回收风险基金' },
];
  const [form] = Form.useForm();

  const columns = [
    { title: ui.t('合约展示名称', 'Contract display name'), dataIndex: 'displayName', width: 140 },
    { title: ui.t('合约名称', 'Contract'), dataIndex: 'contractName', width: 120 },
    { title: ui.t('盈平记录的ID', 'Close record ID'), dataIndex: 'pnlRecordId', width: 120 },
    { title: ui.t('合约FID', 'Contract FID'), dataIndex: 'contractFid', width: 100 },
    { title: ui.t('变动类型', 'Change type'), dataIndex: 'changeType', width: 160 },
    { title: ui.t('变动金额', 'Change amount'), dataIndex: 'changeAmount', width: 160 },
    { title: ui.createdAt, dataIndex: 'createTime', width: 170 },
  ];

  return (
    <AdminPageShell title={ui.pageTitle('risk-fund-detail')}>
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: 'wrap' }}
        initialValues={{ contractName: 'XAU_USD' }}
      >
        <Form.Item label={ui.contractName} name="contractName">
          <Select
            placeholder={ui.pleaseSelect}
            allowClear
            style={{ width: 160 }}
            options={contractNameOptions}
          />
        </Form.Item>
        <Form.Item label={ui.t('合约FID', 'Contract FID')} name="contractFid">
          <Input placeholder={ui.pleaseInput} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.t('变动类型', 'Change type')} name="changeType">
          <Select
            placeholder={ui.pleaseSelect}
            allowClear
            style={{ width: 180 }}
            options={CHANGE_TYPE_OPTIONS}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                form.setFieldsValue({ contractName: undefined });
              }}
            >
              {ui.reset}
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
          showTotal: (t) => ui.total(t),
          pageSize: 10,
        }}
        size="small"
      />
    </AdminPageShell>
  );
}
