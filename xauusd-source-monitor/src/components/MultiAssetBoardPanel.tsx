import { useCallback, useEffect, useState } from 'react'
import {
  fetchMultiAssetBoard,
  type AssetClass,
  type AssetQuote,
  type MultiAssetBoard,
} from '../engine/multiAssetMarket'
import { useLocale } from '../i18n/locale'

type Board = MultiAssetBoard

const CLASS_ORDER: AssetClass[] = ['crypto', 'equity', 'forex', 'commodity']

function classLabel(lang: string, c: AssetClass): string {
  if (lang === 'en') {
    return (
      {
        crypto: 'Crypto',
        equity: 'Equities',
        forex: 'FX',
        commodity: 'Commodities',
      } as const
    )[c]
  }
  return (
    {
      crypto: '加密貨幣',
      equity: '股票指數',
      forex: '外匯',
      commodity: '大宗商品',
    } as const
  )[c]
}

function fmtPx(q: AssetQuote): string {
  const abs = Math.abs(q.last)
  if (abs >= 1000) {
    return q.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (q.class === 'forex') return abs >= 10 ? q.last.toFixed(3) : q.last.toFixed(5)
  if (abs >= 1) return q.last.toFixed(2)
  return q.last.toFixed(4)
}

function fmtChg(q: AssetQuote): string {
  if (q.changePct == null || !Number.isFinite(q.changePct)) return '—'
  const sign = q.changePct >= 0 ? '+' : ''
  return `${sign}${q.changePct.toFixed(2)}%`
}

export function MultiAssetBoardPanel() {
  const { t, lang } = useLocale()
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Prefer same-origin API (Vercel + Vite middleware); avoid treating SPA HTML as JSON.
      try {
        const r = await fetch('/api/market/board', { cache: 'no-store' })
        const ct = r.headers.get('content-type') || ''
        if (r.ok && ct.includes('application/json')) {
          const data = (await r.json()) as { ok?: boolean; board?: Board; error?: string }
          if (data.ok && data.board) {
            setBoard(data.board)
            return
          }
        }
      } catch {
        /* fall through */
      }
      setBoard(await fetchMultiAssetBoard())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(id)
  }, [load])

  const asOf = board?.fetchedAt
    ? new Date(board.fetchedAt).toLocaleString(lang === 'en' ? 'en-SG' : 'zh-HK', {
        timeZone: 'Asia/Singapore',
        hour12: false,
      })
    : '—'

  return (
    <section className="panel multi-asset-board" aria-label={t('multiAssetTitle')}>
      <div className="panel-head">
        <div>
          <p className="kicker">{t('multiAssetKicker')}</p>
          <h2>{t('multiAssetTitle')}</h2>
          <p className="sub">{t('multiAssetSub')}</p>
        </div>
        <div className="panel-actions">
          <span className="muted">{t('multiAssetAsOf').replace('{time}', asOf)}</span>
          <button type="button" className="archive-btn" onClick={() => void load()} disabled={loading}>
            {loading ? t('hourlyScanning') : t('multiAssetRefresh')}
          </button>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {board && (
        <>
          <div className="multi-asset-grid">
            {CLASS_ORDER.map((c) => {
              const list = board.byClass[c] || []
              if (!list.length) return null
              return (
                <div key={c} className="multi-asset-col">
                  <h3>{classLabel(lang, c)}</h3>
                  <ul>
                    {list.map((q) => (
                      <li key={q.id}>
                        <a href={q.sourceUrl} target="_blank" rel="noreferrer">
                          <span className="ma-name">{lang === 'en' ? q.nameEn : q.nameZh}</span>
                          <span className="ma-sym">{q.symbol}</span>
                        </a>
                        <span className="ma-px">{fmtPx(q)}</span>
                        <span
                          className={
                            (q.changePct || 0) >= 0 ? 'ma-chg up' : 'ma-chg down'
                          }
                        >
                          {fmtChg(q)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          {(board.movers.up.length > 0 || board.movers.down.length > 0) && (
            <p className="multi-asset-movers">
              <strong>{t('multiAssetMovers')}</strong>{' '}
              {board.movers.up.map((q) => (
                <span key={`u-${q.id}`} className="ma-chip up">
                  {lang === 'en' ? q.nameEn : q.nameZh} {fmtChg(q)}
                </span>
              ))}
              {board.movers.down.map((q) => (
                <span key={`d-${q.id}`} className="ma-chip down">
                  {lang === 'en' ? q.nameEn : q.nameZh} {fmtChg(q)}
                </span>
              ))}
            </p>
          )}
          {board.notes?.length > 0 && (
            <ul className="muted">
              {board.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
