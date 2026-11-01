import { useCallback, useEffect, useState } from 'react'
import { probeInfoSources } from '../engine/infoProbes'
import { useLocale } from '../i18n/locale'
import type { InfoSourceProbe } from '../types'

export function InfoSourcesPanel() {
  const { t, lang } = useLocale()
  const [rows, setRows] = useState<InfoSourceProbe[]>([])
  const [busy, setBusy] = useState(false)

  const run = useCallback(async () => {
    setBusy(true)
    try {
      const next = await probeInfoSources(lang)
      setRows(next)
    } finally {
      setBusy(false)
    }
  }, [lang])

  useEffect(() => {
    void run()
    const id = window.setInterval(() => void run(), 60_000)
    return () => window.clearInterval(id)
  }, [run])

  const groups: InfoSourceProbe['kind'][] = ['price', 'macro', 'policy', 'news']

  return (
    <div className="panel">
      <h2>{t('infoSourcesTitle')}</h2>
      <p className="sub">{t('infoSourcesSub')}</p>
      <div className="toolbar">
        <button type="button" className="primary" onClick={() => void run()} disabled={busy}>
          {busy ? t('probing') : t('probeNow')}
        </button>
      </div>
      {groups.map((kind) => {
        const list = rows.filter((r) => r.kind === kind)
        if (!list.length) return null
        return (
          <div key={kind} className="info-group">
            <h3>{t(`infoKind_${kind}`)}</h3>
            <div className="info-cards">
              {list.map((r) => (
                <article key={r.id} className={`info-card status-${r.status}`}>
                  <header>
                    <strong>{r.label}</strong>
                    <span className={`pill ${r.status === 'ok' ? 'healthy' : r.status === 'degraded' ? 'watch' : 'alert'}`}>
                      {t(`probe_${r.status}`)}
                    </span>
                  </header>
                  <div className="source-row">
                    <span>{t('colLatency')}</span>
                    <span className="mono">
                      {r.latencyMs != null ? `${r.latencyMs}ms` : '—'}
                    </span>
                  </div>
                  {r.detail ? <div className="citation-note">{r.detail}</div> : null}
                  <a className="info-link" href={r.url} target="_blank" rel="noreferrer noopener">
                    {r.url}
                  </a>
                </article>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
