import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/locale'

const EVENT_URL = 'https://vex-llm-proxy.vercel.app/api/lark/event'
const INCIDENTS_URL = 'https://vex-llm-proxy.vercel.app/api/lark/incidents'

type Status = {
  ok?: boolean
  larkConfigured?: boolean
  hasOpenAI?: boolean
  hasVerificationToken?: boolean
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
        </ul>
        <p className="muted">
          {zh ? '網頁版風險台保持不變。' : 'The web risk desk stays fully available.'}{' '}
          <a href="/#/investigate">{zh ? '打開 Investigate' : 'Open Investigate'}</a>
        </p>
      </section>

      <section className="lark-section">
        <h3>{t('larkSetupTitle')}</h3>
        <ol className="lark-steps">
          <li>
            {zh
              ? '在 Lark 開放平台建立企業自建應用，取得 App ID / App Secret。'
              : 'Create a Lark enterprise app; copy App ID / App Secret.'}
          </li>
          <li>
            {zh ? '在 Vercel 專案環境變數設定：' : 'Set Vercel project env vars:'}{' '}
            <code>LARK_APP_ID</code>, <code>LARK_APP_SECRET</code>,{' '}
            <code>LARK_VERIFICATION_TOKEN</code>（optional）, <code>OPENAI_API_KEY</code>
          </li>
          <li>
            {zh ? '事件訂閱 Request URL：' : 'Event subscription Request URL:'}{' '}
            <code>{EVENT_URL}</code>
          </li>
          <li>
            {zh ? '訂閱事件：' : 'Subscribe events:'} <code>im.message.receive_v1</code>,{' '}
            <code>card.action.trigger</code>
          </li>
          <li>
            {zh
              ? '權限：讀寫訊息、獲取圖片資源；發布應用並加入風險群。'
              : 'Scopes: send/reply messages, read image resources; publish and add the bot to risk chats.'}
          </li>
        </ol>
        <p className="muted">
          {zh
            ? '群聊需 @機器人；私聊可直接對話。指令：market / investigate / review / help。'
            : 'In groups @ the bot; DMs work directly. Commands: market / investigate / review / help.'}
        </p>
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
                  ? 'investigate 告警：XAUUSD 指数源 IDX-01 剔除，Mark 偏离 48bps'
                  : 'investigate Alert: XAUUSD index source IDX-01 excluded, Mark deviation 48bps',
              )
            }
          >
            {zh ? '測排查' : 'Test investigate'}
          </button>
          <button
            type="button"
            className="archive-btn"
            disabled={smokeBusy}
            onClick={() => runSmoke(zh ? '今晚吃什么' : 'What should I cook for dinner?')}
          >
            {zh ? '測離題拒絕' : 'Test off-topic'}
          </button>
          <button
            type="button"
            className="archive-btn"
            disabled={smokeBusy}
            onClick={() => runSmoke('review')}
          >
            {zh ? '測複盤' : 'Test review'}
          </button>
        </div>
        {smokeOut ? (
          <pre className="lark-smoke-out" tabIndex={0}>
            {smokeOut}
          </pre>
        ) : null}
        <p className="muted">
          API: <code>{INCIDENTS_URL}</code>
        </p>
      </section>
    </div>
  )
}
