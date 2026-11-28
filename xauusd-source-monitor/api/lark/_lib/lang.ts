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
  ['帳', '帐'],
  ['戶', '户'],
  ['強', '强'],
  ['複', '复'],
  ['歸', '归'],
  ['檔', '档'],
  ['調', '调'],
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
  // Command / desk keywords (short EN/ZH triggers)
  ['幫', '帮'],
  ['況', '况'],
  ['結', '结'],
  ['庫', '库'],
  ['場', '场'],
  ['識', '识'],
  ['盪', '荡'],
  ['預', '预'],
  ['優', '优'],
  ['參', '参'],
  ['週', '周'],
  ['飛', '飞'],
  ['書', '书'],
  ['單', '单'],
  ['無', '无'],
  ['啟', '启'],
  ['動', '动'],
  ['該', '该'],
  ['嗎', '吗'],
  ['問', '问'],
  ['題', '题'],
  ['號', '号'],
  ['長', '长'],
  ['兒', '儿'],
  ['裏', '里'],
  ['邊', '边'],
  ['點', '点'],
  ['幾', '几'],
  ['會', '会'],
  ['見', '见'],
  ['話', '话'],
  ['經', '经'],
  ['達', '达'],
  ['遠', '远'],
  ['選', '选'],
  ['擇', '择'],
  ['靜', '静'],
  ['頻', '频'],
  ['變', '变'],
  ['換', '换'],
  ['傳', '传'],
  ['輸', '输'],
  ['載', '载'],
  ['頁', '页'],
  ['覽', '览'],
  ['讀', '读'],
  ['寫', '写'],
  ['刪', '删'],
  ['線', '线'],
  ['網', '网'],
  ['電', '电'],
  ['訊', '讯'],
  ['費', '费'],
  ['離', '离'],
  ['備', '备'],
  ['註', '注'],
  ['釋', '释'],
  ['義', '义'],
  ['議', '议'],
  ['論', '论'],
  ['護', '护'],
  ['維', '维'],
  ['運', '运'],
  ['營', '营'],
  ['團', '团'],
  ['隊', '队'],
  ['員', '员'],
  ['瀏', '浏'],
  ['鍵', '键'],
  ['詞', '词'],
  ['細', '细'],
  ['節', '节'],
  ['導', '导'],
  ['聯', '联'],
  ['絡', '络'],
  ['勁', '劲'],
  ['張', '张'],
  ['兩', '两'],
  ['並', '并'],
  ['從', '从'],
  ['當', '当'],
  ['麼', '么'],
]

const HANT_ONLY = new Set(PAIRS.map(([t]) => t).join(''))
const HANS_ONLY = new Set(PAIRS.map(([, s]) => s).join(''))

/** English share / file card noise — must not flip an established Chinese session. */
export function looksLikeShareOrFileMeta(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  // Bare archive commands are not share meta (otherwise "done" sticks on ZH forever).
  if (/^(done|reset)\s*$/i.test(t)) return false
  if (/^\[(file|share|docx|wiki|image)/i.test(t)) return true
  if (
    /(share_chat|file attachment|Project Progress|Blockers|Weekly Meeting|周会|週會|WC &|Pricing:|can view)/i.test(
      t,
    )
  ) {
    return true
  }
  // ALL-CAPS DONE as a section label only appears inside longer share cards
  return t.length >= 16 && /\bDONE\b/.test(t)
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
    const softAck =
      /^(ok|okay|k|thanks?|thx|ty|got it|same|yes|no|yep|nope)[\s!.]*$/i.test(t)
    // Keep Chinese only for share/file meta noise and soft acks — NOT for
    // English keyword commands (market / help / investigate / …) which must
    // switch reply language to match the trigger language.
    if (zhFallback && (looksLikeShareOrFileMeta(t) || softAck)) {
      return fallback
    }
    // Pure Latin (no Han) → English, including short commands under a ZH session
    if (han === 0) return 'en'
    if (!zhFallback) return 'en'
    // Mixed latin + sparse Han while Chinese preferred → keep Chinese
    return fallback
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
