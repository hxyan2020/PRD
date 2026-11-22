import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchOkxKline,
  KLINE_INTERVALS,
  type HourlyKlineSeries,
  type KlineBar,
  type KlineIntervalBar,
} from '../engine/hourlyScan'
import { useLocale } from '../i18n/locale'

function fmtSgtShort(ts: number) {
  return new Date(ts).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour12: false,
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtPx(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isKlineBar(v: string | undefined): v is KlineIntervalBar {
  return KLINE_INTERVALS.some((i) => i.bar === v)
}

export function HourlyKlineChart({
  series,
  onOpenSource,
}: {
  series: HourlyKlineSeries | null | undefined
  onOpenSource?: (sourceId: string) => void
}) {
  const { t } = useLocale()
  const defaultBar: KlineIntervalBar = isKlineBar(series?.interval) ? series.interval : '1H'
  const [tf, setTf] = useState<KlineIntervalBar>(defaultBar)
  const [live, setLive] = useState<HourlyKlineSeries | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hover, setHover] = useState<KlineBar | null>(null)
  const cacheRef = useRef<Partial<Record<KlineIntervalBar, HourlyKlineSeries>>>({})

  // Seed cache with the scan’s default series (usually 1H).
  useEffect(() => {
    if (!series?.bars?.length) return
    const bar = isKlineBar(series.interval) ? series.interval : '1H'
    cacheRef.current[bar] = series
    if (tf === bar) {
      setLive(series)
      setError(null)
    }
  }, [series, tf])

  useEffect(() => {
    const cached = cacheRef.current[tf]
    if (cached?.bars?.length) {
      setLive(cached)
      setError(null)
      setLoading(false)
      return
    }

    // Prefer report payload when it already matches the selected interval.
    if (series?.bars?.length && series.interval === tf) {
      cacheRef.current[tf] = series
      setLive(series)
      setError(null)
      setLoading(false)
      return
    }

    const ac = new AbortController()
    setLoading(true)
    setError(null)
    setHover(null)
    fetchOkxKline(tf, undefined, ac.signal)
      .then((next) => {
        cacheRef.current[tf] = next
        setLive(next)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return
        setLive(null)
        setLoading(false)
        setError(err instanceof Error ? err.message : String(err))
      })
    return () => ac.abort()
  }, [tf, series])

  const activeSeries = live

  const layout = useMemo(() => {
    const bars = activeSeries?.bars || []
    if (bars.length === 0) return null

    const W = 640
    const H = 220
    const padL = 52
    const padR = 12
    const padT = 14
    const padB = 28
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    let lo = Infinity
    let hi = -Infinity
    for (const b of bars) {
      if (b.l < lo) lo = b.l
      if (b.h > hi) hi = b.h
    }
    const pad = (hi - lo) * 0.06 || 1
    lo -= pad
    hi += pad
    const span = hi - lo || 1

    const yOf = (px: number) => padT + ((hi - px) / span) * plotH
    const slot = plotW / bars.length
    const bodyW = Math.max(3, Math.min(12, slot * 0.55))
    const hitW = Math.max(bodyW * 2, slot)

    const candles = bars.map((b, i) => {
      const cx = padL + slot * (i + 0.5)
      const yO = yOf(b.o)
      const yC = yOf(b.c)
      const yH = yOf(b.h)
      const yL = yOf(b.l)
      const up = b.c >= b.o
      const bodyTop = Math.min(yO, yC)
      const bodyH = Math.max(1.5, Math.abs(yC - yO))
      return { b, cx, yH, yL, bodyTop, bodyH, up }
    })

    const ticks = [hi, (hi + lo) / 2, lo].map((v) => ({
      v,
      y: yOf(v),
      label: fmtPx(v),
    }))

    const timeLabels: { x: number; label: string }[] = []
    const step = Math.max(1, Math.floor(bars.length / 4))
    for (let i = 0; i < bars.length; i += step) {
      timeLabels.push({
        x: padL + slot * (i + 0.5),
        label: fmtSgtShort(bars[i].t).replace(/,?\s*\d{4}/, ''),
      })
    }
    const last = bars[bars.length - 1]
    if (timeLabels.length === 0 || timeLabels[timeLabels.length - 1].x < padL + plotW - slot) {
      timeLabels.push({
        x: padL + slot * (bars.length - 0.5),
        label: fmtSgtShort(last.t).replace(/,?\s*\d{4}/, ''),
      })
    }

    return { W, H, padL, padT, plotW, plotH, candles, ticks, timeLabels, last, bodyW, hitW }
  }, [activeSeries])

  const intervalSwitcher = (
    <div className="hourly-kline-intervals" role="group" aria-label={t('hourlyKlineInterval')}>
      {KLINE_INTERVALS.map((opt) => (
        <button
          key={opt.bar}
          type="button"
          className={tf === opt.bar ? 'hourly-kline-tf is-active' : 'hourly-kline-tf'}
          aria-pressed={tf === opt.bar}
          disabled={loading && tf === opt.bar}
          onClick={() => setTf(opt.bar)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  if (!activeSeries || !layout) {
    return (
      <section className="hourly-section hourly-kline">
        <div className="hourly-kline-head">
          <div>
            <h3>{t('hourlyKlineTitle')}</h3>
            <p className="sub">
              {loading ? t('hourlyKlineLoading') : t('hourlyKlineEmpty')}
            </p>
          </div>
          {intervalSwitcher}
        </div>
        {error ? <p className="hourly-empty hourly-kline-error">{error}</p> : null}
      </section>
    )
  }

  const active = hover || layout.last
  const up = active.c >= active.o

  return (
    <section className="hourly-section hourly-kline">
      <div className="hourly-kline-head">
        <div>
          <h3>{t('hourlyKlineTitle')}</h3>
          <p className="sub">
            {t('hourlyKlineSub')
              .replace('{symbol}', activeSeries.symbol)
              .replace('{interval}', activeSeries.interval)
              .replace('{n}', String(activeSeries.bars.length))}
            {loading ? ` · ${t('hourlyKlineLoading')}` : ''}
          </p>
        </div>
        <div className="hourly-kline-head-actions">
          {intervalSwitcher}
          {onOpenSource ? (
            <button
              type="button"
              className="text-link hourly-sources-link"
              onClick={() => onOpenSource(activeSeries.sourceId)}
            >
              {t('hourlyViewSources').replace('{n}', '1')}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="hourly-empty hourly-kline-error">{error}</p> : null}

      <div className="hourly-kline-meta" aria-live="polite">
        <span className="mono">{fmtSgtShort(active.t)} SGT</span>
        <span className="hourly-kline-ohlc">
          <span>
            O <strong className="mono">{fmtPx(active.o)}</strong>
          </span>
          <span>
            H <strong className="mono">{fmtPx(active.h)}</strong>
          </span>
          <span>
            L <strong className="mono">{fmtPx(active.l)}</strong>
          </span>
          <span className={up ? 'kline-up' : 'kline-down'}>
            C <strong className="mono">{fmtPx(active.c)}</strong>
          </span>
        </span>
      </div>

      <div className={`hourly-kline-wrap${loading ? ' is-loading' : ''}`}>
        <svg
          className="hourly-kline-svg"
          viewBox={`0 0 ${layout.W} ${layout.H}`}
          role="img"
          aria-label={t('hourlyKlineTitle')}
        >
          {layout.ticks.map((tk) => (
            <g key={`g-${tk.label}`}>
              <line
                className="hourly-kline-grid"
                x1={layout.padL}
                x2={layout.padL + layout.plotW}
                y1={tk.y}
                y2={tk.y}
              />
              <text className="hourly-kline-axis" x={layout.padL - 6} y={tk.y + 3} textAnchor="end">
                {tk.label}
              </text>
            </g>
          ))}

          {layout.candles.map(({ b, cx, yH, yL, bodyTop, bodyH, up: isUp }) => (
            <g
              key={b.t}
              className={isUp ? 'kline-candle up' : 'kline-candle down'}
              onMouseEnter={() => setHover(b)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(b)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              <line x1={cx} x2={cx} y1={yH} y2={yL} />
              <rect
                className="kline-body"
                x={cx - layout.bodyW / 2}
                y={bodyTop}
                width={layout.bodyW}
                height={bodyH}
                rx={1}
              />
              <rect
                className="hourly-kline-hit"
                x={cx - layout.hitW / 2}
                y={layout.padT}
                width={layout.hitW}
                height={layout.plotH}
              />
            </g>
          ))}

          {layout.timeLabels.map((tl) => (
            <text
              key={`${tl.x}-${tl.label}`}
              className="hourly-kline-axis"
              x={tl.x}
              y={layout.H - 8}
              textAnchor="middle"
            >
              {tl.label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  )
}
