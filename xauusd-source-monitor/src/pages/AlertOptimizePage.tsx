import { useCallback, useMemo, useState } from 'react'
import { useLocale } from '../i18n/locale'
import {
  analyzeLocally,
  initialStatusSteps,
  parseCsvText,
  parseJsonPayload,
  type AnalysisResult,
  type ChartSpec,
  type IngestedDataset,
  type StatusStep,
} from '../lib/alertOptimize'
import { PERM_VERCEL_ORIGIN } from '../copilot/engine/llm'
import { loadSettings } from '../copilot/storage'

function MiniChart({ chart }: { chart: ChartSpec }) {
  const w = 360
  const h = 140
  const pad = 28
  const max = Math.max(...chart.values, 1)
  const n = chart.values.length
  if (chart.kind === 'line' && n >= 2) {
    const pts = chart.values
      .map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / Math.max(1, n - 1)
        const y = h - pad - (v / max) * (h - pad * 2)
        return `${x},${y}`
      })
      .join(' ')
    return (
      <svg className="ao-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={chart.title}>
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} />
        {chart.values.map((v, i) => {
          const x = pad + (i * (w - pad * 2)) / Math.max(1, n - 1)
          const y = h - pad - (v / max) * (h - pad * 2)
          return <circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" />
        })}
      </svg>
    )
  }
  const barW = (w - pad * 2) / Math.max(1, n)
  return (
    <svg className="ao-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={chart.title}>
      {chart.values.map((v, i) => {
        const bh = (v / max) * (h - pad * 2)
        const x = pad + i * barW + 2
        const y = h - pad - bh
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(2, barW - 4)}
            height={bh}
            rx="2"
            fill="currentColor"
            opacity={0.75}
          />
        )
      })}
    </svg>
  )
}

async function fetchViaProxy(url: string, headersJson: string): Promise<{
  text: string
  json: unknown
  error?: string
}> {
  const settings = loadSettings()
  const base = (settings.proxyBase || PERM_VERCEL_ORIGIN).replace(/\/$/, '')
  let headers: Record<string, string> = {}
  if (headersJson.trim()) {
    try {
      headers = JSON.parse(headersJson) as Record<string, string>
    } catch {
      return { text: '', json: null, error: 'API headers must be valid JSON object' }
    }
  }
  const deskToken =
    (typeof localStorage !== 'undefined' && localStorage.getItem('vex_desk_token')) ||
    (import.meta as { env?: { VITE_DESK_GATEWAY_TOKEN?: string } }).env?.VITE_DESK_GATEWAY_TOKEN ||
    ''
  const r = await fetch(`${base}/api/alert-optimize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(deskToken ? { 'x-desk-token': deskToken } : {}),
    },
    body: JSON.stringify({ action: 'fetch', url, headers }),
  })
  const body = (await r.json()) as {
    ok?: boolean
    text?: string
    json?: unknown
    error?: string
  }
  if (!r.ok || body.ok === false) {
    return { text: '', json: null, error: body.error || `HTTP ${r.status}` }
  }
  return { text: body.text || '', json: body.json ?? null }
}

export function AlertOptimizePage() {
  const { t, lang } = useLocale()
  const appLang = lang === 'en' ? 'en' : 'zh-Hant'

  const [datasets, setDatasets] = useState<IngestedDataset[]>([])
  const [apiUrl, setApiUrl] = useState('')
  const [apiHeaders, setApiHeaders] = useState('{}')
  const [apiName, setApiName] = useState('V Exchange API')
  const [question, setQuestion] = useState('')
  const [steps, setSteps] = useState<StatusStep[]>(() => initialStatusSteps(appLang))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copyFlash, setCopyFlash] = useState(false)
  const [error, setError] = useState('')

  const setStep = useCallback((id: string, patch: Partial<StatusStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const onCsvFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')
    const next: IngestedDataset[] = []
    for (const file of Array.from(files)) {
      const text = await file.text()
      next.push(parseCsvText(text, file.name))
    }
    setDatasets((d) => [...d, ...next])
  }

  const addApi = async () => {
    const url = apiUrl.trim()
    if (!url) return
    setError('')
    try {
      const { text, json, error: err } = await fetchViaProxy(url, apiHeaders)
      if (err) {
        setError(err)
        return
      }
      let ds: IngestedDataset
      if (json != null) {
        ds = parseJsonPayload(json, apiName.trim() || 'API', url)
      } else if (/,/.test(text.split('\n')[0] || '') && text.includes('\n')) {
        ds = parseCsvText(text, apiName.trim() || url)
        ds.kind = 'api'
        ds.sourceLabel = url
      } else {
        ds = parseJsonPayload({ raw: text.slice(0, 50_000) }, apiName.trim() || 'API', url)
        ds.issues.push(t('aoApiNonJson'))
      }
      setDatasets((d) => [...d, ds])
      setApiUrl('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const removeDataset = (id: string) => {
    setDatasets((d) => d.filter((x) => x.id !== id))
  }

  const runAnalyze = async () => {
    setRunning(true)
    setResult(null)
    setError('')
    setSteps(initialStatusSteps(appLang).map((s) => ({ ...s, state: 'pending' as const })))

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    try {
      setStep('ingest', { state: 'running' })
      await sleep(280)
      if (!datasets.length) {
        setStep('ingest', { state: 'error', detail: t('aoNeedData') })
        setError(t('aoNeedData'))
        setRunning(false)
        return
      }
      setStep('ingest', {
        state: 'done',
        detail: `${datasets.length} · ${datasets.reduce((n, d) => n + d.rowCount, 0)} rows`,
      })

      setStep('profile', { state: 'running' })
      await sleep(320)
      setStep('profile', { state: 'done' })

      setStep('chart', { state: 'running' })
      await sleep(280)
      setStep('chart', { state: 'done' })

      setStep('reason', { state: 'running' })
      await sleep(360)
      const local = analyzeLocally({ datasets, question, lang: appLang })
      setStep('reason', { state: 'done' })

      setStep('draft', { state: 'running' })
      await sleep(240)
      setResult(local)
      setStep('draft', { state: 'done' })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSteps((prev) =>
        prev.map((s) =>
          s.state === 'running' ? { ...s, state: 'error', detail: String(e) } : s,
        ),
      )
    } finally {
      setRunning(false)
    }
  }

  const fullReport = useMemo(() => result?.reportMarkdown || '', [result])

  const copyOutput = async () => {
    if (!fullReport) return
    try {
      await navigator.clipboard.writeText(fullReport)
      setCopyFlash(true)
      setTimeout(() => setCopyFlash(false), 1600)
    } catch {
      setError(t('aoCopyFail'))
    }
  }

  const downloadReport = () => {
    if (!fullReport) return
    const blob = new Blob([fullReport], { type: 'text/markdown;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `alert-optimize-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="alert-optimize-page">
      <header className="investigate-head">
        <div>
          <h2>{t('aoTitle')}</h2>
          <p className="sub">{t('aoSub')}</p>
        </div>
      </header>

      <section className="panel ao-ingest">
        <h2>{t('aoIngestTitle')}</h2>
        <p className="sub">{t('aoIngestSub')}</p>

        <div className="ao-grid">
          <label className="ao-field">
            <span>{t('aoCsvUpload')}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={(e) => void onCsvFiles(e.target.files)}
            />
          </label>

          <div className="ao-field ao-api-block">
            <span>{t('aoApiUrl')}</span>
            <input
              type="url"
              value={apiUrl}
              placeholder="https://…"
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <input
              type="text"
              value={apiName}
              placeholder={t('aoApiNamePh')}
              onChange={(e) => setApiName(e.target.value)}
            />
            <textarea
              rows={3}
              value={apiHeaders}
              onChange={(e) => setApiHeaders(e.target.value)}
              placeholder='{"Authorization":"Bearer …"}'
              aria-label={t('aoApiHeaders')}
            />
            <button type="button" className="archive-btn" onClick={() => void addApi()}>
              {t('aoFetchApi')}
            </button>
          </div>
        </div>

        {datasets.length ? (
          <ul className="ao-dataset-list">
            {datasets.map((d) => (
              <li key={d.id}>
                <strong>{d.name}</strong>
                <span className="ao-muted">
                  {' '}
                  · {d.kind} · {d.rowCount}×{d.columns.length} · {d.sourceLabel.slice(0, 48)}
                </span>
                <button type="button" className="archive-btn" onClick={() => removeDataset(d.id)}>
                  {t('aoRemove')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ao-muted">{t('aoNoDatasets')}</p>
        )}
      </section>

      <section className="panel">
        <h2>{t('aoQuestionTitle')}</h2>
        <p className="sub">{t('aoQuestionSub')}</p>
        <textarea
          className="ao-question"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('aoQuestionPh')}
        />
        <div className="copilot-actions">
          <button
            type="button"
            className="archive-btn primary-archive"
            disabled={running}
            onClick={() => void runAnalyze()}
          >
            {running ? t('aoAnalyzing') : t('aoAnalyze')}
          </button>
        </div>
        {error ? <p className="ao-error">{error}</p> : null}
      </section>

      <section className={`panel thinking-panel${running ? ' thinking-live' : ''}`}>
        <h4>{t('aoLiveStatus')}</h4>
        <ol className="ao-steps">
          {steps.map((s) => (
            <li key={s.id} data-state={s.state}>
              <span className="ao-step-mark">
                {s.state === 'done' ? '✓' : s.state === 'running' ? '…' : s.state === 'error' ? '!' : '○'}
              </span>
              <span>{s.label}</span>
              {s.detail ? <em className="ao-muted"> — {s.detail}</em> : null}
            </li>
          ))}
        </ol>
      </section>

      {result ? (
        <>
          <section className="panel">
            <h2>{t('aoReadbackTitle')}</h2>
            <ul className="ao-readback">
              {result.readback.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </ul>
            {result.charts.length ? (
              <div className="ao-charts">
                {result.charts.map((c) => (
                  <figure key={c.id} className="ao-chart-card">
                    <figcaption>{c.title}</figcaption>
                    <MiniChart chart={c} />
                    <p className="ao-muted ao-chart-labels">
                      {c.labels.slice(0, 6).join(' · ')}
                      {c.labels.length > 6 ? '…' : ''}
                    </p>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="ao-muted">{t('aoNoCharts')}</p>
            )}
          </section>

          <section className="panel">
            <h2>{t('aoAnswerTitle')}</h2>
            <div className="ao-answer">
              {result.answer.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>{t('aoIssuesTitle')}</h2>
            <ul>
              {result.dataIssues.length ? (
                result.dataIssues.map((x, i) => <li key={i}>{x}</li>)
              ) : (
                <li className="ao-muted">{t('aoNoIssues')}</li>
              )}
            </ul>
            <h2>{t('aoAssumptionsTitle')}</h2>
            <ul>
              {result.assumptions.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>

          <section className="panel ao-export">
            <h2>{t('aoExportTitle')}</h2>
            <div className="copilot-actions">
              <button type="button" className="archive-btn primary-archive" onClick={downloadReport}>
                {t('aoGenReport')}
              </button>
              <button type="button" className="archive-btn" onClick={() => void copyOutput()}>
                {copyFlash ? t('aoCopied') : t('aoCopy')}
              </button>
            </div>
            <pre className="ao-report-preview">{fullReport.slice(0, 1800)}</pre>
          </section>
        </>
      ) : null}
    </div>
  )
}
