import { useMemo, useState } from 'react'
import { L1_SKILLS, L2_CHAINS } from '../data/catalog'
import { analyzeWithRules } from '../engine/rules'
import { modelOptions, runLlm } from '../engine/llm'
import {
  loadHistory,
  loadKnowledge,
  loadMonitorBriefings,
  loadSettings,
  loadSkillOverrides,
  saveHistory,
  saveKnowledge,
  saveSettings,
  saveSkillOverrides,
  type ImportedBriefing,
  type SkillOverrides,
} from '../storage'
import type {
  CopilotSettings,
  IncidentRecord,
  KnowledgeItem,
  LlmProvider,
  SeverityChoice,
} from '../types'
import { useLocale } from '../../i18n/locale'

type Tab = 'incident' | 'archive' | 'skills' | 'knowledge' | 'settings'

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

export function RiskCopilotPage() {
  const { t, lang } = useLocale()
  const [tab, setTab] = useState<Tab>('incident')
  const [settings, setSettings] = useState<CopilotSettings>(() => loadSettings())
  const [history, setHistory] = useState<IncidentRecord[]>(() => loadHistory())
  const [kb, setKb] = useState<KnowledgeItem[]>(() => loadKnowledge())
  const [overrides, setOverrides] = useState<SkillOverrides>(() => loadSkillOverrides())
  const [title, setTitle] = useState('')
  const [facts, setFacts] = useState('')
  const [sev, setSev] = useState<SeverityChoice>('自动建议')
  const [imageData, setImageData] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<IncidentRecord | null>(null)
  const [followUp, setFollowUp] = useState('')
  const [skillQ, setSkillQ] = useState('')
  const [kTitle, setKTitle] = useState('')
  const [kBody, setKBody] = useState('')
  const [selectedBriefingIds, setSelectedBriefingIds] = useState<string[]>([])

  const briefings = useMemo(() => {
    const all = loadMonitorBriefings()
    return all.filter((b) => !b.lang || b.lang === (lang === 'zh-Hant' ? 'zh-Hant' : 'en'))
  }, [lang, tab])

  const persistSettings = (next: CopilotSettings) => {
    setSettings(next)
    saveSettings(next)
  }

  const persistHistory = (next: IncidentRecord[]) => {
    setHistory(next)
    saveHistory(next)
  }

  const onImage = (file: File | null) => {
    if (!file) {
      setImageData(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageData(String(reader.result || ''))
    reader.readAsDataURL(file)
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
    if (!text) {
      setError(t('copilotNeedFacts'))
      return
    }
    setBusy(true)
    try {
      const rules = analyzeWithRules({
        text,
        severity: sev,
        overrides,
        knowledge: kb,
      })
      let report = rules.body
      let provider = settings.provider
      let modelLabel = 'rules'

      if (settings.provider !== 'rules') {
        modelLabel = `${settings.provider}/${settings.model}`
        const llmText = await runLlm({
          settings,
          userPrompt: text,
          skillContext: rules.skillContext,
          kbContext: rules.kbContext || kb.map((k) => `### ${k.title}\n${k.body}`).join('\n\n'),
        })
        report = [
          `# LLM 归因报告（${modelLabel}）`,
          '',
          llmText,
          '',
          '----------',
          '',
          '# 对照：本地 L1/L2 规则报告',
          '',
          rules.body,
        ].join('\n')
      } else {
        provider = 'rules'
      }

      const rec: IncidentRecord = {
        id: `inc_${Date.now()}`,
        createdAt: Date.now(),
        title: title.trim() || t('copilotUntitled'),
        facts: text,
        severity: rules.sev,
        provider,
        modelLabel,
        report,
        hits: rules.hits,
        l2: rules.l2,
        imageDataUrl: imageData,
        briefingIds: selectedBriefingIds.slice(),
        messages: [
          { role: 'user', content: text, at: Date.now() },
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
    if (settings.provider === 'rules') {
      setError(t('copilotFollowUpNeedLlm'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const rules = analyzeWithRules({
        text: active.facts,
        severity: '自动建议',
        overrides,
        knowledge: kb,
      })
      const reply = await runLlm({
        settings,
        userPrompt: followUp.trim(),
        skillContext: rules.skillContext,
        kbContext: rules.kbContext || kb.map((k) => `### ${k.title}\n${k.body}`).join('\n\n'),
        priorMessages: (active.messages || [])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      })
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

  const filteredSkills = L1_SKILLS.filter((s) => {
    const q = skillQ.toLowerCase()
    if (!q) return true
    const o = overrides[s.id]
    return `${s.id} ${s.name} ${s.check} ${o?.check || ''}`.toLowerCase().includes(q)
  })

  const activeIncidents = history.filter((h) => !h.archivedAt)
  const archivedIncidents = history.filter((h) => h.archivedAt)

  return (
    <div className="panel copilot-page">
      <h2>{t('copilotTitle')}</h2>
      <p className="sub">{t('copilotSub')}</p>

      <div className="copilot-tabs" role="tablist">
        {(
          [
            ['incident', 'copilotTabIncident'],
            ['archive', 'copilotTabArchive'],
            ['skills', 'copilotTabSkills'],
            ['knowledge', 'copilotTabKnowledge'],
            ['settings', 'copilotTabSettings'],
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {error ? <p className="feed-error">{error}</p> : null}

      {tab === 'incident' ? (
        <div className="copilot-grid">
          <div>
            <h3>{t('copilotNewIncident')}</h3>
            <label className="field-label">{t('copilotIncidentTitle')}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="XAUUSD Mark/Index…" />

            <label className="field-label">{t('copilotScreenshot')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImage(e.target.files?.[0] || null)}
            />
            {imageData ? <img className="copilot-preview" src={imageData} alt="alert" /> : null}

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
              <button type="button" className="primary-archive archive-btn" disabled={busy} onClick={() => void runAnalysis()}>
                {busy ? t('copilotAnalyzing') : t('copilotAnalyze')}
              </button>
              <button
                type="button"
                className="archive-btn"
                onClick={() => {
                  setTitle('')
                  setFacts('')
                  setImageData(null)
                  setSelectedBriefingIds([])
                  setActive(null)
                }}
              >
                {t('copilotClear')}
              </button>
            </p>
          </div>

          <div>
            <h3>{t('copilotReport')}</h3>
            {active ? (
              <>
                <p className="sub">
                  <span className="pill sev-yellow">{active.severity}</span> · {active.modelLabel} ·{' '}
                  {new Date(active.createdAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}{' '}
                  SGT
                </p>
                <pre className="copilot-report">{active.report}</pre>
                <div className="copilot-actions">
                  <button type="button" className="archive-btn" onClick={() => archiveIncident(active.id)}>
                    {t('copilotArchiveRca')}
                  </button>
                  <button
                    type="button"
                    className="archive-btn"
                    onClick={() => void navigator.clipboard.writeText(active.report)}
                  >
                    {t('copilotCopy')}
                  </button>
                </div>
                <label className="field-label">{t('copilotFollowUp')}</label>
                <textarea rows={3} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                <button type="button" className="archive-btn" disabled={busy} onClick={() => void sendFollowUp()}>
                  {t('copilotSendFollowUp')}
                </button>
              </>
            ) : (
              <p className="sub">{t('copilotReportEmpty')}</p>
            )}

            <h3 style={{ marginTop: 24 }}>{t('copilotRecent')}</h3>
            <div className="copilot-history-mini">
              {activeIncidents.slice(0, 8).map((h) => (
                <div key={h.id} className="item-row">
                  <button type="button" className="text-link" onClick={() => setActive(h)}>
                    {h.title}
                  </button>
                  <span className="sub">{h.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'archive' ? (
        <div>
          <h3>{t('copilotArchiveTitle')}</h3>
          <p className="sub">{t('copilotArchiveSub')}</p>
          {archivedIncidents.length === 0 ? (
            <p className="sub">{t('copilotArchiveEmpty')}</p>
          ) : (
            archivedIncidents.map((h) => (
              <article key={h.id} className="briefing collapsed">
                <header>
                  <h3>{h.title}</h3>
                  <span className="sub">
                    {new Date(h.archivedAt || h.createdAt).toLocaleString('en-SG', {
                      timeZone: 'Asia/Singapore',
                    })}{' '}
                    SGT
                  </span>
                </header>
                <p className="sub">
                  {h.severity} · {h.modelLabel} · L1 {h.hits.join(', ') || '—'}
                </p>
                <div className="copilot-actions">
                  <button type="button" className="archive-btn" onClick={() => setActive(h)}>
                    {t('copilotOpen')}
                  </button>
                  <button type="button" className="archive-btn" onClick={() => unarchiveIncident(h.id)}>
                    {t('unarchiveAction')}
                  </button>
                </div>
                {active?.id === h.id ? <pre className="copilot-report">{h.report}</pre> : null}
              </article>
            ))
          )}
        </div>
      ) : null}

      {tab === 'skills' ? (
        <div>
          <h3>{t('copilotL1Title')}</h3>
          <input
            value={skillQ}
            onChange={(e) => setSkillQ(e.target.value)}
            placeholder={t('copilotSkillSearch')}
          />
          {filteredSkills.map((s) => {
            const o = overrides[s.id]
            const severity = o?.severity || s.severity
            const check = o?.check || s.check
            const action = o?.action || s.action
            const opt = o?.opt || s.opt
            return (
              <div key={s.id} className="item-block">
                <b>
                  {s.id} {s.name}
                </b>{' '}
                <span className="pill sev-yellow">{severity}</span>
                <p className="sub">{check}</p>
                <p>{action}</p>
                <p className="sub">{opt}</p>
                <button
                  type="button"
                  className="archive-btn"
                  onClick={() => {
                    const severityNext = prompt('Severity', severity)
                    if (severityNext == null) return
                    const checkNext = prompt('Check path', check)
                    if (checkNext == null) return
                    const actionNext = prompt('Preferred action', action)
                    if (actionNext == null) return
                    const optNext = prompt('Optimization', opt)
                    if (optNext == null) return
                    const next = {
                      ...overrides,
                      [s.id]: {
                        severity: severityNext,
                        check: checkNext,
                        action: actionNext,
                        opt: optNext,
                      },
                    }
                    setOverrides(next)
                    saveSkillOverrides(next)
                  }}
                >
                  {t('copilotEditSkill')}
                </button>
              </div>
            )
          })}
          <h3>{t('copilotL2Title')}</h3>
          {L2_CHAINS.map((x) => (
            <div key={x.id} className="item-block">
              <b>
                {x.id} {x.name}
              </b>
              <p className="sub">
                {t('copilotLinked')}: {x.linkedL1}
              </p>
              <p>
                <b>{t('copilotCheck')}:</b> {x.check}
              </p>
              <p>
                <b>{t('copilotAction')}:</b> {x.action}
              </p>
              <p>
                <b>{t('copilotOpt')}:</b> {x.opt}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'knowledge' ? (
        <div>
          <h3>{t('copilotKbTitle')}</h3>
          <p className="sub">{t('copilotKbSub')}</p>
          <label className="field-label">{t('copilotKbItemTitle')}</label>
          <input value={kTitle} onChange={(e) => setKTitle(e.target.value)} />
          <label className="field-label">{t('copilotKbBody')}</label>
          <textarea rows={6} value={kBody} onChange={(e) => setKBody(e.target.value)} />
          <p>
            <button
              type="button"
              className="archive-btn primary-archive"
              onClick={() => {
                if (!kTitle.trim() || !kBody.trim()) return
                const item: KnowledgeItem = {
                  id: `kb_${Date.now()}`,
                  title: kTitle.trim(),
                  body: kBody.trim(),
                  updatedAt: Date.now(),
                }
                const next = [item, ...kb]
                setKb(next)
                saveKnowledge(next)
                setKTitle('')
                setKBody('')
              }}
            >
              {t('copilotKbSave')}
            </button>
          </p>
          {kb.map((k) => (
            <div key={k.id} className="item-block">
              <b>{k.title}</b>
              <p className="sub">{k.body.slice(0, 400)}</p>
              <button
                type="button"
                className="archive-btn"
                onClick={() => {
                  setKTitle(k.title)
                  setKBody(k.body)
                  const next = kb.filter((x) => x.id !== k.id)
                  setKb(next)
                  saveKnowledge(next)
                }}
              >
                {t('copilotKbEdit')}
              </button>{' '}
              <button
                type="button"
                className="archive-btn"
                onClick={() => {
                  if (!confirm(t('copilotKbDeleteConfirm'))) return
                  const next = kb.filter((x) => x.id !== k.id)
                  setKb(next)
                  saveKnowledge(next)
                }}
              >
                {t('copilotKbDelete')}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div>
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
          <p className="sub mono">Public UI: this page · API: /api/chat (Vercel)</p>
        </div>
      ) : null}
    </div>
  )
}
