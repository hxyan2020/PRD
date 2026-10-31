import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Select, Space, Table, Tabs, message } from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { contractNameOptions } from '../mock/data';

interface ContractFundRow {
  key: string;
  displayName: string;
  contractName: string;
  manualRecharge: string;
  available: string;
  netValue: string;
  collected: string;
  showRecycle: boolean;
}

interface CurrencyFundRow {
  key: string;
  currency: string;
  available: string;
}

const CONTRACT_ROWS: ContractFundRow[] = [
  {
    key: '1',
    displayName: 'BTC_USD永续',
    contractName: 'BTC_USD',
    manualRecharge: '0USD',
    available: '0USD',
    netValue: '0USD',
    collected: '0USD',
    showRecycle: true,
  },
  {
    key: '2',
    displayName: 'XAU_USD永续',
    contractName: 'XAU_USD',
    manualRecharge: '0USD',
    available: '-0.07USD',
    netValue: '-0.07USD',
    collected: '0USD',
    showRecycle: false,
  },
];

const CURRENCY_ROWS: CurrencyFundRow[] = [
  { key: '1', currency: 'USD', available: '-0.0798' },
];

export function RiskFundListPage() {
  const ui = useUi();
  const [filterForm] = Form.useForm();
  const [tab, setTab] = useState('by-contract');

  const contractColumns = [
    { title: ui.t('合约展示名称', 'Contract display name'), dataIndex: 'displayName', width: 140 },
    { title: ui.t('合约名称', 'Contract'), dataIndex: 'contractName', width: 120 },
    { title: ui.t('手动充值金额', 'Manual top-up amount'), dataIndex: 'manualRecharge', width: 130 },
    { title: ui.t('可用额度', 'Available quota'), dataIndex: 'available', width: 120 },
    { title: ui.t('净值', 'Net value'), dataIndex: 'netValue', width: 120 },
    { title: ui.t('已归集资金', 'Collected funds'), dataIndex: 'collected', width: 120 },
    {
      title: ui.t('基金变动明细', 'Fund change details'),
      key: 'detail',
      width: 120,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          {ui.t('查看', 'View')}
        </Button>
      ),
    },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      width: 320,
      render: (_: unknown, record: ContractFundRow) => (
        <Space size={4} wrap>
          <Button type="primary" size="small" onClick={() => message.info(`增加额度：${record.contractName}`)}>
            增加额度
          </Button>
          <Button danger size="small" onClick={() => message.info(`减少额度：${record.contractName}`)}>
            减少额度
          </Button>
          {record.showRecycle && (
            <Button danger size="small" onClick={() => message.warning(`回收风险基金：${record.contractName}`)}>
              回收风险基金
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const currencyColumns = [
    { title: ui.t('币种', 'Currency'), dataIndex: 'currency', width: 160 },
    { title: ui.t('可用额度', 'Available quota'), dataIndex: 'available', width: 200 },
  ];

  return (
    <AdminPageShell title={ui.pageTitle('risk-fund-list')}>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'by-contract', label: ui.t('按合约双边汇总', 'By contract (both sides)') },
          { key: 'by-currency', label: ui.t('按币种汇总', 'By currency') },
        ]}
        style={{ marginBottom: 8 }}
      />

      {tab === 'by-contract' && (
        <>
          <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item label={ui.contractName} name="contractName">
              <Select
                placeholder={ui.pleaseSelect}
                allowClear
                style={{ width: 180 }}
                options={contractNameOptions}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>
                  {ui.search}
                </Button>
                <Button onClick={() => filterForm.resetFields()}>{ui.reset}</Button>
              </Space>
            </Form.Item>
          </Form>
          <Table
            rowKey="key"
            columns={contractColumns}
            dataSource={CONTRACT_ROWS}
            scroll={{ x: 1200 }}
            pagination={{ total: 2, showTotal: (t) => ui.total(t), pageSize: 10 }}
            size="small"
          />
        </>
      )}

      {tab === 'by-currency' && (
        <Table
          rowKey="key"
          columns={currencyColumns}
          dataSource={CURRENCY_ROWS}
          pagination={{ total: 1, showTotal: (t) => ui.total(t), pageSize: 10 }}
          size="small"
        />
      )}
    </AdminPageShell>
  );
}
