import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/locale'
import type { Briefing, PricePoint } from '../types'

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function PriceChart(props: {
  history: PricePoint[]
  briefings: Briefing[]
  composite: number | null
  spot: number | null
}) {
  const { t, lang } = useLocale()
  const { history, briefings, composite, spot } = props
  const [tip, setTip] = useState<{
    x: number
    y: number
    title: string
    lines: string[]
  } | null>(null)

  const width = 640
  const height = 220
  const pad = { l: 44, r: 12, t: 16, b: 28 }

  const chart = useMemo(() => {
    if (history.length < 2) return null
    const xs = history.map((p) => p.t)
    const ys = history.flatMap((p) => [p.px, p.spot ?? p.px])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = Math.max(1, maxX - minX)
    const spanY = Math.max(0.01, maxY - minY) * 1.08
    const y0 = minY - spanY * 0.04

    const xAt = (t: number) => pad.l + ((t - minX) / spanX) * (width - pad.l - pad.r)
    const yAt = (v: number) => pad.t + (1 - (v - y0) / spanY) * (height - pad.t - pad.b)

    const compositePath = history
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.t).toFixed(1)} ${yAt(p.px).toFixed(1)}`)
      .join(' ')
    const spotPts = history.filter((p) => p.spot != null)
    const spotPath =
      spotPts.length > 1
        ? spotPts
            .map(
              (p, i) =>
                `${i === 0 ? 'M' : 'L'} ${xAt(p.t).toFixed(1)} ${yAt(p.spot!).toFixed(1)}`,
            )
            .join(' ')
        : ''

    const windowStart = minX
    const windowEnd = maxX
    const markers = briefings
      .filter((b) => b.createdAt >= windowStart - 60_000 && b.createdAt <= windowEnd + 60_000)
      .map((b) => {
        const nearest = history.reduce((best, p) =>
          Math.abs(p.t - b.createdAt) < Math.abs(best.t - b.createdAt) ? p : best,
        )
        return { briefing: b, x: xAt(b.createdAt), y: yAt(nearest.px), px: nearest.px }
      })

    return { compositePath, spotPath, markers, xAt, yAt, minY: y0, maxY: y0 + spanY }
  }, [briefings, history])

  if (!chart) {
    return (
      <div className="panel chart-panel">
        <h2>{t('chartTitle')}</h2>
        <p className="sub">{t('chartEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="panel chart-panel">
      <h2>{t('chartTitle')}</h2>
      <p className="sub">{t('chartSub')}</p>
      <div className="chart-legend">
        <span>
          <i className="swatch composite" /> {t('composite')}
          {composite != null ? ` ${composite.toFixed(2)}` : ''}
        </span>
        <span>
          <i className="swatch spot" /> {t('spotXau')}
          {spot != null ? ` ${spot.toFixed(2)}` : ''}
        </span>
        <span>
          <i className="swatch briefing" /> {t('chartBriefingMark')}
        </span>
      </div>
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="price-chart"
          role="img"
          aria-label={t('chartTitle')}
        >
          <line
            x1={44}
            y1={height - 28}
            x2={width - 12}
            y2={height - 28}
            className="axis"
          />
          <line x1={44} y1={16} x2={44} y2={height - 28} className="axis" />
          <path d={chart.compositePath} className="line-composite" />
          {chart.spotPath ? <path d={chart.spotPath} className="line-spot" /> : null}
          {chart.markers.map((m) => (
            <g key={m.briefing.id}>
              <line
                x1={m.x}
                y1={16}
                x2={m.x}
                y2={height - 28}
                className="briefing-guide"
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={6}
                className={`briefing-dot ${m.briefing.severity}`}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                  setTip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    title: m.briefing.title,
                    lines: [
                      `${fmtTime(m.briefing.createdAt)} SGT`,
                      `${t('composite')} ${m.briefing.compositePrice.toFixed(2)}`,
                      m.briefing.triggerReason,
                      `${t('breached')}: ${m.briefing.breachedSources.join(', ')}`,
                    ],
                  })
                }}
                onMouseLeave={() => setTip(null)}
                onClick={() => {
                  setTip((prev) =>
                    prev?.title === m.briefing.title
                      ? null
                      : {
                          x: m.x,
                          y: m.y,
                          title: m.briefing.title,
                          lines: [
                            `${fmtTime(m.briefing.createdAt)} SGT`,
                            `${t('composite')} ${m.briefing.compositePrice.toFixed(2)}`,
                            m.briefing.triggerReason,
                            `${t('breached')}: ${m.briefing.breachedSources.join(', ')}`,
                          ],
                        },
                  )
                }}
              />
            </g>
          ))}
          <text x={8} y={24} className="axis-label">
            {chart.maxY.toFixed(0)}
          </text>
          <text x={8} y={height - 32} className="axis-label">
            {chart.minY.toFixed(0)}
          </text>
        </svg>
        {tip ? (
          <div
            className="chart-tooltip"
            style={{
              left: Math.min(Math.max(8, tip.x + 8), width - 180),
              top: Math.max(8, tip.y - 8),
            }}
          >
            <strong>{tip.title}</strong>
            {tip.lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            <div className="tip-hint">{lang === 'zh-Hant' ? '點標記可固定/關閉' : 'Tap mark to pin/close'}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
