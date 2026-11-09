import type { CopilotSettings, LlmProvider } from '../types'
import type { AppLang } from '../../i18n/messages'

export const SYSTEM_PROMPT_ZH = `你是 V Exchange 永續合約 Risk Copilot（風險歸因助手）。
業務範圍：XAUUSD MVP 永續、指數源/Mark、LP、強平/ADL、對沖與監控。
語言規則（最高優先）：用與「用戶輸入事實」相同的語言回答。用戶用繁體／簡體中文就回中文；用英文就回英文。不要跟隨系統 UI 語言。
你必須輸出結構化報告，段落順序固定為：
1) 根因判定（最先寫；區分：已證實事實 / 候選根因 / 待驗證假設；找不到外部新聞或宏觀催化時要明確聲明）
2) 排查路徑（按優先級，引用匹配到的 L1 指標技能與 L2 鏈路）
3) 下一步／推薦解決方案（須標註需人工審批，禁止聲稱已自動執行）
4) 使用的數據來源（必須列出直連 URL：行情 API、場所頁、新聞／宏觀文章；沒有就寫「無」）
5) 後續優化點
6) 缺失證據清單

規則：
- 範圍：只回答 V Exchange／XAUUSD 永續風險排查相關問題。對無關閒聊、娛樂、寫作、編程作業等請求，溫和拒絕並引導用戶貼告警／指標事實。不要硬編造 RCA。
- 若輸入標明「NO DEFINED SKILL」，必須先明確寫出「未匹配到已定義 Skill」，再給可能 RCA 假設（標註未證實）；並列出提供的外網頁面具體 URL。
- 根因必須能回指用戶上傳／粘貼的告警原文（標題、成分源如 BYBIT_INDEX、觸發時間、價格）。禁止輸出與告警無關的泛化 L2 清單。
- 先寫【已證實事實】（告警已寫明的事），再寫【候選／待驗證】；不要把行情簡報裡的新聞當成告警根因。
- 需要外網核驗時，只引用提示中給出的具體頁面 URL（場所交易頁、幫助文檔、新聞深鏈），不要給官網首頁。
- 不得建議未經授權的生產操作（下單、改價、強平執行、劃轉）。
- 價格異動「觀察」（bps/基差/場所結構）≠「原因」（新聞/宏觀/政策）。
- 優先使用用戶提供的 Skill 上下文、RAG 知識庫與簡報引用連結；沒有證據就說不確定。
- 若輸入含 XAUUSD 源監控簡報，僅作次要上下文；根因仍以 PRIMARY ALERT 為準。`

export const SYSTEM_PROMPT_EN = `You are V Exchange perpetual Risk Copilot (root-cause assistant).
Scope: XAUUSD MVP perpetual, index/Mark sources, LPs, liquidation/ADL, hedge and monitoring.
Language rule (highest priority): reply in the same language as the user's input facts. Chinese input → Chinese reply; English input → English reply. Do NOT follow the UI locale.
You MUST output a structured report in this fixed order:
1) Root-cause judgement (FIRST; confirmed facts / candidate causes / unverified hypotheses; explicitly say when no external news/macro catalyst is found)
2) Investigation path (priority order; cite matched L1 indicator skills and L2 chains)
3) Next steps / recommended solutions (mark approval-required; never claim auto-execution)
4) Data sources used (MUST list direct URLs: price APIs, venue pages, news/macro articles; write "none" if unavailable)
5) Follow-on optimisation points
6) Missing-evidence checklist

Rules:
- Scope: only answer V Exchange / XAUUSD perpetual risk-investigate questions. Gently refuse unrelated chit-chat, entertainment, writing, or homework — steer the user to paste alerts/metrics. Do not invent an RCA for off-topic asks.
- If the prompt says NO DEFINED SKILL, first state that no defined skill matched, then give possible RCA hypotheses (mark unverified) and list the provided external page URLs.
- Root cause MUST cite the uploaded/pasted alert text (title, constituent like BYBIT_INDEX, trigger time, price). Do not dump unrelated generic L2 chains.
- Write confirmed facts from the alert first, then candidates/unverified items. Do not treat market-briefing news as the alert root cause.
- When external verification is needed, cite only the concrete page URLs provided (venue trade/help/news deep links) — never bare homepages.
- Do not suggest unauthorised production actions (orders, reprice, liquidation execution, transfers).
- Price "observations" (bps/basis/venue structure) ≠ "causes" (news/macro/policy).
- Prefer Skill context, RAG knowledge, and briefing citation URLs; say uncertain when evidence is missing.
- If an XAUUSD source-monitor briefing is present, treat it as secondary context only; PRIMARY ALERT drives the root cause.`

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

function keyFor(settings: CopilotSettings): string {
  switch (settings.provider) {
    case 'openai':
      return settings.openaiKey.trim()
    case 'anthropic':
      return settings.anthropicKey.trim()
    case 'gemini':
      return settings.geminiKey.trim()
    case 'openrouter':
      return settings.openrouterKey.trim()
    default:
      return ''
  }
}

async function callProxy(
  settings: CopilotSettings,
  messages: { role: string; content: string }[],
): Promise<string | null> {
  const bases = [
    settings.proxyBase.replace(/\/$/, ''),
    typeof window !== 'undefined' ? '' : '',
  ].filter((b, i, arr) => arr.indexOf(b) === i)

  for (const base of bases) {
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
      if (!res.ok) continue
      const data = (await res.json()) as { text?: string; error?: string }
      if (data.text) return data.text
    } catch {
      /* try next / fallback */
    }
  }
  return null
}

async function callGeminiDirect(
  settings: CopilotSettings,
  messages: { role: string; content: string }[],
): Promise<string> {
  const key = settings.geminiKey.trim()
  if (!key) throw new Error('请在设置中填写 Gemini API Key（或配置 /api/chat 代理）。')
  const model = settings.model || 'gemini-2.0-flash'
  const system = messages.find((m) => m.role === 'system')?.content ?? SYSTEM_PROMPT_ZH
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.2 },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini 调用失败 (${res.status}): ${err.slice(0, 400)}`)
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  if (!text) throw new Error('Gemini 返回空内容')
  return text
}

async function callOpenAiCompatible(
  settings: CopilotSettings,
  messages: { role: string; content: string }[],
  kind: 'openai' | 'openrouter',
): Promise<string> {
  const key = kind === 'openai' ? settings.openaiKey.trim() : settings.openrouterKey.trim()
  if (!key) {
    throw new Error(
      kind === 'openai'
        ? '请在设置中填写 OpenAI API Key（或配置 /api/chat 代理）。'
        : '请在设置中填写 OpenRouter API Key。',
    )
  }
  const url =
    kind === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(kind === 'openrouter'
        ? {
            'HTTP-Referer':
              typeof window !== 'undefined' ? window.location.origin : 'https://vex-llm-proxy.vercel.app',
            'X-Title': 'V Exchange Risk Copilot',
          }
        : {}),
    },
    body: JSON.stringify({
      model:
        settings.model || (kind === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'),
      messages,
      temperature: 0.2,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(
      `${kind === 'openrouter' ? 'OpenRouter' : 'OpenAI'} 调用失败 (${res.status}): ${err.slice(0, 400)}`,
    )
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content || ''
  if (!text) throw new Error(`${kind === 'openrouter' ? 'OpenRouter' : 'OpenAI'} 返回空内容`)
  return text
}

export function hasLlmCredentials(settings: CopilotSettings): boolean {
  if (settings.provider === 'rules') return false
  if (settings.proxyBase.trim()) return true
  return Boolean(keyFor(settings))
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
              '## Skill context (L1/L2)',
              args.skillContext || '(none)',
              '',
              '## RAG knowledge excerpts',
              args.kbContext || '(no matches)',
              '',
              '## User input / dialogue',
              args.userPrompt,
              '',
              'Reply in the SAME language as the user input facts above (ignore UI locale). Order: (1) Root cause first, (2) Investigation path, (3) Next steps / recommendations. Keep data-source URLs and approval gates explicit.',
            ].join('\n')
          : [
              '## Skill 上下文（L1/L2）',
              args.skillContext || '（無）',
              '',
              '## RAG 知識庫摘錄',
              args.kbContext || '（無匹配條目）',
              '',
              '## 用戶輸入／對話',
              args.userPrompt,
              '',
              '請用與上方用戶輸入相同的語言回覆（不要跟隨系統 UI 語言）。段落順序：(1) 先寫根因，(2) 排查路徑，(3) 下一步／建議方案。數據來源直連 URL 與需審批標記必須清楚列出。',
            ].join('\n'),
    },
    ...(args.priorMessages || []).map((m) => ({ role: m.role, content: m.content })),
  ]

  const viaProxy = await callProxy(settings, messages)
  if (viaProxy) return viaProxy

  if (settings.provider === 'gemini') return callGeminiDirect(settings, messages)
  if (settings.provider === 'openrouter') return callOpenAiCompatible(settings, messages, 'openrouter')
  if (settings.provider === 'openai') return callOpenAiCompatible(settings, messages, 'openai')

  throw new Error(
    `${settings.provider} 需服务端代理（/api/chat）或改用 Gemini / OpenRouter / OpenAI BYOK。请在「设置」填写密钥，或把 proxyBase 指到已配置密钥的部署。`,
  )
}
