import type { Lang } from './types.js'

/**
 * Paired Traditional/Simplified characters common in risk-ops + everyday Chinese.
 * Score: +1 traditional side, +1 simplified side.
 */
const PAIRS: [string, string][] = [
  ['專', '专'],
  ['國', '国'],
  ['語', '语'],
  ['風', '风'],
  ['險', '险'],
  ['報', '报'],
  ['對', '对'],
  ['開', '开'],
  ['關', '关'],
  ['盤', '盘'],
  ['價', '价'],
  ['異', '异'],
  ['態', '态'],
  ['檢', '检'],
  ['查', '查'],
  ['據', '据'],
  ['記', '记'],
  ['錄', '录'],
  ['時', '时'],
  ['間', '间'],
  ['實', '实'],
  ['際', '际'],
  ['為', '为'],
  ['過', '过'],
  ['個', '个'],
  ['與', '与'],
  ['這', '这'],
  ['來', '来'],
  ['後', '后'],
  ['們', '们'],
  ['說', '说'],
  ['請', '请'],
  ['還', '还'],
  ['現', '现'],
  ['務', '务'],
  ['產', '产'],
  ['資', '资'],
  ['幣', '币'],
  ['準', '准'],
  ['層', '层'],
  ['級', '级'],
  ['應', '应'],
  ['計', '计'],
  ['數', '数'],
  ['證', '证'],
  ['據', '据'],
  ['驗', '验'],
  ['進', '进'],
  ['閉', '闭'],
  ['處', '处'],
  ['匯', '汇'],
  ['總', '总'],
  ['黃', '黄'],
  ['麼', '么'],
  ['樣', '样'],
  ['東', '东'],
  ['區', '区'],
  ['萬', '万'],
  ['業', '业'],
  ['監', '监'],
  ['測', '测'],
  ['幣', '币'],
  ['帳', '帐'],
  ['戶', '户'],
  ['強', '强'],
  ['平', '平'],
  ['複', '复'],
  ['盤', '盘'],
  ['歸', '归'],
  ['檔', '档'],
  ['報', '报'],
  ['告', '告'],
  ['調', '调'],
  ['查', '查'],
  ['排', '排'],
  ['趨', '趋'],
  ['勢', '势'],
  ['發', '发'],
  ['確', '确'],
  ['認', '认'],
  ['標', '标'],
  ['嚴', '严'],
  ['鏈', '链'],
  ['權', '权'],
  ['簽', '签'],
  ['審', '审'],
  ['處', '处'],
  ['理', '理'],
]

const HANT_ONLY = new Set(PAIRS.map(([t]) => t).join(''))
const HANS_ONLY = new Set(PAIRS.map(([, s]) => s).join(''))

/** English share / file card noise — must not flip an established Chinese session. */
export function looksLikeShareOrFileMeta(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^\[(file|share|docx|wiki|image)/i.test(t)) return true
  return /(share_chat|file attachment|Project Progress|Blockers|\bDONE\b|Weekly Meeting|周会|週會|WC &|Pricing:|can view)/i.test(
    t,
  )
}

function pickZhVariant(text: string, fallback: Lang): Lang {
  let hant = 0
  let hans = 0
  for (const ch of text) {
    if (HANT_ONLY.has(ch)) hant += 1
    if (HANS_ONLY.has(ch)) hans += 1
  }
  if (hant > hans) return 'zh-Hant'
  if (hans > hant) return 'zh-Hans'
  if (fallback === 'zh-Hant' || fallback === 'zh-Hans') return fallback
  // Ambiguous Chinese → Simplified (mainland / quote-ops default)
  return 'zh-Hans'
}

/**
 * Detect reply language from the user's latest message.
 * Empty text keeps `fallback` (session preference).
 * Chinese wins over English share titles / mixed doc cards; English-only share meta
 * does not override an established Chinese preference.
 */
export function detectLang(text: string, fallback: Lang = 'en'): Lang {
  const t = text.trim()
  if (!t) return fallback

  const han = (t.match(/[\u4e00-\u9fff]/g) || []).length
  const latin = (t.match(/[A-Za-z]/g) || []).length

  if (/^(english|en)\b/i.test(t) && han === 0) return 'en'
  if (/^(中文|简体|簡體)\b/.test(t)) return 'zh-Hans'
  if (/^(繁體|繁体)\b/.test(t)) return 'zh-Hant'

  // Any real Chinese in the message → reply in Chinese (even if the share card is English-heavy)
  if (han >= 2) return pickZhVariant(t, fallback)
  if (han === 1 && latin <= 8) return pickZhVariant(t, fallback)

  // English-only (or latin-dominant with fewer than 2 Han)
  if (latin > 0) {
    const zhFallback = fallback === 'zh-Hans' || fallback === 'zh-Hant'
    // Keep Chinese session across doc shares / short English acks / file hints
    if (
      zhFallback &&
      (looksLikeShareOrFileMeta(t) ||
        t.length <= 48 ||
        /^(ok|okay|k|thanks?|thx|ty|got it|same|yes|no|yep|nope)[\s!.]*$/i.test(t))
    ) {
      return fallback
    }
    // Explicit English sentence while session was Chinese — switch only when clearly English prose
    if (zhFallback && han === 0 && latin >= 24 && /\s/.test(t)) return 'en'
    if (!zhFallback) return 'en'
    // Short / ambiguous latin while Chinese preferred → keep Chinese
    if (zhFallback) return fallback
    return 'en'
  }

  return fallback
}

export function isZh(lang: Lang): boolean {
  return lang === 'zh-Hans' || lang === 'zh-Hant'
}

/** LLM instruction: always mirror the user's language. */
export function languageInstruction(lang: Lang): string {
  switch (lang) {
    case 'zh-Hans':
      return '必须使用简体中文回复用户（友好、专业）。不要切换到英文或繁体，除非用户明确要求。'
    case 'zh-Hant':
      return '必須使用繁體中文回覆使用者（友好、專業）。不要切換到英文或簡體，除非使用者明確要求。'
    default:
      return 'You MUST reply in English (friendly, professional). Do not switch to Chinese unless the user explicitly asks.'
  }
}

export function langLabel(lang: Lang): string {
  switch (lang) {
    case 'zh-Hans':
      return '简体中文'
    case 'zh-Hant':
      return '繁體中文'
    default:
      return 'English'
  }
}
