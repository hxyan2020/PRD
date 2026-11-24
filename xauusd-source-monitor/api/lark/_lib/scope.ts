import { detectSafetyViolation } from './safety.js'
import type { Intent, Lang } from './types.js'

export { detectLang, isZh } from './lang.js'

const MARKET_RE =
  /行情|趋势|趨勢|市况|市況|\bmarket\b|\btrends?\b|\bgold\b|\bxau\b|\bxauusd\b|黄金|黃金|\bdxy\b|美元|波动|波動|基差|\bbps\b|溢价|溢價|折价|折價|\bokx\b|\bbinance\b|\bbybit\b|\bkraken\b|\bkitco\b|\bspot\b|k线|k線|\bcandles?\b/i

const INVESTIGATE_RE =
  /排查|调查|調查|告警|报警|報警|\bincident\b|\balerts?\b|\binvestigate\b|\brca\b|根因|强平|強平|\badl\b|指数源|指數源|\bmarks?\b|\bindex\b|\blp\b|对冲|對沖|拒单|拒單|盘口|盤口|偏差|剔除|无有效源|無有效源|失败|失敗|异常|異常|截图|截圖|表格|\btable\b|\breports?\b|报告|報告/i

/** Mid-text review cues — avoid bare "alert" (collides with investigate alert paste). */
const REVIEW_RE =
  /复盘|複盤|\breview\b|\barchive\b|归档|歸檔|事故清单|事故清單|\bincidents\b|定期回顾|定期回顧|\bdashboard\b|看板|仪表盘|儀表盤|告警清单|告警清單|报告看板|報告看板/i

const HELP_RE = /^(help|帮助|幫助|\?|start|开始|開始)\s*$/i

/** Natural hellos / soft openers — not the full help dump. */
const GREETING_RE =
  /^(hi|hii+|hello|hey+|yo|howdy|sup|good\s*(morning|afternoon|evening)|morning|afternoon|evening|你好[呀啊吗嗎嘛~！!。.]?|您好[呀啊~！!。.]?|哈喽|哈囉|嗨+|早晚安|早上好|下午好|晚上好|早安|午安|晚安|在吗|在嗎|在不在|有人吗|有人嗎)\s*[!.。！？~]*\s*$/i

/** Soft acks after @ — never treat real questions as greetings. */
const SOFT_ACK_RE =
  /^(ok|okay|k|thanks?|thx|ty|好的?|嗯+|哦+|噢+|收到|谢谢|謝謝|了解|知道了|辛苦了|可以)\s*[!.。！~]*\s*$/i

/** Bot / UAT / admin meta questions — always answer, never greet. */
const BOT_META_RE =
  /管理员|管理員|谁负责|誰負責|负责人|負責人|报给谁|報給誰|联系谁|聯繫誰|找谁|找誰|\buat\b|\badmin\b|\bowner\b|谁维护|誰維護|客服|支持|支持人|对接人|對接人/i

/**
 * Desk product FAQ: roles / who can edit Skills or knowledge.
 * Must NOT fall through to investigate-style Skills+severity dumps or random KB excerpts.
 */
const DESK_FAQ_RE =
  /(一般用户|普通用户|一般用戶|普通用戶|普通账号|普通帳號|一般账号|一般帳號|\bops\b|\banalyst\b|非管理员|非管理員).{0,24}(编辑|編輯|修改|更改|改|写|寫|创建|刪除).{0,24}(知识库|知識庫|skills?|技能|rag|记忆|記憶)|(编辑|編輯|修改|更改|改|写|寫).{0,16}(知识库|知識庫|skills?|技能).{0,16}(权限|權限|吗|嗎|可以|能不能|能否|？|\?)|(谁|誰|who).{0,16}(能|可以|可).{0,8}(编辑|編輯|更改|改|写|寫).{0,16}(知识库|知識庫|skills?|技能)|(只有|仅有|僅有|就我|只有我|仅我|僅我|就只有).{0,16}(能|可以|可).{0,10}(编辑|編輯|更改|修改|改|写|寫).{0,16}(知识库|知識庫|skills?|技能)|(确定|確定|是不是|对吗|對嗎|真的|sure).{0,24}(编辑|編輯|更改|修改|改|写|寫).{0,16}(知识库|知識庫|skills?|技能)|(知识库|知識庫|skills?).{0,16}(谁|誰).{0,10}(编辑|編輯|更改|改|写|寫)|only\s+admin.{0,24}(edit|write|change).{0,24}(knowledge|skills?)|can\s+only\s+i\s+(edit|write|change).{0,24}(knowledge|skills?|kb)|only\s+i\s+can\s+(edit|write|change).{0,24}(knowledge|skills?|kb)|can\s+(a\s+)?(general|normal|regular|ops|analyst)\s*(user)?s?\s+(edit|write|change).{0,24}(knowledge|skills?|kb)|who\s+can\s+(edit|write|change).{0,24}(knowledge|skills?|kb)|(知识库|知識庫|skills?).{0,12}(只读|只讀|readonly|read-?only|权限|權限)/i

/** Alert / incident evidence — OK to attach Skills retrieval + severity. */
const INCIDENT_EVIDENCE_RE =
  /告警|报警|報警|\balert\b|\bincident\b|\brca\b|排查|强平|強平|\badl\b|指数源|指數源|\bmarks?\b|\bindex\b|偏差|剔除|无有效源|無有效源|\bbps\b|失败|失敗|异常|異常|截图|截圖|\bseverity\b|P[0-3]\b/i

/**
 * User asks the bot to reach something it cannot (admin/DB/prod/secrets/writes).
 * Action-ish verbs + protected resource — avoid matching alert paste that merely mentions admin.
 */
const ACCESS_NEEDED_RE =
  /(帮我|請|请|帮忙|麻煩|麻烦)?\s*(查一下|查下|查询|查詢|看看|打开|打開|登录|登入|拉取|调取|調取|访问|訪問|进入|進入|连上|連上).{0,16}(后台|後台|管理台|admin\s*console|\badmin\b|数据库|資料庫|\bdb\b|生产环境|生產環境|生产库|生產庫|生产数据|生產資料|密钥|密鑰|凭证|憑證|api\s*key|内网|內網)|开通.{0,10}(权限|權限|access)|開通.{0,10}(权限|權限|access)|给我.{0,10}(权限|權限)|給我.{0,10}(权限|權限)|帮我改.{0,12}(生产|生產|配置)|幫我改.{0,12}(生产|生產|配置)|执行.{0,8}(强平|強平|\badl\b|写操作|寫操作)|query\s+(the\s+)?(prod(uction)?\s+)?(db|database|admin)|access\s+(the\s+)?(admin|database|prod(uction)?)|grant\s+me\s+(access|permission)|pull\s+(from\s+)?prod|log\s*in\s+to\s+(admin|prod)|change\s+prod(uction)?\s+config/i

/** True when the user wants the bot to access a resource it cannot reach. */
export function needsInaccessibleAccess(text: string): boolean {
  return ACCESS_NEEDED_RE.test(text.trim())
}

/**
 * Standard reply when the bot needs access it does not have
 * (admin/DB/prod APIs down / missing credentials / gated writes).
 */
export function accessUnavailableReply(lang: Lang, detail?: string): string {
  const why =
    detail?.trim() ||
    (lang === 'zh-Hans'
      ? '我这边需要访问的资源目前不可用，或我没有相应权限／凭证。'
      : lang === 'zh-Hant'
        ? '我這邊需要訪問的資源目前不可用，或我沒有相應權限／憑證。'
        : 'I need a resource that is currently unavailable, or I lack the required permission / credentials.')
  if (lang === 'zh-Hans') {
    return [
      '🔒 **无法访问**',
      '',
      `• **原因：** ${why}`,
      '• **请联系：** **@Yan Haixiang**（开通权限、补凭证、或代查生产／后台／DB）',
      '',
      '_我不会编造生产数据，也不会在未授权时执行写操作。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🔒 **無法訪問**',
      '',
      `• **原因：** ${why}`,
      '• **請聯繫：** **@Yan Haixiang**（開通權限、補憑證、或代查生產／後台／DB）',
      '',
      '_我不會編造生產資料，也不會在未授權時執行寫操作。_',
    ].join('\n')
  }
  return [
    '🔒 **Access unavailable**',
    '',
    `• **Why:** ${why}`,
    '• **Please contact:** **@Yan Haixiang** (grant access, add credentials, or look up prod / admin / DB)',
    '',
    '_I will not invent production data or execute writes without authorization._',
  ].join('\n')
}

/** End of a keyword command — `\b` does not work after CJK. */
const CMD_END = '(?:\\s|$|[：:：])'

const COMMAND_INVESTIGATE = new RegExp(
  `^(?:investigate\\b|排查|开始排查|開始排查)${CMD_END}`,
  'i',
)
const COMMAND_MARKET = new RegExp(`^(?:market\\b|行情|市况|市況|趋势|趨勢)${CMD_END}`, 'i')
/** Whole-message openers for the alerts/reports dashboard. */
const COMMAND_REVIEW = new RegExp(
  `^(?:review\\b|archive\\b|dashboard\\b|alerts\\b|alert\\s*board\\b|复盘|複盤|归档|歸檔|看板|仪表盘|儀表盤)${CMD_END}`,
  'i',
)
const COMMAND_HELP = new RegExp(`^(?:help\\b|帮助|幫助|说明|說明)${CMD_END}`, 'i')
const COMMAND_DONE = new RegExp(
  `^(?:done\\b|reset\\b|完成|结束排查|結束排查|重置)${CMD_END}`,
  'i',
)
/** Mark current investigate step complete (text alternative to card button). */
const COMMAND_STEP_DONE =
  /^(?:step\s*done|next\s*step\s*done|已完成此步|完成此步|本步完成|标记完成|標記完成)\s*$/i

export function isStepDoneCommand(text: string): boolean {
  return COMMAND_STEP_DONE.test(text.trim())
}
const COMMAND_SKILLS = new RegExp(
  `^(?:skills?\\b|skill\\s*list\\b|技能|技能库|技能庫|场景|場景|查看\\s*skills?|看\\s*skills?)${CMD_END}` +
    `|(?:有哪些|列出|查看|打开|打開).{0,8}(?:排查场景|排查場景|skills?|技能)|(?:排查场景|排查場景|技能目录|技能目錄)\\s*(?:有哪些|列表|目录|目錄)?\\s*$`,
  'i',
)
const COMMAND_KNOWLEDGE = new RegExp(
  `^(?:knowledge\\b|kb\\b|rag\\b|知识库|知識庫|知识|知識|查看\\s*(?:知识库|知識庫|kb|rag)|看\\s*(?:知识库|知識庫))${CMD_END}` +
    `|(?:打开|打開|查看|列出).{0,8}(?:知识库|知識庫|rag)|(?:知识库|知識庫)\\s*(?:目录|目錄|列表)?\\s*$`,
  'i',
)
/** On-demand weekly digest (also cron-pushed Fridays 16:00 CST). */
const COMMAND_WEEKLY =
  /^(?:weekly(?:\s*report|\s*digest)?|week\s*report|周报|週報|本周总结|本週總結|本周汇总|本週匯總)\s*$/i

/** Bare wiki / docs keyword (CJK-safe). */
const COMMAND_WIKI = new RegExp(
  `^(?:wiki\\b|文档|文檔|飞书文档|飛書文檔|百科)${CMD_END}`,
  'i',
)

/**
 * AIPO Lark API UAT — user asks to read Feishu Wiki / Docs (authorized, read-only).
 * Desk **knowledge** / **kb** commands stay separate (local RAG catalogue).
 */
const LARK_WIKI_RE =
  /\b(lark|feishu)\s*wiki\b|\bwiki\b|(飞书|飛書).{0,8}(wiki|文档|文檔)|(读|讀|查|搜|打开|打開|搜索).{0,16}(飞书|飛書)\s*(wiki|文档|文檔)|wiki\s*(文档|文檔|页面|頁面|node)|飞书文档|飛書文檔|\bdocx\b|知识空间|知識空間/i

/** User points at a just-shared doc / asks whether the bot can read it. */
const SHARED_DOC_READ_RE =
  /(能|可以|可否|能不能|可不可以).{0,8}(读|讀|读取|讀取|查看|打开|打開|看到).{0,16}(这里面|這裡面|这个|這個|这份|這份|里边|裡邊|里面|裡面|文档|文檔|数据|資料|内容|內容|分享)|(读|讀|读取|讀取|查看).{0,10}(一下|下)?.{0,10}(文档|文檔|这个|這個|这份|這份|分享)|(这里面|這裡面|这份文档|這份文檔|这个文档|這個文檔).{0,12}(数据|資料|内容|內容)|(can\s+you\s+read|read\s+(this|the)\s+(doc|file|data))/i

export function isLarkWikiQuestion(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (COMMAND_KNOWLEDGE.test(t)) return false
  return COMMAND_WIKI.test(t) || LARK_WIKI_RE.test(t) || SHARED_DOC_READ_RE.test(t)
}

/** Soft reply when user asks if a shared doc is readable (before / instead of wiki search). */
export function sharedDocReadReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '📄 **可以试着读**（只读）',
      '',
      '• 如果你刚分享了飞书文档，请再发一下 **文档链接**，或把要点贴出来，我按授权范围读取摘要。',
      '• 我只能读已授权的 Wiki／文档；读不到时请联系 **@Yan Haixiang** 开通只读权限。',
      '',
      '_不会改文档，也不会把内容发到群外。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '📄 **可以試著讀**（唯讀）',
      '',
      '• 如果你剛分享了飛書文檔，請再發一下 **文檔連結**，或把要點貼出來，我按授權範圍讀取摘要。',
      '• 我只能讀已授權的 Wiki／文檔；讀不到時請聯繫 **@Yan Haixiang** 開通唯讀權限。',
      '',
      '_不會改文檔，也不會把內容發到群外。_',
    ].join('\n')
  }
  return [
    '📄 **I can try to read it** (read-only)',
    '',
    '• If you just shared a Feishu doc, send the **doc link** or paste the key bits and I’ll summarize within my authorized scope.',
    '• I only read authorized Wiki/Docs — if access fails, ask **@Yan Haixiang** to grant read scope.',
    '',
    '_I won’t edit the doc or send its contents outside this chat._',
  ].join('\n')
}

/** Clock hour in UTC+8 (Asia/Shanghai). Feishu users are east-eight. */
export function east8Hour(now = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Shanghai',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const h = Number(parts.find((p) => p.type === 'hour')?.value)
    // en-GB 24h may yield "24" at midnight on some engines → normalize
    if (!Number.isFinite(h)) return 12
    return h === 24 ? 0 : h
  } catch {
    return 12
  }
}

/**
 * Daypart openers for greetings (东八区):
 * morning before 12, afternoon until 18 (5pm is still 下午好), evening until 22.
 */
export function greetingOpenForHour(lang: Lang, hour: number): string {
  if (lang === 'zh-Hans') {
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '还在线呀'
  }
  if (lang === 'zh-Hant') {
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '還在線呀'
  }
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Hey — still here'
}

export function classifyIntent(
  text: string,
  opts: { inInvestigateSession: boolean; mentionedBot: boolean; chatType: string },
): Intent {
  const t = text.trim()
  if (!t) {
    // Bare @mention or empty DM open → natural greeting
    if (opts.mentionedBot) return 'greeting'
    return opts.inInvestigateSession ? 'followup' : 'greeting'
  }

  if (COMMAND_HELP.test(t) || HELP_RE.test(t)) return 'help'
  if (GREETING_RE.test(t)) return 'greeting'

  // Negative list only — politics / abuse / privacy / company secrets
  if (detectSafetyViolation(t)) return 'safety'

  // Explicit commands first — investigate before review so "Alert: …" paste is not a dashboard
  if (COMMAND_INVESTIGATE.test(t)) return 'investigate'
  if (COMMAND_MARKET.test(t)) return 'market'
  if (COMMAND_SKILLS.test(t)) return 'skills'
  if (COMMAND_KNOWLEDGE.test(t)) return 'knowledge'
  if (COMMAND_WEEKLY.test(t)) return 'weekly'
  if (COMMAND_REVIEW.test(t)) return 'review'
  if (COMMAND_DONE.test(t)) return 'archive'
  if (REVIEW_RE.test(t) && !INVESTIGATE_RE.test(t)) return 'review'

  // Active investigation: treat free-text as evidence/follow-up unless explicit command above
  if (opts.inInvestigateSession) return 'followup'

  // Shared Feishu docs / “can you read this?”
  if (isLarkWikiQuestion(t) || SHARED_DOC_READ_RE.test(t)) return 'general_risk'

  if (MARKET_RE.test(t) && !INVESTIGATE_RE.test(t)) return 'market'
  if (INVESTIGATE_RE.test(t)) return 'investigate'

  // Meta / desk FAQ (roles, who can edit KB) — answer, never investigate dump
  if (BOT_META_RE.test(t) || DESK_FAQ_RE.test(t)) return 'general_risk'

  // Small talk / banter / dinner / anything else — chat (not offtopic refuse)
  if (isCasualChat(t)) return 'general_risk'

  // Soft ack after @ only — NEVER classify short real questions as greeting
  // (DMs set mentionedBot=true, so length<12 used to swallow e.g.「谁是管理员」)
  if (SOFT_ACK_RE.test(t)) return 'greeting'

  // Accept all remaining free-text (chat + risk Q&A). Intent `offtopic` is unused.
  return 'general_risk'
}

/** True when the question is about desk roles / edit permissions (not an incident). */
export function isDeskFaqQuestion(text: string): boolean {
  return DESK_FAQ_RE.test(text.trim())
}

/** True when free-text looks like alert/incident evidence (Skills dump OK). */
export function looksLikeIncidentEvidence(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (INCIDENT_EVIDENCE_RE.test(t)) return true
  // Long structured paste with metric-ish tokens
  return t.length > 120 && /\d+(\.\d+)?\s*(bps|%|ms|s)\b/i.test(t)
}

/** Deterministic desk FAQ: who can edit knowledge / Skills. */
export function deskFaqReply(lang: Lang, question: string): string | null {
  if (!isDeskFaqQuestion(question)) return null
  if (lang === 'zh-Hans') {
    return [
      '🔐 **桌面权限说明**',
      '',
      '• **结论：** 知识库／Skills **仅 Admin 可写**；一般用户／Ops／Analyst **不能编辑**。',
      '• **“只有我能改吗？”** 若你的账号是 **Admin**，则只有 Admin（含你）能改；否则你也改不了。',
      '• **只读角色：** Ops／Analyst／一般用户可 **查看** 知识库与 Skills，并仍可做 **investigate**。',
      '• **需要开通 Admin：** 请联系 **@Yan Haixiang**。',
      '',
      '_桌面页：[知识库](https://vex-llm-proxy.vercel.app/#/knowledge) · [Skills](https://vex-llm-proxy.vercel.app/#/skills)_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🔐 **桌面權限說明**',
      '',
      '• **結論：** 知識庫／Skills **僅 Admin 可寫**；一般用戶／Ops／Analyst **不能編輯**。',
      '• **「只有我能改嗎？」** 若你的帳號是 **Admin**，則只有 Admin（含你）能改；否則你也改不了。',
      '• **只讀角色：** Ops／Analyst／一般用戶可 **查看** 知識庫與 Skills，並仍可做 **investigate**。',
      '• **需要開通 Admin：** 請聯繫 **@Yan Haixiang**。',
      '',
      '_桌面頁：[知識庫](https://vex-llm-proxy.vercel.app/#/knowledge) · [Skills](https://vex-llm-proxy.vercel.app/#/skills)_',
    ].join('\n')
  }
  return [
    '🔐 **Desk permissions**',
    '',
    '• **Answer:** Knowledge / Skills are **Admin-write only**. General / Ops / Analyst **cannot edit**.',
    '• **“Only I can change it?”** If your account is **Admin**, then only Admins (including you) can edit; otherwise you cannot either.',
    '• **Read access:** Ops / Analyst / general users can **view** knowledge & Skills and still run **investigate**.',
    '• **Need Admin:** contact **@Yan Haixiang**.',
    '',
    '_Desk: [Knowledge](https://vex-llm-proxy.vercel.app/#/knowledge) · [Skills](https://vex-llm-proxy.vercel.app/#/skills)_',
  ].join('\n')
}

/** Deterministic answer for bot/admin/UAT meta questions. */
export function botMetaReply(lang: Lang, question: string): string | null {
  const faq = deskFaqReply(lang, question)
  if (faq) return faq
  if (!BOT_META_RE.test(question)) return null
  if (lang === 'zh-Hans') {
    return [
      '🙋 **关于管理员／UAT 对接**',
      '',
      '• **当前阶段：** 我还在 **UAT** 阶段。',
      '• **管理员／问题对接人：** **@Yan Haixiang**',
      '• **怎么反馈：** 使用中有任何问题、Bug 或权限需求，请直接报给 **@Yan Haixiang**。',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🙋 **關於管理員／UAT 對接**',
      '',
      '• **當前階段：** 我還在 **UAT** 階段。',
      '• **管理員／問題對接人：** **@Yan Haixiang**',
      '• **怎麼回饋：** 使用中有任何問題、Bug 或權限需求，請直接報給 **@Yan Haixiang**。',
    ].join('\n')
  }
  return [
    '🙋 **Admin / UAT contact**',
    '',
    '• **Stage:** I’m still in **UAT**.',
    '• **Admin / contact:** **@Yan Haixiang**',
    '• **How to report:** Please send any issues, bugs, or access needs to **@Yan Haixiang**.',
  ].join('\n')
}

/** Short social / identity lines — answer warmly, never dump a command menu. */
const CASUAL_WHO_ME =
  /^(我是谁|我是誰|who\s+am\s+i|whoami|我叫什么|我叫什麼|你知道我是谁吗|你知道我是誰嗎)\s*[?？!！.。]*\s*$/i
const CASUAL_WHO_YOU =
  /^(你是谁|你是誰|你叫什么|你叫什麼|who\s+are\s+you|what(?:'s| is)\s+your\s+name)\s*[?？!！.。]*\s*$/i
const CASUAL_THANKS =
  /^(谢谢|謝謝|thanks?|thx|ty|感谢|感謝|多谢|多謝)\s*[!！.。~]*\s*$/i
const CASUAL_HOW =
  /^(怎么样|怎麼樣|最近怎么样|最近怎麼樣|在忙吗|在忙嗎|how\s+are\s+you)\s*[?？!！.。]*\s*$/i
/** Banter / flirt — must NEVER trigger web search (e.g.「我帅不」≠ 彭帅). */
const CASUAL_BANTER =
  /^(我帅不[帅帥]?|我帅吗|我帅嗎|帅不帅|帥不帥|我好看吗|我好看嗎|好看吗|好看嗎|漂亮吗|漂亮嗎|可爱吗|可愛嗎|爱我吗|愛我嗎|想我了吗|想我了嗎|在吗|在嗎|哈哈+|呵呵+|嘿嘿+|嗯嗯+|哦+|噢+|lol+|lmao|haha+|omg)\s*[?？!！.。~]*\s*$/i

export function isCasualChat(text: string): boolean {
  const t = text.trim()
  return (
    CASUAL_WHO_ME.test(t) ||
    CASUAL_WHO_YOU.test(t) ||
    CASUAL_THANKS.test(t) ||
    CASUAL_HOW.test(t) ||
    CASUAL_BANTER.test(t)
  )
}

/** True when free-text is short social banter that must not open search / RAG dumps. */
export function isCasualBanter(text: string): boolean {
  return CASUAL_BANTER.test(text.trim())
}

/** Friendly one-beat replies for small talk (optional displayName for “我是谁”). */
export function casualChatReply(
  lang: Lang,
  question: string,
  displayName?: string | null,
): string | null {
  const t = question.trim()
  if (CASUAL_WHO_YOU.test(t)) {
    if (lang === 'zh-Hans') {
      return [
        '🙋 我是 **V Exchange Risk Copilot**（VE AI 风控小助手）。',
        '',
        '平时帮你看行情、对告警做排查、翻 Skills／知识库。有风险问题直接丢给我就行 🙂',
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        '🙋 我是 **V Exchange Risk Copilot**（VE AI 風控小助手）。',
        '',
        '平時幫你看行情、對告警做排查、翻 Skills／知識庫。有風險問題直接丟給我就行 🙂',
      ].join('\n')
    }
    return [
      '🙋 I’m **V Exchange Risk Copilot**.',
      '',
      'I help with market scans, alert investigations, and Skills / knowledge. Drop me a risk question anytime 🙂',
    ].join('\n')
  }
  if (CASUAL_WHO_ME.test(t)) {
    const name = (displayName || '').trim()
    if (lang === 'zh-Hans') {
      return name
        ? [
            `🙂 你是 **${name}**。`,
            '',
            '在这串对话里你是值班同学；改知识库／Skills 需要 **Admin**（找 **@Yan Haixiang** 开通）。要排查就直接贴告警给我。',
          ].join('\n')
        : [
            '🙂 你是正在跟我对话的值班同学。',
            '',
            '我这边读不到完整花名册（或缺通讯录权限），但记得这是我们的风险会话。改知识库要 **Admin**——找 **@Yan Haixiang**；要排查直接贴告警就好。',
          ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return name
        ? [
            `🙂 你是 **${name}**。`,
            '',
            '在這串對話裡你是值班同學；改知識庫／Skills 需要 **Admin**（找 **@Yan Haixiang** 開通）。要排查就直接貼告警給我。',
          ].join('\n')
        : [
            '🙂 你是正在跟我對話的值班同學。',
            '',
            '我這邊讀不到完整花名冊（或缺通訊錄權限），但記得這是我們的風險會話。改知識庫要 **Admin**——找 **@Yan Haixiang**；要排查直接貼告警就好。',
          ].join('\n')
    }
    return name
      ? [
          `🙂 You’re **${name}**.`,
          '',
          'In this chat you’re the on-duty operator. Editing knowledge / Skills needs **Admin** (ask **@Yan Haixiang**). Paste an alert anytime to investigate.',
        ].join('\n')
      : [
          '🙂 You’re the on-duty operator talking to me.',
          '',
          'I can’t see a full HR profile from here (contact scope may be missing), but this is our risk session. Editing the KB needs **Admin** — **@Yan Haixiang**. Paste an alert to investigate.',
        ].join('\n')
  }
  if (CASUAL_THANKS.test(t)) {
    if (lang === 'zh-Hans') return '不客气 🙂 想继续聊、看行情或贴告警，都随时叫我。'
    if (lang === 'zh-Hant') return '不客氣 🙂 想繼續聊、看行情或貼告警，都隨時叫我。'
    return 'You’re welcome 🙂 Happy to keep chatting, or dig into markets / alerts anytime.'
  }
  if (CASUAL_HOW.test(t)) {
    if (lang === 'zh-Hans') return '还行，在线陪聊＋值班中 🙂 想吹牛或看 XAUUSD／告警都行。'
    if (lang === 'zh-Hant') return '還行，在線陪聊＋值班中 🙂 想吹牛或看 XAUUSD／告警都行。'
    return 'Doing fine — on chat + duty 🙂 Banter or XAUUSD / alerts, either works.'
  }
  if (CASUAL_BANTER.test(t)) {
    if (lang === 'zh-Hans') {
      return '😄 挺帅的呀——自信加一分。想继续贫两句，或扔个行情／告警过来，我都在。'
    }
    if (lang === 'zh-Hant') {
      return '😄 挺帥的呀——自信加一分。想繼續貧兩句，或扔個行情／告警過來，我都在。'
    }
    return '😄 Looking good — confidence +1. Keep chatting, or toss me a market / alert anytime.'
  }
  return null
}

/** @deprecated Negative-list policy: free-text is no longer refused as offtopic. Kept for callers. */
export function offtopicReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return '可以呀 🙂 我专长是 V Exchange 风控，不过闲聊也陪。你想聊什么，或者要看行情／贴告警，直接说。'
  }
  if (lang === 'zh-Hant') {
    return '可以呀 🙂 我專長是 V Exchange 風控，不過閒聊也陪。你想聊什麼，或者要看行情／貼告警，直接說。'
  }
  return 'Sure 🙂 Risk is my specialty, but I’m happy to chat too. What’s on your mind — or send a market / alert if you want.'
}

/**
 * Greeting / help body for Lark interactive cards (lark_md).
 * Uses blank lines, bold command names, bullets, and per-command trigger hints.
 */
export function greetingReply(lang: Lang): string {
  const hour = east8Hour()
  const open = greetingOpenForHour(lang, hour)
  const variant = Math.floor(Date.now() / 60_000) % 3

  if (lang === 'zh-Hans') {
    const intros = [
      `${open} 🙂 我是 **V Exchange Risk Copilot**。`,
      `${open} 👋 **V Exchange Risk Copilot** 在这儿。`,
      `嗨～ ${open}。我是 **V Exchange Risk Copilot**。`,
    ]
    return [
      intros[variant]!,
      '',
      '下面是我能做的事。**中文关键词：群聊 @我 + 关键词；私聊直接说。**',
      '**也可用自然语言／贴告警／截图／表格**（不必先打出关键词）。',
      '',
      '• 📈 **行情** — 市况／XAUUSD 趋势',
      '',
      '• 🔍 **排查** — 贴告警／截图／表格，引导排查',
      '',
      '• 📊 **复盘** / **看板** — 告警与报告看板',
      '',
      '• 🧩 **技能** — 34 个排查场景（L1-01～28 + L2-A～F）',
      '',
      '• 📚 **知识库** — 知识库（含「可能出现的风险」指标清单）',
      '',
      '• 📖 **文档** — 只读检索已授权飞书 Wiki／文档（未授权联系 **@Yan Haixiang**）',
      '',
      '• 📊 **周报** — 本周汇总；每周五 **16:00（东八区）** 自动推送给 **@Yan Haixiang**',
      '',
      '• ⏱ **半小时行情** — 每 **30 分钟**自动推送行情扫报给 **@Yan Haixiang**',
      '',
      '• 🌅 **每日 24h 早报** — 东八区每天 **09:00** 向指定群推送过去 24 小时行情',
      '',
      '• ✅ **完成** — 结束并归档本次排查',
      '',
      '• ❓ **帮助** — 完整说明',
      '',
      '_说中文我会用中文回复。我还在 UAT 阶段，有问题请报给 @Yan Haixiang。_',
    ].join('\n')
  }

  if (lang === 'zh-Hant') {
    const intros = [
      `${open} 🙂 我是 **V Exchange Risk Copilot**。`,
      `${open} 👋 **V Exchange Risk Copilot** 在這兒。`,
      `嗨～ ${open}。我是 **V Exchange Risk Copilot**。`,
    ]
    return [
      intros[variant]!,
      '',
      '下面是我能做的事。**中文關鍵詞：群聊 @我 + 關鍵詞；私聊直接說。**',
      '**也可用自然語言／貼告警／截圖／表格**（不必先打出關鍵詞）。',
      '',
      '• 📈 **行情** — 市況／XAUUSD 趨勢',
      '',
      '• 🔍 **排查** — 貼告警／截圖／表格，引導排查',
      '',
      '• 📊 **複盤** / **看板** — 告警與報告看板',
      '',
      '• 🧩 **技能** — 34 個排查場景（L1-01～28 + L2-A～F）',
      '',
      '• 📚 **知識庫** — 知識庫（含「可能出現的風險」指標清單）',
      '',
      '• 📖 **文檔** — 唯讀檢索已授權飛書 Wiki／文檔（未授權聯繫 **@Yan Haixiang**）',
      '',
      '• 📊 **週報** — 本週匯總；每週五 **16:00（東八區）** 自動推送給 **@Yan Haixiang**',
      '',
      '• ⏱ **半小時行情** — 每 **30 分鐘**自動推送行情掃報給 **@Yan Haixiang**',
      '',
      '• ✅ **完成** — 結束並歸檔本次排查',
      '',
      '• ❓ **幫助** — 完整說明',
      '',
      '_說中文我會用中文回覆。我還在 UAT 階段，有問題請報給 @Yan Haixiang。_',
    ].join('\n')
  }

  const intros = [
    `${open} 🙂 I’m **V Exchange Risk Copilot**.`,
    `${open} 👋 **V Exchange Risk Copilot** here.`,
    `Hey! ${open.toLowerCase().startsWith('good') ? open : 'Nice to see you'}. I’m **V Exchange Risk Copilot**.`,
  ]
  return [
    intros[variant]!,
    '',
    'Here’s what I can do. **Keywords: group = @me + keyword; DM = just say the keyword.**',
    '**Natural language / paste alerts / screenshots / tables also work** (keywords not required).',
    '',
    '• 📈 **market** — XAUUSD / gold market trends',
    '',
    '• 🔍 **investigate** — paste an alert, screenshot, or table to dig in',
    '',
    '• 📊 **review** / **dashboard** — alerts & reports board',
    '',
    '• 🧩 **skills** — 34 investigation scenarios (L1-01–28 + L2-A–F)',
    '',
    '• 📚 **knowledge** / **kb** — knowledge base (incl. possible-risks inventory)',
    '',
    '• 📖 **wiki** — read-only Lark Wiki / Docs (unauthorized → **@Yan Haixiang**)',
    '',
    '• 📊 **weekly** — weekly digest; auto-pushed to **@Yan Haixiang** Fridays **16:00 Asia/Shanghai**',
    '',
    '• ⏱ **30-min market** — auto market scan to **@Yan Haixiang** every **30 minutes**',
    '',
    '• ✅ **done** — close and archive this investigation',
    '',
    '• ❓ **help** — full guide',
    '',
    '_I’m still in UAT — please report any issues to @Yan Haixiang._',
  ].join('\n')
}

export function helpReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '你好 🙂 我是 **V Exchange Risk Copilot**（Lark）。',
      '',
      '**中文关键词：群聊 @我 + 关键词；私聊直接说。**',
      '**也可用自然语言／贴告警／截图／表格**（不必先打出关键词）。',
      '',
      '• 📈 **行情** — 市况／趋势',
      '• 🔍 **排查** — 贴告警／截图／表格排查',
      '• 📊 **复盘** / **看板** — 告警看板',
      '• 🧩 **技能** — 34 个排查场景（不是监控指标清单）',
      '• 📚 **知识库** — 知识库（含「可能出现的风险」）',
      '• 📖 **文档** — 飞书 Wiki／文档只读',
      '• 📊 **周报** — 本周汇总（周五 16:00 东八区推送 @Yan Haixiang）',
      '• ⏱ **半小时行情** — 每 30 分钟自动推送 @Yan Haixiang',
      '• ✅ **完成** — 归档本次排查',
      '• ❓ **帮助** — 本说明',
      '',
      '_说中文会用中文回复；English keywords 仍可用。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '你好 🙂 我是 **V Exchange Risk Copilot**（Lark）。',
      '',
      '**中文關鍵詞：群聊 @我 + 關鍵詞；私聊直接說。**',
      '**也可用自然語言／貼告警／截圖／表格**（不必先打出關鍵詞）。',
      '',
      '• 📈 **行情** — 市況／趨勢',
      '• 🔍 **排查** — 貼告警／截圖／表格排查',
      '• 📊 **複盤** / **看板** — 告警看板',
      '• 🧩 **技能** — 34 個排查場景（不是監控指標清單）',
      '• 📚 **知識庫** — 知識庫（含「可能出現的風險」）',
      '• 📖 **文檔** — 飛書 Wiki／文檔唯讀',
      '• 📊 **週報** — 本週匯總（週五 16:00 東八區推送 @Yan Haixiang）',
      '• ⏱ **半小時行情** — 每 30 分鐘自動推送 @Yan Haixiang',
      '• ✅ **完成** — 歸檔本次排查',
      '• ❓ **幫助** — 本說明',
      '',
      '_說中文會用中文回覆；English keywords 仍可用。_',
    ].join('\n')
  }
  return [
    'Hi 🙂 I’m **V Exchange Risk Copilot** on Lark.',
    '',
    '**Keywords: group = @me + keyword; DM = just say the keyword.**',
    '**Natural language / paste alerts / screenshots / tables also work** (keywords not required).',
    '',
    '• 📈 **market** — market trends',
    '• 🔍 **investigate** — paste alert / screenshot / table',
    '• 📊 **review** / **dashboard** — alerts board',
    '• 🧩 **skills** — 34 investigation scenarios (not the metric inventory)',
    '• 📚 **knowledge** / **kb** — knowledge base (incl. possible risks)',
    '• 📖 **wiki** — Lark Wiki / Docs read-only',
    '• 📊 **weekly** — weekly digest (Fri 16:00 Asia/Shanghai → @Yan Haixiang)',
    '• ⏱ **30-min market** — auto push to @Yan Haixiang every 30 minutes',
    '• ✅ **done** — archive this investigation',
    '• ❓ **help** — this guide',
    '',
    '_I mirror your language (EN / 中文)._',
  ].join('\n')
}
