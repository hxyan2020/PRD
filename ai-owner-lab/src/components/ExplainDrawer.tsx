import { useEffect, useRef, useState } from 'react'
import {
  explainSelection,
  getApiSettings,
  saveApiSettings,
  type ChatMessage,
} from '../lib/explain'
import { useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'

interface Props {
  open: boolean
  selectedText: string
  sourceLabel?: string
  sourcePath?: string
  onClose: () => void
}

type UiMessage = { role: 'assistant' | 'user'; content: string }

export function ExplainDrawer({
  open,
  selectedText,
  sourceLabel,
  sourcePath,
  onClose,
}: Props) {
  const notebook = useNotebook()
  const { lang, t } = useLanguage()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [model, setModel] = useState('local-tutor')
  const [busy, setBusy] = useState(false)
  const [typingIndex, setTypingIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [modelName, setModelName] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const runIdRef = useRef(0)

  useEffect(() => {
    if (!open || !selectedText) return
    const settings = getApiSettings()
    setApiKey(settings.apiKey)
    setEndpoint(settings.endpoint)
    setModelName(settings.model)
    setMessages([])
    setError('')
    setDraft('')
    setSavedFlash(false)
    setTypingIndex(null)
    setBusy(true)
    const runId = ++runIdRef.current
    void explainSelection({ selectedText, sourceLabel, sourcePath, lang })
      .then((result) => {
        if (runId !== runIdRef.current) return
        setModel(result.model)
        setMessages([{ role: 'assistant', content: result.content }])
        setTypingIndex(0)
      })
      .catch((err: unknown) => {
        if (runId !== runIdRef.current) return
        setError(err instanceof Error ? err.message : 'Explain failed')
      })
      .finally(() => {
        if (runId === runIdRef.current) setBusy(false)
      })
  }, [open, selectedText, sourceLabel, sourcePath, lang])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy, typingIndex])

  if (!open) return null

  const isAnimating = typingIndex !== null
  const latestAssistant =
    [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''

  async function sendFollowUp() {
    const text = draft.trim()
    if (!text || busy || isAnimating) return
    setBusy(true)
    setError('')
    setDraft('')
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    const runId = ++runIdRef.current
    try {
      const history: ChatMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const result = await explainSelection({
        selectedText,
        sourceLabel,
        sourcePath,
        history: history.slice(0, -1),
        userMessage: text,
        lang,
      })
      if (runId !== runIdRef.current) return
      setModel(result.model)
      const withReply = [...nextMessages, { role: 'assistant' as const, content: result.content }]
      setMessages(withReply)
      setTypingIndex(withReply.length - 1)
    } catch (err: unknown) {
      if (runId !== runIdRef.current) return
      setError(err instanceof Error ? err.message : 'Follow-up failed')
    } finally {
      if (runId === runIdRef.current) setBusy(false)
    }
  }

  function saveToNotebook() {
    if (!latestAssistant || busy || isAnimating) return
    notebook.addExplanation({
      selectedText,
      explanation: latestAssistant,
      sourceLabel,
      sourcePath,
      model,
    })
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2000)
  }

  function persistSettings() {
    saveApiSettings({ apiKey, endpoint, model: modelName })
    setShowSettings(false)
  }

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label="AI explanation">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer-panel">
        <header className="drawer-head">
          <div>
            <p className="eyebrow">{t('aiTutor')}</p>
            <h2>{t('explainSelection')}</h2>
          </div>
          <div className="drawer-head-actions">
            <button type="button" className="btn ghost" onClick={() => setShowSettings((v) => !v)}>
              {t('api')}
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              {t('close')}
            </button>
          </div>
        </header>

        {showSettings ? (
          <div className="api-settings">
            <p>{t('apiHelp')}</p>
            <label>
              {t('apiKey')}
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-… (optional)"
                autoComplete="off"
              />
            </label>
            <label>
              {t('endpoint')}
              <input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://text.pollinations.ai/openai"
              />
            </label>
            <label>
              {t('model')}
              <input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="openai"
              />
            </label>
            <button type="button" className="btn primary" onClick={persistSettings}>
              {t('saveApi')}
            </button>
          </div>
        ) : null}

        <div className="drawer-selection">
          <strong>{t('selectedText')}</strong>
          <blockquote>{selectedText}</blockquote>
          {sourceLabel ? (
            <small>
              {t('source')}: {sourceLabel}
            </small>
          ) : null}
        </div>

        <div className="drawer-chat" aria-live="polite">
          {messages.map((m, index) => (
            <div key={`${m.role}-${index}`} className={`chat-bubble ${m.role}`}>
              <span className="chat-role">
                {m.role === 'assistant' ? `AI · ${model}` : t('you')}
              </span>
              {m.role === 'assistant' && typingIndex === index ? (
                <TypewriterContent
                  text={m.content}
                  onDone={() => setTypingIndex(null)}
                  onTick={() => chatEndRef.current?.scrollIntoView({ block: 'end' })}
                />
              ) : (
                <div className="chat-content">{renderLightMarkdown(m.content)}</div>
              )}
            </div>
          ))}

          {busy ? (
            <div className="chat-bubble assistant typing-wait">
              <span className="chat-role">AI · {model}</span>
              <div className="typing-indicator" aria-label={t('aiTyping')}>
                <span />
                <span />
                <span />
              </div>
              <p className="typing-label">{t('aiTyping')}</p>
            </div>
          ) : null}

          {error ? <p className="chat-error">{error}</p> : null}
          <div ref={chatEndRef} />
        </div>

        <footer className="drawer-foot">
          <div className="cta-row">
            <button
              type="button"
              className="btn primary"
              disabled={!latestAssistant || busy || isAnimating}
              onClick={saveToNotebook}
            >
              {savedFlash ? t('savedToNotebook') : t('saveAiReply')}
            </button>
          </div>
          <form
            className="followup-form"
            onSubmit={(e) => {
              e.preventDefault()
              void sendFollowUp()
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('askFollowUp')}
              disabled={busy || isAnimating}
            />
            <button
              type="submit"
              className="btn ghost"
              disabled={busy || isAnimating || !draft.trim()}
            >
              {t('send')}
            </button>
          </form>
        </footer>
      </aside>
    </div>
  )
}

function TypewriterContent({
  text,
  onDone,
  onTick,
}: {
  text: string
  onDone: () => void
  onTick?: () => void
}) {
  const [shown, setShown] = useState(0)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  const onTickRef = useRef(onTick)
  onDoneRef.current = onDone
  onTickRef.current = onTick

  useEffect(() => {
    doneRef.current = false
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || text.length === 0) {
      setShown(text.length)
      onDoneRef.current()
      return
    }

    setShown(0)
    const duration = Math.min(2400, Math.max(700, text.length * 10))
    const started = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      // Ease-out so it feels like typing that speeds slightly then settles
      const eased = 1 - (1 - progress) ** 1.35
      const next = Math.floor(eased * text.length)
      setShown(next)
      if (next % 12 === 0) onTickRef.current?.()
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setShown(text.length)
        if (!doneRef.current) {
          doneRef.current = true
          onDoneRef.current()
        }
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text])

  const complete = shown >= text.length
  if (complete) {
    return <div className="chat-content">{renderLightMarkdown(text)}</div>
  }

  return (
    <div className="chat-content typing-out">
      <p>
        {plainPreview(text.slice(0, shown))}
        <span className="typing-caret" aria-hidden="true" />
      </p>
    </div>
  )
}

function plainPreview(text: string) {
  return text.replace(/\*\*/g, '').replace(/^-\s+/gm, '• ')
}

function renderLightMarkdown(text: string) {
  const blocks = text.split(/\n\n+/)
  return blocks.map((block, i) => {
    if (block.startsWith('- ')) {
      const items = block.split('\n').filter((l) => l.startsWith('- '))
      return (
        <ul key={i}>
          {items.map((item) => (
            <li key={item}>{formatInline(item.replace(/^- /, ''))}</li>
          ))}
        </ul>
      )
    }
    return <p key={i}>{formatInline(block)}</p>
  })
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}
