import type { Lang } from './types.js'

export type SafetyHit =
  | 'pii'
  | 'secret'
  | 'profanity'
  | 'political'
  | null

/**
 * Negative list only — politely refuse these; otherwise chat / help freely.
 * Does NOT block normal risk ops (Fed rates, market policy, account_id in alerts).
 */
const PII_ASK_RE =
  /\b(ssn|passport|id\s*card|national\s*id|driver'?s?\s*license|home\s*address|residential\s*address|private\s*key|seed\s*phrase|mnemonic|bank\s*account|routing\s*number|credit\s*card|cvv|do[bx]|date\s*of\s*birth)\b|身份证|身分證|护照|護照|銀行卡|银行卡|信用卡|手机号|手機號|住址|家庭住址|私人密钥|私鑰|助记词|助記詞|查一下.*用户.*手机|查出.*客户.*姓名|泄露.*隐私|洩露.*隱私|客户隐私|客戶隱私|个人隐私|個人隱私/i

/** Company / internal secrets — credentials, proprietary dumps, gated prod data asks. */
const SECRET_ASK_RE =
  /公司机密|公司機密|商业机密|商業機密|内部机密|內部機密|商业秘密|商業秘密|\btrade\s*secret\b|\bcompany\s*secret\b|生产密钥|生產密鑰|内部密码|內部密碼|后台密码|後台密碼|\bprod(uction)?\s*(password|secret|credential|api\s*key)\b|\bdump\s+(the\s+)?(secrets?|credentials?|api\s*keys?)\b|泄露.*机密|洩露.*機密|把.*密钥.*发给我|把.*密鑰.*發給我|给我.*api\s*key|給我.*api\s*key|导出.*全量.*用户|導出.*全量.*用戶/i

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
  if (SECRET_ASK_RE.test(t)) return 'secret'
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

/** Polite refusals — negative list only; never scold. */
export function safetyReply(lang: Lang, hit: Exclude<SafetyHit, null>): string {
  if (hit === 'profanity') {
    if (lang === 'zh-Hans') {
      return '哎，咱们还是好好说话～ 🙂 我可以陪你聊天，也可以帮你看行情／告警——换个正常措辞就行。'
    }
    if (lang === 'zh-Hant') {
      return '哎，咱們還是好好說話～ 🙂 我可以陪你聊天，也可以幫你看行情／告警——換個正常措辭就行。'
    }
    return 'Hey, let’s keep it friendly 🙂 I’m happy to chat, or help with markets / alerts — just rephrase without the abuse.'
  }
  if (hit === 'political') {
    if (lang === 'zh-Hans') {
      return '抱歉，政治敏感话题我这边不太方便聊。换点别的吧——闲聊、行情或风控问题我都在 🙂'
    }
    if (lang === 'zh-Hant') {
      return '抱歉，政治敏感話題我這邊不太方便聊。換點別的吧——閒聊、行情或風控問題我都在 🙂'
    }
    return 'Sorry — I need to skip politically sensitive topics. Happy to chat about something else, or help with markets / risk 🙂'
  }
  if (hit === 'secret') {
    if (lang === 'zh-Hans') {
      return '抱歉，公司机密／内部凭证这类我不能提供或协助获取。需要开通权限请找 **@Yan Haixiang**。其他话题我都可以聊 🙂'
    }
    if (lang === 'zh-Hant') {
      return '抱歉，公司機密／內部憑證這類我不能提供或協助取得。需要開通權限請找 **@Yan Haixiang**。其他話題我都可以聊 🙂'
    }
    return 'Sorry — I can’t share or help obtain company secrets / internal credentials. For access, contact **@Yan Haixiang**. Happy to chat about anything else 🙂'
  }
  // pii
  if (lang === 'zh-Hans') {
    return '抱歉，个人隐私（证件、手机、住址、密钥等）我不能查也不能提供。排查时用你已授权的告警字段就好。想聊别的或看行情，随时说 🙂'
  }
  if (lang === 'zh-Hant') {
    return '抱歉，個人隱私（證件、手機、住址、密鑰等）我不能查也不能提供。排查時用你已授權的告警欄位就好。想聊別的或看行情，隨時說 🙂'
  }
  return 'Sorry — I can’t look up or share personal privacy (IDs, phones, addresses, keys, etc.). Use alert fields you’re authorized to share. Happy to chat or help with markets otherwise 🙂'
}

export const SAFETY_SYSTEM_RULES_EN = `Negative list (polite refuse only these; otherwise chat and help freely):
- Personal privacy (PII): do not reveal, invent, or solicit IDs, phones, home addresses, bank cards, passwords, private keys beyond what the user already pasted in an alert.
- Company secrets: do not reveal or help obtain internal credentials, proprietary dumps, production secrets, or gated company confidential data. Point access requests to @Yan Haixiang.
- Abuse / profanity: do not use or repeat curse words; ask politely to rephrase.
- Politically sensitive topics (partisan politics, elections, independence movements, ideology). Monetary/market "policy" (e.g. Fed rates) for XAUUSD risk is OK.
- For anything else — including casual chat, banter, food, movies, exchanges, product Q&A — engage warmly. Specialty is V Exchange risk, but you are also a friendly teammate who chats.`

export const SAFETY_SYSTEM_RULES_ZH_HANS = `负面清单（仅对这些客气拒绝；其余一律接受并陪聊／帮忙）：
- 个人隐私：不提供、不编造、不套取证件／手机／住址／银行卡／密码／私钥等；仅可使用用户已在告警中提供的字段。
- 公司机密：不提供、不协助获取内部凭证、生产密钥、专有机密数据；需要权限时请联系 @Yan Haixiang。
- 辱骂／脏话：不使用也不复述；客气请对方换个说法。
- 政治敏感（党派、选举、独立运动、意识形态等）。与 XAUUSD 风险相关的货币政策／利率可用。
- 其他一律接受——闲聊、玩笑、吃饭、电影、交易所、产品问答都可以。专长是 V Exchange 风控，但也是会陪聊的值班同事。`

export const SAFETY_SYSTEM_RULES_ZH_HANT = `負面清單（僅對這些客氣拒絕；其餘一律接受並陪聊／幫忙）：
- 個人隱私：不提供、不編造、不套取證件／手機／住址／銀行卡／密碼／私鑰等；僅可使用使用者已在告警中提供的欄位。
- 公司機密：不提供、不協助取得內部憑證、生產密鑰、專有機密資料；需要權限時請聯繫 @Yan Haixiang。
- 辱罵／髒話：不使用也不複述；客氣請對方換個說法。
- 政治敏感（黨派、選舉、獨立運動、意識形態等）。與 XAUUSD 風險相關的貨幣政策／利率可用。
- 其他一律接受——閒聊、玩笑、吃飯、電影、交易所、產品問答都可以。專長是 V Exchange 風控，但也是會陪聊的值班同事。`
