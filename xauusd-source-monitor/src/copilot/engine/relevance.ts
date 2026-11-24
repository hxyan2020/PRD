import type { AppLang } from '../../i18n/messages'

/** In-scope tokens for V Exchange XAUUSD risk / Investigate. */
const SCOPE_RE =
  /xau|xauusd|xau_usd|gold|comex|gc=f|index|mark|funding|adl|liquidat|perp|swap|basis|bps|lp\b|mmr|强平|強平|指數|指数|標記|标记|資金費|资金费|告警|預警|预警|排查|根因|rca|skill|l1|l2|bybit|okx|bitget|binance|kitco|fed|fomc|源剔除|源恢复|源恢復|線性過渡|线性过渡|报价|報價|撮合|结算|結算|对账|對賬|仓位|倉位|永續|永续|風險|风险|threshold|deviation|briefing|ocr|alert|incident|知识库|知識庫|技能|指令|help\b|capability|capabilities/i

/** Clearly off-topic patterns (gentle reject even if a short finance word slips in). */
const OFFTOPIC_RE =
  /weather|recipe|cook|joke|poem|lyrics|homework|leetcode|bitcoin meme|恋|戀愛|星座|塔罗|塔羅|nba|足球比分|电影推荐|電影推薦|写一首|寫一首|ignore previous|system prompt/i

/** Bare hello / hi only — not capability or risk questions. */
const BARE_GREETING_RE =
  /^(hi|hello|hey|yo|哈喽|哈囉|你好|您好|在吗|在嗎|早|早上好|下午好|晚上好|嗨)[\s!！.。？?]*$/i

/**
 * Meta questions about what this copilot has / can do.
 * These must get a real answer — never a recycled greeting.
 */
const CAPABILITY_RE =
  /知识库|知識庫|skill\s*库|skill\s*庫|技能库|技能庫|技能表|你会什么|你會什麼|你能做什么|你能做什麼|你可以做什么|你可以做什麼|有什么功能|有什麼功能|怎么用|怎麼用|如何使用|完整指令|^help$|^\/help$|commands?|what can you do|do you have (a )?(knowledge|skill)|knowledge base|skill (base|library|catalog)|capabilities/i

export type ThreadIntent = 'same_topic' | 'new_topic'

export type RelevanceResult =
  | {
      ok: true
      mode?: 'normal' | 'capability' | 'greeting'
      /** Present on follow-ups: continuing the open RCA vs starting a different alert/topic. */
      thread?: ThreadIntent
    }
  | { ok: false; reason: 'empty' | 'off_topic'; message: string }

/** Explicit “this is a different alert / new thread” cues. */
const NEW_TOPIC_CUE_RE =
  /另一个告警|另一個告警|另外一条|另外一條|另外一个|另外一個|新的告警|新告警|新的事件|新事件|换一个告警|換一個告警|换条告警|換條告警|重新排查|新开|新開|不是刚才|不是剛才|无关的告警|無關的告警|different alert|another alert|new alert|separate incident|unrelated alert|new (rca|incident|case)/i

/** Clarifying / continuing the open RCA. */
const SAME_TOPIC_CUE_RE =
  /下一步|next step|为什么|為什麼|why\b|怎么查|怎麼查|怎么做|怎麼做|how\b|严重|嚴重|severity|根因|path|skill|外网|外網|url|来源|來源|这个告警|這個告警|这条|這條|刚才|剛才|同一|继续|繼續|补充|補充|再解释|再解釋|还是那个|還是那個|命中|匹配|证据|證據|建议|建議/i

/** Looks like a pasted monitor/Lark alert block. */
const ALERT_PASTE_RE =
  /【[^】]*告警[^】]*】|触发时间|觸發時間|当前剔除|當前剔除|当前恢复|當前恢復|线性过渡|線性過渡|trigger(?:ed)?(?:\s*time)?[：:]|BYBIT_INDEX|OKX_INDEX|BINANCE_INDEX/i

export function continueAskingFooter(lang: AppLang = 'zh-Hant'): string {
  return lang === 'en'
    ? 'If anything is unclear, keep asking on this RCA (next step, why a Skill matched, which evidence to check). Starting a different alert? Say “new alert” or run a fresh Investigate.'
    : '有不清楚的地方可以继续追问（下一步、为什么命中某 Skill、要核对哪条证据）。若要查另一条告警，请说明「新告警」或新开一次排查。'
}

export function newTopicAckMessage(lang: AppLang = 'zh-Hant'): string {
  return lang === 'en'
    ? [
        'This looks like a new alert / new topic — not a follow-up on the open RCA.',
        'To investigate the new alert: clear or start a new incident, paste the new facts, then Run investigation once.',
        'If you meant the current RCA, say so (e.g. “still the previous one”) or name the Skill / root-cause line.',
        continueAskingFooter('en'),
      ].join('\n')
    : [
        '看起来你在开一个新话题／新告警，而不是追问当前这条 RCA。',
        '要排查新告警：清空或新建事故，把新告警贴进事实框，再点一次「执行排查」即可。',
        '若其实还是问当前这条，请补一句「还是刚才那个」或点出具体 Skill／根因。',
        continueAskingFooter('zh-Hant'),
      ].join('\n')
}

const WEAK_FACT_TOKEN_RE =
  /^(20\d{2}|\d{3,}|触发时间|觸發時間|内容|內容|指数|指數|告警|预警|預警|window|price|current)$/i

function meaningfulTokens(text: string): string[] {
  return [
    ...new Set(
      (String(text || '').toLowerCase().match(/[a-z0-9_\u4e00-\u9fff]{3,}/g) || []).filter(
        (t) => t.length >= 3 && !WEAK_FACT_TOKEN_RE.test(t),
      ),
    ),
  ]
}

/** Token overlap between follow-up text and the open incident facts (0–1). */
export function factOverlapRatio(question: string, activeFacts: string): number {
  const qTokens = new Set(meaningfulTokens(question))
  const fTokens = meaningfulTokens(activeFacts).slice(0, 80)
  if (!qTokens.size || !fTokens.length) return 0
  let hits = 0
  for (const t of fTokens) {
    if (qTokens.has(t)) hits += 1
  }
  return hits / Math.min(fTokens.length, 24)
}

/**
 * Decide whether a follow-up continues the open RCA or starts a different alert/topic.
 * Capability / greeting / off-topic are handled by assessFollowUpRelevance first.
 */
export function classifyThreadIntent(
  question: string,
  activeFacts: string,
): ThreadIntent {
  const q = String(question || '').trim()
  const facts = String(activeFacts || '').trim()
  if (!q || !facts) return 'same_topic'

  if (NEW_TOPIC_CUE_RE.test(q)) return 'new_topic'
  if (SAME_TOPIC_CUE_RE.test(q)) return 'same_topic'

  const overlap = factOverlapRatio(q, facts)
  const alertLike = ALERT_PASTE_RE.test(q) && q.length >= 40
  // Long new alert paste with little overlap → new topic
  if (alertLike && overlap < 0.18) return 'new_topic'
  // Shared entities / wording with the open incident → same thread
  if (overlap >= 0.12) return 'same_topic'
  // Short clarifying questions default to same topic when an RCA is open
  if (q.length < 48) return 'same_topic'
  // Longer in-scope text that doesn't touch the open facts → treat as new topic
  if (SCOPE_RE.test(q) && overlap < 0.08) return 'new_topic'
  return 'same_topic'
}

export function isCapabilityQuestion(text: string): boolean {
  return CAPABILITY_RE.test(String(text || '').trim())
}

export function isBareGreeting(text: string): boolean {
  const raw = String(text || '').trim()
  if (!raw || CAPABILITY_RE.test(raw) || SCOPE_RE.test(raw)) return false
  return BARE_GREETING_RE.test(raw)
}

/** Natural answers — different shape for KB vs skills vs general help. */
export function capabilityAnswer(text: string, lang: AppLang = 'zh-Hant'): string {
  const raw = String(text || '').trim()
  const zh = lang !== 'en'
  const aboutKb = /知识库|知識庫|knowledge/i.test(raw)
  const aboutSkills = /skill|技能/i.test(raw)

  if (zh && aboutKb && !aboutSkills) {
    return [
      '有的。Investigate 里挂着一棵可编辑的知识树（默认含业务范围、指数/Mark、RCA 规范等），分析告警时会做 RAG 检索。',
      '它不是闲聊百科——主要用来对齐排查口径。你可以直接贴一条深度/指数/Mark 告警，我按知识 + L1/L2 skill 往下拆。',
      '想看目录：打开 Knowledge 页；完整指令也可以说 `help`。',
    ].join('\n')
  }
  if (!zh && aboutKb && !aboutSkills) {
    return [
      'Yes — Investigate keeps an editable knowledge tree (scope, index/Mark notes, RCA norms, etc.) and retrieves from it during analysis.',
      'It’s for risk grounding, not small talk. Paste a depth / index / Mark alert and I’ll use KB + L1/L2 skills on it.',
      'Browse it under Knowledge, or say `help` for the short command list.',
    ].join('\n')
  }
  if (zh && aboutSkills) {
    return [
      '有。L1 是单点指标 skill（Mark / 指数源 / 深度 / 强平等），L2 是串联排查链；都能在 Skills 页增改、停用。',
      '匹配不上时我会先标明 skill gap，再给未验证的可能路径——不会假装命中。',
      '丢一条告警原文或截图过来就行；`help` 可看常用指令。',
    ].join('\n')
  }
  if (!zh && aboutSkills) {
    return [
      'Yes. L1 skills cover single indicators (Mark / index / depth / liquidation, …); L2 skills chain them. Edit or disable them on the Skills page.',
      'If nothing matches I’ll say so (skill gap) before offering unverified paths — I won’t fake a hit.',
      'Paste an alert (or screenshot). Say `help` for the short command list.',
    ].join('\n')
  }

  return zh
    ? [
        '我是 V Exchange Risk Copilot——偏排查，不闲聊。',
        '常帮你：看 Mark / 指数 / LP / 深度 / 强平告警，按 L1·L2 skill + 知识库顺着证据拆，也能做事故复盘追问。',
        '直接贴告警原文、截图或表格就行。',
        '常用：`help` 看指令 · Skills / Knowledge 页管库 · 有活跃 RCA 时可继续追问「下一步 / 为什么」。',
      ].join('\n')
    : [
        'I’m V Exchange Risk Copilot — investigation, not small talk.',
        'I help with Mark / index / LP / depth / liquidation alerts: match L1·L2 skills + knowledge, walk the evidence, and follow up on open RCAs.',
        'Paste alert text, a screenshot, or a table.',
        'Handy: `help` for commands · Skills / Knowledge pages to manage the libraries · on an open RCA ask “next step / why”.',
      ].join('\n')
}

/** One warm hello — only for bare greetings, never reused for meta questions. */
export function greetingAnswer(lang: AppLang = 'zh-Hant'): string {
  const zh = lang !== 'en'
  return zh
    ? '在的。盯市况、拆告警、顺着证据排查或复盘都可以——把你在看的告警丢过来；要指令清单说 `help`。'
    : 'Hey — I’m here for market checks, alert RCA, and incident follow-ups. Drop what you’re looking at, or say `help` for commands.'
}

export function assessRelevance(text: string, lang: AppLang = 'zh-Hant'): RelevanceResult {
  const raw = String(text || '').trim()
  const zh = lang !== 'en'
  if (!raw) return { ok: true, mode: 'normal' }

  if (isCapabilityQuestion(raw)) return { ok: true, mode: 'capability' }
  if (isBareGreeting(raw)) return { ok: true, mode: 'greeting' }

  if (OFFTOPIC_RE.test(raw) && !SCOPE_RE.test(raw)) {
    return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
  }

  // Short chit-chat with no risk context
  if (raw.length < 12 && !SCOPE_RE.test(raw)) {
    return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
  }

  if (SCOPE_RE.test(raw)) return { ok: true, mode: 'normal' }

  // Longer text without any scope signal — politely out of scope
  if (raw.length >= 12) {
    return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
  }

  return { ok: true, mode: 'normal' }
}

export function gentleRejectMessage(zh: boolean): string {
  return zh
    ? [
        '这条更像闲聊或题外话，我这边接不住。',
        '我擅长 XAUUSD 永续相关的指数／Mark／LP／深度／强平／Funding／告警 RCA。',
        '贴监控原文或截图事实，我接着排查；问能力/知识库/skill 也可以直接问，或说 `help`。',
      ].join('\n')
    : [
        'That looks outside risk-investigate scope.',
        'I help with XAUUSD perp topics: index/Mark, LPs, depth, liquidation/ADL, funding, and alert RCA.',
        'Paste a monitor alert or screenshot facts — or ask about the knowledge/skill libraries, or say `help`.',
      ].join('\n')
}

/** True when follow-up is about the open RCA / risk scope (or clarifying it). */
export function assessFollowUpRelevance(
  question: string,
  activeFacts: string,
  lang: AppLang = 'zh-Hant',
): RelevanceResult {
  const q = String(question || '').trim()
  if (!q) return { ok: true, mode: 'normal', thread: 'same_topic' }

  if (isCapabilityQuestion(q)) return { ok: true, mode: 'capability' }
  if (isBareGreeting(q)) return { ok: true, mode: 'greeting' }

  // Allow clarifying questions that reference the incident even without keywords
  if (SAME_TOPIC_CUE_RE.test(q) && activeFacts.trim()) {
    return { ok: true, mode: 'normal', thread: 'same_topic' }
  }

  const direct = assessRelevance(q, lang)
  if (!direct.ok) {
    // If question tokens overlap incident facts, treat as on-topic follow-up
    const factHits = (activeFacts.toLowerCase().match(/[a-z0-9_\u4e00-\u9fff]{3,}/g) || []).slice(
      0,
      40,
    )
    const ql = q.toLowerCase()
    if (factHits.some((t) => t.length >= 4 && ql.includes(t))) {
      return { ok: true, mode: 'normal', thread: 'same_topic' }
    }
    return direct
  }

  const thread = classifyThreadIntent(q, activeFacts)
  return { ok: true, mode: direct.mode || 'normal', thread }
}
