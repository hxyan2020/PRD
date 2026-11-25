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
 * Must NOT fall through to investigate-style Skills+severity dumps.
 */
const DESK_FAQ_RE =
  /(一般用户|普通用户|一般用戶|普通用戶|普通账号|普通帳號|一般账号|一般帳號|\bops\b|\banalyst\b|非管理员|非管理員).{0,24}(编辑|編輯|修改|改|写|寫|创建|刪除).{0,24}(知识库|知識庫|skills?|技能|rag|记忆|記憶)|(编辑|編輯|修改|改|写|寫).{0,16}(知识库|知識庫|skills?|技能).{0,16}(权限|權限|吗|嗎|可以|能不能|能否)|(谁|誰|who).{0,16}(能|可以|可).{0,8}(编辑|編輯|改|写|寫).{0,16}(知识库|知識庫|skills?|技能)|only\s+admin.{0,24}(edit|write).{0,24}(knowledge|skills?)|can\s+(a\s+)?(general|normal|regular|ops|analyst)\s*(user)?s?\s+(edit|write|change).{0,24}(knowledge|skills?|kb)|who\s+can\s+(edit|write).{0,24}(knowledge|skills?|kb)|(知识库|知識庫|skills?).{0,12}(只读|只讀|readonly|read-?only)/i

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

const COMMAND_INVESTIGATE = /^(investigate|排查|開始排查|开始排查)\b/i
const COMMAND_MARKET = /^(market|行情|趋势|趨勢)\b/i
/** Whole-message openers for the alerts/reports dashboard. */
const COMMAND_REVIEW =
  /^(review|复盘|複盤|archive|归档|歸檔|dashboard|alerts|alert\s*board|看板|仪表盘|儀表盤)\b/i
const COMMAND_HELP = /^(help|帮助|幫助)\b/i
const COMMAND_DONE = /^(done|完成|结束排查|結束排查|reset|重置)\b/i
const COMMAND_SKILLS =
  /^(skills?|skill\s*list|技能|技能库|技能庫|查看\s*skills?|看\s*skills?)\b/i
const COMMAND_KNOWLEDGE =
  /^(knowledge|kb|rag|知识库|知識庫|知识|知識|查看\s*(知识库|知識庫|kb|rag)|看\s*(知识库|知識庫))\b/i
/** On-demand weekly digest (also cron-pushed Fridays 16:00 CST). */
const COMMAND_WEEKLY =
  /^(?:weekly(?:\s*report|\s*digest)?|week\s*report|周报|週報|本周总结|本週總結|本周汇总|本週匯總)\s*$/i

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

/** Clearly out-of-scope topics for a V Exchange risk bot. */
const OFFTOPIC_RE =
  /天气|天氣|食谱|食譜|做饭|做飯|\bcook\b|\bdinner\b|\brecipe\b|笑话|笑話|恋爱|戀愛|星座|彩票|\bfootball\b|\bnba\b|电影推荐|電影推薦|写代码作业|寫代碼作業|助记词|助記詞|\bhack\b|\bphishing\b|钓鱼|釣魚|今晚吃什么|吃什麼/i

const IN_SCOPE_HINT =
  /v\s*exchange|永续|永續|\brisk\b|风险|風險|\bxauusd\b|合约|合約|定价|定價|监控|監控|\bsource\b|源/i

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

  // Safety before any other intent (block PII asks / abuse / politics)
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

  if (OFFTOPIC_RE.test(t) && !IN_SCOPE_HINT.test(t) && !INVESTIGATE_RE.test(t) && !MARKET_RE.test(t)) {
    return 'offtopic'
  }

  if (MARKET_RE.test(t) && !INVESTIGATE_RE.test(t)) return 'market'
  if (INVESTIGATE_RE.test(t)) return 'investigate'

  // Meta / desk FAQ (roles, who can edit KB) — answer, never investigate dump
  if (BOT_META_RE.test(t) || DESK_FAQ_RE.test(t)) return 'general_risk'

  // Soft ack after @ only — NEVER classify short real questions as greeting
  // (DMs set mentionedBot=true, so length<12 used to swallow e.g.「谁是管理员」)
  if (SOFT_ACK_RE.test(t)) return 'greeting'

  if (IN_SCOPE_HINT.test(t) || MARKET_RE.test(t) || INVESTIGATE_RE.test(t) || BOT_META_RE.test(t)) {
    return 'general_risk'
  }
  // Prefer answering over offtopic for short operational questions
  if (t.length <= 40) return 'general_risk'
  if (t.length > 40 && !IN_SCOPE_HINT.test(t) && !MARKET_RE.test(t) && !BOT_META_RE.test(t)) {
    return 'offtopic'
  }

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
      '• **结论：** **不可以。** 一般用户／Ops／Analyst **不能编辑** 知识库或 Skills。',
      '• **可写角色：** 仅 **Admin** 可创建／编辑 Skills、RAG 知识库及相关覆盖项。',
      '• **只读角色：** Ops／Analyst／一般用户可 **查看** 知识库与 Skills，并仍可做 **investigate** 排查。',
      '• **需要开通 Admin：** 请联系 **@Yan Haixiang**。',
      '',
      '_桌面页：https://quote-ai-troubleshooting-bot.vercel.app/#/knowledge · https://quote-ai-troubleshooting-bot.vercel.app/#/skills_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🔐 **桌面權限說明**',
      '',
      '• **結論：** **不可以。** 一般用戶／Ops／Analyst **不能編輯** 知識庫或 Skills。',
      '• **可寫角色：** 僅 **Admin** 可建立／編輯 Skills、RAG 知識庫及相關覆蓋項。',
      '• **只讀角色：** Ops／Analyst／一般用戶可 **查看** 知識庫與 Skills，並仍可做 **investigate** 排查。',
      '• **需要開通 Admin：** 請聯繫 **@Yan Haixiang**。',
      '',
      '_桌面頁：https://quote-ai-troubleshooting-bot.vercel.app/#/knowledge · https://quote-ai-troubleshooting-bot.vercel.app/#/skills_',
    ].join('\n')
  }
  return [
    '🔐 **Desk permissions**',
    '',
    '• **Answer:** **No.** General / Ops / Analyst users **cannot edit** the knowledge base or Skills.',
    '• **Write access:** **Admin only** can create/edit Skills, RAG knowledge, and related overrides.',
    '• **Read access:** Ops / Analyst / general users can **view** knowledge & Skills and still run **investigate**.',
    '• **Need Admin:** contact **@Yan Haixiang**.',
    '',
    '_Desk: https://quote-ai-troubleshooting-bot.vercel.app/#/knowledge · https://quote-ai-troubleshooting-bot.vercel.app/#/skills_',
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
      '',
      '_生产写操作仍需人工审批；我不会自称已执行生产变更。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🙋 **關於管理員／UAT 對接**',
      '',
      '• **當前階段：** 我還在 **UAT** 階段。',
      '• **管理員／問題對接人：** **@Yan Haixiang**',
      '• **怎麼回饋：** 使用中有任何問題、Bug 或權限需求，請直接報給 **@Yan Haixiang**。',
      '',
      '_生產寫操作仍需人工審批；我不會自稱已執行生產變更。_',
    ].join('\n')
  }
  return [
    '🙋 **Admin / UAT contact**',
    '',
    '• **Stage:** I’m still in **UAT**.',
    '• **Admin / contact:** **@Yan Haixiang**',
    '• **How to report:** Please send any issues, bugs, or access needs to **@Yan Haixiang**.',
    '',
    '_Production writes still need human approval; I won’t claim I executed them._',
  ].join('\n')
}

export function offtopicReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return '谢谢提问 🙂 我主要为 V Exchange 风险管理服务（XAUUSD 永续、指数／Mark、LP、强平／ADL、行情监控与事故排查）。这个问题超出我的训练范围，建议改问行情趋势、告警排查或事故复盘——我很乐意协助。试试 market / investigate / review。'
  }
  if (lang === 'zh-Hant') {
    return '多謝提問 🙂 我主要服務 V Exchange 風險管理（XAUUSD 永續、指數／Mark、LP、強平／ADL、行情監控與事故排查）。這個問題超出我的訓練範圍，建議改問行情趨勢、告警排查或事故複盤——我很樂意協助。試試 market / investigate / review。'
  }
  return 'Thanks for reaching out 🙂 I’m trained for V Exchange risk management (XAUUSD perps, index/Mark, LPs, liquidation/ADL, market monitoring, and incident investigation). That question is outside my scope — try market, investigate, or review, and I’ll gladly help.'
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
      '下面是我能做的事。每条都写了**怎么触发**：',
      '',
      '• 📈 **market** — 市况／XAUUSD 趋势',
      '  触发：发送 **market**，或直接问「金价怎么样／今日趋势」',
      '  群聊：先 @我 再发；私聊：直接发',
      '',
      '• 🔍 **investigate** — 贴告警／截图／表格，引导排查',
      '  触发：粘贴告警原文、截图或表格；也可先发 **investigate**',
      '  群聊：@我 + 粘贴；私聊：直接粘贴',
      '',
      '• 📊 **review** / **dashboard** — 告警与报告看板',
      '  触发：发送 **review** 或 **dashboard**',
      '  群聊：@我 + 指令；私聊：直接发',
      '',
      '• 🧩 **skills** — 查看 Skills 目录（L1／L2／VE-SOP）',
      '  触发：发送 **skills**；完整桌面页见卡片底部链接',
      '',
      '• 📚 **knowledge** / **kb** — 查看 RAG 知识库摘录',
      '  触发：发送 **knowledge** 或 **kb**；完整桌面页见卡片底部链接',
      '',
      '• 📊 **weekly** / **周报** — 本周事件与建议汇总',
      '  触发：发送 **weekly** 或 **周报**；每周五 **16:00（东八区）** 自动推送给 **@Yan Haixiang**',
      '',
      '• ✅ **done** — 结束并归档本次排查',
      '  触发：发送 **done**（排查进行中时）',
      '',
      '• ❓ **help** — 完整说明',
      '  触发：发送 **help**',
      '',
      '_生产操作需人工审批。_',
      '',
      '_我还在 UAT 阶段，有任何问题请报给 @Yan Haixiang。_',
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
      '下面是我能做的事。每條都寫了**怎麼觸發**：',
      '',
      '• 📈 **market** — 市況／XAUUSD 趨勢',
      '  觸發：發送 **market**，或直接問「金價怎麼樣／今日趨勢」',
      '  群聊：先 @我 再發；私聊：直接發',
      '',
      '• 🔍 **investigate** — 貼告警／截圖／表格，引導排查',
      '  觸發：貼上告警原文、截圖或表格；也可先發 **investigate**',
      '  群聊：@我 + 貼上；私聊：直接貼',
      '',
      '• 📊 **review** / **dashboard** — 告警與報告看板',
      '  觸發：發送 **review** 或 **dashboard**',
      '  群聊：@我 + 指令；私聊：直接發',
      '',
      '• 🧩 **skills** — 查看 Skills 目錄（L1／L2／VE-SOP）',
      '  觸發：發送 **skills**；完整桌面頁見卡片底部連結',
      '',
      '• 📚 **knowledge** / **kb** — 查看 RAG 知識庫摘錄',
      '  觸發：發送 **knowledge** 或 **kb**；完整桌面頁見卡片底部連結',
      '',
      '• 📊 **weekly** / **週報** — 本週事件與建議匯總',
      '  觸發：發送 **weekly** 或 **週報**；每週五 **16:00（東八區）** 自動推送給 **@Yan Haixiang**',
      '',
      '• ✅ **done** — 結束並歸檔本次排查',
      '  觸發：發送 **done**（排查進行中時）',
      '',
      '• ❓ **help** — 完整說明',
      '  觸發：發送 **help**',
      '',
      '_生產操作需人工審批。_',
      '',
      '_我還在 UAT 階段，有任何問題請報給 @Yan Haixiang。_',
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
    'Here’s what I can do. Each item includes **how to trigger** it:',
    '',
    '• 📈 **market** — XAUUSD / gold market trends',
    '  Trigger: send **market**, or ask in plain language (e.g. “gold trend today?”)',
    '  Group: @me then send · DM: just send it',
    '',
    '• 🔍 **investigate** — paste an alert, screenshot, or table to dig in',
    '  Trigger: paste alert text / screenshot / table, or send **investigate**',
    '  Group: @me + paste · DM: paste directly',
    '',
    '• 📊 **review** / **dashboard** — alerts & reports board',
    '  Trigger: send **review** or **dashboard**',
    '  Group: @me + command · DM: just send it',
    '',
    '• 🧩 **skills** — browse Skills catalogue (L1 / L2 / VE-SOP)',
    '  Trigger: send **skills**; full desk page link at card footer',
    '',
    '• 📚 **knowledge** / **kb** — browse RAG knowledge excerpts',
    '  Trigger: send **knowledge** or **kb**; full desk page link at card footer',
    '',
    '• 📊 **weekly** — this week’s events & recommendations',
    '  Trigger: send **weekly**; auto-pushed to **@Yan Haixiang** Fridays **16:00 Asia/Shanghai**',
    '',
    '• ✅ **done** — close and archive this investigation',
    '  Trigger: send **done** (while an investigation is open)',
    '',
    '• ❓ **help** — full guide',
    '  Trigger: send **help**',
    '',
    '_Production actions need human approval._',
    '',
    '_I’m still in UAT — please report any issues to @Yan Haixiang._',
  ].join('\n')
}

export function helpReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '你好 🙂 我是 **V Exchange Risk Copilot**（Lark）。',
      '',
      '**我可以做什么**',
      '• 回答 XAUUSD／黄金市况与趋势',
      '• 读取告警文字、图片、表格，引导排查并生成报告',
      '• 从 Skills／知识库（RAG）检索，按新证据调整下一步',
      '• 累积事故与报告，打开告警看板',
      '',
      '**怎么触发（每条）**',
      '',
      '• 📈 **market**',
      '  发送 **market**，或问「金价／趋势」；群聊请先 @我',
      '',
      '• 🔍 **investigate**',
      '  粘贴告警／截图／表格，或发送 **investigate**；群聊请 @我',
      '',
      '• 📊 **review** / **dashboard**',
      '  发送 **review** 或 **dashboard**；群聊请 @我',
      '',
      '• 🧩 **skills**',
      '  发送 **skills** 查看 Skills 目录',
      '',
      '• 📚 **knowledge** / **kb**',
      '  发送 **knowledge** 或 **kb** 查看 RAG 知识库',
      '',
      '• 📊 **weekly** / **周报**',
      '  发送 **weekly** 或 **周报**；每周五 16:00（东八区）自动推送给 @Yan Haixiang',
      '',
      '• ✅ **done**',
      '  排查中发送 **done** 以归档',
      '',
      '• ❓ **help**',
      '  发送 **help** 查看本说明',
      '',
      '_结论与生产操作需人工审批。我会跟随你的语言（中／英）回复。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '你好 🙂 我是 **V Exchange Risk Copilot**（Lark）。',
      '',
      '**我可以做什麼**',
      '• 回答 XAUUSD／黃金市況與趨勢',
      '• 讀取告警文字、圖片、表格，引導排查並生成報告',
      '• 從 Skills／知識庫（RAG）檢索，按新證據調整下一步',
      '• 累積事故與報告，打開告警看板',
      '',
      '**怎麼觸發（每條）**',
      '',
      '• 📈 **market**',
      '  發送 **market**，或問「金價／趨勢」；群聊請先 @我',
      '',
      '• 🔍 **investigate**',
      '  貼上告警／截圖／表格，或發送 **investigate**；群聊請 @我',
      '',
      '• 📊 **review** / **dashboard**',
      '  發送 **review** 或 **dashboard**；群聊請 @我',
      '',
      '• 🧩 **skills**',
      '  發送 **skills** 查看 Skills 目錄',
      '',
      '• 📚 **knowledge** / **kb**',
      '  發送 **knowledge** 或 **kb** 查看 RAG 知識庫',
      '',
      '• 📊 **weekly** / **週報**',
      '  發送 **weekly** 或 **週報**；每週五 16:00（東八區）自動推送給 @Yan Haixiang',
      '',
      '• ✅ **done**',
      '  排查中發送 **done** 以歸檔',
      '',
      '• ❓ **help**',
      '  發送 **help** 查看本說明',
      '',
      '_結論與生產操作需人工審批。我會跟隨你的語言（中／英）回覆。_',
    ].join('\n')
  }
  return [
    'Hi 🙂 I’m **V Exchange Risk Copilot** on Lark.',
    '',
    '**What I can do**',
    '• Answer XAUUSD / gold market trend & condition questions',
    '• Read alerts, text, images, and tables; guide investigation and draft reports',
    '• Retrieve Skills / knowledge (RAG) and adapt next steps from new evidence',
    '• Accumulate incidents & reports; open the alerts board',
    '',
    '**How to trigger each**',
    '',
    '• 📈 **market**',
    '  Send **market**, or ask about gold/trends; in groups @me first',
    '',
    '• 🔍 **investigate**',
    '  Paste alert / screenshot / table, or send **investigate**; in groups @me',
    '',
    '• 📊 **review** / **dashboard**',
    '  Send **review** or **dashboard**; in groups @me',
    '',
    '• 🧩 **skills**',
    '  Send **skills** to browse the Skills catalogue',
    '',
    '• 📚 **knowledge** / **kb**',
    '  Send **knowledge** or **kb** to browse the RAG knowledge base',
    '',
    '• 📊 **weekly**',
    '  Send **weekly**; auto-pushed to @Yan Haixiang Fridays 16:00 Asia/Shanghai',
    '',
    '• ✅ **done**',
    '  During an investigation, send **done** to archive',
    '',
    '• ❓ **help**',
    '  Send **help** for this guide',
    '',
    '_Actions need human approval. I mirror your language (EN / 中文)._',
  ].join('\n')
}
