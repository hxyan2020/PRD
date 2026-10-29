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
          <Form.Item label={fh('Report Type')} name="type">
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
        { title: fh('Report ID'), dataIndex: 'id' },
        { title: fh('Type'), dataIndex: 'type' },
        { title: fh('Generated At'), dataIndex: 'generatedAt' },
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
          <Form.Item label={fh('Account ID')} name="accountId">
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
        { title: fh('From'), dataIndex: 'from' },
        { title: fh('To'), dataIndex: 'to' },
        { title: fh('Amount'), dataIndex: 'amount' },
        { title: fh('Time'), dataIndex: 'time' },
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
            { title: fh('Account ID'), dataIndex: 'accountId' },
            { title: fh('Flow Type'), dataIndex: 'flowType' },
            { title: fh('Trigger Type'), dataIndex: 'triggerType' },
            { title: fh('Flow Amount (USD)'), dataIndex: 'amountUsd' },
            { title: fh('Updated At'), dataIndex: 'updatedAt' },
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
        <Form.Item label={fh('User')}>
          <Select defaultValue="BROKER" style={{ width: 120 }} options={[{ value: 'BROKER', label: 'BROKER' }]} />
        </Form.Item>
        <Form.Item label={fh('Alert Type')} name="alertType" initialValue="all">
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
          { title: fh('User ID'), dataIndex: 'userId' },
          { title: fh('Alert ID'), dataIndex: 'alertId' },
          { title: fh('Alert Type'), dataIndex: 'alertType' },
          { title: fh('Trigger Detail'), dataIndex: 'detail' },
          { title: fh('Alert Time'), dataIndex: 'alertTime' },
          { title: fh('Alert Method'), dataIndex: 'method' },
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
          <Form.Item label={fh('用户合约FID')} name="fid">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label={fh('合约名称')} name="contract">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label={fh('币种')} name="coin">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label={fh('类型')} name="type">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label={fh('出入金类型')} name="flowType">
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
        { title: fh('合约FID'), dataIndex: 'fid' },
        { title: fh('合约名称'), dataIndex: 'contractName' },
        { title: fh('币种'), dataIndex: 'coin' },
        { title: fh('类型'), dataIndex: 'type' },
        { title: fh('入/出'), dataIndex: 'direction' },
        { title: fh('金额'), dataIndex: 'amount' },
        { title: fh('时间'), dataIndex: 'time' },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={{ pageSize: 10 }}
    />
  )
}
