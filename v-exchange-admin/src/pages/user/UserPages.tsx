import { Button, Empty, Form, Input, Select, Space, Tabs } from 'antd'
import {
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import { ListPageShell } from '../../components/ListPageShell'
import { PageFrame } from '../../components/PageFrame'
import { marginChangeRecords, userRateConfigRecords } from '../../mock/extendedData'

const emptyLocale = { emptyText: <Empty description="暂无数据" /> }

export function UserAssetPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="用户资产钱包">
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<SearchOutlined />}>
          按合约FID查找
        </Button>
      </Space>
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item label="合约ID" name="contractId">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="币种" name="coin">
          <Select placeholder="请选择" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="最小总权益" name="minEquity">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="账户类型" name="accountType">
          <Select placeholder="请选择" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <QueryResetButtons onReset={() => form.resetFields()} />
            <Button type="primary">导出</Button>
          </Space>
        </Form.Item>
      </Form>
      <div style={{ padding: 48, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>请输入合约FID</div>
    </PageFrame>
  )
}

export function UserRateConfigPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="用户费率配置"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            增加
          </Button>
          <Button type="primary">用户费率组</Button>
        </Space>
      }
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="合约FID" name="fid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="UID" name="uid">
            <Input style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="是否是做市商" name="mm">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="用户类型" name="userType">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="remark"
      scroll={{ x: 2200 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid', width: 100 },
        { title: 'UID', dataIndex: 'uid', width: 80 },
        {
          title: '是否做市商',
          dataIndex: 'isMarketMaker',
          width: 100,
          render: (v: boolean) => (v ? '✓' : ''),
        },
        { title: '用户类型', dataIndex: 'userType', width: 110 },
        {
          title: '费率/折扣/代理',
          key: 'rates',
          width: 180,
          render: (_: unknown, row: (typeof userRateConfigRecords)[0]) =>
            `Maker:${row.makerRate} Taker:${row.takerRate} 是否为代理:${row.isAgent}`,
        },
        {
          title: '合约/费率组',
          key: 'group',
          width: 140,
          render: (_: unknown, row: (typeof userRateConfigRecords)[0]) => (
            <Space>
              合约等级:{row.contractLevel}
              <Button type="link" size="small">
                查看
              </Button>
            </Space>
          ),
        },
        {
          title: '开启全局费率优惠',
          dataIndex: 'globalDiscount',
          width: 140,
          render: (v: boolean) => (v ? '✓' : ''),
        },
        { title: '优惠模式', dataIndex: 'discountMode', width: 100 },
        {
          title: '持仓类型',
          dataIndex: 'positionType',
          width: 120,
          render: (text: string) => (
            <Space>
              {text}
              <Button type="link" size="small">
                修改
              </Button>
            </Space>
          ),
        },
        { title: '备注', dataIndex: 'remark', width: 140 },
        {
          title: '操作记录',
          key: 'log',
          width: 90,
          render: () => (
            <Button type="link" size="small" icon={<EyeOutlined />}>
              查看
            </Button>
          ),
        },
        {
          title: '操作',
          key: 'op',
          width: 120,
          render: () => (
            <Space>
              <Button type="primary" size="small">
                编辑
              </Button>
              <Button danger size="small">
                删除
              </Button>
            </Space>
          ),
        },
      ]}
      dataSource={userRateConfigRecords.map((r, i) => ({ ...r, key: i }))}
      pagination={{ total: 4, pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }}
    />
  )
}

export function UserInfoPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="用户信息">
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item name="fid">
          <Input placeholder="合约FID" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Space wrap>
            <Button type="primary">根据合约 FID 查找</Button>
            <Button type="primary">根据邮箱查找</Button>
            <Button type="primary">根据 UID 查找</Button>
            <Button type="primary">根据交易 ID 查找</Button>
            <Button type="primary">查询</Button>
            <Button danger>重置</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              批量添加 Tags
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              批量补发
            </Button>
            <Button icon={<DownloadOutlined />}>导出模板</Button>
            <Button icon={<UploadOutlined />}>导入查询</Button>
            <Button type="primary">用户打标</Button>
          </Space>
        </Form.Item>
      </Form>
      <div style={{ padding: 48, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>请输入合约FID</div>
    </PageFrame>
  )
}

export function UserRiskSettingsPage() {
  const [form] = Form.useForm()
  return (
    <PageFrame title="用户风险设置">
      <Tabs
        style={{ marginBottom: 16 }}
        items={[
          { key: 'manual', label: '手动特殊风控限额' },
          { key: 'shared', label: '关联账户共享上限' },
        ]}
      />
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约FID" name="fid">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="合约名称" name="contract">
          <Input style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="持仓类型" name="positionType">
          <Select placeholder="请选择" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
        <Form.Item style={{ marginLeft: 'auto' }}>
          <Button type="primary" icon={<PlusOutlined />}>
            添加特殊风控用户限额
          </Button>
        </Form.Item>
      </Form>
      <Empty description="暂无数据" />
    </PageFrame>
  )
}

export function UserBlacklistPage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="黑名单互不成交配置"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      }
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="合约FID1" name="fid1">
            <Input style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="合约FID2" name="fid2">
            <Input style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="启用状态" name="status">
            <Select placeholder="请选择" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="fid1"
      columns={[
        { title: '更新时间', dataIndex: 'updatedAt' },
        { title: '合约FID1', dataIndex: 'fid1' },
        { title: '合约FID2', dataIndex: 'fid2' },
        { title: '状态', dataIndex: 'status' },
        { title: '操作', key: 'op', render: () => <Button type="primary" size="small">编辑</Button> },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={false}
    />
  )
}

export function BlacklistGroupPage() {
  const [form] = Form.useForm()
  const tableBlock = (title: string) => (
    <div style={{ marginBottom: 24 }}>
      <h4>{title}</h4>
      <Empty description="暂无数据" />
    </div>
  )
  return (
    <PageFrame
      title="黑名单分组"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            添加
          </Button>
          <Button type="primary">一键开启互不成文</Button>
          <Button type="primary">一键取消互不成文</Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="分组名称" name="groupName">
          <Input style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      {tableBlock('内部做市商')}
      {tableBlock('外部做市商')}
    </PageFrame>
  )
}

export function MarginChangePage() {
  const [form] = Form.useForm()
  return (
    <ListPageShell
      title="保证金变动明细"
      filters={
        <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
          <Form.Item name="f1">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="f2">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="f3">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="f4">
            <Select placeholder="请选择" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="range">
            <Input.Group compact>
              <Input style={{ width: 120 }} placeholder="开始日期" />
              <Input style={{ width: 120 }} placeholder="结束日期" />
            </Input.Group>
          </Form.Item>
          <Form.Item>
            <QueryResetButtons onReset={() => form.resetFields()} />
          </Form.Item>
        </Form>
      }
      rowKey="positionId"
      scroll={{ x: 1400 }}
      columns={[
        { title: '合约FID', dataIndex: 'contractFid', width: 140 },
        { title: '仓位ID', dataIndex: 'positionId', width: 90 },
        { title: '合约名称', dataIndex: 'contractName', width: 120 },
        { title: '方向', dataIndex: 'direction', width: 80 },
        { title: '类型', dataIndex: 'type', width: 100 },
        { title: '金额', dataIndex: 'amount', width: 80 },
        { title: '强平价格', dataIndex: 'liqPrice', width: 140 },
        { title: '修改时间', dataIndex: 'updatedAt', width: 160 },
      ]}
      dataSource={marginChangeRecords}
      pagination={{
        total: 79,
        pageSize: 15,
        showTotal: (t) => `共 ${t} 条`,
        showSizeChanger: true,
        pageSizeOptions: ['15', '30', '50'],
      }}
    />
  )
}
