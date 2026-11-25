import type { CopilotSettings, LlmProvider } from '../types'
import type { AppLang } from '../../i18n/messages'

export const SYSTEM_PROMPT_ZH = `你是 **报价 AI排查助手**（CFD 定價風控專家／風險歸因助手）。與 V Exchange／永續無關。
業務範圍：CFD Broker Pricing — LP→PE→MT 報價鏈路、舊價成交、Bad Tick、Markout、強平、LP 切源、跨資產行情與監控。
你必須輸出結構化繁體中文報告，包含（每段用 emoji 標題 + 粗體關鍵詞子彈，提升可讀性）：
🔎 根因判定（區分：已證實事實 / 候選根因 / 待驗證假設；找不到外部新聞或宏觀催化時要明確聲明）
🧭 排查路徑（按優先級，引用匹配到的 L1 指標技能與 L2 鏈路；• **步驟：** …）
🔗 使用的數據來源（必須列出直連 URL：行情 API、場所頁、新聞／宏觀文章；沒有就寫「無」）
⚡ 推薦解決方案 / Preferred Action（須標註需人工審批，禁止聲稱已自動執行）
🛠️ 後續優化點
🕳️ 缺失證據清單

規則：
- 格式：每個小節一個 emoji；子彈用「• **粗體關鍵詞：** 說明」；避免 emoji 刷屏。
- 不得建議未經授權的生產操作（下單、改價、強平執行、劃轉）。
- 價格異動「觀察」（bps/基差/場所結構）≠「原因」（新聞/宏觀/政策）。
- 優先使用用戶提供的 Skill 上下文、RAG 知識庫與簡報引用連結；沒有證據就說不確定。
- 若輸入含行情源監控簡報，把它當作事故輸入量，並保留其中的原因／觀察／citations URL。
- 不提供／不套取個人隱私；不使用髒話；不討論政治敏感話題（黨派／意識形態）。與 CFD 定價／跨資產行情相關的貨幣／利率政策可用。
- 禁止自稱 V Exchange／VE／永續風控機器人。`

export const SYSTEM_PROMPT_EN = `You are **报价 AI排查助手** — a CFD pricing risk-control expert (root-cause assistant). Not V Exchange / not perpetual.
Scope: CFD Broker Pricing — LP→PE→MT quote pipeline, stale quote, Bad Tick, markout, stop-out, LP failover, multi-asset market monitoring.
You MUST output a structured English report with emoji section headers + bold-keyword bullets for readability:
🔎 Root-cause judgement (confirmed facts / candidate causes / unverified hypotheses; explicitly say when no external news/macro catalyst is found)
🧭 Investigation path (priority order; cite matched L1 indicator skills and L2 chains; • **Step:** …)
🔗 Data sources used (MUST list direct URLs: price APIs, venue pages, news/macro articles; write "none" if unavailable)
⚡ Recommended solutions / Preferred Action (mark approval-required; never claim auto-execution)
🛠️ Follow-on optimisation points
🕳️ Missing-evidence checklist

Rules:
- Format: one emoji per section; bullets as "• **Bold keyword:** detail"; no emoji spam.
- Do not suggest unauthorised production actions (orders, reprice, liquidation execution, transfers).
- Price "observations" (bps/basis/venue structure) ≠ "causes" (news/macro/policy).
- Prefer Skill context, RAG knowledge, and briefing citation URLs; say uncertain when evidence is missing.
- If the input includes a market source-monitor briefing, treat it as incident input and keep its causes/observations/citation URLs.
- Never reveal or solicit personal information (IDs, phones, addresses, keys); never use curse words; never discuss politically sensitive topics (partisan politics / ideology). Monetary market policy for CFD pricing risk is OK.
- Do not identify as a V Exchange / VE / perpetual risk bot.`

/** @deprecated Prefer systemPromptFor(lang) */
export const SYSTEM_PROMPT = SYSTEM_PROMPT_ZH

export function systemPromptFor(lang: AppLang = 'zh-Hant'): string {
  return lang === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH
}

export function modelOptions(provider: LlmProvider): { id: string; label: string }[] {
  switch (provider) {
    case 'openai':
      return [
        { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
        { id: 'gpt-4o', label: 'gpt-4o' },
      ]
    case 'anthropic':
      return [
        { id: 'claude-sonnet-4-5', label: 'claude-sonnet-4-5' },
        { id: 'claude-haiku-4-5', label: 'claude-haiku-4-5' },
      ]
    case 'gemini':
      return [
        { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
        { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
      ]
    case 'openrouter':
      return [
        { id: 'openai/gpt-4o-mini', label: 'openrouter/gpt-4o-mini' },
        { id: 'anthropic/claude-sonnet-4.5', label: 'openrouter/claude-sonnet' },
        { id: 'google/gemini-2.0-flash-001', label: 'openrouter/gemini-flash' },
      ]
    default:
      return [{ id: 'rules', label: '本地规则' }]
  }
}

/** Permanent production host — SPA + server-side OpenAI via /api/chat. */
export const PERM_VERCEL_ORIGIN = 'https://quote-ai-troubleshooting-bot.vercel.app'

function proxyBases(settings: CopilotSettings): string[] {
  const configured = settings.proxyBase.replace(/\/$/, '')
  const bases: string[] = []
  // Prefer same-origin when the desk is already on the Vercel host (or local Vite proxy).
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.endsWith('vercel.app') || host === 'localhost' || host === '127.0.0.1') {
      bases.push('')
    }
  }
  if (configured) bases.push(configured)
  if (!bases.includes(PERM_VERCEL_ORIGIN)) bases.push(PERM_VERCEL_ORIGIN)
  return [...new Set(bases)]
}

async function callProxy(
  settings: CopilotSettings,
  messages: { role: string; content: string }[],
): Promise<string | null> {
  let lastErr = ''
  for (const base of proxyBases(settings)) {
    const url = `${base}/api/chat`
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (settings.deskToken?.trim()) headers['X-Desk-Token'] = settings.deskToken.trim()
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          messages,
        }),
      })
      const data = (await res.json()) as { text?: string; error?: string }
      if (res.ok && data.text) return data.text
      lastErr = data.error || `HTTP ${res.status}`
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
    }
  }
  if (lastErr) throw new Error(lastErr)
  return null
}

/** Managed desk never asks for browser API keys — server env only. */
export function hasLlmCredentials(settings: CopilotSettings): boolean {
  if (settings.provider === 'rules') return false
  if (settings.deskToken.trim()) return true
  if (settings.proxyBase.trim()) return true
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    return true
  }
  return false
}

/** Probe managed /api/chat (GET) — used for the OpenAI connected pill. */
export async function probeLlmGateway(settings: CopilotSettings): Promise<boolean> {
  for (const base of proxyBases(settings)) {
    try {
      const headers: Record<string, string> = {}
      if (settings.deskToken?.trim()) headers['X-Desk-Token'] = settings.deskToken.trim()
      const res = await fetch(`${base}/api/chat`, { method: 'GET', headers, cache: 'no-store' })
      if (res.ok) return true
    } catch {
      /* try next */
    }
  }
  return false
}

export async function runLlm(args: {
  settings: CopilotSettings
  userPrompt: string
  skillContext: string
  kbContext: string
  priorMessages?: { role: 'user' | 'assistant'; content: string }[]
  lang?: AppLang
}): Promise<string> {
  const { settings } = args
  const lang: AppLang = args.lang === 'en' ? 'en' : 'zh-Hant'
  if (settings.provider === 'rules') {
    throw new Error('规则模式请使用本地分析，不走 LLM。')
  }

  const messages = [
    { role: 'system', content: systemPromptFor(lang) },
    {
      role: 'user',
      content:
        lang === 'en'
          ? [
              '## Skill context (CFD pricing RCA)',
              args.skillContext || '(none)',
              '',
              '## RAG knowledge excerpts',
              args.kbContext || '(no matches)',
              '',
              '## User input / dialogue',
              args.userPrompt,
              '',
              'Respond in English. Keep the investigation path, data-source URLs, and approval-gated recommendations explicit.',
            ].join('\n')
          : [
              '## Skill 上下文（CFD 定價 RCA）',
              args.skillContext || '（無）',
              '',
              '## RAG 知識庫摘錄',
              args.kbContext || '（無匹配條目）',
              '',
              '## 用戶輸入／對話',
              args.userPrompt,
              '',
              '請用繁體中文回覆。排查路徑、數據來源直連 URL、需審批的建議方案必須清楚列出。',
            ].join('\n'),
    },
    ...(args.priorMessages || []).map((m) => ({ role: m.role, content: m.content })),
  ]

  const viaProxy = await callProxy(settings, messages)
  if (viaProxy) return viaProxy
  throw new Error(
    'LLM proxy unavailable. This desk uses the permanent Vercel /api/chat with a server-side OpenAI key — browser API keys are not used.',
  )
}
