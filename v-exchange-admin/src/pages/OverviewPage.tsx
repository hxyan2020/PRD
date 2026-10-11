import { Card, Col, Row, Statistic } from 'antd'
import { PageFrame } from '../components/PageFrame'

export function OverviewPage() {
  return (
    <PageFrame title="Overview">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Active Contracts" value={1} suffix="/ 2" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Market Sources" value={17} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Index Prices" value={2} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Open Positions" value={0} />
          </Card>
        </Col>
      </Row>
    </PageFrame>
  )
}
