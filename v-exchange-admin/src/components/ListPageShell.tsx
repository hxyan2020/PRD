import type { ReactNode } from 'react'
import type { TableProps } from 'antd'
import { Table } from 'antd'
import { PageFrame } from './PageFrame'

type ListPageShellProps<T extends object> = {
  title?: string
  extra?: ReactNode
  filters?: ReactNode
  columns: TableProps<T>['columns']
  dataSource: T[]
  rowKey: string
  scroll?: TableProps<T>['scroll']
  pagination?: TableProps<T>['pagination']
  locale?: TableProps<T>['locale']
}

export function ListPageShell<T extends object>({
  title,
  extra,
  filters,
  columns,
  dataSource,
  rowKey,
  scroll,
  pagination,
  locale,
}: ListPageShellProps<T>) {
  return (
    <PageFrame title={title} extra={extra}>
      {filters ? <div className="list-page-filters">{filters}</div> : null}
      <div className="admin-table-scroll">
        <Table
          size="small"
          bordered
          rowKey={rowKey}
          columns={columns}
          dataSource={dataSource}
          scroll={scroll ?? { x: true }}
          pagination={pagination}
          locale={locale}
        />
      </div>
    </PageFrame>
  )
}
