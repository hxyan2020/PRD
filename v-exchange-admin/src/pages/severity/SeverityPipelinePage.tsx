import { useMemo } from 'react'
import { Alert, Card, Col, Row, Statistic, Steps, Tag, Timeline, Typography } from 'antd'
import {
  AlertOutlined,
  AuditOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  CommentOutlined,
  RobotOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageFrame } from '../../components/PageFrame'
import { getLoopStats, getRecommendations, severityMeta } from '../../mock/severityData'

const { Text, Paragraph } = Typography

export function SeverityPipelinePage() {
  const navigate = useNavigate()
  const stats = useMemo(() => getLoopStats(), [])
  const pendingRec = getRecommendations().find((r) => r.status === '待RO审批')

  const stages = [
    {
      icon: <AlertOutlined />,
      title: '① 告警触发',
      desc: `监控指标越限产生告警（近7天 ${stats.alertTotal} 条）`,
      page: 'severity-alert-feedback',
    },
    {
      icon: <CalculatorOutlined />,
      title: '② 公式打分定级',
      desc: `公式 ${stats.activeVersion} 按因子加权评分，映射 P0–P3`,
      page: 'severity-formula',
    },
    {
      icon: <RobotOutlined />,
      title: '③ AI incident 卡片推送',
      desc: '按定级路由值班群/电话升级，卡片附评分明细',
      page: 'severity-alert-feedback',
    },
    {
      icon: <CommentOutlined />,
      title: '④ 值班定级反馈',
      desc: `24/7 值班确认定级是否准确，不准则勾选原因（已反馈 ${stats.feedbackCount} 条，不准率 ${stats.inaccurateRate}%）`,
      page: 'severity-alert-feedback',
    },
    {
      icon: <ClusterOutlined />,
      title: '⑤ AI 每周聚合',
      desc: `聚合相似告警的反馈形成问题簇（本周 ${stats.clusterCount} 个簇）`,
      page: 'severity-recommendation',
    },
    {
      icon: <AuditOutlined />,
      title: '⑥ 新公式推荐 + RO 审批',
      desc: `AI 产出增删因子/调权/调阈值建议（待审批 ${stats.pendingRecommendations} 份）`,
      page: 'severity-recommendation',
    },
    {
      icon: <RocketOutlined />,
      title: '⑦ 新版本公式生效',
      desc: '批准后发布新版本，回到 ② 持续迭代',
      page: 'severity-formula',
    },
  ]

  return (
    <PageFrame title="严重度指标优化链路（P0–P3 闭环）">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="闭环目标：让公式定级与 24/7 值班的实际判断持续对齐"
        description="每条告警由严重度公式自动定级并推送 AI incident 卡片；值班对定级不准的告警勾选原因反馈；AI 每周聚合相似告警的反馈，推荐新的严重度计算公式（新增/移除因子、调整权重与阈值），经 RO 批准后发布生效。"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="近7天告警" value={stats.alertTotal} suffix="条" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="值班已反馈" value={stats.feedbackCount} suffix="条" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="定级不准率"
              value={stats.inaccurateRate}
              suffix="%"
              valueStyle={{ color: stats.inaccurateRate > 30 ? '#cf1322' : '#d48806' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="本周反馈簇" value={stats.clusterCount} suffix="个" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="待 RO 审批推荐"
              value={stats.pendingRecommendations}
              suffix="份"
              valueStyle={{ color: stats.pendingRecommendations > 0 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="当前公式版本" value={stats.activeVersion} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="完整链路（点击节点跳转对应页面）" style={{ marginBottom: 16 }}>
        <Steps
          direction="vertical"
          size="small"
          current={pendingRec ? 5 : 6}
          items={stages.map((s) => ({
            title: (
              <a onClick={() => navigate(`/${s.page}`)} style={{ fontWeight: 600 }}>
                {s.title}
              </a>
            ),
            description: s.desc,
            icon: s.icon,
          }))}
        />
      </Card>

      <Row gutter={16}>
        <Col span={14}>
          <Card size="small" title="示例：一条告警的完整旅程（用户故事）">
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              告警 <Text code>ALT-20261012-044</Text>「资金费率异常跳变 ETHUSDT」：公式定级 P1，值班认为应为
              P2，反馈进入本周聚合，AI 推荐新公式待 RO 审批。
            </Paragraph>
            <Timeline
              items={[
                {
                  color: 'red',
                  children: (
                    <>
                      <Text strong>10-12 03:47 告警触发，公式打分 60.5 → </Text>
                      <Tag color={severityMeta.P1.color}>{severityMeta.P1.label}</Tag>
                      <div>
                        <Text type="secondary">
                          F1 资金费率偏离 4.8 倍（0.92）× 权重 0.20 为主要贡献项
                        </Text>
                      </div>
                    </>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>03:48 AI incident 卡片推送 Lark 值班群</Text>
                      <div>
                        <Text type="secondary">按 P1 路由：@所有值班，要求 15 分钟内响应</Text>
                      </div>
                    </>
                  ),
                },
                {
                  color: 'gold',
                  children: (
                    <>
                      <Text strong>04:05 值班 Ops-Chen 反馈：定级不准，建议 </Text>
                      <Tag color={severityMeta.P2.color}>{severityMeta.P2.label}</Tag>
                      <div>
                        <Text type="secondary">
                          勾选原因：低峰时段影响被高估；因子权重过高。备注：凌晨低峰期价差因子噪声大，MM 已自动回补。
                        </Text>
                      </div>
                    </>
                  ),
                },
                {
                  color: 'purple',
                  children: (
                    <>
                      <Text strong>10-13 06:00 AI 周聚合：归入簇 C-02（相似反馈 6 条）</Text>
                      <div>
                        <Text type="secondary">
                          簇内共性：价差/价源类告警缺少真实资金影响度量
                        </Text>
                      </div>
                    </>
                  ),
                },
                {
                  color: 'purple',
                  children: (
                    <>
                      <Text strong>10-13 06:00 生成推荐 REC-2026-W42（v2.3 → v2.4）</Text>
                      <div>
                        <Text type="secondary">
                          新增 F7 受影响资金规模；移除 F5 持续时长；F3 权重 0.20→0.13；P1 阈值 65→68
                        </Text>
                      </div>
                    </>
                  ),
                },
                {
                  color: pendingRec ? 'gray' : 'green',
                  children: (
                    <>
                      <Text strong>
                        {pendingRec ? '待 RO 审批（可在「AI Weekly Recommendation」页操作）' : 'RO 已批准，v2.4 已生效'}
                      </Text>
                      <div>
                        <Text type="secondary">
                          批准后同类告警按新公式自动定级为 P2，无需值班再次改判
                        </Text>
                      </div>
                    </>
                  ),
                  dot: pendingRec ? undefined : <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card size="small" title="P0–P3 定级标准与响应要求" style={{ marginBottom: 16 }}>
            {(Object.keys(severityMeta) as Array<keyof typeof severityMeta>).map((level) => (
              <div key={level} style={{ marginBottom: 10 }}>
                <Tag color={severityMeta[level].color}>{severityMeta[level].label}</Tag>
                <Text>{severityMeta[level].desc}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    响应要求：{severityMeta[level].response}
                  </Text>
                </div>
              </div>
            ))}
          </Card>
          <Card size="small" title="本周定级分布（公式判定）">
            <Row gutter={8}>
              {(Object.keys(stats.levelCount) as Array<keyof typeof stats.levelCount>).map((level) => (
                <Col span={6} key={level}>
                  <Statistic
                    title={<Tag color={severityMeta[level].color}>{level}</Tag>}
                    value={stats.levelCount[level]}
                    suffix="条"
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </PageFrame>
  )
}
