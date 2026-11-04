import { getDayLesson, getGlossary, getProductionLang } from '../data/content'
import type { Lang } from '../i18n/types'

const KEY_STORAGE = 'ownlab-openai-key'
const ENDPOINT_STORAGE = 'ownlab-openai-endpoint'
const MODEL_STORAGE = 'ownlab-openai-model'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export function getApiSettings() {
  return {
    apiKey: localStorage.getItem(KEY_STORAGE)?.trim() ?? '',
    endpoint:
      localStorage.getItem(ENDPOINT_STORAGE)?.trim() ||
      'https://api.openai.com/v1/chat/completions',
    model: localStorage.getItem(MODEL_STORAGE)?.trim() || 'gpt-4o-mini',
  }
}

export function saveApiSettings(input: {
  apiKey: string
  endpoint?: string
  model?: string
}) {
  localStorage.setItem(KEY_STORAGE, input.apiKey.trim())
  if (input.endpoint !== undefined) {
    localStorage.setItem(ENDPOINT_STORAGE, input.endpoint.trim())
  }
  if (input.model !== undefined) {
    localStorage.setItem(MODEL_STORAGE, input.model.trim())
  }
}

function localTutorExplain(selectedText: string, sourcePath: string | undefined, lang: Lang): string {
  const text = selectedText.trim()
  const lower = text.toLowerCase()
  const glossary = getGlossary(lang)
  const hits = glossary.filter(
    (g) =>
      lower.includes(g.term.toLowerCase()) ||
      g.term.toLowerCase().split(/\s+/).some((w) => w.length > 3 && lower.includes(w)),
  )

  const dayMatch = sourcePath?.match(/\/day\/(\d+)/)
  const dayNum = dayMatch ? Number(dayMatch[1]) : undefined
  const lesson = dayNum ? getDayLesson(lang, dayNum) : undefined
  const production = dayNum ? getProductionLang(lang, dayNum) : undefined

  if (lang === 'zh') {
    const parts: string[] = []
    parts.push(`**白话解释：** ${summarizeSelection(text, lang)}`)
    if (hits.length) {
      parts.push('**相关 OWNLAB 术语**')
      for (const hit of hits.slice(0, 4)) {
        parts.push(`- **${hit.term}**：${hit.short} ${hit.detail}`)
      }
    }
    if (lesson) {
      parts.push(
        `**来自第 ${lesson.day} 天（${lesson.title}）：** 作为产品负责人，把它连到：${lesson.outcomes[0] ?? lesson.subtitle}`,
      )
    }
    if (production) {
      parts.push(
        `**生产视角（${production.source}）：** ${production.poLesson} 留意：${production.watchFor.slice(0, 2).join('；')}。`,
      )
    }
    parts.push('**产品动作：** 把这个想法改写成 PRD 里的决策、指标或风险——而不是工程任务清单。')
    parts.push('_本地导师可继续对话。想更强的模型回复，可在设置里添加 OpenAI 兼容密钥。_')
    return parts.join('\n\n')
  }

  const parts: string[] = []
  parts.push(`**Plain-language take:** ${summarizeSelection(text, lang)}`)
  if (hits.length) {
    parts.push('**Related OWNLAB terms**')
    for (const hit of hits.slice(0, 4)) {
      parts.push(`- **${hit.term}**: ${hit.short} ${hit.detail}`)
    }
  }
  if (lesson) {
    parts.push(
      `**From Day ${lesson.day} (${lesson.title}):** As a product owner, connect this to: ${lesson.outcomes[0] ?? lesson.subtitle}`,
    )
  }
  if (production) {
    parts.push(
      `**Production lens (${production.source}):** ${production.poLesson} Watch for: ${production.watchFor.slice(0, 2).join('; ')}.`,
    )
  }
  parts.push(
    '**PO move:** Rewrite this idea as a decision, metric, or risk in your PRD — not as an eng task list.',
  )
  parts.push(
    '_Local tutor can keep chatting. Add an OpenAI-compatible API key in settings for a stronger model._',
  )
  return parts.join('\n\n')
}

function summarizeSelection(text: string, lang: Lang): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (lang === 'zh') {
    if (clean.length <= 180) {
      return `你选中了：“${clean}”。在 AI 产品工作中，把它当作需要落地的概念——定义、负责人、指标与失败模式。`
    }
    return `你选中了一段较长内容，开头是“${clean.slice(0, 80)}…”。拆成：含义、在栈中的位置、如何度量、生产里会坏什么。`
  }
  if (clean.length <= 180) {
    return `You highlighted: “${clean}”. In AI product work, treat this as a concept to operationalize — definition, owner, metric, and failure mode.`
  }
  return `You highlighted a longer passage starting with “${clean.slice(0, 140)}…”. Break it into: what it means, where it lives in the stack, how you’d measure it, and what breaks in production.`
}

function findGlossaryHits(query: string, lang: Lang) {
  const lower = query.toLowerCase()
  const glossary = getGlossary(lang)
  return glossary.filter((g) => {
    const term = g.term.toLowerCase()
    return (
      lower.includes(term) ||
      term.split(/\s+/).some((w) => w.length > 3 && lower.includes(w)) ||
      g.short.toLowerCase().includes(lower) ||
      g.detail.toLowerCase().includes(lower)
    )
  })
}

function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase()
  return /^(hi|hello|hey|yo|sup|howdy|hola|你好|嗨|您好|哈喽)([!?.\s]|$)/i.test(t)
}

function wantsExamples(text: string): boolean {
  return /\b(example|examples|case|cases|production|real.?world|实例|例子|案例|生产)\b/i.test(text)
}

function wantsMetric(text: string): boolean {
  return /\b(metric|metrics|measure|kpi|eval|error budget|指标|度量|评估|错误预算)\b/i.test(text)
}

function wantsHowTo(text: string): boolean {
  return /\b(how (do|can|should)|what should|next step|practice|apply|怎么|如何|下一步|实践|落地)\b/i.test(
    text,
  )
}

function wantsWhy(text: string): boolean {
  return /\b(why|why does|why is|为什么|为何)\b/i.test(text)
}

/** Conversational reply for follow-ups — never repeats the full initial explain dump. */
function localTutorChat(input: {
  selectedText: string
  sourcePath?: string
  sourceLabel?: string
  userMessage: string
  history?: ChatMessage[]
  lang: Lang
}): string {
  const lang = input.lang
  const msg = input.userMessage.trim()
  const selection = input.selectedText.replace(/\s+/g, ' ').trim()
  const dayMatch = input.sourcePath?.match(/\/day\/(\d+)/)
  const dayNum = dayMatch ? Number(dayMatch[1]) : undefined
  const lesson = dayNum ? getDayLesson(lang, dayNum) : undefined
  const production = dayNum ? getProductionLang(lang, dayNum) : undefined
  const hits = findGlossaryHits(`${msg} ${selection}`, lang).slice(0, 3)
  const turn = (input.history?.filter((m) => m.role === 'user').length ?? 0) + 1

  if (isGreeting(msg)) {
    if (lang === 'zh') {
      return [
        `你好！我是 OWNLAB 本地导师。我们在聊你选中的「${selection.slice(0, 80)}${selection.length > 80 ? '…' : ''}」${lesson ? `（第 ${lesson.day} 天）` : ''}。`,
        '你可以直接问我：这是什么意思、产品负责人该怎么用、该盯什么指标、或要一个生产案例。',
        '_想要更强的对话模型，可在设置里添加 API 密钥。_',
      ].join('\n\n')
    }
    return [
      `Hi — I’m the OWNLAB local tutor. We’re talking about “${selection.slice(0, 100)}${selection.length > 100 ? '…' : ''}”${lesson ? ` from Day ${lesson.day}` : ''}.`,
      'Ask me anything: what it means, how a PO should use it, which metric to watch, or a production example.',
      '_Add an API key in settings if you want a stronger live model._',
    ].join('\n\n')
  }

  const parts: string[] = []

  if (lang === 'zh') {
    parts.push(`**针对你的问题（“${msg}”）：**`)

    if (hits.length) {
      parts.push(
        hits
          .map((h) => `- **${h.term}**：${h.short}${wantsWhy(msg) || wantsHowTo(msg) ? ` ${h.detail}` : ''}`)
          .join('\n'),
      )
    } else {
      parts.push(
        `结合选中内容「${selection.slice(0, 120)}${selection.length > 120 ? '…' : ''}」：把它当作产品概念——谁拥有、如何度量、失败时用户会怎样。`,
      )
    }

    if (wantsExamples(msg) && production) {
      parts.push(
        `**生产案例（${production.source}）：** ${production.whatHappened} **启示：** ${production.poLesson}`,
      )
    } else if (wantsExamples(msg)) {
      parts.push(
        '**例子：** 想象客服机器人回答退款政策——若无引用与升级路径，概率性答复会变成法律责任（Day 1 案例模式）。',
      )
    }

    if (wantsMetric(msg)) {
      parts.push(
        '**可盯的指标：** 错误答案率 / 有据回答率、升级率、任务完成率，以及与非 AI 基线对比的错误预算。',
      )
    }

    if (wantsHowTo(msg) || (!hits.length && !wantsExamples(msg) && !wantsMetric(msg))) {
      const move = lesson?.poMoves[0]
      parts.push(
        `**你可以现在做的：** ${move ?? '在 PRD 里写清：定义、负责人、成功指标、失败时用户看到什么。'}`,
      )
    }

    if (lesson && turn <= 2) {
      parts.push(`**课程锚点：** 第 ${lesson.day} 天 · ${lesson.title} — ${lesson.outcomes[0] ?? lesson.subtitle}`)
    }

    parts.push('还想继续的话，可以问「给我一个指标」「举个生产例子」或「产品负责人下一步做什么」。')
    return parts.join('\n\n')
  }

  parts.push(`**On your note (“${msg}”):**`)

  if (hits.length) {
    parts.push(
      hits
        .map(
          (h) =>
            `- **${h.term}**: ${h.short}${wantsWhy(msg) || wantsHowTo(msg) ? ` ${h.detail}` : ''}`,
        )
        .join('\n'),
    )
  } else {
    parts.push(
      `Tied to “${selection.slice(0, 140)}${selection.length > 140 ? '…' : ''}”: treat it as a product concept — who owns it, how you measure it, and what the user experiences when it fails.`,
    )
  }

  if (wantsExamples(msg) && production) {
    parts.push(
      `**Production example (${production.source}):** ${production.whatHappened} **PO lesson:** ${production.poLesson}`,
    )
  } else if (wantsExamples(msg)) {
    parts.push(
      '**Example:** A support bot answering refund policy without citations or escalation turns a probabilistic answer into a liability — the Day 1 Air Canada pattern.',
    )
  }

  if (wantsMetric(msg)) {
    parts.push(
      '**Metrics to watch:** wrong-answer rate / grounded-answer rate, escalation rate, task completion, and an error budget vs the non-AI baseline.',
    )
  }

  if (wantsHowTo(msg) || (!hits.length && !wantsExamples(msg) && !wantsMetric(msg))) {
    const move = lesson?.poMoves[0]
    parts.push(
      `**What you can do now:** ${move ?? 'Write it into a PRD as: definition, owner, success metric, and what the user sees on failure.'}`,
    )
  }

  if (lesson && turn <= 2) {
    parts.push(
      `**Lesson anchor:** Day ${lesson.day} · ${lesson.title} — ${lesson.outcomes[0] ?? lesson.subtitle}`,
    )
  }

  parts.push('Ask another follow-up anytime — e.g. “give me a metric”, “show a production case”, or “what should the PO do next?”')
  return parts.join('\n\n')
}

export async function explainSelection(input: {
  selectedText: string
  sourcePath?: string
  sourceLabel?: string
  history?: ChatMessage[]
  userMessage?: string
  lang?: Lang
}): Promise<{ content: string; model: string }> {
  const lang = input.lang ?? 'en'
  const settings = getApiSettings()
  const system =
    lang === 'zh'
      ? [
          '你是面向 AI 产品负责人（不是工程师）的 OWNLAB 导师。',
          '用生产案例、产品决策、指标与风险清晰讲解。',
          '像真实导师一样对话：直接回答用户的追问，不要重复整段初讲。',
          '除非被要求更长，否则保持简洁（80–180 字）。',
          '轻度使用 markdown，短段落与要点。',
          '请用中文回答。',
          input.sourceLabel ? `学习者当前在：${input.sourceLabel}。` : '',
          `用户选中的原文："""${input.selectedText}"""`,
        ]
          .filter(Boolean)
          .join(' ')
      : [
          'You are OWNLAB tutor for AI Product Owners (not engineers).',
          'Explain clearly with production examples, PO decisions, metrics, and risks.',
          'Chat like a real tutor: answer the user’s follow-up directly; do not repeat the full initial explanation.',
          'Keep answers concise (80-180 words) unless asked for more.',
          'Use markdown lightly with short paragraphs and bullets.',
          input.sourceLabel ? `Learner is on: ${input.sourceLabel}.` : '',
          `Selected text for context: """${input.selectedText}"""`,
        ]
          .filter(Boolean)
          .join(' ')

  // Local tutor path (no API key)
  if (!settings.apiKey) {
    // Brief pause so the UI typing indicator is visible before the typewriter starts.
    await new Promise((resolve) => window.setTimeout(resolve, input.userMessage?.trim() ? 450 : 320))
    if (input.userMessage?.trim()) {
      return {
        model: 'local-tutor',
        content: localTutorChat({
          selectedText: input.selectedText,
          sourcePath: input.sourcePath,
          sourceLabel: input.sourceLabel,
          userMessage: input.userMessage,
          history: input.history,
          lang,
        }),
      }
    }
    return {
      model: 'local-tutor',
      content: localTutorExplain(input.selectedText, input.sourcePath, lang),
    }
  }

  const promptUser =
    lang === 'zh'
      ? `请为 AI 产品负责人讲解这段选中内容：\n\n"""${input.selectedText}"""`
      : `Explain this selection for an AI Product Owner:\n\n"""${input.selectedText}"""`

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
  ]

  if (input.userMessage?.trim() && input.history?.length) {
    // Follow-up: send prior turns (already include first explain) + new question
    messages.push(...input.history)
    messages.push({ role: 'user', content: input.userMessage.trim() })
  } else if (input.userMessage?.trim()) {
    messages.push({ role: 'user', content: promptUser })
    messages.push({
      role: 'assistant',
      content:
        lang === 'zh'
          ? '好的，我已看过选中内容。请继续提问。'
          : 'Got it — I’ve read the selection. Ask your follow-up.',
    })
    messages.push({ role: 'user', content: input.userMessage.trim() })
  } else {
    messages.push({ role: 'user', content: promptUser })
  }

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.5,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`API error ${response.status}: ${errText.slice(0, 280)}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Empty model response')
  return { content, model: settings.model }
}
