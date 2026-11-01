import { useMemo, useState } from 'react'
import { isBriefingActive } from '../engine/briefing'
import { useLocale } from '../i18n/locale'
import { severityLabelKey, severityTone } from '../lib/severity'
import type { Briefing, PricePoint } from '../types'

function fmtClock(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function fmtAxis(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Tip = {
  xPct: number
  yPct: number
  title: string
  severity: string
  lines: string[]
  pinned: boolean
}

export function PriceChart(props: {
  history: PricePoint[]
  briefings: Briefing[]
  composite: number | null
  spot: number | null
}) {
  const { t, lang } = useLocale()
  const { history, briefings, composite, spot } = props
  const [tip, setTip] = useState<Tip | null>(null)

  const width = 640
  const height = 248
  const padL = 48
  const padR = 14
  const padT = 18
  const padB = 36

  const visibleBriefings = useMemo(
    () =>
      briefings
        .filter((b) => isBriefingActive(b) && (!b.lang || b.lang === lang))
        .slice(0, 40),
    [briefings, lang],
  )

  const chart = useMemo(() => {
    const now = Date.now()
    // Blend live ticks with briefing anchors so markers always land on the series.
    const briefingPts: PricePoint[] = visibleBriefings
      .filter((b) => now - b.createdAt < 48 * 3600_000)
      .map((b) => ({
        t: b.createdAt,
        px: b.compositePrice,
        spot: spot ?? undefined,
      }))

    const mergedMap = new Map<number, PricePoint>()
    for (const p of [...briefingPts, ...history]) {
      const key = Math.round(p.t / 1000) * 1000
      const prev = mergedMap.get(key)
      mergedMap.set(key, prev ? { ...prev, ...p, px: p.px } : p)
    }
    const series = [...mergedMap.values()].sort((a, b) => a.t - b.t)

    if (series.length < 2 && history.length < 2 && briefingPts.length < 1) return null

    // If only briefings exist, synthesize a short path around them for a readable chart.
    let points = series
    if (points.length < 2) {
      const base = points[0] ?? {
        t: now,
        px: composite ?? 3900,
        spot: spot ?? undefined,
      }
      points = [
        { t: base.t - 5 * 60_000, px: base.px * 0.9994, spot: base.spot },
        base,
        { t: Math.max(base.t + 60_000, now), px: composite ?? base.px, spot: spot ?? base.spot },
      ]
    }

    const xs = points.map((p) => p.t)
    const markerTs = visibleBriefings.map((b) => b.createdAt)
    const minX = Math.min(...xs, ...markerTs, now - 5 * 60_000)
    const maxX = Math.max(...xs, ...markerTs, now)
    const ys = points.flatMap((p) => [p.px, p.spot ?? p.px])
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = Math.max(1, maxX - minX)
    const spanY = Math.max(0.05, (maxY - minY) * 1.12)
    const y0 = minY - spanY * 0.06

    const xAt = (t: number) => padL + ((t - minX) / spanX) * (width - padL - padR)
    const yAt = (v: number) => padT + (1 - (v - y0) / spanY) * (height - padT - padB)

    const compositePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.t).toFixed(1)} ${yAt(p.px).toFixed(1)}`)
      .join(' ')
    const spotPts = points.filter((p) => p.spot != null)
    const spotPath =
      spotPts.length > 1
        ? spotPts
            .map(
              (p, i) =>
                `${i === 0 ? 'M' : 'L'} ${xAt(p.t).toFixed(1)} ${yAt(p.spot!).toFixed(1)}`,
            )
            .join(' ')
        : ''

    const markers = visibleBriefings
      .filter((b) => b.createdAt >= minX - 60_000 && b.createdAt <= maxX + 60_000)
      .map((b) => {
        const nearest = points.reduce((best, p) =>
          Math.abs(p.t - b.createdAt) < Math.abs(best.t - b.createdAt) ? p : best,
        )
        const x = xAt(b.createdAt)
        const y = yAt(nearest.px)
        return {
          briefing: b,
          x,
          y,
          xPct: (x / width) * 100,
          yPct: (y / height) * 100,
          label: fmtAxis(b.createdAt),
        }
      })

    const ticks = [0, 0.5, 1].map((f) => {
      const t = minX + spanX * f
      return { t, x: xAt(t), label: fmtAxis(t) }
    })

    return {
      compositePath,
      spotPath,
      markers,
      ticks,
      minY: y0,
      maxY: y0 + spanY,
      pointCount: points.length,
    }
  }, [visibleBriefings, history, composite, spot])

  const openTip = (m: {
    briefing: Briefing
    xPct: number
    yPct: number
  }, pinned: boolean) => {
    const tone = severityTone(m.briefing.severity)
    setTip({
      xPct: m.xPct,
      yPct: m.yPct,
      title: m.briefing.title,
      severity: tone,
      pinned,
      lines: [
        `${t(severityLabelKey(m.briefing.severity))} · ${fmtClock(m.briefing.createdAt)} SGT`,
        `${t('composite')} ${m.briefing.compositePrice.toFixed(2)}`,
        m.briefing.triggerReason,
        `${t('breached')}: ${m.briefing.breachedSources.join(', ') || '—'}`,
      ],
    })
  }

  if (!chart) {
    return (
      <div className="panel chart-panel" id="price-chart">
        <h2>{t('chartTitle')}</h2>
        <p className="sub">{t('chartEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="panel chart-panel" id="price-chart">
      <div className="chart-heading">
        <div>
          <h2>{t('chartTitle')}</h2>
          <p className="sub desktop-copy">{t('chartSub')}</p>
          <p className="sub mobile-copy">{t('chartSubShort')}</p>
        </div>
        <span className="pill healthy chart-live">
          <span className="pulse" />
          {t('chartLive')}
          {composite != null ? ` · ${composite.toFixed(2)}` : ''}
        </span>
      </div>
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
          <i className="swatch briefing" /> {t('chartBriefingMark')} ({chart.markers.length})
        </span>
      </div>
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="price-chart"
          role="img"
          aria-label={t('chartTitle')}
        >
          <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} className="axis" />
          <line x1={padL} y1={padT} x2={padL} y2={height - padB} className="axis" />
          {chart.ticks.map((tk) => (
            <g key={tk.t}>
              <line x1={tk.x} y1={padT} x2={tk.x} y2={height - padB} className="grid" />
              <text x={tk.x} y={height - 12} textAnchor="middle" className="axis-label">
                {tk.label}
              </text>
            </g>
          ))}
          <path d={chart.compositePath} className="line-composite" />
          {chart.spotPath ? <path d={chart.spotPath} className="line-spot" /> : null}
          {chart.markers.map((m) => (
            <g key={m.briefing.id} className="briefing-mark">
              <line
                x1={m.x}
                y1={padT}
                x2={m.x}
                y2={height - padB}
                className="briefing-guide"
              />
              {/* Larger invisible hit target for mobile */}
              <circle
                cx={m.x}
                cy={m.y}
                r={14}
                className="briefing-hit"
                onMouseEnter={() => openTip(m, tip?.pinned ?? false)}
                onMouseLeave={() => {
                  if (!tip?.pinned) setTip(null)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (tip?.pinned && tip.title === m.briefing.title) setTip(null)
                  else openTip(m, true)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  if (tip?.pinned && tip.title === m.briefing.title) setTip(null)
                  else openTip(m, true)
                }}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={6}
                className={`briefing-dot tone-${severityTone(m.briefing.severity)}`}
              />
              <text x={m.x} y={m.y - 10} textAnchor="middle" className="mark-time">
                {m.label}
              </text>
            </g>
          ))}
          <text x={8} y={padT + 6} className="axis-label">
            {chart.maxY.toFixed(1)}
          </text>
          <text x={8} y={height - padB - 4} className="axis-label">
            {chart.minY.toFixed(1)}
          </text>
        </svg>
        {tip ? (
          <div
            className={`chart-tooltip severity-${tip.severity}`}
            style={{
              left: `${Math.min(72, Math.max(4, tip.xPct + 2))}%`,
              top: `${Math.min(62, Math.max(4, tip.yPct - 8))}%`,
            }}
            onClick={() => setTip(null)}
          >
            <div className="tip-top">
              <span className={`pill sev-${tip.severity}`}>{t(`sev_${tip.severity}`)}</span>
              {tip.pinned ? <span className="tip-pin">{lang === 'zh-Hant' ? '已固定' : 'pinned'}</span> : null}
            </div>
            <strong>{tip.title}</strong>
            {tip.lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            <div className="tip-hint">
              {lang === 'zh-Hant' ? '點標記固定 tooltip；再點關閉' : 'Tap mark to pin tooltip; tap again to close'}
            </div>
          </div>
        ) : null}
      </div>
      {chart.markers.length === 0 ? (
        <p className="sub chart-empty-marks">{t('chartNoMarks')}</p>
      ) : (
        <ul className="chart-mark-list">
          {chart.markers.slice(0, 6).map((m) => (
            <li key={m.briefing.id}>
              <button
                type="button"
                className="mark-chip"
                onClick={() => openTip(m, true)}
              >
                <span className={`pill sev-${severityTone(m.briefing.severity)}`}>
                  {t(severityLabelKey(m.briefing.severity))}
                </span>
                <span className="mono">{m.label} SGT</span>
                <span className="mark-chip-title">{m.briefing.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
