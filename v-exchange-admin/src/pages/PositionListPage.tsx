import { Button, Form, Input, Select, Space, Table, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { perpContractOptions } from '../config/pairs'
import { positionRecords } from '../mock/extendedData'
import { fh } from '../components/FieldHelpLabel'

const { Text } = Typography

export function PositionListPage() {
  const [form] = Form.useForm()

  const columns = [
    { title: fh('合约FID'), dataIndex: 'contractFid', width: 100 },
    { title: fh('仓位ID'), dataIndex: 'positionId', width: 100 },
    { title: fh('合约展示名称'), dataIndex: 'displayName', width: 120 },
    { title: fh('合约名称'), dataIndex: 'contractName', width: 110 },
    { title: fh('仓位类型'), dataIndex: 'positionType', width: 90 },
    { title: fh('开仓类型'), dataIndex: 'openType', width: 90 },
    { title: fh('持仓状态'), dataIndex: 'status', width: 90 },
    { title: fh('开仓均价'), dataIndex: 'avgPrice', width: 100 },
    { title: fh('自动追加保证金'), dataIndex: 'autoMargin', width: 120 },
    { title: fh('持仓量'), dataIndex: 'quantity', width: 90, sorter: true },
    { title: fh('可平量'), dataIndex: 'closable', width: 90 },
    { title: fh('仓位价值'), dataIndex: 'value', width: 100, sorter: true },
    { title: fh('初始杠杆'), dataIndex: 'leverage', width: 90 },
    { title: fh('合理价格'), dataIndex: 'fairPrice', width: 90 },
    { title: fh('仓位保证金'), dataIndex: 'margin', width: 100 },
    { title: fh('保证金率字段'), dataIndex: 'marginRate', width: 110 },
    { title: fh('强平价格'), dataIndex: 'liqPrice', width: 90 },
    { title: fh('破产价格'), dataIndex: 'bankruptcyPrice', width: 90 },
    { title: fh('浮动盈亏'), dataIndex: 'floatingPnl', width: 90 },
    { title: fh('已实现盈亏'), dataIndex: 'realizedPnl', width: 100 },
    { title: fh('已平盈亏'), dataIndex: 'closedPnl', width: 90 },
    { title: fh('手续费'), dataIndex: 'fee', width: 80 },
    { title: fh('资金费率盈亏'), dataIndex: 'fundingPnl', width: 110 },
    { title: fh('盈亏%'), dataIndex: 'pnlPct', width: 80 },
    { title: fh('ROI%'), dataIndex: 'roi', width: 80 },
    { title: fh('杠杆变更'), dataIndex: 'leverageChange', width: 90 },
    { title: fh('更新时间'), dataIndex: 'updatedAt', width: 160 },
    { title: fh('下单时间'), dataIndex: 'orderTime', width: 160 },
  ]

  return (
    <PageFrame title="持仓列表">
      <Space style={{ marginBottom: 12 }} wrap>
        <Button type="primary" icon={<SearchOutlined />}>
          根据合约FID查找
        </Button>
      </Space>
      <Form form={form} layout="inline" style={{ marginBottom: 12, rowGap: 12 }}>
        <Form.Item label={fh('仓位ID')} name="positionId">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={fh('合约FID')} name="contractFid">
          <Input style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={fh('合约名称')} name="contractName">
          <Select allowClear placeholder="请选择" style={{ width: 160 }} options={perpContractOptions} />
        </Form.Item>
        <Form.Item label={fh('持仓量>=')} name="quantityMin">
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={fh('仓位价值>=')} name="valueMin">
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={fh('持仓状态')} name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={fh('仓位类型')} name="positionType">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={fh('开仓类型')} name="openType">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <QueryResetButtons onReset={() => form.resetFields()} />
            <Button type="primary">导出</Button>
          </Space>
        </Form.Item>
      </Form>
      <Text type="danger" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        排序与价值计算仅针对当前表格数据；持仓状态下指定合约 FID 的保证金率与合理价格字段为准确值。
      </Text>
      <Table
        rowKey="positionId"
        size="small"
        bordered
        scroll={{ x: 3600 }}
        columns={columns}
        dataSource={positionRecords}
        locale={{ emptyText: '暂无数据' }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: ['50', '100', '200'],
          defaultPageSize: 200,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </PageFrame>
  )
}
