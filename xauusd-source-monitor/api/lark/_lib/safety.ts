import type { Lang } from './types.js'

export type SafetyHit =
  | 'pii'
  | 'profanity'
  | 'political'
  | null

/**
 * Block requests that ask for personal data disclosure, use abuse language,
 * or drag the bot into politically sensitive topics.
 * Does NOT block normal risk ops (Fed rates, market policy, account_id in alerts).
 */
const PII_ASK_RE =
  /\b(ssn|passport|id\s*card|national\s*id|driver'?s?\s*license|home\s*address|residential\s*address|private\s*key|seed\s*phrase|mnemonic|bank\s*account|routing\s*number|credit\s*card|cvv|do[bx]|date\s*of\s*birth)\b|身份证|身分證|护照|護照|銀行卡|银行卡|信用卡|手机号|手機號|住址|家庭住址|私人密钥|私鑰|助记词|助記詞|查一下.*用户.*手机|查出.*客户.*姓名|泄露.*隐私|洩露.*隱私/i

const PROFANITY_RE =
  /\b(fuck|fucking|shit|bitch|asshole|cunt|motherfucker|dickhead|bastard)\b|傻逼|操你|草你|妈的|媽的|他妈的|他媽的|滚你|滾你|狗日|混蛋|白痴废物/i

/** Partisan / geopolitical / ideology — avoid monetary "policy" alone. */
const POLITICAL_RE =
  /\b(election|campaign\s*rally|political\s*party|impeach|coup|protest\s*crackdown|regime\s*change|separatis[mt]|independence\s*movement|geopolitic)\b|总统竞选|總統競選|政党斗争|政黨鬥爭|议会选举|議會選舉|颜色革命|顏色革命|台独|臺獨|港独|港獨|藏独|疆独|六四|法轮功|法輪功|政治敏感|颠覆国家|顛覆國家/i

export function detectSafetyViolation(text: string): SafetyHit {
  const t = text.trim()
  if (!t) return null
  if (PROFANITY_RE.test(t)) return 'profanity'
  if (POLITICAL_RE.test(t)) return 'political'
  if (PII_ASK_RE.test(t)) return 'pii'
  return null
}

/** Strip common curse words from model output (defense in depth). */
export function scrubOutgoing(text: string): string {
  return text
    .replace(PROFANITY_RE, '[…]')
    .replace(
      /\b(\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{16,19})\b/g,
      '[redacted]',
    )
}

export function safetyReply(lang: Lang, hit: Exclude<SafetyHit, null>): string {
  if (hit === 'profanity') {
    if (lang === 'zh-Hans') {
      return '请保持专业用语。我是 V Exchange 风险管理助手，可以帮你做行情与事故排查——请用正常措辞重新说明问题。'
    }
    if (lang === 'zh-Hant') {
      return '請保持專業用語。我是 V Exchange 風險管理助手，可以幫你做行情與事故排查——請用正常措辭重新說明問題。'
    }
    return 'Please keep a professional tone. I’m the V Exchange risk assistant — restate your market or incident question without abusive language.'
  }
  if (hit === 'political') {
    if (lang === 'zh-Hans') {
      return '我无法讨论政治敏感话题。我只协助 V Exchange 永续风险管理（行情、告警、排查与复盘）。请提出与风控相关的问题。'
    }
    if (lang === 'zh-Hant') {
      return '我無法討論政治敏感話題。我只協助 V Exchange 永續風險管理（行情、告警、排查與複盤）。請提出與風控相關的問題。'
    }
    return 'I can’t discuss politically sensitive topics. I only help with V Exchange perpetual risk (markets, alerts, investigation, review). Please ask a risk-ops question.'
  }
  // pii
  if (lang === 'zh-Hans') {
    return '我不会提供或套取个人隐私信息（证件、手机、住址、密钥等）。排查时可使用你已授权提供的告警字段；请勿要求泄露客户隐私。'
  }
  if (lang === 'zh-Hant') {
    return '我不會提供或套取個人隱私資訊（證件、手機、住址、密鑰等）。排查時可使用你已授權提供的告警欄位；請勿要求洩露客戶隱私。'
  }
  return 'I won’t reveal or solicit personal information (IDs, phones, addresses, keys, etc.). Use alert fields you’re authorized to share — don’t ask me to expose customer privacy.'
}

export const SAFETY_SYSTEM_RULES_EN = `Safety (non-negotiable):
- Do NOT reveal, invent, or solicit personal information (PII): legal names beyond what the user already pasted in an alert, phones, emails, home addresses, government IDs, bank cards, passwords, private keys.
- Do NOT use or repeat curse words / abusive language; stay professional.
- Do NOT discuss politically sensitive topics (partisan politics, elections, independence movements, ideology). Monetary/market "policy" (e.g. Fed rates) for XAUUSD risk is OK.
- If asked for any of the above, refuse briefly and redirect to V Exchange risk management.`

export const SAFETY_SYSTEM_RULES_ZH_HANS = `安全红线（必须遵守）：
- 不提供、不编造、不套取个人隐私（证件、手机、住址、银行卡、密码、私钥等）；仅可使用用户已在告警中提供的字段。
- 不使用也不复述脏话／辱骂；保持专业。
- 不讨论政治敏感话题（党派、选举、独立运动、意识形态等）。与 XAUUSD 风险相关的货币政策／利率可用。
- 若用户要求上述内容，简短拒绝并导回 V Exchange 风险管理。`

export const SAFETY_SYSTEM_RULES_ZH_HANT = `安全紅線（必須遵守）：
- 不提供、不編造、不套取個人隱私（證件、手機、住址、銀行卡、密碼、私鑰等）；僅可使用使用者已在告警中提供的欄位。
- 不使用也不複述髒話／辱罵；保持專業。
- 不討論政治敏感話題（黨派、選舉、獨立運動、意識形態等）。與 XAUUSD 風險相關的貨幣政策／利率可用。
- 若使用者要求上述內容，簡短拒絕並導回 V Exchange 風險管理。`
