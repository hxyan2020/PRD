import type { CopilotSettings, LlmProvider } from '../types'

export const SYSTEM_PROMPT = `你是 V Exchange 永续合约 Risk Copilot（风险归因助手）。
业务范围：XAUUSD MVP 永续、指数源/Mark、LP、强平/ADL、对冲与监控。
你必须输出结构化中文报告，包含：
1) 根因判定（区分：已证实事实 / 候选根因 / 待验证假设；找不到外部新闻或宏观催化时要明确声明）
2) 排查路径（按优先级，引用匹配到的 L1 指标技能与 L2 链路）
3) 推荐解决方案 / Preferred Action（须标注需人工审批，禁止声称已自动执行）
4) 后续优化点
5) 缺失证据清单

规则：
- 不得建议未经授权的生产操作（下单、改价、强平执行、划转）。
- 价格异动「观察」（bps/基差/场所结构）≠「原因」（新闻/宏观/政策）。
- 优先使用用户提供的 Skill 上下文与 RAG 知识库；没有证据就说不确定。
- 若输入含 XAUUSD 源监控简报，把它当作事故输入量，不要忽略其中的原因/观察分栏。`

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
  const system = messages.find((m) => m.role === 'system')?.content ?? SYSTEM_PROMPT
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
              typeof window !== 'undefined' ? window.location.origin : 'https://hxyan2020.github.io',
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
}): Promise<string> {
  const { settings } = args
  if (settings.provider === 'rules') {
    throw new Error('规则模式请使用本地分析，不走 LLM。')
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        '## Skill 上下文（L1/L2）',
        args.skillContext || '（无）',
        '',
        '## RAG 知识库摘录',
        args.kbContext || '（无匹配条目）',
        '',
        '## 用户输入 / 对话',
        args.userPrompt,
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
