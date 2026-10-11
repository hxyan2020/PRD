import type { ReactNode } from 'react'
import { Button, Empty, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ListPageShell } from '../../components/ListPageShell'
import { PageFrame } from '../../components/PageFrame'
import { marketMakerWhitelist } from '../../mock/openapiFinancialData'

const emptyLocale = { emptyText: <Empty description="暂无数据" /> }

export function OpenApiWhitelistPage() {
  return (
    <PageFrame>
    <PageFrameTabs
      title="OpenApi White Config"
      tabItems={[
        {
          key: 'ip',
          label: 'IP白名单',
          children: (
            <ListPageShell
              extra={
                <Button type="primary" icon={<PlusOutlined />}>
                  增加
                </Button>
              }
              rowKey="ip"
              columns={[
                { title: 'IP地址', dataIndex: 'ip' },
                { title: '备注', dataIndex: 'remark' },
                { title: '创建者', dataIndex: 'creator' },
                { title: '创建时间', dataIndex: 'createdAt' },
                {
                  title: '操作',
                  key: 'op',
                  render: () => (
                    <Button danger size="small">
                      删除
                    </Button>
                  ),
                },
              ]}
              dataSource={[]}
              locale={emptyLocale}
              pagination={false}
            />
          ),
        },
        {
          key: 'uid',
          label: 'UID白名单',
          children: (
            <ListPageShell
              extra={
                <Button type="primary" icon={<PlusOutlined />}>
                  增加
                </Button>
              }
              rowKey="uid"
              columns={[
                { title: 'UID', dataIndex: 'uid' },
                { title: '备注', dataIndex: 'remark' },
                { title: '创建者', dataIndex: 'creator' },
                { title: '创建时间', dataIndex: 'createdAt' },
                { title: '操作', key: 'op', render: () => <Button danger size="small">删除</Button> },
              ]}
              dataSource={[]}
              locale={emptyLocale}
              pagination={false}
            />
          ),
        },
      ]}
    />
    </PageFrame>
  )
}

function PageFrameTabs({
  title,
  tabItems,
}: {
  title: string
  tabItems: { key: string; label: string; children: ReactNode }[]
}) {
  return (
    <div style={{ padding: '0 4px' }}>
      <h3 style={{ margin: '0 0 12px', fontWeight: 500 }}>{title}</h3>
      <Tabs items={tabItems} />
    </div>
  )
}

export function OpenApiMarketMakerPage() {
  return (
    <ListPageShell
      title="OpenAPI做市商维护"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          增加
        </Button>
      }
      rowKey="contractFid"
      columns={[
        { title: '做市商合约FID', dataIndex: 'contractFid' },
        { title: '备注', dataIndex: 'remark' },
        { title: '创建者', dataIndex: 'creator' },
        { title: '创建时间', dataIndex: 'createdAt', width: 170 },
        {
          title: '操作',
          key: 'op',
          width: 90,
          render: () => (
            <Button danger size="small">
              删除
            </Button>
          ),
        },
      ]}
      dataSource={marketMakerWhitelist}
      pagination={{ total: 3, pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }}
    />
  )
}

export function OpenApiMmBlacklistPage() {
  return (
    <ListPageShell
      title="OpenApi做市商黑名单维护"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          增加
        </Button>
      }
      rowKey="contractFid"
      columns={[
        { title: '做市商合约FID', dataIndex: 'contractFid' },
        { title: '备注', dataIndex: 'remark' },
        { title: '已拉黑用户FID', dataIndex: 'blockedFid' },
        { title: '创建者', dataIndex: 'creator' },
        { title: '创建时间', dataIndex: 'createdAt' },
        {
          title: '操作',
          key: 'op',
          render: () => (
            <Button danger size="small">
              删除
            </Button>
          ),
        },
      ]}
      dataSource={[]}
      locale={emptyLocale}
      pagination={false}
    />
  )
}
