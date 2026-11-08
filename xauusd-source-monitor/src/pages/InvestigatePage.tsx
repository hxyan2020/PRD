import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { analyzeWithRules, followUpWithRules } from '../copilot/engine/rules'
import { modelOptions, runLlm } from '../copilot/engine/llm'
import {
  flattenKbDocs,
  loadHistory,
  loadKnowledgeTree,
  loadMonitorBriefings,
  loadSettings,
  loadSkills,
  saveHistory,
  saveSettings,
  type ImportedBriefing,
} from '../copilot/storage'
import type {
  CopilotSettings,
  IncidentRecord,
  LlmProvider,
  SeverityChoice,
} from '../copilot/types'
import { useLocale } from '../i18n/locale'

function briefingToFacts(b: ImportedBriefing): string {
  const lines = [
    `【XAUUSD 源监控简报输入】${b.title}`,
    `severity=${b.severity ?? '—'} · trigger=${b.triggerReason ?? '—'} · composite=${b.compositePrice ?? '—'}`,
    `breached=${(b.breachedSources || []).join(', ') || '—'}`,
    '',
    '【价格变动原因（新闻/宏观）】',
    ...(b.causes?.length ? b.causes.map((x) => `• ${x}`) : ['• （无）']),
    '',
    '【价格变动观察】',
    ...(b.observations?.length
      ? b.observations.map((x) => `• ${x}`)
      : (b.why || []).map((x) => `• ${x}`)),
    '',
    '【影响】',
    ...(b.impact || []).map((x) => `• ${x}`),
    '',
    '【建议动作】',
    ...(b.actions || []).map((x) => `• ${x}`),
  ]
  return lines.join('\n')
}

export function InvestigatePage() {
  const { t, lang } = useLocale()
  const [settings, setSettings] = useState<CopilotSettings>(() => loadSettings())
  const [history, setHistory] = useState<IncidentRecord[]>(() => loadHistory())
  const [title, setTitle] = useState('')
  const [facts, setFacts] = useState('')
  const [sev, setSev] = useState<SeverityChoice>('自动建议')
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<IncidentRecord | null>(null)
  const [followUp, setFollowUp] = useState('')
  const [selectedBriefingIds, setSelectedBriefingIds] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)

  const briefings = useMemo(() => {
    const all = loadMonitorBriefings()
    return all.filter((b) => !b.lang || b.lang === (lang === 'zh-Hant' ? 'zh-Hant' : 'en'))
  }, [lang])

  const persistSettings = (next: CopilotSettings) => {
    setSettings(next)
    saveSettings(next)
  }

  const persistHistory = (next: IncidentRecord[]) => {
    setHistory(next)
    saveHistory(next)
  }

  const onImages = (files: FileList | null) => {
    if (!files?.length) {
      setImages([])
      return
    }
    const list = Array.from(files).slice(0, 6)
    Promise.all(
      list.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result || ''))
            reader.readAsDataURL(file)
          }),
      ),
    ).then(setImages)
  }

  const toggleBriefing = (id: string) => {
    setSelectedBriefingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const importSelectedBriefings = () => {
    const picked = briefings.filter((b) => selectedBriefingIds.includes(b.id))
    if (!picked.length) return
    const block = picked.map(briefingToFacts).join('\n\n----\n\n')
    setFacts((prev) => (prev ? `${prev}\n\n${block}` : block))
    if (!title.trim() && picked[0]) setTitle(`RCA · ${picked[0].title}`)
  }

  const runAnalysis = async () => {
    setError(null)
    const briefingBits = briefings
      .filter((b) => selectedBriefingIds.includes(b.id))
      .map(briefingToFacts)
      .join('\n\n')
    const text = [facts.trim(), briefingBits].filter(Boolean).join('\n\n')
    if (!text && !images.length) {
      setError(t('copilotNeedFacts'))
      return
    }
    const analysisText =
      text ||
      '[Screenshot uploaded — OCR text not available; please paste alert text for better skill matching.]'
    setBusy(true)
    const startedAt = Date.now()
    try {
      const skills = loadSkills()
      const tree = loadKnowledgeTree()
      const knowledge = flattenKbDocs(tree)
      const rules = analyzeWithRules({
        text: analysisText,
        severity: sev,
        skills,
        knowledge,
        tree,
        startedAt,
      })
      let report = rules.body
      let provider = settings.provider
      let modelLabel = 'rules'

      if (settings.provider !== 'rules') {
        modelLabel = `${settings.provider}/${settings.model}`
        const llmText = await runLlm({
          settings,
          userPrompt: analysisText,
          skillContext: rules.skillContext,
          kbContext:
            rules.kbContext ||
            knowledge.map((k) => `### ${k.title}\n${k.body}`).join('\n\n'),
        })
        report = [
          `# LLM RCA（${modelLabel}）`,
          '',
          llmText,
          '',
          '----------',
          '',
          '# Local skills + knowledge report',
          '',
          rules.body,
        ].join('\n')
      } else {
        provider = 'rules'
      }

      const rec: IncidentRecord = {
        id: `inc_${Date.now()}`,
        createdAt: startedAt,
        title: title.trim() || t('copilotUntitled'),
        facts: analysisText,
        severity: rules.sev,
        provider,
        modelLabel,
        report,
        hits: rules.hits,
        l2: rules.l2,
        imageDataUrl: images[0] || null,
        imageDataUrls: images,
        briefingIds: selectedBriefingIds.slice(),
        thinking: rules.thinking,
        timeline: rules.timeline,
        skillsUsed: rules.skillsUsed,
        knowledgeUsed: rules.knowledgeUsed,
        nextSteps: rules.nextSteps,
        messages: [
          { role: 'user', content: analysisText, at: startedAt },
          { role: 'assistant', content: report, at: Date.now() },
        ],
      }
      const next = [rec, ...history]
      persistHistory(next)
      setActive(rec)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const sendFollowUp = async () => {
    if (!active || !followUp.trim()) return
    setBusy(true)
    setError(null)
    try {
      let reply: string
      if (settings.provider === 'rules') {
        reply = followUpWithRules(followUp.trim(), active.facts)
      } else {
        const skills = loadSkills()
        const tree = loadKnowledgeTree()
        const knowledge = flattenKbDocs(tree)
        const rules = analyzeWithRules({
          text: active.facts,
          severity: '自动建议',
          skills,
          knowledge,
          tree,
        })
        reply = await runLlm({
          settings,
          userPrompt: `${followUp.trim()}\n\n[System reminder: If you do not know, say so clearly. Internal admin DB retrieval is Phase 2 — do not invent admin answers.]`,
          skillContext: rules.skillContext,
          kbContext:
            rules.kbContext ||
            knowledge.map((k) => `### ${k.title}\n${k.body}`).join('\n\n'),
          priorMessages: (active.messages || [])
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-6)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        })
      }
      const messages = [
        ...(active.messages || []),
        { role: 'user' as const, content: followUp.trim(), at: Date.now() },
        { role: 'assistant' as const, content: reply, at: Date.now() },
      ]
      const updated: IncidentRecord = {
        ...active,
        report: `${active.report}\n\n----\n【追问】${followUp.trim()}\n\n${reply}`,
        messages,
      }
      const next = history.map((h) => (h.id === active.id ? updated : h))
      persistHistory(next)
      setActive(updated)
      setFollowUp('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const archiveIncident = (id: string) => {
    const next = history.map((h) =>
      h.id === id ? { ...h, archivedAt: Date.now() } : h,
    )
    persistHistory(next)
    if (active?.id === id) setActive(next.find((h) => h.id === id) || null)
  }

  const unarchiveIncident = (id: string) => {
    const next = history.map((h) => {
      if (h.id !== id) return h
      const { archivedAt: _a, ...rest } = h
      return rest
    })
    persistHistory(next)
  }

  const openIncidents = history.filter((h) => !h.archivedAt)
  const archivedIncidents = history.filter((h) => h.archivedAt)

  return (
    <div className="panel copilot-page investigate-page">
      <div className="investigate-head">
        <div>
          <h2>{t('investigateTitle')}</h2>
          <p className="sub">{t('investigateSub')}</p>
        </div>
        <button
          type="button"
          className="archive-btn"
          onClick={() => setShowSettings((v) => !v)}
        >
          {t('copilotTabSettings')}
        </button>
      </div>

      {showSettings ? (
        <div className="item-block">
          <h3>{t('copilotSettingsTitle')}</h3>
          <p className="sub">{t('copilotSettingsSub')}</p>
          <label className="field-label">Gemini API Key</label>
          <input
            type="password"
            value={settings.geminiKey}
            onChange={(e) => persistSettings({ ...settings, geminiKey: e.target.value })}
            autoComplete="off"
          />
          <label className="field-label">OpenAI API Key</label>
          <input
            type="password"
            value={settings.openaiKey}
            onChange={(e) => persistSettings({ ...settings, openaiKey: e.target.value })}
            autoComplete="off"
          />
          <label className="field-label">Anthropic API Key</label>
          <input
            type="password"
            value={settings.anthropicKey}
            onChange={(e) => persistSettings({ ...settings, anthropicKey: e.target.value })}
            autoComplete="off"
          />
          <label className="field-label">OpenRouter API Key</label>
          <input
            type="password"
            value={settings.openrouterKey}
            onChange={(e) => persistSettings({ ...settings, openrouterKey: e.target.value })}
            autoComplete="off"
          />
          <label className="field-label">{t('copilotProxyBase')}</label>
          <input
            value={settings.proxyBase}
            onChange={(e) => persistSettings({ ...settings, proxyBase: e.target.value })}
            placeholder="https://vexchange-risk-copilot.vercel.app"
          />
          <p className="sub">{t('copilotSettingsHint')}</p>
        </div>
      ) : null}

      {error ? <p className="feed-error">{error}</p> : null}

      <div className="copilot-grid">
        <div>
          <h3>{t('copilotNewIncident')}</h3>
          <label className="field-label">{t('copilotIncidentTitle')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="XAUUSD Mark/Index…"
          />

          <label className="field-label">{t('investigateScreenshots')}</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onImages(e.target.files)}
          />
          {images.length ? (
            <div className="investigate-previews">
              {images.map((src, i) => (
                <img key={i} className="copilot-preview" src={src} alt={`alert-${i + 1}`} />
              ))}
            </div>
          ) : null}

          <label className="field-label">{t('copilotBriefingImport')}</label>
          <div className="briefing-pick-list">
            {briefings.length === 0 ? (
              <p className="sub">{t('copilotNoBriefings')}</p>
            ) : (
              briefings.slice(0, 12).map((b) => (
                <label key={b.id} className="briefing-pick">
                  <input
                    type="checkbox"
                    checked={selectedBriefingIds.includes(b.id)}
                    onChange={() => toggleBriefing(b.id)}
                  />
                  <span>
                    {b.title}
                    {b.archivedAt ? ` · ${t('copilotBriefingArchived')}` : ''}
                  </span>
                </label>
              ))
            )}
          </div>
          <button type="button" className="archive-btn" onClick={importSelectedBriefings}>
            {t('copilotImportBriefings')}
          </button>

          <label className="field-label">{t('copilotFacts')}</label>
          <textarea
            rows={10}
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder={t('copilotFactsPh')}
          />

          <div className="copilot-row">
            <div>
              <label className="field-label">{t('copilotSeverity')}</label>
              <select value={sev} onChange={(e) => setSev(e.target.value as SeverityChoice)}>
                {(['自动建议', 'P0', 'P1', 'P2', 'P3'] as SeverityChoice[]).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">{t('copilotProvider')}</label>
              <select
                value={settings.provider}
                onChange={(e) => {
                  const provider = e.target.value as LlmProvider
                  const models = modelOptions(provider)
                  persistSettings({
                    ...settings,
                    provider,
                    model: models[0]?.id || 'rules',
                  })
                }}
              >
                <option value="rules">{t('copilotProviderRules')}</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Claude</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div>
              <label className="field-label">{t('copilotModel')}</label>
              <select
                value={settings.model}
                onChange={(e) => persistSettings({ ...settings, model: e.target.value })}
                disabled={settings.provider === 'rules'}
              >
                {modelOptions(settings.provider).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="copilot-actions">
            <button
              type="button"
              className="primary-archive archive-btn"
              disabled={busy}
              onClick={() => void runAnalysis()}
            >
              {busy ? t('copilotAnalyzing') : t('investigateRun')}
            </button>
            <button
              type="button"
              className="archive-btn"
              onClick={() => {
                setTitle('')
                setFacts('')
                setImages([])
                setSelectedBriefingIds([])
                setActive(null)
              }}
            >
              {t('copilotClear')}
            </button>
          </p>
          <p className="sub">{t('investigateStatsNote')}</p>
        </div>

        <div>
          <h3>{t('copilotReport')}</h3>
          {active ? (
            <>
              <p className="sub">
                <span className="pill sev-yellow">{active.severity}</span> · {active.modelLabel} ·{' '}
                {new Date(active.createdAt).toLocaleString('en-SG', {
                  timeZone: 'Asia/Singapore',
                })}{' '}
                SGT
                {active.archivedAt ? ` · ${t('investigateArchivedBadge')}` : ` · ${t('investigateOpenBadge')}`}
              </p>

              <h4>{t('investigateSkillsUsed')}</h4>
              <ul className="investigate-list">
                {(active.skillsUsed || []).length ? (
                  active.skillsUsed!.map((s) => (
                    <li key={`${s.level}-${s.id}`}>
                      [{s.level}] {s.id} {s.name}
                      {s.severity ? ` (${s.severity})` : ''}
                    </li>
                  ))
                ) : (
                  <li>{t('investigateNoneMatched')}</li>
                )}
              </ul>

              <h4>{t('investigateKbUsed')}</h4>
              <ul className="investigate-list">
                {(active.knowledgeUsed || []).length ? (
                  active.knowledgeUsed!.map((n) => (
                    <li key={n.id}>{n.path || n.title}</li>
                  ))
                ) : (
                  <li>{t('investigateNoneMatched')}</li>
                )}
              </ul>

              <h4>{t('investigateThinking')}</h4>
              <ul className="investigate-list">
                {(active.thinking || []).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>

              <h4>{t('investigateTimeline')}</h4>
              <ol className="investigate-timeline">
                {(active.timeline || []).map((e, i) => (
                  <li key={i}>
                    <span className="mono">
                      {new Date(e.at).toLocaleTimeString('en-SG', {
                        timeZone: 'Asia/Singapore',
                      })}
                    </span>{' '}
                    {e.label}
                  </li>
                ))}
              </ol>

              <h4>{t('investigateNextSteps')}</h4>
              <ol className="investigate-list">
                {(active.nextSteps || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>

              <details>
                <summary>{t('investigateFullReport')}</summary>
                <pre className="copilot-report">{active.report}</pre>
              </details>

              <div className="copilot-actions">
                {active.archivedAt ? (
                  <button
                    type="button"
                    className="archive-btn"
                    onClick={() => unarchiveIncident(active.id)}
                  >
                    {t('unarchiveAction')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="archive-btn primary-archive"
                    onClick={() => archiveIncident(active.id)}
                  >
                    {t('copilotArchiveRca')}
                  </button>
                )}
                <button
                  type="button"
                  className="archive-btn"
                  onClick={() => void navigator.clipboard.writeText(active.report)}
                >
                  {t('copilotCopy')}
                </button>
                <NavLink className="archive-btn" to="/stats">
                  {t('navStats')}
                </NavLink>
              </div>
              <p className="sub">{t('investigateArchiveNote')}</p>

              <label className="field-label">{t('copilotFollowUp')}</label>
              <p className="sub">{t('investigateFollowUpHint')}</p>
              <textarea rows={3} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              <button
                type="button"
                className="archive-btn"
                disabled={busy}
                onClick={() => void sendFollowUp()}
              >
                {t('copilotSendFollowUp')}
              </button>
            </>
          ) : (
            <p className="sub">{t('copilotReportEmpty')}</p>
          )}

          <h3 style={{ marginTop: 24 }}>{t('copilotRecent')}</h3>
          <div className="copilot-history-mini">
            {openIncidents.slice(0, 8).map((h) => (
              <div key={h.id} className="item-row">
                <button type="button" className="text-link" onClick={() => setActive(h)}>
                  {h.title}
                </button>
                <span className="sub">{h.severity}</span>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 16 }}>{t('copilotArchiveTitle')}</h3>
          <p className="sub">{t('investigateArchiveNote')}</p>
          {archivedIncidents.length === 0 ? (
            <p className="sub">{t('copilotArchiveEmpty')}</p>
          ) : (
            archivedIncidents.slice(0, 6).map((h) => (
              <div key={h.id} className="item-row">
                <button type="button" className="text-link" onClick={() => setActive(h)}>
                  {h.title}
                </button>
                <button type="button" className="archive-btn" onClick={() => unarchiveIncident(h.id)}>
                  {t('unarchiveAction')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
