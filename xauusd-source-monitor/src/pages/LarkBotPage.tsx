import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/locale'

const EVENT_URL = 'https://vex-llm-proxy.vercel.app/api/lark/event'
const INCIDENTS_URL = 'https://vex-llm-proxy.vercel.app/api/lark/incidents'

type Status = {
  ok?: boolean
  larkConfigured?: boolean
  hasOpenAI?: boolean
  hasVerificationToken?: boolean
  readyForConversation?: boolean
  chatReady?: boolean
  nextStep?: string
  bot?: {
    name?: string | null
    openId?: string | null
    tokenOk?: boolean
    chatCount?: number
    chatNames?: string[]
    error?: string | null
    openDmFeishu?: string | null
    openDmLark?: string | null
  }
  error?: string
}

export function LarkBotPage() {
  const { t, lang } = useLocale()
  const [status, setStatus] = useState<Status | null>(null)
  const [smokeOut, setSmokeOut] = useState<string>('')
  const [smokeBusy, setSmokeBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/lark/event')
        const data = (await r.json()) as Status
        if (!cancelled) setStatus(data)
      } catch (e) {
        if (!cancelled) {
          setStatus({ ok: false, error: e instanceof Error ? e.message : 'unreachable' })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const runSmoke = async (text: string) => {
    setSmokeBusy(true)
    setSmokeOut('')
    try {
      const r = await fetch('/api/lark/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await r.json()
      setSmokeOut(JSON.stringify(data, null, 2))
    } catch (e) {
      setSmokeOut(e instanceof Error ? e.message : 'smoke failed')
    } finally {
      setSmokeBusy(false)
    }
  }

  const zh = lang === 'zh-Hant'
  const bot = status?.bot

  return (
    <div className="page lark-page">
      <header className="page-head">
        <h2>{t('navLark')}</h2>
        <p className="page-sub">{t('larkSub')}</p>
      </header>

      <section className="lark-section">
        <h3>{t('larkStatusTitle')}</h3>
        <ul className="lark-status-list">
          <li>
            {t('larkStatusWebhook')}:{' '}
            <code className={status?.ok ? 'ok' : 'bad'}>{status?.ok ? 'up' : status?.error || '…'}</code>
          </li>
          <li>
            {t('larkStatusCreds')}:{' '}
            <code className={status?.larkConfigured ? 'ok' : 'bad'}>
              {status?.larkConfigured ? 'configured' : 'missing LARK_APP_ID/SECRET'}
            </code>
          </li>
          <li>
            OpenAI:{' '}
            <code className={status?.hasOpenAI ? 'ok' : 'bad'}>
              {status?.hasOpenAI ? 'ready' : 'optional fallback = rules'}
            </code>
          </li>
          <li>
            Lark token:{' '}
            <code className={bot?.tokenOk ? 'ok' : 'bad'}>
              {bot?.tokenOk ? 'ok' : bot?.error || '…'}
            </code>
          </li>
          <li>
            Bot:{' '}
            <code className={bot?.name ? 'ok' : 'bad'}>{bot?.name || '…'}</code>
          </li>
          <li>
            {zh ? '已加入會話：' : 'Chats joined: '}
            <code className={(bot?.chatCount || 0) > 0 ? 'ok' : 'bad'}>
              {typeof bot?.chatCount === 'number' ? bot.chatCount : '…'}
            </code>
            {(bot?.chatNames || []).length > 0 ? ` — ${bot?.chatNames?.join(', ')}` : ''}
          </li>
        </ul>
        {status?.nextStep ? <p className="muted">{status.nextStep}</p> : null}
        <div className="lark-smoke-actions" style={{ marginTop: '0.75rem' }}>
          {bot?.openDmFeishu ? (
            <a className="archive-btn" href={bot.openDmFeishu} target="_blank" rel="noreferrer">
              {zh ? '飛書打開私聊' : 'Open DM (Feishu)'}
            </a>
          ) : null}
          {bot?.openDmLark ? (
            <a className="archive-btn" href={bot.openDmLark} target="_blank" rel="noreferrer">
              {zh ? 'Lark 打開私聊' : 'Open DM (Lark)'}
            </a>
          ) : null}
        </div>
        <p className="muted">
          {zh ? '網頁版風險台保持不變。' : 'The web risk desk stays fully available.'}{' '}
          <a href="/#/investigate">{zh ? '打開 Investigate' : 'Open Investigate'}</a>
        </p>
      </section>

      <section className="lark-section">
        <h3>{zh ? '開始對話' : 'Start chatting'}</h3>
        <ol className="lark-steps">
          <li>
            {zh ? '事件訂閱 Request URL 必須是：' : 'Event subscription Request URL must be:'}{' '}
            <code>{EVENT_URL}</code>
            {zh ? '（Encrypt Key 關閉）' : ' (Encrypt Key OFF)'}
          </li>
          <li>
            {zh ? '訂閱：' : 'Subscribe:'} <code>im.message.receive_v1</code>,{' '}
            <code>card.action.trigger</code>
          </li>
          <li>
            {zh
              ? '用上方按鈕打開私聊，或把「VE AI风控小助手」加進風險群，然後發送 hi / 你好 / help'
              : 'Use the DM button above, or add “VE AI风控小助手” to a risk group, then send hi / 你好 / help'}
          </li>
          <li>
            {zh
              ? '群聊請 @機器人；私聊可直接發。'
              : 'In groups @ the bot; DMs work without @.'}
          </li>
        </ol>
      </section>

      <section className="lark-section">
        <h3>{t('larkCapabilitiesTitle')}</h3>
        <ul className="lark-caps">
          <li>{t('larkCap1')}</li>
          <li>{t('larkCap2')}</li>
          <li>{t('larkCap3')}</li>
          <li>{t('larkCap4')}</li>
          <li>{t('larkCap5')}</li>
          <li>{t('larkCap6')}</li>
          <li>{t('larkCap7')}</li>
        </ul>
      </section>

      <section className="lark-section">
        <h3>{t('larkSmokeTitle')}</h3>
        <p className="muted">{t('larkSmokeSub')}</p>
        <div className="lark-smoke-actions">
          <button
            type="button"
            className="archive-btn"
            disabled={smokeBusy}
            onClick={() => runSmoke(zh ? '今天黄金行情怎么样' : 'What are gold market trends today?')}
          >
            {zh ? '測市況' : 'Test market'}
          </button>
          <button
            type="button"
            className="archive-btn"
            disabled={smokeBusy}
            onClick={() =>
              runSmoke(
                zh
                  ? 'investigate IDX-01 excluded，Mark 偏离 48bps'
                  : 'investigate IDX-01 excluded, Mark 48bps',
              )
            }
          >
            {zh ? '測排查' : 'Test investigate'}
          </button>
          <a className="muted" href={INCIDENTS_URL} target="_blank" rel="noreferrer">
            incidents API
          </a>
        </div>
        {smokeOut ? <pre className="lark-smoke-out">{smokeOut}</pre> : null}
      </section>
    </div>
  )
}
