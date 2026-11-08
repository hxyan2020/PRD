import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { matchRelevantBriefings } from '../copilot/engine/briefingMatch'
import { analyzeWithRules, followUpWithRules } from '../copilot/engine/rules'
import { hasLlmCredentials, runLlm } from '../copilot/engine/llm'
import {
  applyManagedLlmConfig,
  flattenKbDocs,
  loadHistory,
  loadKnowledgeTree,
  loadMonitorBriefings,
  loadSettings,
  loadSkills,
  saveHistory,
  type ImportedBriefing,
} from '../copilot/storage'
import type { CopilotSettings, IncidentRecord, SeverityChoice } from '../copilot/types'
import { useLocale } from '../i18n/locale'

function briefingToFacts(b: ImportedBriefing): string {
  const citationLines =
    b.citations?.length
      ? b.citations.map((c) => `• ${c.label} — ${c.url}${c.note ? ` (${c.note})` : ''}`)
      : (b.sourcesConsulted || []).map((x) => `• ${x}`)
  const lines = [
    `【XAUUSD source-monitor briefing】${b.title}`,
    `severity=${b.severity ?? '—'} · trigger=${b.triggerReason ?? '—'} · composite=${b.compositePrice ?? '—'}`,
    `breached=${(b.breachedSources || []).join(', ') || '—'}`,
    '',
    '【Causes (news/macro)】',
    ...(b.causes?.length ? b.causes.map((x) => `• ${x}`) : ['• (none)']),
    '',
    '【Observations (price/venue)】',
    ...(b.observations?.length
      ? b.observations.map((x) => `• ${x}`)
      : (b.why || []).map((x) => `• ${x}`)),
    '',
    '【Impact】',
    ...(b.impact || []).map((x) => `• ${x}`),
    '',
    '【Actions】',
    ...(b.actions || []).map((x) => `• ${x}`),
    '',
    '【Data sources (direct links)】',
    ...(citationLines.length ? citationLines : ['• (none)']),
  ]
  return lines.join('\n')
}

function collectDataSources(
  briefings: ImportedBriefing[],
): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = []
  const seen = new Set<string>()
  for (const b of briefings) {
    for (const c of b.citations || []) {
      const url = (c.url || '').trim()
      if (!url || seen.has(url)) continue
      seen.add(url)
      out.push({ label: c.label || url, url })
    }
    for (const line of b.sourcesConsulted || []) {
      const m = line.match(/https?:\/\/\S+/)
      if (!m) continue
      const url = m[0].replace(/[),.;]+$/, '')
      if (seen.has(url)) continue
      seen.add(url)
      out.push({ label: line.replace(url, '').replace(/[—\-–]\s*$/, '').trim() || url, url })
    }
  }
  return out
}

const SEVERITY_OPTIONS: SeverityChoice[] = ['P0', 'P1', 'P2', 'P3']

function normalizeSev(raw: string): SeverityChoice | '待判定' {
  const s = String(raw || '').toUpperCase()
  if (s.startsWith('P0')) return 'P0'
  if (s.startsWith('P1')) return 'P1'
  if (s.startsWith('P2')) return 'P2'
  if (s.startsWith('P3')) return 'P3'
  return '待判定'
}

export function InvestigatePage() {
  const { t, lang } = useLocale()
  const [settings, setSettings] = useState<CopilotSettings>(() => loadSettings())
  const [history, setHistory] = useState<IncidentRecord[]>(() => loadHistory())
  const [title, setTitle] = useState('')
  const [facts, setFacts] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<IncidentRecord | null>(null)
  const [followUp, setFollowUp] = useState('')
  const [boundBriefings, setBoundBriefings] = useState<ImportedBriefing[]>([])
  const [liveThinking, setLiveThinking] = useState<string[]>([])
  const [llmReady, setLlmReady] = useState(() => hasLlmCredentials(loadSettings()))

  const pushThink = (line: string) => {
    setLiveThinking((prev) => [...prev, line])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next = await applyManagedLlmConfig(loadSettings())
      if (cancelled) return
      setSettings(next)
      setLlmReady(hasLlmCredentials(next))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const briefings = useMemo(() => {
    const all = loadMonitorBriefings()
    return all.filter((b) => !b.lang || b.lang === (lang === 'zh-Hant' ? 'zh-Hant' : 'en'))
  }, [lang])

  const previewBound = useMemo(() => {
    const q = [title, facts].filter(Boolean).join('\n')
    if (!q.trim() && !images.length) return []
    return matchRelevantBriefings(q || 'XAUUSD', briefings, 3)
  }, [title, facts, images.length, briefings])

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

  const runAnalysis = async () => {
    setError(null)
    const userText = facts.trim()
    if (!userText && !images.length) {
      setError(t('copilotNeedFacts'))
      return
    }

    const query = [title.trim(), userText].filter(Boolean).join('\n') || 'XAUUSD alert'
    const matched = matchRelevantBriefings(query, briefings, 3)
    setBoundBriefings(matched)
    const dataSources = collectDataSources(matched)
    const briefingBits = matched.map(briefingToFacts).join('\n\n----\n\n')
    const text = [userText, briefingBits].filter(Boolean).join('\n\n')
    const analysisText =
      text ||
      '[Screenshot uploaded — OCR text not available; please paste alert text for better skill matching.]'

    const autoTitle =
      title.trim() ||
      (matched[0] ? `RCA · ${matched[0].title}` : '') ||
      t('copilotUntitled')
    if (!title.trim() && matched[0]) setTitle(autoTitle)

    setBusy(true)
    setLiveThinking([t('investigateThinkMatch')])
    setActive(null)
    const startedAt = Date.now()
    try {
      const skills = loadSkills()
      const tree = loadKnowledgeTree()
      const knowledge = flattenKbDocs(tree)
      pushThink(
        matched.length
          ? t('investigateAutoBoundThinking').replace('{n}', String(matched.length)) +
              `: ${matched.map((b) => b.title).join(' · ')}`
          : t('investigateAutoBoundNone'),
      )
      pushThink(t('investigateThinkSkills'))
      // Always auto-recommend severity from input + matched skills.
      const rules = analyzeWithRules({
        text: analysisText,
        severity: '自动建议',
        skills,
        knowledge,
        tree,
        startedAt,
        lang,
        dataSources,
      })
      let report = rules.body
      let provider = settings.provider
      let modelLabel = 'rules'
      let llmNote: string | null = null

      if (settings.provider !== 'rules' && hasLlmCredentials(settings)) {
        try {
          pushThink(t('investigateThinkLlm'))
          modelLabel = `${settings.provider}/${settings.model}`
          const llmText = await runLlm({
            settings,
            lang,
            userPrompt: [
              analysisText,
              '',
              matched.length
                ? `【Auto-bound market events】${matched.map((b) => b.title).join(' · ')}`
                : '【Auto-bound market events】none matched',
              `【Recommended severity】${rules.sev}`,
              dataSources.length
                ? `【Data sources (direct links)】\n${dataSources
                    .map((s) => `- ${s.label}: ${s.url}`)
                    .join('\n')}`
                : '【Data sources (direct links)】none',
            ].join('\n'),
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
        } catch (llmErr) {
          provider = 'rules'
          modelLabel = 'rules'
          llmNote = `${t('llmFallbackRules')} ${
            llmErr instanceof Error ? llmErr.message : String(llmErr)
          }`
        }
      } else {
        provider = 'rules'
        modelLabel = 'rules'
      }

      pushThink(t('investigateThinkDone'))
      if (llmNote) setError(llmNote)

      const thinking = [
        matched.length
          ? t('investigateAutoBoundThinking').replace(
              '{n}',
              String(matched.length),
            ) + `: ${matched.map((b) => b.title).join(' · ')}`
          : t('investigateAutoBoundNone'),
        ...rules.thinking,
      ]
      const rec: IncidentRecord = {
        id: `inc_${Date.now()}`,
        createdAt: startedAt,
        title: autoTitle,
        facts: analysisText,
        severity: rules.sev,
        provider,
        modelLabel,
        report,
        hits: rules.hits,
        l2: rules.l2,
        imageDataUrl: images[0] || null,
        imageDataUrls: images,
        briefingIds: matched.map((b) => b.id),
        thinking,
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
      setLiveThinking(thinking)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setLiveThinking([])
    } finally {
      setBusy(false)
    }
  }

  const updateSeverity = (nextSev: SeverityChoice) => {
    if (!active) return
    const updated: IncidentRecord = {
      ...active,
      severity: nextSev,
      thinking: [
        ...(active.thinking || []).filter((line) => !line.startsWith('[severity-override]')),
        `[severity-override] ${t('investigateSeverityOverride')}: ${nextSev}`,
      ],
    }
    const next = history.map((h) => (h.id === active.id ? updated : h))
    persistHistory(next)
    setActive(updated)
  }

  const sendFollowUp = async () => {
    if (!active || !followUp.trim()) return
    setBusy(true)
    setError(null)
    try {
      let reply: string
      if (settings.provider === 'rules' || !hasLlmCredentials(settings)) {
        reply = followUpWithRules(followUp.trim(), active.facts, lang)
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
          lang,
        })
        reply = await runLlm({
          settings,
          lang,
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
  const shownBound = boundBriefings.length ? boundBriefings : previewBound
  const activeSev = active ? normalizeSev(active.severity) : '待判定'
  const activeSources = active
    ? collectDataSources(
        (active.briefingIds || [])
          .map((id) => briefings.find((b) => b.id === id))
          .filter((b): b is ImportedBriefing => !!b),
      )
    : collectDataSources(shownBound)

  return (
    <div className="panel copilot-page investigate-page">
      <div className="investigate-head">
        <div>
          <h2>{t('investigateTitle')}</h2>
          <p className="sub">{t('investigateSub')}</p>
        </div>
        <span className={`pill ${llmReady ? 'healthy' : 'watch'}`}>
          {llmReady ? t('llmConnected') : t('llmConnecting')}
        </span>
      </div>

      {error ? <p className="feed-error">{error}</p> : null}

      <div className="copilot-grid">
        <div>
          <h3>{t('copilotNewIncident')}</h3>

          <label className="field-label" htmlFor="investigate-screenshots">
            {t('investigateScreenshots')}
          </label>
          <label className="file-upload-btn" htmlFor="investigate-screenshots">
            <input
              id="investigate-screenshots"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onImages(e.target.files)}
            />
            <span>
              {images.length
                ? t('investigateUploadSelected').replace('{n}', String(images.length))
                : t('investigateUploadCta')}
            </span>
          </label>
          {images.length ? (
            <div className="investigate-previews">
              {images.map((src, i) => (
                <img key={i} className="copilot-preview" src={src} alt={`alert-${i + 1}`} />
              ))}
            </div>
          ) : null}

          <label className="field-label">{t('copilotFacts')}</label>
          <textarea
            rows={10}
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder={t('copilotFactsPh')}
          />

          <div className="item-block" style={{ borderTop: 'none', paddingTop: 4 }}>
            <p className="field-label" style={{ marginBottom: 6 }}>
              {t('investigateAutoBoundLabel')}
            </p>
            <p className="sub" style={{ marginTop: 0 }}>
              {t('investigateAutoBoundHint')}
            </p>
            {shownBound.length ? (
              <>
                <ul className="investigate-list">
                  {shownBound.map((b) => (
                    <li key={b.id}>
                      <span className="pill sev-yellow">{b.severity || '—'}</span> {b.title}
                    </li>
                  ))}
                </ul>
                {collectDataSources(shownBound).length ? (
                  <div style={{ marginTop: 8 }}>
                    <p className="field-label" style={{ marginBottom: 4 }}>
                      {t('investigateDataSources')}
                    </p>
                    <ul className="investigate-list investigate-sources">
                      {collectDataSources(shownBound)
                        .slice(0, 6)
                        .map((s) => (
                          <li key={s.url}>
                            <a href={s.url} target="_blank" rel="noreferrer noopener">
                              {s.label}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="sub">{t('investigateAutoBoundPending')}</p>
            )}
          </div>

          <p className="sub">{t('investigateSeverityHint')}</p>

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
                setBoundBriefings([])
                setActive(null)
                setLiveThinking([])
              }}
            >
              {t('copilotClear')}
            </button>
          </p>
          <p className="sub">{t('investigateStatsNote')}</p>
        </div>

        <div>
          <h3>{t('copilotReport')}</h3>

          {(busy || liveThinking.length > 0) && (
            <div className={`thinking-panel${busy ? ' thinking-live' : ''}`}>
              <h4>{busy ? t('investigateThinkingLive') : t('investigateThinking')}</h4>
              <ol className="investigate-list thinking-steps">
                {(busy ? liveThinking : active?.thinking || liveThinking).map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ol>
            </div>
          )}

          {active && !busy ? (
            <>
              <div className="copilot-row" style={{ alignItems: 'end', marginBottom: 8 }}>
                <div>
                  <label className="field-label">{t('investigateSeverityRecommended')}</label>
                  <select
                    value={SEVERITY_OPTIONS.includes(activeSev as SeverityChoice) ? activeSev : 'P2'}
                    onChange={(e) => updateSeverity(e.target.value as SeverityChoice)}
                  >
                    {SEVERITY_OPTIONS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                  <p className="sub" style={{ marginTop: 4 }}>
                    {t('investigateSeverityCanEdit')}
                  </p>
                </div>
                <p className="sub" style={{ margin: 0 }}>
                  {active.modelLabel} ·{' '}
                  {new Date(active.createdAt).toLocaleString('en-SG', {
                    timeZone: 'Asia/Singapore',
                  })}{' '}
                  SGT
                  {active.archivedAt
                    ? ` · ${t('investigateArchivedBadge')}`
                    : ` · ${t('investigateOpenBadge')}`}
                </p>
              </div>

              {(active.briefingIds || []).length ? (
                <>
                  <h4>{t('investigateBoundEvents')}</h4>
                  <ul className="investigate-list">
                    {(active.briefingIds || []).map((id) => {
                      const b = briefings.find((x) => x.id === id)
                      return (
                        <li key={id}>
                          {b ? (
                            <>
                              <span className="pill sev-yellow">{b.severity || '—'}</span> {b.title}
                            </>
                          ) : (
                            id
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </>
              ) : null}

              <h4>{t('investigateDataSources')}</h4>
              <p className="sub">{t('investigateDataSourcesHint')}</p>
              {activeSources.length ? (
                <ul className="investigate-list investigate-sources">
                  {activeSources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer noopener">
                        {s.label}
                      </a>
                      <span className="source-url mono">{s.url}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sub">{t('investigateDataSourcesNone')}</p>
              )}

              <h4>{t('investigatePath')}</h4>
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

              {!liveThinking.length ? (
                <>
                  <h4>{t('investigateThinking')}</h4>
                  <ul className="investigate-list">
                    {(active.thinking || []).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              <h4>{t('investigateRecommendations')}</h4>
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
          ) : !busy ? (
            <p className="sub">{t('copilotReportEmpty')}</p>
          ) : null}

          {history.length > 0 ? (
            <>
              <h3 style={{ marginTop: 24 }}>{t('copilotRecent')}</h3>
              <div className="copilot-history-mini">
                {openIncidents.slice(0, 8).map((h) => (
                  <div key={h.id} className="item-row">
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setActive(h)
                        setLiveThinking(h.thinking || [])
                      }}
                    >
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
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setActive(h)
                        setLiveThinking(h.thinking || [])
                      }}
                    >
                      {h.title}
                    </button>
                    <button
                      type="button"
                      className="archive-btn"
                      onClick={() => unarchiveIncident(h.id)}
                    >
                      {t('unarchiveAction')}
                    </button>
                  </div>
                ))
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
