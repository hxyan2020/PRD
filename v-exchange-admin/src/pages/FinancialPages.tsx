import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Empty, Form, Input, Select, Space, Table, Tabs, Typography } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { financialAccountInfo, financialFundRecords } from '../mock/financialData';

const { Title } = Typography;

export function FinancialReportPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('financial-report')}>
      <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label={ui.t('报表类型', 'Report type')} name="type">
          <Select placeholder={ui.pleaseSelect} allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        size="small"
        columns={[
          { title: ui.t('报表ID', 'Report ID'), dataIndex: 'id', width: 140 },
          { title: ui.t('类型', 'Type'), dataIndex: 'type', width: 140 },
          { title: ui.t('生成时间', 'Generated at'), dataIndex: 'generatedAt', width: 180 },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </AdminPageShell>
  );
}

export function TransferRecordPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('transfer-record')}>
      <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label={ui.t('账户ID', 'Account ID')} name="accountId">
          <Input style={{ width: 160 }} placeholder={ui.pleaseInput} />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        size="small"
        columns={[
          { title: ui.t('转出', 'From'), dataIndex: 'from', width: 140 },
          { title: ui.t('转入', 'To'), dataIndex: 'to', width: 140 },
          { title: ui.t('金额', 'Amount'), dataIndex: 'amount', width: 120 },
          { title: ui.t('时间', 'Time'), dataIndex: 'time', width: 180 },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </AdminPageShell>
  );
}

export function FinancialAccountPage() {
  const ui = useUi();

  return (
    <AdminPageShell title={ui.pageTitle('financial-account')}>
      <div className="db-section">
        <div className="db-section-header">
          <Title level={5} style={{ margin: 0 }}>
            {ui.t('账户信息', 'Account info')}
          </Title>
          <Button type="primary">{ui.t('注入资金', 'Inject funds')}</Button>
        </div>
        <div className="db-info-row">
          <div className="db-info-item">
            <div className="db-info-label">{ui.t('账户ID', 'Account ID')}</div>
            <div className="db-info-value">{financialAccountInfo.accountId}</div>
          </div>
          <div className="db-info-item">
            <div className="db-info-label">{ui.t('当前注资金额', 'Current injection')}</div>
            <div className="db-info-value">
              {financialAccountInfo.currentInjectionUsd.toLocaleString()} USD
            </div>
          </div>
        </div>
      </div>
      <div className="db-section">
        <div className="db-section-header">
          <Title level={5} style={{ margin: 0 }}>
            {ui.t('资金记录', 'Fund records')}
          </Title>
        </div>
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          columns={[
            { title: ui.t('账户ID', 'Account ID'), dataIndex: 'accountId', width: 120 },
            { title: ui.t('流水类型', 'Flow type'), dataIndex: 'flowType', width: 100 },
            { title: ui.t('触发类型', 'Trigger type'), dataIndex: 'triggerType', width: 100 },
            { title: ui.t('流水金额 (USD)', 'Amount (USD)'), dataIndex: 'amountUsd', width: 150 },
            { title: ui.updatedAt, dataIndex: 'updatedAt', width: 170 },
          ]}
          dataSource={financialFundRecords.map((row) => ({
            ...row,
            flowType: row.flowType === '入金' ? ui.t('入金', 'Inflow') : ui.t('出金', 'Outflow'),
            triggerType: row.triggerType === '手动' ? ui.t('手动', 'Manual') : ui.t('自动', 'Auto'),
          }))}
        />
      </div>
    </AdminPageShell>
  );
}

export function FinancialReconPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  const alertTable = (
    <>
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: 'wrap' }}
        initialValues={{ user: 'BROKER', alertType: 'all' }}
      >
        <Form.Item label={ui.t('用户', 'User')} name="user">
          <Select style={{ width: 120 }} options={[{ value: 'BROKER', label: 'BROKER' }]} />
        </Form.Item>
        <Form.Item label={ui.t('告警类型', 'Alert type')} name="alertType">
          <Select
            style={{ width: 120 }}
            options={[{ value: 'all', label: ui.t('全部', 'All') }]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="alertId"
        size="small"
        locale={emptyLocale}
        columns={[
          { title: ui.t('用户ID', 'User ID'), dataIndex: 'userId', width: 120 },
          { title: ui.t('告警ID', 'Alert ID'), dataIndex: 'alertId', width: 120 },
          { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 120 },
          { title: ui.t('触发详情', 'Trigger detail'), dataIndex: 'detail', width: 200 },
          { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 170 },
          { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 100 },
        ]}
        dataSource={[]}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </>
  );

  return (
    <AdminPageShell title={ui.pageTitle('financial-recon')}>
      <Tabs
        items={[
          { key: 'alerts', label: ui.alertRecords, children: alertTable },
          {
            key: 'config',
            label: ui.monitorConfig,
            children: <Empty description={ui.empty} />,
          },
        ]}
      />
    </AdminPageShell>
  );
}

export function FinanceFlowPage() {
  const [form] = Form.useForm();
  const ui = useUi();
  const emptyLocale = { emptyText: <Empty description={ui.empty} /> };

  return (
    <AdminPageShell title={ui.pageTitle('finance-flow')}>
      <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', rowGap: 8 }}>
        <Form.Item label={ui.t('用户合约FID', 'User contract FID')} name="fid">
          <Select placeholder={ui.pleaseSelect} allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.contractName} name="contract">
          <Select placeholder={ui.pleaseSelect} allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.t('币种', 'Currency')} name="coin">
          <Select placeholder={ui.pleaseSelect} allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={ui.t('类型', 'Type')} name="type">
          <Select placeholder={ui.pleaseSelect} allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={ui.t('出入金类型', 'Deposit/withdraw type')} name="flowType">
          <Select placeholder={ui.pleaseSelect} allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker
            placeholder={[ui.t('开始日期', 'Start date'), ui.t('结束日期', 'End date')]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="fid"
        size="small"
        locale={emptyLocale}
        scroll={{ x: 900 }}
        columns={[
          { title: ui.t('合约FID', 'Contract FID'), dataIndex: 'fid', width: 110 },
          { title: ui.contractName, dataIndex: 'contractName', width: 120 },
          { title: ui.t('币种', 'Currency'), dataIndex: 'coin', width: 80 },
          { title: ui.t('类型', 'Type'), dataIndex: 'type', width: 100 },
          { title: ui.t('入/出', 'In/Out'), dataIndex: 'direction', width: 80 },
          { title: ui.t('金额', 'Amount'), dataIndex: 'amount', width: 120 },
          { title: ui.t('时间', 'Time'), dataIndex: 'time', width: 170 },
        ]}
        dataSource={[]}
        pagination={{ pageSize: 10, showTotal: (n) => ui.total(n) }}
      />
    </AdminPageShell>
  );
}
