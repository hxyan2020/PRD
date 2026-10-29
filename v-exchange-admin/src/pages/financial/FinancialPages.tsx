import { Button, Card, Col, DatePicker, Empty, Form, Input, Row, Select, Table, Tabs, Typography } from 'antd'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { ListPageShell } from '../../components/ListPageShell'
import { PageFrame } from '../../components/PageFrame'
import {
  financialAccountInfo,
  financialFundRecords,
} from '../../mock/openapiFinancialData'
import { fh } from '../../components/FieldHelpLabel'

const { Text, Title } = Typography
const emptyLocale = { emptyText: <Empty description="暂无数据" /> }

export function FinancialReportPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="Financial Report"
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="Report Type" name="type">
            <Select placeholder="请选择" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="range">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="id"
      columns={[
        { title: 'Report ID', dataIndex: 'id' },
        { title: 'Type', dataIndex: 'type' },
        { title: 'Generated At', dataIndex: 'generatedAt' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}

export function TransferRecordPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="Transfer Record"
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="Account ID" name="accountId">
            <Input style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="range">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="id"
      columns={[
        { title: 'From', dataIndex: 'from' },
        { title: 'To', dataIndex: 'to' },
        { title: 'Amount', dataIndex: 'amount' },
        { title: 'Time', dataIndex: 'time' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}

export function FinancialAccountPage() {
  return (
    <PageFrame title="Financial Account Manage">
      <Card title="Account Info" extra={<Button type="primary">Inject Funds</Button>} style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col>
            <Text type="secondary">Account ID</Text>
            <div>
              <Title level={4} style={{ margin: '4px 0 0' }}>
                {financialAccountInfo.accountId}
              </Title>
            </div>
          </Col>
          <Col>
            <Text type="secondary">Current Injection Amount</Text>
            <div>
              <Title level={4} style={{ margin: '4px 0 0' }}>
                {financialAccountInfo.currentInjectionUsd.toLocaleString()} USD
              </Title>
            </div>
          </Col>
        </Row>
      </Card>
      <Card title="Fund Records">
        <Table
          size="small"
          bordered
          rowKey="updatedAt"
          pagination={false}
          columns={[
            { title: 'Account ID', dataIndex: 'accountId' },
            { title: 'Flow Type', dataIndex: 'flowType' },
            { title: 'Trigger Type', dataIndex: 'triggerType' },
            { title: 'Flow Amount (USD)', dataIndex: 'amountUsd' },
            { title: 'Updated At', dataIndex: 'updatedAt' },
          ]}
          dataSource={financialFundRecords}
        />
      </Card>
    </PageFrame>
  )
}

export function FinancialReconPage() {
  const [form] = Form.useForm()
  const alertTable = (
    <>
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="User">
          <Select defaultValue="BROKER" style={{ width: 120 }} options={[{ value: 'BROKER', label: 'BROKER' }]} />
        </Form.Item>
        <Form.Item label="Alert Type" name="alertType" initialValue="all">
          <Select style={{ width: 120 }} options={[{ value: 'all', label: 'All' }]} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        size="small"
        bordered
        locale={emptyLocale}
        columns={[
          { title: 'User ID', dataIndex: 'userId' },
          { title: 'Alert ID', dataIndex: 'alertId' },
          { title: 'Alert Type', dataIndex: 'alertType' },
          { title: 'Trigger Detail', dataIndex: 'detail' },
          { title: 'Alert Time', dataIndex: 'alertTime' },
          { title: 'Alert Method', dataIndex: 'method' },
        ]}
        dataSource={[]}
        pagination={{ pageSize: 10 }}
      />
    </>
  )

  return (
    <PageFrame title="Financial Reconciliation Monitor">
      <Tabs
        items={[
          { key: 'alerts', label: 'Alert Records', children: alertTable },
          { key: 'config', label: 'Monitor Config', children: <Empty description="暂无数据" /> },
        ]}
      />
    </PageFrame>
  )
}

export function FinanceFlowPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="financeFlow"
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
          <Form.Item label="用户合约FID" name="fid">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label={fh('合约名称')} name="contract">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="币种" name="coin">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="类型" name="type">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="出入金类型" name="flowType">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="range">
            <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="fid"
      columns={[
        { title: '合约FID', dataIndex: 'fid' },
        { title: fh('合约名称'), dataIndex: 'contractName' },
        { title: '币种', dataIndex: 'coin' },
        { title: '类型', dataIndex: 'type' },
        { title: '入/出', dataIndex: 'direction' },
        { title: '金额', dataIndex: 'amount' },
        { title: '时间', dataIndex: 'time' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}
