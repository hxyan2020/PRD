import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { PageFrame } from '../components/PageFrame'
import {
  contractRecords,
  fairPriceRecords,
  fundingRateRecords,
  indexPriceRecords,
  marketSourceRecords,
} from '../mock/data'
import { pairMarketSnapshots } from '../mock/pairMarketData'
import { positionRecords } from '../mock/extendedData'
import { PAIR_LIST } from '../config/pairs'
import './OverviewPage.css'

const { Text } = Typography

export function OverviewPage() {
  const enabledCount = contractRecords.filter((c) => c.status === '启用中').length

  const configRows = PAIR_LIST.map((pair) => {
    const contract = contractRecords.find((c) => c.symbol === pair.symbol)
    const index = indexPriceRecords.find((i) => i.indexName === pair.indexName)
    const fair = fairPriceRecords.find((f) => f.contractName === pair.displayNameZh)
    const funding = fundingRateRecords.find((f) => f.contract === pair.displayNameZh)
    return {
      key: pair.key,
      symbol: pair.symbol,
      indexName: pair.indexName,
      contractStatus: contract?.status ?? '—',
      indexEnabled: index?.enabled ? '启用' : '禁用',
      fairAlgo: fair?.newAlgoStatus ?? '—',
      fundingPeriod: funding ? `${funding.periodHours}h` : '—',
      leverage: contract?.leverage ?? '—',
    }
  })

  return (
    <PageFrame title="Overview">
      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Active Contracts" value={enabledCount} suffix={`/ ${contractRecords.length}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Index Feeds (XAUUSD · BTCUSD)" value={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Market Sources" value={marketSourceRecords.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Open Positions (mock)" value={positionRecords.length} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {pairMarketSnapshots.map((snap) => (
          <Col xs={24} lg={12} key={snap.symbol}>
            <Card size="small" className="overview-pair-card">
              <div className="pair-head">
                <div>
                  <p className="pair-symbol">{snap.symbol}</p>
                  <Text className="pair-index">Index {snap.indexName}</Text>
                </div>
                <Tag color={snap.contractStatus === '启用中' ? 'success' : 'default'}>{snap.contractStatus}</Tag>
              </div>
              <div className="overview-metric-grid">
                <div>
                  <div className="label">指数价格</div>
                  <div className="value">{snap.indexPrice}</div>
                </div>
                <div>
                  <div className="label">标记价格</div>
                  <div className="value">{snap.markPrice}</div>
                </div>
                <div>
                  <div className="label">最新价</div>
                  <div className="value">{snap.lastPrice}</div>
                </div>
                <div>
                  <div className="label">资金费率</div>
                  <div className="value">{snap.fundingRate}</div>
                </div>
                <div>
                  <div className="label">下次结算</div>
                  <div className="value">{snap.nextFundingIn}</div>
                </div>
                <div>
                  <div className="label">买卖价差 (bps)</div>
                  <div className="value">{snap.spreadBps}</div>
                </div>
                <div>
                  <div className="label">24h 成交额</div>
                  <div className="value">{snap.volume24hUsd}</div>
                </div>
                <div>
                  <div className="label">持仓量 (OI)</div>
                  <div className="value">{snap.openInterestUsd}</div>
                </div>
                <div>
                  <div className="label">多空比</div>
                  <div className="value">{snap.longShortRatio}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" title="双币对配置一览 (XAUUSD · BTCUSD)" className="overview-config-table" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          dataSource={configRows}
          columns={[
            { title: '合约', dataIndex: 'symbol', width: 100 },
            { title: '指数', dataIndex: 'indexName', width: 90 },
            { title: '合约状态', dataIndex: 'contractStatus', width: 90 },
            { title: '指数源', dataIndex: 'indexEnabled', width: 80 },
            { title: '标记价算法', dataIndex: 'fairAlgo', width: 100 },
            { title: '资金费周期', dataIndex: 'fundingPeriod', width: 100 },
            { title: '杠杆', dataIndex: 'leverage', width: 90 },
            {
              title: '快捷入口',
              key: 'links',
              render: (_, row) => (
                <>
                  <Link to="/contract-list">合约</Link>
                  {' · '}
                  <Link to="/index-price">指数</Link>
                  {' · '}
                  <Link to="/fair-price">标记价</Link>
                  {' · '}
                  <Link to="/funding-rate">资金费</Link>
                  {' · '}
                  <Link to={`/market-source?pair=${row.symbol}`}>行情源</Link>
                </>
              ),
            },
          ]}
        />
      </Card>

      <Text type="secondary" style={{ fontSize: 12 }}>
        后续批次截图将按页面逐项对齐 UI 与字段；XAU_USD / BTC_USD 配置与筛选已作为全局基准。
      </Text>
    </PageFrame>
  )
}
