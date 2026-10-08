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

export function ExplainDrawer({
  open,
  selectedText,
  sourceLabel,
  sourcePath,
  onClose,
}: Props) {
  const notebook = useNotebook()
  const { lang, t } = useLanguage()
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([])
  const [model, setModel] = useState('local-tutor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [modelName, setModelName] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

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
    setBusy(true)
    void explainSelection({ selectedText, sourceLabel, sourcePath, lang })
      .then((result) => {
        setModel(result.model)
        setMessages([{ role: 'assistant', content: result.content }])
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Explain failed')
      })
      .finally(() => setBusy(false))
  }, [open, selectedText, sourceLabel, sourcePath, lang])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  if (!open) return null

  const latestAssistant =
    [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''

  async function sendFollowUp() {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    setError('')
    setDraft('')
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
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
      setModel(result.model)
      setMessages([...nextMessages, { role: 'assistant', content: result.content }])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Follow-up failed')
    } finally {
      setBusy(false)
    }
  }

  function saveToNotebook() {
    if (!latestAssistant) return
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
                placeholder="sk-..."
              />
            </label>
            <label>
              {t('endpoint')}
              <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
            </label>
            <label>
              {t('model')}
              <input value={modelName} onChange={(e) => setModelName(e.target.value)} />
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

        <div className="drawer-chat">
          {busy && messages.length === 0 ? <p className="chat-status">{t('thinking')}</p> : null}
          {messages.map((m, index) => (
            <div key={`${m.role}-${index}`} className={`chat-bubble ${m.role}`}>
              <span className="chat-role">
                {m.role === 'assistant' ? `AI · ${model}` : t('you')}
              </span>
              <div className="chat-content">{renderLightMarkdown(m.content)}</div>
            </div>
          ))}
          {busy && messages.length > 0 ? <p className="chat-status">{t('thinking')}</p> : null}
          {error ? <p className="chat-error">{error}</p> : null}
          <div ref={chatEndRef} />
        </div>

        <footer className="drawer-foot">
          <div className="cta-row">
            <button
              type="button"
              className="btn primary"
              disabled={!latestAssistant || busy}
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
              disabled={busy}
            />
            <button type="submit" className="btn ghost" disabled={busy || !draft.trim()}>
              {t('send')}
            </button>
          </form>
        </footer>
      </aside>
    </div>
  )
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
