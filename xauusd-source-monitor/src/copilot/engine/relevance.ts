import type { AppLang } from '../../i18n/messages'

/** In-scope tokens for V Exchange XAUUSD risk / Investigate. */
const SCOPE_RE =
  /xau|xauusd|xau_usd|gold|comex|gc=f|index|mark|funding|adl|liquidat|perp|swap|basis|bps|lp\b|mmr|强平|強平|指數|指数|標記|标记|資金費|资金费|告警|預警|预警|排查|根因|rca|skill|l1|l2|bybit|okx|bitget|binance|kitco|fed|fomc|源剔除|源恢复|源恢復|線性過渡|线性过渡|报价|報價|撮合|结算|結算|对账|對賬|仓位|倉位|永續|永续|風險|风险|threshold|deviation|briefing|ocr|alert|incident/i

/** Clearly off-topic patterns (gentle reject even if a short finance word slips in). */
const OFFTOPIC_RE =
  /^(hi|hello|hey|你好|哈咯|在吗|在嗎)\b|weather|recipe|cook|joke|poem|lyrics|homework|leetcode|bitcoin meme|恋|戀愛|星座|塔罗|塔羅|nba|足球比分|电影推荐|電影推薦|写一首|寫一首|ignore previous|system prompt/i

export type RelevanceResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'off_topic'; message: string }

export function assessRelevance(text: string, lang: AppLang = 'zh-Hant'): RelevanceResult {
  const raw = String(text || '').trim()
  const zh = lang === 'zh-Hant'
  if (!raw) return { ok: true } // empty handled elsewhere (facts required / screenshot ok)

  if (OFFTOPIC_RE.test(raw) && !SCOPE_RE.test(raw)) {
    return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
  }

  // Short chit-chat with no risk context
  if (raw.length < 12 && !SCOPE_RE.test(raw)) {
    return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
  }

  if (SCOPE_RE.test(raw)) return { ok: true }

  // Longer text without any scope signal — politely out of scope
  if (raw.length >= 12) {
    return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
  }

  return { ok: true }
}

export function gentleRejectMessage(zh: boolean): string {
  return zh
    ? [
        '抱歉，这个请求看起来不在 V Exchange 风险排查范围内。',
        '我只能协助 XAUUSD 永续相关的行情源／Mark／LP／强平／Funding／告警 RCA 等问题。',
        '请粘贴监控告警原文、截图事实或相关指标，我再继续帮你排查。',
      ].join('\n')
    : [
        'Sorry — that request looks outside the V Exchange risk-investigate scope.',
        'I can only help with XAUUSD perpetual topics: index/Mark sources, LPs, liquidation/ADL, funding, and alert RCA.',
        'Please paste a monitor alert, screenshot facts, or related metrics and I’ll continue.',
      ].join('\n')
}

/** True when follow-up is about the open RCA / risk scope (or clarifying it). */
export function assessFollowUpRelevance(
  question: string,
  activeFacts: string,
  lang: AppLang = 'zh-Hant',
): RelevanceResult {
  const q = String(question || '').trim()
  const zh = lang === 'zh-Hant'
  if (!q) return { ok: true }

  // Allow clarifying questions that reference the incident even without keywords
  if (
    /下一步|next step|为什么|為什麼|why|怎么|怎麼|how|严重|嚴重|severity|根因|path|skill|外网|外網|url|来源|來源|这个|這個|告警|刚才|剛才/i.test(
      q,
    ) &&
    activeFacts.trim()
  ) {
    return { ok: true }
  }

  const direct = assessRelevance(q, lang)
  if (direct.ok) return direct

  // If question tokens overlap incident facts, treat as on-topic
  const factHits = (activeFacts.toLowerCase().match(/[a-z0-9_\u4e00-\u9fff]{3,}/g) || [])
    .slice(0, 40)
  const ql = q.toLowerCase()
  if (factHits.some((t) => t.length >= 4 && ql.includes(t))) return { ok: true }

  return { ok: false, reason: 'off_topic', message: gentleRejectMessage(zh) }
}
