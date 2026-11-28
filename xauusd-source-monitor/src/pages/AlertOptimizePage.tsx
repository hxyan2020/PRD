import { useCallback, useMemo, useState } from 'react'
import { useLocale } from '../i18n/locale'
import {
  OPTIMIZE_DIRECTIONS,
  analyzeAlertOptimize,
  analyzeLocally,
  appendFollowUpsToReport,
  buildAoFollowUpContext,
  extractAlertNames,
  followUpAlertOptimize,
  initialStatusSteps,
  parseCsvFile,
  parseCsvText,
  parseJsonPayload,
  slotLabel,
  totalRowCount,
  type AlertDataSlot,
  type AnalysisResult,
  type AoFollowUpTurn,
  type ChartSpec,
  type DeskMode,
  type IngestedDataset,
  type OptimizeDirectionId,
  type StatusStep,
} from '../lib/alertOptimize'
import { hasLlmCredentials, PERM_VERCEL_ORIGIN, runLlm } from '../copilot/engine/llm'
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
  truncated?: boolean
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
    truncated?: boolean
    error?: string
  }
  if (!r.ok || body.ok === false) {
    return { text: '', json: null, error: body.error || `HTTP ${r.status}` }
  }
  return { text: body.text || '', json: body.json ?? null, truncated: Boolean(body.truncated) }
}

type SlotDraft = { paste: string; pasteName: string; apiUrl: string; apiHeaders: string; apiName: string }

const EMPTY_SLOT: SlotDraft = {
  paste: '',
  pasteName: '',
  apiUrl: '',
  apiHeaders: '{}',
  apiName: '',
}

const SLOTS: AlertDataSlot[] = ['underlying', 'alert_logs', 'human_labels']

export function AlertOptimizePage() {
  const { t, lang } = useLocale()
  const appLang = lang

  const [mode, setMode] = useState<DeskMode>('alert_optimize')

  // —— 通用分析 ——
  const [datasets, setDatasets] = useState<IngestedDataset[]>([])
  const [csvPaste, setCsvPaste] = useState('')
  const [csvPasteName, setCsvPasteName] = useState('pasted.csv')
  const [apiUrl, setApiUrl] = useState('')
  const [apiHeaders, setApiHeaders] = useState('{}')
  const [apiName, setApiName] = useState('V Exchange API')
  const [question, setQuestion] = useState('')

  // —— 告警优化 ——
  const [slotSets, setSlotSets] = useState<Record<AlertDataSlot, IngestedDataset[]>>({
    underlying: [],
    alert_logs: [],
    human_labels: [],
  })
  const [slotDrafts, setSlotDrafts] = useState<Record<AlertDataSlot, SlotDraft>>({
    underlying: { ...EMPTY_SLOT, pasteName: 'underlying.csv', apiName: 'Underlying API' },
    alert_logs: { ...EMPTY_SLOT, pasteName: 'alert-logs.csv', apiName: 'Alert logs API' },
    human_labels: { ...EMPTY_SLOT, pasteName: 'labels.csv', apiName: 'Labels API' },
  })
  const [alertName, setAlertName] = useState('')
  const [directions, setDirections] = useState<OptimizeDirectionId[]>(['threshold'])
  const [notes, setNotes] = useState('')

  const [steps, setSteps] = useState<StatusStep[]>(() => initialStatusSteps(appLang, 'alert_optimize'))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [followUps, setFollowUps] = useState<AoFollowUpTurn[]>([])
  const [followUpDraft, setFollowUpDraft] = useState('')
  const [followBusy, setFollowBusy] = useState(false)
  const [copyFlash, setCopyFlash] = useState(false)
  const [error, setError] = useState('')

  const alertDatasets = useMemo(
    () => [...slotSets.underlying, ...slotSets.alert_logs, ...slotSets.human_labels],
    [slotSets],
  )
  const alertNameOptions = useMemo(() => extractAlertNames(alertDatasets), [alertDatasets])

  const setStep = useCallback((id: string, patch: Partial<StatusStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const switchMode = (next: DeskMode) => {
    setMode(next)
    setResult(null)
    setFollowUps([])
    setFollowUpDraft('')
    setError('')
    setSteps(initialStatusSteps(appLang, next))
  }

  const tagSlot = (ds: IngestedDataset, slot: AlertDataSlot): IngestedDataset => ({
    ...ds,
    slot,
    name: ds.name || slotLabel(slot, appLang),
  })

  const onCsvFiles = async (files: FileList | null, slot?: AlertDataSlot) => {
    if (!files?.length) return
    setError('')
    const next: IngestedDataset[] = []
    for (const file of Array.from(files)) {
      try {
        const ds = await parseCsvFile(file, file.name)
        next.push(slot ? tagSlot(ds, slot) : ds)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    if (!next.length) return
    if (slot) {
      setSlotSets((s) => ({ ...s, [slot]: [...s[slot], ...next] }))
    } else {
      setDatasets((d) => [...d, ...next])
    }
  }

  const addPastedCsv = (slot?: AlertDataSlot) => {
    if (slot) {
      const draft = slotDrafts[slot]
      const text = draft.paste.trim()
      if (!text) return
      setError('')
      const name = draft.pasteName.trim() || `${slot}.csv`
      setSlotSets((s) => ({
        ...s,
        [slot]: [...s[slot], tagSlot(parseCsvText(text, name), slot)],
      }))
      setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], paste: '' } }))
      return
    }
    const text = csvPaste.trim()
    if (!text) return
    setError('')
    const name = csvPasteName.trim() || 'pasted.csv'
    setDatasets((d) => [...d, parseCsvText(text, name)])
    setCsvPaste('')
  }

  const addApi = async (slot?: AlertDataSlot) => {
    const url = (slot ? slotDrafts[slot].apiUrl : apiUrl).trim()
    if (!url) return
    setError('')
    const headersJson = slot ? slotDrafts[slot].apiHeaders : apiHeaders
    const nameHint = slot
      ? slotDrafts[slot].apiName.trim() || slotLabel(slot, appLang)
      : apiName.trim() || 'API'
    try {
      const { text, json, error: err, truncated } = await fetchViaProxy(url, headersJson)
      if (err) {
        setError(err)
        return
      }
      let ds: IngestedDataset
      if (json != null) {
        ds = parseJsonPayload(json, nameHint, url)
      } else if (/,/.test(text.split('\n')[0] || '') && text.includes('\n')) {
        ds = parseCsvText(text, nameHint || url)
        ds.kind = 'api'
        ds.sourceLabel = url
      } else {
        ds = parseJsonPayload({ raw: text.slice(0, 200_000) }, nameHint || 'API', url)
        ds.issues.push(t('aoApiNonJson'))
      }
      if (truncated) {
        ds.issues.push(
          'Preprocess: upstream proxy streamed a memory-safe window; agent full-scanned every row in that window',
        )
      }
      if (slot) {
        setSlotSets((s) => ({ ...s, [slot]: [...s[slot], tagSlot(ds, slot)] }))
        setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], apiUrl: '' } }))
      } else {
        setDatasets((d) => [...d, ds])
        setApiUrl('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const removeDataset = (id: string, slot?: AlertDataSlot) => {
    if (slot) {
      setSlotSets((s) => ({ ...s, [slot]: s[slot].filter((x) => x.id !== id) }))
    } else {
      setDatasets((d) => d.filter((x) => x.id !== id))
    }
  }

  const toggleDirection = (id: OptimizeDirectionId) => {
    setDirections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const runAnalyze = async () => {
    setRunning(true)
    setResult(null)
    setFollowUps([])
    setFollowUpDraft('')
    setError('')
    setSteps(initialStatusSteps(appLang, mode).map((s) => ({ ...s, state: 'pending' as const })))

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    try {
      if (mode === 'alert_optimize') {
        setStep('ingest', { state: 'running' })
        await sleep(280)
        if (!alertDatasets.length) {
          setStep('ingest', { state: 'error', detail: t('aoNeedOneSlot') })
          setError(t('aoNeedOneSlot'))
          setRunning(false)
          return
        }
        const rows = totalRowCount(alertDatasets)
        const rawRows = alertDatasets.reduce(
          (n, d) => n + (d.preprocess?.originalRowCount || d.rowCount),
          0,
        )
        setStep('ingest', {
          state: 'done',
          detail: `${alertDatasets.length} · raw ${rawRows} → work ${rows}`,
        })

        setStep('preprocess', { state: 'running' })
        await sleep(280)
        const ppHit = alertDatasets.filter((d) => d.preprocess?.triggered).length
        setStep('preprocess', {
          state: 'done',
          detail: ppHit
            ? t('aoPreprocessHit').replace('{n}', String(ppHit))
            : t('aoPreprocessSkip'),
        })

        setStep('scope', { state: 'running' })
        await sleep(240)
        setStep('scope', {
          state: 'done',
          detail: [
            alertName.trim() || t('aoAlertNameAny'),
            directions.length
              ? `${directions.length} dir`
              : t('aoDirectionsDefault'),
          ].join(' · '),
        })

        setStep('profile', { state: 'running' })
        await sleep(280)
        setStep('profile', { state: 'done' })

        setStep('chart', { state: 'running' })
        await sleep(260)
        setStep('chart', { state: 'done' })

        setStep('path', { state: 'running' })
        await sleep(360)
        const local = analyzeAlertOptimize({
          datasets: alertDatasets,
          alertName,
          directions,
          notes,
          lang: appLang,
        })
        setStep('path', { state: 'done' })

        setStep('draft', { state: 'running' })
        await sleep(220)
        setResult(local)
        setStep('draft', { state: 'done' })
      } else {
        setStep('ingest', { state: 'running' })
        await sleep(280)
        if (!datasets.length) {
          setStep('ingest', { state: 'error', detail: t('aoNeedData') })
          setError(t('aoNeedData'))
          setRunning(false)
          return
        }
        const rows = totalRowCount(datasets)
        const rawRows = datasets.reduce(
          (n, d) => n + (d.preprocess?.originalRowCount || d.rowCount),
          0,
        )
        setStep('ingest', {
          state: 'done',
          detail: `${datasets.length} · raw ${rawRows} → work ${rows}`,
        })

        setStep('preprocess', { state: 'running' })
        await sleep(280)
        const ppHit = datasets.filter((d) => d.preprocess?.triggered).length
        setStep('preprocess', {
          state: 'done',
          detail: ppHit
            ? t('aoPreprocessHit').replace('{n}', String(ppHit))
            : t('aoPreprocessSkip'),
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
      }
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

  const activeDatasets = mode === 'alert_optimize' ? alertDatasets : datasets

  const fullReport = useMemo(() => {
    if (!result) return ''
    return appendFollowUpsToReport(result.reportMarkdown, followUps, appLang)
  }, [result, followUps, appLang])

  const sendFollowUp = async () => {
    if (!result || !followUpDraft.trim() || followBusy) return
    const q = followUpDraft.trim()
    setFollowBusy(true)
    setError('')
    try {
      const settings = loadSettings()
      let reply: string
      if (settings.provider === 'rules' || !hasLlmCredentials(settings)) {
        reply = followUpAlertOptimize({
          question: q,
          result,
          datasets: activeDatasets,
          lang: appLang,
          mode,
          alertName: mode === 'alert_optimize' ? alertName : undefined,
          directions: mode === 'alert_optimize' ? directions : undefined,
        })
      } else {
        const ctx = buildAoFollowUpContext({
          mode,
          result,
          datasets: activeDatasets,
          alertName: mode === 'alert_optimize' ? alertName : undefined,
          directions: mode === 'alert_optimize' ? directions : undefined,
          question: mode === 'general' ? question : notes,
          lang: appLang,
        })
        reply = await runLlm({
          settings,
          lang: appLang,
          userPrompt: [
            appLang === 'en'
              ? 'Continue interactive analysis of the alert-optimize / general-analysis desk result. Answer the user follow-up using only the provided context; if unknown, say so. Prefer concrete bullets with data support.'
              : appLang === 'zh-Hant'
                ? '繼續對告警優化／通用分析桌面結論做交互追問。僅依據所給上下文作答；不知道就說不知道。優先用帶數據支持的具體要點。'
                : '继续对告警优化／通用分析桌面结论做交互追问。仅依据所给上下文作答；不知道就说不知道。优先用带数据支持的具体要点。',
            '',
            q,
          ].join('\n'),
          skillContext: '(alert-optimize desk follow-up)',
          kbContext: ctx,
          priorMessages: followUps.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        })
      }
      setFollowUps((prev) => [
        ...prev,
        { role: 'user', content: q, at: Date.now() },
        { role: 'assistant', content: reply, at: Date.now() + 1 },
      ])
      setFollowUpDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setFollowBusy(false)
    }
  }

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
    a.download = `${mode === 'alert_optimize' ? 'alert-optimize' : 'general-analysis'}-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const renderAssistantBody = (text: string) => {
    const blocks = text.split(/\n\n+/)
    return blocks.map((block, i) => {
      const lines = block.split('\n').map((l) => l.trimEnd())
      const isList = lines.some((l) => /^[-*]\s+/.test(l))
      if (isList) {
        const title = lines.find((l) => /^#{1,3}\s+/.test(l) || (!/^[-*]\s+/.test(l) && l.trim()))
        const items = lines.filter((l) => /^[-*]\s+/.test(l))
        return (
          <div key={i} className="ao-answer-block">
            {title && !/^[-*]\s+/.test(title) ? (
              <p
                className="ao-answer-heading"
                dangerouslySetInnerHTML={{
                  __html: title
                    .replace(/^#{1,3}\s+/, '')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code>$1</code>'),
                }}
              />
            ) : null}
            <ul>
              {items.map((item, j) => (
                <li
                  key={j}
                  dangerouslySetInnerHTML={{
                    __html: item
                      .replace(/^[-*]\s+/, '')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code>$1</code>'),
                  }}
                />
              ))}
            </ul>
          </div>
        )
      }
      return (
        <p
          key={i}
          dangerouslySetInnerHTML={{
            __html: block
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/`([^`]+)`/g, '<code>$1</code>'),
          }}
        />
      )
    })
  }

  const renderIngestControls = (opts: {
    slot?: AlertDataSlot
    paste: string
    pasteName: string
    onPaste: (v: string) => void
    onPasteName: (v: string) => void
    apiUrlVal: string
    apiNameVal: string
    apiHeadersVal: string
    onApiUrl: (v: string) => void
    onApiName: (v: string) => void
    onApiHeaders: (v: string) => void
  }) => (
    <div className="ao-grid">
      <div className="ao-field ao-csv-block">
        <label className="ao-field">
          <span>{t('aoCsvUpload')}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={(e) => void onCsvFiles(e.target.files, opts.slot)}
          />
        </label>
        <span>{t('aoCsvPaste')}</span>
        <input
          type="text"
          value={opts.pasteName}
          placeholder={t('aoCsvPasteNamePh')}
          onChange={(e) => opts.onPasteName(e.target.value)}
        />
        <textarea
          rows={4}
          value={opts.paste}
          onChange={(e) => opts.onPaste(e.target.value)}
          placeholder={t('aoCsvPastePh')}
          aria-label={t('aoCsvPaste')}
        />
        <button type="button" className="archive-btn" onClick={() => addPastedCsv(opts.slot)}>
          {t('aoCsvPasteAdd')}
        </button>
      </div>
      <div className="ao-field ao-api-block">
        <span>{t('aoApiUrl')}</span>
        <input
          type="url"
          value={opts.apiUrlVal}
          placeholder="https://…"
          onChange={(e) => opts.onApiUrl(e.target.value)}
        />
        <input
          type="text"
          value={opts.apiNameVal}
          placeholder={t('aoApiNamePh')}
          onChange={(e) => opts.onApiName(e.target.value)}
        />
        <textarea
          rows={3}
          value={opts.apiHeadersVal}
          onChange={(e) => opts.onApiHeaders(e.target.value)}
          placeholder='{"Authorization":"Bearer …"}'
          aria-label={t('aoApiHeaders')}
        />
        <button type="button" className="archive-btn" onClick={() => void addApi(opts.slot)}>
          {t('aoFetchApi')}
        </button>
      </div>
    </div>
  )

  const renderDatasetList = (list: IngestedDataset[], slot?: AlertDataSlot) =>
    list.length ? (
      <ul className="ao-dataset-list">
        {list.map((d) => (
          <li key={d.id}>
            <strong>{d.name}</strong>
            <span className="ao-muted">
              {' '}
              · {d.kind} · {d.rowCount}×{d.columns.length} · {d.sourceLabel.slice(0, 48)}
            </span>
            <button type="button" className="archive-btn" onClick={() => removeDataset(d.id, slot)}>
              {t('aoRemove')}
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="ao-muted">{t('aoNoDatasets')}</p>
    )

  return (
    <div className="alert-optimize-page">
      <header className="investigate-head">
        <div>
          <h2>{t('aoTitle')}</h2>
          <p className="sub">{t('aoSub')}</p>
        </div>
      </header>

      <div className="ao-mode-tabs" role="tablist" aria-label={t('aoModeLabel')}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'alert_optimize'}
          className={mode === 'alert_optimize' ? 'active' : ''}
          onClick={() => switchMode('alert_optimize')}
        >
          {t('aoModeAlert')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'general'}
          className={mode === 'general' ? 'active' : ''}
          onClick={() => switchMode('general')}
        >
          {t('aoModeGeneral')}
        </button>
      </div>
      <p className="ao-muted ao-limits-hint">{t('aoLimitsHint')}</p>

      {mode === 'alert_optimize' ? (
        <>
          <section className="panel ao-ingest">
            <h2>{t('aoAlertSlotsTitle')}</h2>
            <p className="sub">{t('aoAlertSlotsSub')}</p>

            {SLOTS.map((slot) => {
              const draft = slotDrafts[slot]
              return (
                <div key={slot} className="ao-slot-block">
                  <h3>{slotLabel(slot, appLang)}</h3>
                  <p className="ao-muted ao-slot-hint">
                    {slot === 'underlying'
                      ? t('aoSlotUnderlyingHint')
                      : slot === 'alert_logs'
                        ? t('aoSlotLogsHint')
                        : t('aoSlotLabelsHint')}
                  </p>
                  {renderIngestControls({
                    slot,
                    paste: draft.paste,
                    pasteName: draft.pasteName,
                    onPaste: (v) => setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], paste: v } })),
                    onPasteName: (v) =>
                      setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], pasteName: v } })),
                    apiUrlVal: draft.apiUrl,
                    apiNameVal: draft.apiName,
                    apiHeadersVal: draft.apiHeaders,
                    onApiUrl: (v) => setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], apiUrl: v } })),
                    onApiName: (v) =>
                      setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], apiName: v } })),
                    onApiHeaders: (v) =>
                      setSlotDrafts((d) => ({ ...d, [slot]: { ...d[slot], apiHeaders: v } })),
                  })}
                  {renderDatasetList(slotSets[slot], slot)}
                </div>
              )
            })}
          </section>

          <section className="panel">
            <h2>{t('aoScopeTitle')}</h2>
            <p className="sub">{t('aoScopeSub')}</p>

            <label className="ao-field">
              <span>{t('aoAlertName')}</span>
              <select
                className="ao-select"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              >
                <option value="">{t('aoAlertNameAny')}</option>
                {alertNameOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {!alertNameOptions.length ? (
              <p className="ao-muted">{t('aoAlertNameEmpty')}</p>
            ) : null}

            <fieldset className="ao-directions">
              <legend>{t('aoDirections')}</legend>
              <p className="sub">{t('aoDirectionsSub')}</p>
              <div className="ao-direction-grid">
                {OPTIMIZE_DIRECTIONS.map((d) => {
                  const label = appLang === 'en' ? d.en : d.zh
                  const checked = directions.includes(d.id)
                  return (
                    <label key={d.id} className={`ao-direction-chip${checked ? ' on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDirection(d.id)}
                      />
                      <span>{label}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <label className="ao-field">
              <span>{t('aoNotes')}</span>
              <textarea
                className="ao-question"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('aoNotesPh')}
              />
            </label>

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
        </>
      ) : (
        <>
          <section className="panel ao-ingest">
            <h2>{t('aoIngestTitle')}</h2>
            <p className="sub">{t('aoIngestSub')}</p>
            {renderIngestControls({
              paste: csvPaste,
              pasteName: csvPasteName,
              onPaste: setCsvPaste,
              onPasteName: setCsvPasteName,
              apiUrlVal: apiUrl,
              apiNameVal: apiName,
              apiHeadersVal: apiHeaders,
              onApiUrl: setApiUrl,
              onApiName: setApiName,
              onApiHeaders: setApiHeaders,
            })}
            {renderDatasetList(datasets)}
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
        </>
      )}

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
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                  }}
                />
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
            <h2>{t('aoPreprocessTitle')}</h2>
            <ul className="ao-readback">
              {result.preprocessNotes.map((line, i) => (
                <li key={i}>{line.replace(/^\-\s*/, '')}</li>
              ))}
            </ul>
            <h2>{t('aoOptimizeTitle')}</h2>
            <ul>
              {result.optimizeSuggestions.map((x, i) => (
                <li key={i}>{x.replace(/^\-\s*/, '')}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>{t('aoAnswerTitle')}</h2>
            <div className="ao-answer">{renderAssistantBody(result.answer)}</div>
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

          <section className="panel ao-followup">
            <h2>{t('aoFollowUpTitle')}</h2>
            <p className="sub">{t('aoFollowUpSub')}</p>
            {followUps.length ? (
              <div className="ao-followup-thread">
                {followUps.map((turn, i) => (
                  <div key={`${turn.at}-${i}`} className={`ao-followup-turn ao-followup-${turn.role}`}>
                    <div className="ao-followup-role">
                      {turn.role === 'user' ? t('aoFollowUpYou') : t('aoFollowUpAssistant')}
                    </div>
                    <div className="ao-followup-body">
                      {turn.role === 'assistant' ? (
                        renderAssistantBody(turn.content)
                      ) : (
                        <p>{turn.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ao-muted">{t('aoFollowUpEmpty')}</p>
            )}
            <textarea
              className="ao-question"
              rows={3}
              value={followUpDraft}
              onChange={(e) => setFollowUpDraft(e.target.value)}
              placeholder={t('aoFollowUpPh')}
              disabled={followBusy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void sendFollowUp()
                }
              }}
            />
            <div className="copilot-actions">
              <button
                type="button"
                className="archive-btn primary-archive"
                disabled={followBusy || !followUpDraft.trim()}
                onClick={() => void sendFollowUp()}
              >
                {followBusy ? t('aoFollowUpSending') : t('aoFollowUpSend')}
              </button>
            </div>
          </section>

          <section className="panel ao-export">
            <h2>{t('aoExportTitle')}</h2>
            <p className="sub">{t('aoExportIncludesFollowUp')}</p>
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
