import { detectSafetyViolation } from './safety.js'
import type { Intent, Lang } from './types.js'

export { detectLang, isZh } from './lang.js'

const MARKET_RE =
  /行情|趋势|趨勢|市况|市況|\bmarket\b|\btrends?\b|\bgold\b|\bxau\b|\bxauusd\b|黄金|黃金|\bdxy\b|美元|波动|波動|基差|\bbps\b|溢价|溢價|折价|折價|\bokx\b|\bbinance\b|\bbybit\b|\bkraken\b|\bkitco\b|\bspot\b|k线|k線|\bcandles?\b/i

const INVESTIGATE_RE =
  /排查|调查|調查|告警|报警|報警|预警|預警|\bincident\b|\balerts?\b|\binvestigate\b|\brca\b|根因|强平|強平|\badl\b|指数源|指數源|\bmarks?\b|\bindex\b|\blp\b|对冲|對沖|拒单|拒單|盘口|盤口|偏差|剔除|无有效源|無有效源|失败|失敗|异常|異常|截图|截圖|表格|\btable\b|\breports?\b|报告|報告|价差|價差|\bspread\b|\[forwarded_card\]|\[merge_forward\]|\[replied_alert\]/i

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
  /告警|报警|報警|预警|預警|\balert\b|\bincident\b|\brca\b|排查|强平|強平|\badl\b|指数源|指數源|\bmarks?\b|\bindex\b|偏差|剔除|无有效源|無有效源|\bbps\b|失败|失敗|异常|異常|截图|截圖|\bseverity\b|P[0-3]\b|价差|價差|\bspread\b|阈值|閾值|买一|賣一|卖一|监控周期|監控週期|\[forwarded_card\]|\[merge_forward\]|\[replied_alert\]/i

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

/**
 * Generate a proceed-based investigation report from the recorded interaction log.
 * Prefer matching while an investigate session is open; also allow explicit phrasing anytime.
 */
export const COMMAND_INV_REPORT =
  /^(?:generate\s*(?:an?\s*)?(?:investigation\s*|case\s*|proceed(?:\s*based)?\s*)?report|investigation\s*report|proceed(?:\s*based)?\s*report|case\s*report|write\s*(?:the\s*)?report|生成(?:排查|过程|過程|进展|進展)?报告|生成(?:排查|過程|進展)?報告|排查报告|排查報告|过程报告|過程報告|进展报告|進展報告|输出报告|輸出報告|出一份报告|出一份報告)\s*[!！.。~]*$/i

export function isInvReportCommand(text: string): boolean {
  const t = text.trim()
  if (COMMAND_INV_REPORT.test(t)) return true
  // Soft: “根据排查过程生成报告 / generate report from this investigation”
  return /(生成|输出|輸出|写|寫).{0,8}(排查|过程|過程|进展|進展)?报告|(generate|write).{0,12}(investigation|proceed|case).{0,8}report/i.test(
    t,
  )
}

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

/**
 * Oscillation / leverage / breaking-news alert status (cron every 15m).
 * Must beat INVESTIGATE_RE which also matches「预警」.
 */
const COMMAND_OSCILLATION =
  /^(?:oscillation(?:\s*alert)?|osc(?:illation)?\s*warn(?:ing)?|震荡行情预警|震盪行情預警|震荡预警|震盪預警|震荡预警状态|震盪預警狀態)\s*$/i

/** Daily 24h morning market digest (cron 09:00 Asia/Shanghai → group). */
const COMMAND_DAILY_MARKET =
  /^(?:daily(?:\s*24h)?(?:\s*market)?(?:\s*report)?|morning(?:\s*report)?|每日\s*24h\s*早报|每日24h早报|每日\s*24\s*小时早报|每日24小時早報|每日早报|每日早報|24h\s*早报|24h早報|24小时早报|24小時早報)\s*$/i

/** Alert optimize desk (CSV / API analysis) — web + Lark greeting entry. */
const COMMAND_ALERT_OPTIMIZE =
  /^(?:alert[\s_-]*optim(?:ize|ise)|alert[\s_-]*tuning|告警优化|告警優化|告警调参|告警調參)\s*$/i

export function isOscillationCommand(text: string): boolean {
  return COMMAND_OSCILLATION.test(text.trim())
}

export function isDailyMarketCommand(text: string): boolean {
  return COMMAND_DAILY_MARKET.test(text.trim())
}

export function isAlertOptimizeCommand(text: string): boolean {
  return COMMAND_ALERT_OPTIMIZE.test(text.trim())
}

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

/**
 * How / what / why / short “X吗” — a question, not an imperative desk instruction.
 * Clear market asks with an instrument still count as market (handled by callers).
 */
export function looksLikeSemanticQuestion(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (isExplicitCommand(t)) return false
  if (looksLikeIncidentEvidence(t)) return false
  // Note: `\b` is useless after CJK — keep CJK openers separate from Latin `\b` openers.
  if (
    /^(怎么|如何|怎样|怎麼|什么是|什麼是|啥是|是什么|是什麼|是什么意思|是什麼意思|为什么|為什麼|为何|為何)/.test(
      t,
    ) ||
    /^(how\s+(do|to|can|does|should|would)|what\s+(is|are|does|do)|why\s+|tell\s+me\s+about|explain)\b/i.test(
      t,
    )
  ) {
    return true
  }
  // Short interrogatives that are not bare command keywords
  if (
    t.length <= 40 &&
    /(?:[?？]\s*$|(?:呢|吗|嗎|呀|啊)\s*[?？!！.。~]*\s*$)/.test(t) &&
    !/^(排查|调查|調查|行情|市况|市況|复盘|複盤|周报|週報|skills?|知识库|知識庫|help|帮助|幫助)\s*[?？!！.。~]*$/i.test(
      t,
    )
  ) {
    return true
  }
  return false
}

/**
 * During an open investigation: user is confused / asking why-how, not pasting the next evidence chunk.
 * These turns should unlock reasoning + business knowledge; normal evidence turns stay Skills-only.
 */
export function looksLikeInvestigationQuestion(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (isExplicitCommand(t) || isInvReportCommand(t) || isStepDoneCommand(t)) return false
  if (looksLikeIncidentEvidence(t)) return false
  if (looksLikeSemanticQuestion(t)) return true
  // Confusion / “I don’t understand this step” without a trailing ?
  if (
    /(看不懂|不懂|不理解|不解|不太明白|搞不清|什么意思|什麼意思|为何要|為何要|为什么要|為什麼要|怎么做|怎麼做|如何操作|怎么查|怎麼查|哪里看|哪裡看|是否应该|是否應該|对吗|對嗎)/i.test(
      t,
    )
  ) {
    return true
  }
  if (
    /(don'?t\s+understand|confused|what\s+does\s+this\s+mean|why\s+(do|should|are)\s+we|how\s+(do|should)\s+i|where\s+(do|should)\s+i\s+(look|check)|is\s+this\s+(correct|right))/i.test(
      t,
    )
  ) {
    return true
  }
  return false
}

/** Clear market question with instrument / desk cue — run market, don't chat-divert. */
export function looksLikeClearMarketAsk(text: string): boolean {
  const t = text.trim()
  return (
    /(xauusd|\bxau\b|gold|黄金|黃金|行情|市况|市況|trend|k线|k線|溢价|溢價|funding|bps|dxy|美元指数|美元指數)/i.test(
      t,
    ) && t.length >= 4
  )
}

export type TurnDisposition = 'execute' | 'clarify' | 'chat'

/**
 * High-level turn policy:
 * - execute — clear instruction / clear market / alert paste
 * - clarify — soft command match but ambiguous (ask before running)
 * - chat — question or idle talk → semantic reply, no command template
 */
export function resolveTurnDisposition(
  text: string,
  intent: Intent,
  opts?: { skipConfirm?: boolean },
): TurnDisposition {
  const t = text.trim()
  if (!t) return 'chat'
  if (opts?.skipConfirm) return 'execute'
  if (intent === 'inv_report') return 'execute'
  if (
    intent === 'greeting' ||
    intent === 'ack_mention' ||
    intent === 'help' ||
    intent === 'safety' ||
    intent === 'general_risk' ||
    intent === 'followup' ||
    intent === 'offtopic'
  ) {
    return intent === 'help' || intent === 'greeting' || intent === 'ack_mention' || intent === 'safety'
      ? 'execute'
      : 'chat'
  }
  if (isExplicitCommand(t, intent)) return 'execute'
  if (intent === 'investigate' && looksLikeIncidentEvidence(t)) return 'execute'
  if (intent === 'market' && looksLikeClearMarketAsk(t) && t.length >= 6) return 'execute'
  if (looksLikePureChat(t) || isCasualChat(t) || looksLikeSemanticQuestion(t)) return 'chat'
  if (needsCommandConfirm(t, intent)) return 'clarify'
  return 'execute'
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
  if (COMMAND_OSCILLATION.test(t)) return 'oscillation'
  if (COMMAND_DAILY_MARKET.test(t)) return 'daily_market'
  if (COMMAND_ALERT_OPTIMIZE.test(t)) return 'alert_optimize'
  if (COMMAND_REVIEW.test(t)) return 'review'
  if (COMMAND_DONE.test(t)) return 'archive'
  // Proceed-based report from recorded interactions (prefer during an open case)
  if (isInvReportCommand(t)) return 'inv_report'
  if (REVIEW_RE.test(t) && !INVESTIGATE_RE.test(t) && !looksLikePureChat(t) && !looksLikeSemanticQuestion(t)) {
    return 'review'
  }

  // Active investigation: treat free-text as evidence/follow-up unless explicit command above
  if (opts.inInvestigateSession) return 'followup'

  // Shared Feishu docs / “can you read this?”
  if (isLarkWikiQuestion(t) || SHARED_DOC_READ_RE.test(t)) return 'general_risk'

  // Pure chat / random life Q — do not steal into soft market/investigate
  if (looksLikePureChat(t) && !looksLikeIncidentEvidence(t)) return 'general_risk'

  // How-to / definition questions about desk topics → answer as chat/Q&A (not open a workflow)
  if (
    looksLikeSemanticQuestion(t) &&
    !looksLikeIncidentEvidence(t) &&
    !(MARKET_RE.test(t) && looksLikeClearMarketAsk(t))
  ) {
    return 'general_risk'
  }

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

/** Explicit keyword command (no soft regex). */
export function isExplicitCommand(text: string, intent?: Intent): boolean {
  const t = text.trim()
  if (!t) return false
  if (intent === 'investigate') return COMMAND_INVESTIGATE.test(t)
  if (intent === 'market') return COMMAND_MARKET.test(t)
  if (intent === 'skills') return COMMAND_SKILLS.test(t)
  if (intent === 'knowledge') return COMMAND_KNOWLEDGE.test(t)
  if (intent === 'weekly') return COMMAND_WEEKLY.test(t)
  if (intent === 'oscillation') return COMMAND_OSCILLATION.test(t)
  if (intent === 'daily_market') return COMMAND_DAILY_MARKET.test(t)
  if (intent === 'alert_optimize') return COMMAND_ALERT_OPTIMIZE.test(t)
  if (intent === 'review') return COMMAND_REVIEW.test(t)
  if (intent === 'help') return COMMAND_HELP.test(t) || HELP_RE.test(t)
  if (intent === 'archive') return COMMAND_DONE.test(t)
  if (intent === 'inv_report') return isInvReportCommand(t)
  return (
    COMMAND_INVESTIGATE.test(t) ||
    COMMAND_MARKET.test(t) ||
    COMMAND_SKILLS.test(t) ||
    COMMAND_KNOWLEDGE.test(t) ||
    COMMAND_WEEKLY.test(t) ||
    COMMAND_OSCILLATION.test(t) ||
    COMMAND_DAILY_MARKET.test(t) ||
    COMMAND_ALERT_OPTIMIZE.test(t) ||
    COMMAND_REVIEW.test(t) ||
    COMMAND_HELP.test(t) ||
    COMMAND_DONE.test(t) ||
    isInvReportCommand(t)
  )
}

const PURE_CHAT_RE =
  /今晚吃|吃什么|吃什麼|午饭|午飯|晚饭|晚飯|早餐|咖啡|奶茶|电影|電影|追剧|好看吗|好看嗎|无聊|無聊|聊聊|随便聊|隨便聊|天气|天氣|下雨|上班好累|好困|周末去哪|週末去哪|推荐.*餐厅|推薦.*餐廳|讲个笑话|講個笑話|你开心吗|你開心嗎|陪我聊|what\s+should\s+i\s+(eat|cook|watch)|how\s+was\s+your\s+day|tell\s+me\s+a\s+joke|i'?m\s+bored|let'?s\s+chat|random\s+question/i

/** Venue / product asks are Q&A — not pure life chat (e.g.「币安你知道吗」). */
const VENUE_OR_PRODUCT_ASK_RE =
  /币安|幣安|binance|okx|bybit|kraken|bitget|永续|永續|交易所|加密货币|加密貨幣|\bbtc\b|\beth\b|bitcoin|ethereum|xauusd|黄金|黃金|funding|mark\b|index\b/i

/**
 * Life / social / random chat — not a desk command.
 * Used so soft market/investigate keywords inside banter do not hijack the turn.
 */
export function looksLikePureChat(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (VENUE_OR_PRODUCT_ASK_RE.test(t)) return false
  if (isCasualChat(t)) return true
  if (PURE_CHAT_RE.test(t) && !looksLikeIncidentEvidence(t)) return true
  // Short personal / opinion Q without risk tokens.
  // Require question particle at end — do NOT match 吗 inside 怎么／什么.
  if (
    t.length <= 40 &&
    /(?:[?？]\s*$|(?:呢|呀|啊|吗|嗎)\s*[?？!！.。~]*\s*$)/.test(t) &&
    !MARKET_RE.test(t) &&
    !INVESTIGATE_RE.test(t) &&
    !BOT_META_RE.test(t) &&
    !DESK_FAQ_RE.test(t) &&
    !SHARED_DOC_READ_RE.test(t) &&
    !LARK_WIKI_RE.test(t)
  ) {
    return true
  }
  return false
}

const CONFIRMABLE: Intent[] = [
  'market',
  'investigate',
  'review',
  'skills',
  'knowledge',
  'weekly',
  'oscillation',
  'daily_market',
]

/**
 * Soft-matched command without clear payload → ask before running.
 * Explicit keywords / alert paste / clear market ask proceed immediately.
 * How-to / chat questions should NOT reach here (routed to general_risk / chat).
 */
export function needsCommandConfirm(text: string, intent: Intent): boolean {
  if (!CONFIRMABLE.includes(intent)) return false
  const t = text.trim()
  if (!t) return false
  if (isExplicitCommand(t, intent)) return false
  if (looksLikePureChat(t) || isCasualChat(t) || looksLikeSemanticQuestion(t)) return false
  if (intent === 'investigate' && looksLikeIncidentEvidence(t)) return false
  // Clear market question with instrument / price cue — run
  if (intent === 'market' && looksLikeClearMarketAsk(t) && t.length >= 6) return false
  // Soft investigate / review without explicit command → clarify
  if (intent === 'investigate' || intent === 'review') return true
  if (intent === 'skills' || intent === 'knowledge' || intent === 'weekly') {
    // Soft catalogue asks that are already intentional — only confirm if very short/vague
    return t.length < 8
  }
  // Soft market without clear instrument
  if (intent === 'market') return true
  return false
}

export function pendingCommandLabel(
  intent: Intent,
  lang: Lang,
): { title: string; action: string } {
  const map: Record<string, { zh: string; en: string }> = {
    market: { zh: '查看行情', en: 'open a market scan' },
    investigate: { zh: '开始排查', en: 'start an investigation' },
    review: { zh: '打开复盘／看板', en: 'open the review / dashboard' },
    skills: { zh: '打开 Skills 目录', en: 'open the Skills catalogue' },
    knowledge: { zh: '打开知识库目录', en: 'open the knowledge catalogue' },
    weekly: { zh: '生成周报', en: 'build the weekly report' },
    oscillation: { zh: '检查震荡行情预警状态', en: 'check oscillation-alert status' },
    daily_market: { zh: '查看每日 24h 早报状态', en: 'check the daily 24h morning report' },
    alert_optimize: { zh: '打开告警优化桌面页', en: 'open the alert-optimize desk page' },
  }
  const row = map[intent] || { zh: '执行该操作', en: 'run that action' }
  if (lang === 'zh-Hans' || lang === 'zh-Hant') {
    return { title: '确认一下', action: row.zh }
  }
  return { title: 'Just to confirm', action: row.en }
}

export function commandConfirmPrompt(lang: Lang, intent: Intent, userText: string): string {
  const { action } = pendingCommandLabel(intent, lang)
  const snippet = userText.replace(/\s+/g, ' ').trim().slice(0, 80)
  if (lang === 'zh-Hans') {
    return [
      `我先确认一下：你是要我 **${action}**，还是只是问问／随便聊聊？`,
      snippet ? `（你刚说：_「${snippet}」_）` : '',
      '',
      '回 **确认** 我就执行；回 **不用**，或直接把问题说清楚，我按聊天答。',
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      `我先確認一下：你是要我 **${action}**，還是只是問問／隨便聊聊？`,
      snippet ? `（你剛說：_「${snippet}」_）` : '',
      '',
      '回 **確認** 我就執行；回 **不用**，或直接把問題說清楚，我按聊天答。',
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    `Quick check — should I **${action}**, or are you just asking / chatting?`,
    snippet ? `(You said: _“${snippet}”_)` : '',
    '',
    'Reply **yes** and I’ll run it; reply **no**, or just clarify the question, and I’ll chat.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function looksLikeCommandConfirm(text: string): boolean {
  const t = text.trim()
  return /^(确认|確認|是的?|好的?|可以|行|继续|繼續|开|開|要|yes|y|ok|okay|confirm|sure|go\s*ahead|do\s*it)\s*[!.。！~]*$/i.test(
    t,
  )
}

export function looksLikeCommandCancel(text: string): boolean {
  const t = text.trim()
  return /^(不用|不要|取消|算了|否|不了|先不|闲聊|閒聊|聊天|no|n|cancel|nah|never\s*mind|chat)\s*[!.。！~]*$/i.test(
    t,
  )
}

/** True when the question is about desk roles / edit permissions (not an incident). */
export function isDeskFaqQuestion(text: string): boolean {
  return DESK_FAQ_RE.test(text.trim())
}

/** True when free-text looks like alert/incident evidence (Skills dump OK). */
export function looksLikeIncidentEvidence(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  // How-to「怎么排查」is a question, not pasted alert evidence
  if (
    t.length < 48 &&
    /^(怎么|如何|怎样|怎麼).{0,6}排查|how\s+(do\s+i\s+)?investigate|what\s+is\s+investigate/i.test(t)
  ) {
    return false
  }
  // Soft “帮我排查一下” without alert payload — command ask, not evidence
  if (
    t.length < 40 &&
    /排查|调查|調查|investigate|告警|报警|報警|alert/i.test(t) &&
    !/(截图|截圖|bps|强平|強平|指数源|指數源|\bmarks?\b|\bindex\b|偏差|剔除|无有效源|無有效源|P[0-3]\b|失败|失敗|异常|異常|\brca\b|severity)/i.test(
      t,
    ) &&
    /^(帮我|請|请|帮忙|麻煩|麻烦|麻烦帮|請幫|请帮)?\s*(排查|调查|調查|investigate|看看告警|看下告警)\s*(一下|下|下呗|一下吧)?\s*[!！.。~]*$/i.test(
      t,
    )
  ) {
    return false
  }
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
      '_桌面页：[知识库](https://quote-ai-troubleshooting-bot.vercel.app/#/knowledge) · [Skills](https://quote-ai-troubleshooting-bot.vercel.app/#/skills)_',
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
      '_桌面頁：[知識庫](https://quote-ai-troubleshooting-bot.vercel.app/#/knowledge) · [Skills](https://quote-ai-troubleshooting-bot.vercel.app/#/skills)_',
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
    '_Desk: [Knowledge](https://quote-ai-troubleshooting-bot.vercel.app/#/knowledge) · [Skills](https://quote-ai-troubleshooting-bot.vercel.app/#/skills)_',
  ].join('\n')
}

/** Questions about this bot’s own runtime (crons, schedule, what I push). */
const BOT_RUNTIME_META_RE =
  /(多少|几个|幾個|有哪些|什么|什麼|哪些).{0,12}(cron|定时|定時|定时任务|定時任務|自动推送|自動推送|早晚报|早報|周报|週報)|(cron|定时|定時).{0,8}(多少|几个|幾個|列表|清单|清單)|(你|bot|助手).{0,8}(会|會|有).{0,8}(自动|自動|定时|定時|推送)|how\s+many\s+crons?|what\s+crons?|cron\s+(jobs?|list|schedule)/i

export function isBotRuntimeMetaQuestion(text: string): boolean {
  return BOT_RUNTIME_META_RE.test(text.trim())
}

/** Honest, conversational answer about configured Vercel crons (no web search). */
export function botRuntimeMetaReply(lang: Lang, question: string): string | null {
  if (!isBotRuntimeMetaQuestion(question)) return null
  if (lang === 'zh-Hans') {
    return [
      '⏱️ 我这边现在挂了 **8** 个 Vercel Cron（都会打到本服务）：',
      '',
      '1. **每日早报** `daily-market-report` — 每天东八区 **09:00**（UTC 01:00）',
      '2. **半小时行情** `market-report` — 每 **30** 分钟（私聊 desk，不在欢迎语功能列表里）',
      '3. **Cron 健康** `cron-health` — 每 **30** 分钟推给你；漏推会红牌 @你',
      '4. **告警提醒 DEMO** `alert-nudge` — 活动日每分钟（知道了可停）',
      '5. **震荡预警** `oscillation-alert` — 每 **15** 分钟（含今日 DEMO 槽）',
      '6. **周报 DEMO** `weekly-demo` — 每 **15** 分钟看一次，今日 **16:00** 槽推一次',
      '7. **正式周报** `weekly-report` — 每周五东八区 **16:00**（UTC 08:00）',
      '8. **cron-tick 兜底** — 每 **5** 分钟在公网别名上扇出上述推送（幂等）',
      '',
      '想看某一条的预览，可以说「早报 dry」或让我帮你手动推一次。',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '⏱️ 我這邊現在掛了 **8** 個 Vercel Cron：',
      '',
      '1. **每日早報** — 每天東八區 **09:00**',
      '2. **半小時行情** — 每 **30** 分鐘（私聊 desk，不在歡迎語功能列表裡）',
      '3. **Cron 健康** — 每 **30** 分鐘推給你；漏推會紅牌 @你',
      '4. **告警提醒 DEMO** — 活動日每分鐘（知道了可停）',
      '5. **震盪預警** — 每 **15** 分鐘',
      '6. **週報 DEMO** — 每 **15** 分鐘看一次，今日 **16:00** 槽推一次',
      '7. **正式週報** — 每週五東八區 **16:00**',
      '8. **cron-tick 兜底** — 每 **5** 分鐘扇出上述推送（冪等）',
      '',
      '想看某一條預覽或手動推一次，直接跟我說就行。',
    ].join('\n')
  }
  return [
    '⏱️ I’ve got **8** Vercel crons wired up:',
    '',
    '1. **Daily morning market** — 09:00 Asia/Shanghai daily',
    '2. **Half-hourly market** — every 30 minutes (private desk DM; not in greeting feature list)',
    '3. **Cron health** — every 30 minutes to you; raises @you on missed pushes',
    '4. **Alert nudge DEMO** — every minute on campaign day (stop with 知道了)',
    '5. **Oscillation alert** — every 15 minutes',
    '6. **Weekly DEMO** — polled every 15 min; fires in today’s 16:00 slot',
    '7. **Weekly report** — Fridays 16:00 Asia/Shanghai',
    '8. **cron-tick catch-up** — every 5 minutes fans out the jobs above on the public alias (idempotent)',
    '',
    'Want a dry-run or a manual push of one of them? Just say which.',
  ].join('\n')
}

/** “你有什么技能／你会什么” — capability overview, not the Skills catalogue dump. */
const BOT_CAPABILITIES_RE =
  /^(你有什么技能|你有什麼技能|你会什么|你會什麼|你能做什么|你能做什麼|你都会什么|你都會什麼|你会干嘛|你會幹嘛|你能干嘛|你能幹嘛|你有哪些本事|你会啥|你會啥)\s*[?？!！.。]*\s*$|(你|bot|助手).{0,6}(有什么|有什麼|会哪些|會哪些|能做).{0,8}(技能|本事|能力|功能)|what\s+can\s+you\s+do|what\s+are\s+your\s+(skills?|capabilities)|your\s+skills?\s*\??\s*$/i

export function isBotCapabilitiesQuestion(text: string): boolean {
  return BOT_CAPABILITIES_RE.test(text.trim())
}

export function botCapabilitiesReply(lang: Lang, question: string): string | null {
  if (!isBotCapabilitiesQuestion(question)) return null
  if (lang === 'zh-Hans') {
    return [
      '🙂 我能帮你这些：',
      '',
      '• **闲聊** — 吃饭、玩笑、随便问，我按聊天回',
      '• **行情** — 说「行情」或问黄金怎么样（群早报见下方定时推送）',
      '• **排查** — 贴告警／截图／表格，我对着 Skills 帮你拆',
      '• **告警优化** — 说「告警优化」打开桌面（告警优化／通用分析）',
      '• **知识／Skills 目录** — 说 **skills** 或 **知识库** 打开清单（桌面 34 个场景）',
      '• **定时推送** — 早报、震荡预警、周报（问「你有多少 cron」可看列表）',
      '',
      '想先看目录还是直接扔一条告警过来？',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🙂 我能幫你這些：',
      '',
      '• **閒聊** — 吃飯、玩笑、隨便問',
      '• **行情** — 說「行情」或問黃金怎麼樣（群早報見下方定時推送）',
      '• **排查** — 貼告警／截圖／表格',
      '• **告警優化** — 說「告警優化」打開桌面（告警優化／通用分析）',
      '• **知識／Skills 目錄** — 說 **skills** 或 **知識庫**',
      '• **定時推送** — 早報、震盪預警、週報',
      '',
      '想先看目錄還是直接丟一條告警過來？',
    ].join('\n')
  }
  return [
    '🙂 Here’s what I can help with:',
    '',
    '• **Chat** — food, banter, random asks',
    '• **Markets** — say **market** or ask about gold (group morning digest is under scheduled pushes)',
    '• **Investigate** — paste an alert, screenshot, or table',
    '• **Alert optimize** — say **alert optimize** for the desk (Alert optimize / General analysis)',
    '• **Skills / knowledge catalogue** — say **skills** or **knowledge**',
    '• **Scheduled pushes** — morning report, oscillation, weekly (ask “how many crons”)',
    '',
    'Want the catalogue, or just drop an alert?',
  ].join('\n')
}

/** Deterministic answer for bot/admin/UAT meta questions. */
export function botMetaReply(lang: Lang, question: string): string | null {
  const runtime = botRuntimeMetaReply(lang, question)
  if (runtime) return runtime
  const caps = botCapabilitiesReply(lang, question)
  if (caps) return caps
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
const CASUAL_FOOD =
  /^(?:今晚吃什么|今晚吃什麼|中午吃什么|中午吃什麼|吃什么|吃什麼|晚饭吃什么|晚飯吃什麼|午饭吃什么|午飯吃什麼|(?:what\s+should\s+i\s+(?:eat|cook)|what(?:'s| is)\s+for\s+(?:dinner|lunch)|dinner\s+ideas?).*)\s*[?？!！.。]*\s*$/i
const CASUAL_WEATHER =
  /^(今天天气|今天天氣|天气怎么样|天氣怎麼樣|下雨了吗|下雨了嗎|how(?:'s| is)\s+the\s+weather)\s*[?？!！.。]*\s*$/i
const CASUAL_BORED =
  /^(好无聊|好無聊|好烦|好煩|无聊|無聊|i'?m\s+bored|so\s+bored)\s*[!！.。~]*\s*$/i
/** “Can you chat / hang out?” — warm yes, never support-ticket clarify. */
const CASUAL_CAN_CHAT =
  /^(你能闲聊吗|你能閒聊嗎|可以闲聊吗|可以閒聊嗎|能聊天吗|能聊天嗎|可以聊天吗|可以聊天嗎|陪我聊[会會下]?|聊会天|聊會兒天|我们聊会|我們聊會|闲聊一下|閒聊一下|can\s+you\s+chat|wanna\s+chat|let'?s\s+chat|do\s+you\s+chat)\s*[?？!！.。~]*\s*$/i

/** “What time is it?” — answer Asia/Shanghai wall clock; never web-search. */
const CASUAL_NOW_TIME =
  /^(现在几点|現在幾點|现在几点了|現在幾點了|几点了|幾點了|几点啦|幾點啦|几点钟|幾點鐘|现在时间|現在時間|现在什么时候|現在什麼時候|报一下时间|報一下時間|报时|報時|what\s+time\s+is\s+it(?:\s+now)?|what'?s\s+the\s+time|current\s+time)\s*[?？!！.。~]*\s*$/i

/** Follow-up after bot missed a time ask — e.g.「我意思时间」「我说时间」. */
const CASUAL_TIME_CLARIFY =
  /^(我意思|我说|我是说|我是說|我指的是|意思是|就是|就是问|就是問)?\s*(时间|時間|几点|幾點|几点了|幾點了|报时|報時|the\s+time|time)\s*[?？!！.。~]*\s*$/i

/** True when the user is asking (or clarifying) the current wall-clock time. */
export function looksLikeNowTimeQuestion(text: string): boolean {
  const t = text.trim()
  return CASUAL_NOW_TIME.test(t) || CASUAL_TIME_CLARIFY.test(t)
}

/** Asia/Shanghai wall clock for chat replies (Feishu users are UTC+8). */
export function formatNowEast8(now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now)
  } catch {
    return now.toISOString()
  }
}

/** Deterministic clock reply — never invent, never search. */
export function nowTimeReply(lang: Lang, question: string, now = new Date()): string | null {
  if (!looksLikeNowTimeQuestion(question)) return null
  const wall = formatNowEast8(now)
  if (lang === 'zh-Hans') {
    return `🕒 现在是 **东八区（Asia/Shanghai）** **${wall}**。`
  }
  if (lang === 'zh-Hant') {
    return `🕒 現在是 **東八區（Asia/Shanghai）** **${wall}**。`
  }
  return `🕒 It’s **${wall}** Asia/Shanghai (UTC+8).`
}

/**
 * “中国在哪个时区 / what timezone is China” — common knowledge, never stub or wiki.
 * Nationwide civil time is UTC+8 (CST / Asia/Shanghai); no DST.
 */
const CASUAL_TIMEZONE_CN =
  /^(中国|中國|国内|國內|大陆|大陸|我们|我們)?\s*(在|是|用)?\s*(哪个|哪個|什么|什麼)?\s*(时区|時區|时区啊|時區啊|timezone|time\s*zone)|^(中国|中國).{0,8}(时区|時區|UTC|东八|東八)|(时区|時區).{0,8}(中国|中國)|what\s+(time\s*)?zone\s+is\s+china|china(?:'s)?\s+(time\s*)?zone|is\s+china\s+(in\s+)?(utc\s*)?\+?\s*8/i

export function looksLikeTimezoneQuestion(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 48) return false
  return CASUAL_TIMEZONE_CN.test(t)
}

/** Deterministic timezone FAQ — China = UTC+8 / Asia/Shanghai. */
export function timezoneReply(lang: Lang, question: string): string | null {
  if (!looksLikeTimezoneQuestion(question)) return null
  if (lang === 'zh-Hans') {
    return [
      '🌏 中国（全国统一民用时间）用 **东八区**，也就是 **UTC+8**。',
      '',
      '• 常用名：**中国标准时间（CST）** / **Asia/Shanghai**',
      '• **不实行夏令时**',
      '• 香港、澳门也是 UTC+8；台湾同样是 UTC+8',
      '',
      `现在东八区时间：**${formatNowEast8()}**`,
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '🌏 中國（全國統一民用時間）用 **東八區**，也就是 **UTC+8**。',
      '',
      '• 常用名：**中國標準時間（CST）** / **Asia/Shanghai**',
      '• **不實行夏令時**',
      '• 香港、澳門也是 UTC+8；台灣同樣是 UTC+8',
      '',
      `現在東八區時間：**${formatNowEast8()}**`,
    ].join('\n')
  }
  return [
    '🌏 China uses **UTC+8** nationwide (China Standard Time).',
    '',
    '• Common labels: **CST** / **Asia/Shanghai**',
    '• **No daylight saving time**',
    '• Hong Kong, Macau, and Taiwan are also UTC+8',
    '',
    `Wall clock now: **${formatNowEast8()}** Asia/Shanghai`,
  ].join('\n')
}

export function isCasualChat(text: string): boolean {
  const t = text.trim()
  return (
    CASUAL_WHO_ME.test(t) ||
    CASUAL_WHO_YOU.test(t) ||
    CASUAL_THANKS.test(t) ||
    CASUAL_HOW.test(t) ||
    CASUAL_BANTER.test(t) ||
    CASUAL_FOOD.test(t) ||
    CASUAL_WEATHER.test(t) ||
    CASUAL_BORED.test(t) ||
    CASUAL_CAN_CHAT.test(t) ||
    looksLikeNowTimeQuestion(t) ||
    looksLikeTimezoneQuestion(t)
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
        '🙋 我是 **报价 AI排查助手**——**CFD 定价风控专家**（与 V Exchange／永续无关）。',
        '',
        '专长 LP→PE→MT 报价链路、旧价成交、Bad Tick、Markout、强平／LP 切源；也会帮你看跨资产行情、翻 Skills／知识库。有定价风控问题直接丢给我就行 🙂',
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        '🙋 我是 **报价 AI排查助手**——**CFD 定價風控專家**（與 V Exchange／永續無關）。',
        '',
        '專長 LP→PE→MT 報價鏈路、舊價成交、Bad Tick、Markout、強平／LP 切源；也會幫你看跨資產行情、翻 Skills／知識庫。有定價風控問題直接丟給我就行 🙂',
      ].join('\n')
    }
    return [
      '🙋 I’m **报价 AI排查助手** — a **CFD pricing risk-control expert** (not V Exchange / not perpetual).',
      '',
      'I focus on LP→PE→MT quote pipeline, stale quote, Bad Tick, markout, stop-out / LP failover — plus multi-asset market scans and Skills / knowledge. Drop me a pricing-risk question anytime 🙂',
    ].join('\n')
  }
  if (CASUAL_WHO_ME.test(t)) {
    const name = (displayName || '').trim()
    if (lang === 'zh-Hans') {
      return name
        ? `🙂 你是 **${name}**呀。这串对话里你是跟我值班聊天的人——想闲聊、看行情或丢告警都行。`
        : '🙂 你是正在跟我聊天的值班同学。花名册我这边不一定读得到，但不影响我们继续聊／看行情／排查。'
    }
    if (lang === 'zh-Hant') {
      return name
        ? `🙂 你是 **${name}**呀。這串對話裡你是跟我值班聊天的人——想閒聊、看行情或丟告警都行。`
        : '🙂 你是正在跟我聊天的值班同學。花名冊我這邊不一定讀得到，但不影響我們繼續聊／看行情／排查。'
    }
    return name
      ? `🙂 You’re **${name}**. In this thread you’re chatting with me on duty — banter, markets, or alerts all fine.`
      : '🙂 You’re the on-duty teammate chatting with me. I may not see a full HR profile, but we can still chat / markets / investigate.'
  }
  if (CASUAL_THANKS.test(t)) {
    if (lang === 'zh-Hans') return '不客气 🙂 想继续聊、看行情或贴告警，都随时叫我。'
    if (lang === 'zh-Hant') return '不客氣 🙂 想繼續聊、看行情或貼告警，都隨時叫我。'
    return 'You’re welcome 🙂 Happy to keep chatting, or dig into markets / alerts anytime.'
  }
  if (CASUAL_HOW.test(t)) {
    if (lang === 'zh-Hans') return '还行，在线陪聊＋值班中 🙂 想吹牛或看行情／CFD 定价告警都行。'
    if (lang === 'zh-Hant') return '還行，在線陪聊＋值班中 🙂 想吹牛或看行情／CFD 定價告警都行。'
    return 'Doing fine — on chat + duty 🙂 Banter or markets / CFD pricing alerts, either works.'
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
  if (CASUAL_FOOD.test(t)) {
    if (lang === 'zh-Hans') {
      return [
        '🍽️ 今晚可以来点轻松的：',
        '',
        '• **麻辣烫／冒菜** — 快、热、选择多',
        '• **日式定食** — 牛丼或咖喱饭，稳妥不踩雷',
        '• **清淡一点** — 番茄鸡蛋面 + 拍黄瓜',
        '',
        '你更想吃辣的、清淡的，还是重油重酱？我帮你收窄。',
      ].join('\n')
    }
    if (lang === 'zh-Hant') {
      return [
        '🍽️ 今晚可以來點輕鬆的：',
        '',
        '• **麻辣燙／冒菜** — 快、熱、選擇多',
        '• **日式定食** — 牛丼或咖哩飯，穩妥不踩雷',
        '• **清淡一點** — 番茄雞蛋麵 + 拍黃瓜',
        '',
        '你更想吃辣的、清淡的，還是重油重醬？我幫你收窄。',
      ].join('\n')
    }
    return [
      '🍽️ Easy dinner picks:',
      '',
      '• **Spicy hotpot / mala** — fast and flexible',
      '• **Rice bowl / curry** — reliable, low regret',
      '• **Lighter** — tomato-egg noodles + a cucumber salad',
      '',
      'Craving spicy, light, or saucy? I’ll narrow it down.',
    ].join('\n')
  }
  if (CASUAL_WEATHER.test(t)) {
    if (lang === 'zh-Hans') {
      return '🌤️ 我这边看不到你窗外实时天气——你那边现在是阴是晴？要出门的话记得看一眼手机天气 App；闷的话室内待着喝点热的也行 🙂'
    }
    if (lang === 'zh-Hant') {
      return '🌤️ 我這邊看不到你窗外即時天氣——你那邊現在是陰是晴？要出門的話記得看一眼手機天氣 App；悶的話室內待著喝點熱的也行 🙂'
    }
    return '🌤️ I can’t see your local sky from here — sunny or grey on your side? Check your weather app before heading out; otherwise stay in with something warm 🙂'
  }
  if (CASUAL_BORED.test(t)) {
    if (lang === 'zh-Hans') {
      return '😌 无聊的时候可以：听首歌晃两分钟、下楼买杯喝的，或者扔个无厘头问题给我贫两句。想看行情也可以，我不催 🙂'
    }
    if (lang === 'zh-Hant') {
      return '😌 無聊的時候可以：聽首歌晃兩分鐘、下樓買杯喝的，或者扔個無厘頭問題給我貧兩句。想看行情也可以，我不催 🙂'
    }
    return '😌 When it’s dull: one song, a quick walk for a drink, or toss me a silly question. Markets are fine too — no rush 🙂'
  }
  if (CASUAL_CAN_CHAT.test(t)) {
    if (lang === 'zh-Hans') {
      return '可以呀 🙂 风控是本职，闲聊也陪。吃什么、贫两句、看行情都行——你先丢一句来。'
    }
    if (lang === 'zh-Hant') {
      return '可以呀 🙂 風控是本職，閒聊也陪。吃什麼、貧兩句、看行情都行——你先丟一句來。'
    }
    return 'Sure 🙂 Risk is the day job, but I’m happy to chat too — food, banter, or markets. Toss me a line.'
  }
  const time = nowTimeReply(lang, t)
  if (time) return time
  const tz = timezoneReply(lang, t)
  if (tz) return tz
  return null
}

/**
 * True when a reply is a rigid menu / “I received you” stub — discard and retry.
 * Used so we do not ship chatbotFallbackReply-shaped LLM output either.
 */
export function isStubMenuReply(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return true
  return /专长.*风控，闲聊也陪|專長.*風控，不過閒聊也陪|CFD 定价风控|CFD 定價風控|CFD pricing risk|I can also chat|say whatever|想说什么都行|想說什麼都行|我接住了|不必发指令|不必發指令|想听我能干啥|想聽我能幹啥|Want what I can do, a market take|我可以按聊天直接答|关于「.{0,48}」——|關於「.{0,48}」——|这块我先接一句|這塊我先接一句|卡在哪一步|哪一层定义|哪一層定義|which step \/ which definition/i.test(
    t,
  )
}

/**
 * Last-resort only — prefer LLM / search / deterministic handlers first.
 * One natural clarifying beat; never a capability menu or「关于「x」——」template.
 */
export function chatbotFallbackReply(lang: Lang, question: string): string {
  const canned =
    botCapabilitiesReply(lang, question) ||
    botRuntimeMetaReply(lang, question) ||
    botMetaReply(lang, question)
  if (canned) return canned
  // Identity / thanks still fine as tiny deterministic fallbacks
  const identity = casualChatReply(lang, question, null)
  if (identity && /你是谁|你是誰|我是谁|我是誰|谢谢|謝謝|thanks|can\s+you\s+chat|你能闲聊|你能閒聊/i.test(question)) {
    return identity
  }
  if (lang === 'zh-Hans') {
    return '我还没完全抓准你的意思——能再说具体一点吗？我想听的那一块是什么，直接说就行 🙂'
  }
  if (lang === 'zh-Hant') {
    return '我還沒完全抓準你的意思——能再說具體一點嗎？你最想弄清的那一塊是什麼，直接說就行 🙂'
  }
  return 'I haven’t quite locked onto what you mean — can you add one concrete detail? Just say the bit you care about 🙂'
}

/** @deprecated Negative-list policy: free-text is no longer refused as offtopic. Kept for callers. */
export function offtopicReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return '可以呀 🙂 我专长是 **CFD 定价风控**，不过闲聊也陪。你想聊什么，或者要看行情／贴定价告警，直接说。'
  }
  if (lang === 'zh-Hant') {
    return '可以呀 🙂 我專長是 **CFD 定價風控**，不過閒聊也陪。你想聊什麼，或者要看行情／貼定價告警，直接說。'
  }
  return 'Sure 🙂 CFD pricing risk is my specialty, but I’m happy to chat too. What’s on your mind — or send a market / pricing alert if you want.'
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
      `${open} 🙂 我是 **报价 AI排查助手**——**CFD 定价风控专家**。`,
      `${open} 👋 **报价 AI排查助手**（CFD 定价风控）在这儿。`,
      `嗨～ ${open}。我是 **报价 AI排查助手**，专做 CFD 定价风控排查。`,
    ]
    return [
      intros[variant]!,
      '',
      '与 V Exchange／永续无关。下面是我能做的事。**中文关键词：群聊 @我 + 关键词；私聊直接说。**',
      '**也可用自然语言／贴告警／截图／表格**（不必先打出关键词）。',
      '',
      '• 📈 **行情** — 加密／股指／外汇／商品跨资产市况',
      '',
      '• 🔍 **排查** — 贴定价告警／截图／表格，引导 CFD RCA',
      '',
      '• 🛠️ **告警优化** — 桌面：告警优化（三槽数据＋方向）／通用分析',
      '',
      '• 📊 **复盘** / **看板** — 告警与报告看板',
      '',
      '• 🧩 **技能** — CFD 定价 RCA（旧价成交／Bad Tick／LP 切源／Markout／…）',
      '',
      '• 📚 **知识库** — CFD Broker Pricing 知识库（含风险场景）',
      '',
      '• 📖 **文档** — 只读检索已授权飞书 Wiki／文档（未授权联系 **@Yan Haixiang**）',
      '',
      '• 📊 **周报** — 本周汇总；每周五 **16:00（东八区）** 自动推送给 **@Yan Haixiang**',
      '',
      '• ⚠️ **震荡行情预警** — 主要品种振幅／突发新闻时，推送群 + **@Yan Haixiang** 私聊',
      '',
      '• ❓ **帮助** — 完整说明',
      '',
      '_说中文我会用中文回复。我还在 UAT 阶段，有问题请报给 @Yan Haixiang。_',
    ].join('\n')
  }

  if (lang === 'zh-Hant') {
    const intros = [
      `${open} 🙂 我是 **报价 AI排查助手**——**CFD 定價風控專家**。`,
      `${open} 👋 **报价 AI排查助手**（CFD 定價風控）在這兒。`,
      `嗨～ ${open}。我是 **报价 AI排查助手**，專做 CFD 定價風控排查。`,
    ]
    return [
      intros[variant]!,
      '',
      '與 V Exchange／永續無關。下面是我能做的事。**中文關鍵詞：群聊 @我 + 關鍵詞；私聊直接說。**',
      '**也可用自然語言／貼告警／截圖／表格**（不必先打出關鍵詞）。',
      '',
      '• 📈 **行情** — 加密／股指／外匯／商品跨資產市況',
      '',
      '• 🔍 **排查** — 貼定價告警／截圖／表格，引導 CFD RCA',
      '',
      '• 🛠️ **告警優化** — 桌面：告警優化（三槽數據＋方向）／通用分析',
      '',
      '• 📊 **複盤** / **看板** — 告警與報告看板',
      '',
      '• 🧩 **技能** — CFD 定價 RCA（舊價成交／Bad Tick／LP 切源／Markout／…）',
      '',
      '• 📚 **知識庫** — CFD Broker Pricing 知識庫（含風險場景）',
      '',
      '• 📖 **文檔** — 唯讀檢索已授權飛書 Wiki／文檔（未授權聯繫 **@Yan Haixiang**）',
      '',
      '• 📊 **週報** — 本週匯總；每週五 **16:00（東八區）** 自動推送給 **@Yan Haixiang**',
      '',
      '• ⚠️ **震盪行情預警** — 主要品種振幅／突發新聞時，推送群 + **@Yan Haixiang** 私聊',
      '',
      '• ❓ **幫助** — 完整說明',
      '',
      '_說中文我會用中文回覆。我還在 UAT 階段，有問題請報給 @Yan Haixiang。_',
    ].join('\n')
  }

  const intros = [
    `${open} 🙂 I’m **报价 AI排查助手** — a **CFD pricing risk-control expert**.`,
    `${open} 👋 **报价 AI排查助手** (CFD pricing risk) here.`,
    `Hey! ${open.toLowerCase().startsWith('good') ? open : 'Nice to see you'}. I’m **报价 AI排查助手**, focused on CFD pricing risk RCA.`,
  ]
  return [
    intros[variant]!,
    '',
    'Not V Exchange / not perpetual. Here’s what I can do. **Keywords: group = @me + keyword; DM = just say the keyword.**',
    '**Natural language / paste alerts / screenshots / tables also work** (keywords not required).',
    '',
    '• 📈 **market** — multi-asset (crypto / equities / FX / commodities)',
    '',
    '• 🔍 **investigate** — paste a pricing alert, screenshot, or table for CFD RCA',
    '',
    '• 🛠️ **alert optimize** — desk: Alert optimize (3 slots + directions) / General analysis',
    '',
    '• 📊 **review** / **dashboard** — alerts & reports board',
    '',
    '• 🧩 **skills** — CFD pricing RCA playbooks (stale quote / Bad Tick / LP failover / …)',
    '',
    '• 📚 **knowledge** / **kb** — CFD Broker Pricing knowledge base',
    '',
    '• 📖 **wiki** — read-only Lark Wiki / Docs (unauthorized → **@Yan Haixiang**)',
    '',
    '• 📊 **weekly** — weekly digest; auto-pushed to **@Yan Haixiang** Fridays **16:00 Asia/Shanghai**',
    '',
    '• ⚠️ **oscillation alert** — major-market vol / breaking news → group + **@Yan Haixiang** DM',
    '',
    '• ❓ **help** — full guide',
    '',
    '_I’m still in UAT — please report any issues to @Yan Haixiang._',
  ].join('\n')
}

export function helpReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '你好 🙂 我是 **报价 AI排查助手**——**CFD 定价风控专家**（Lark；与 V Exchange／永续无关）。',
      '',
      '**中文关键词：群聊 @我 + 关键词；私聊直接说。**',
      '**也可用自然语言／贴告警／截图／表格**（不必先打出关键词）。',
      '',
      '• 📈 **行情** — 加密／股指／外汇／商品跨资产市况',
      '• 🔍 **排查** — 贴定价告警／截图／表格做 CFD RCA',
      '• 🛠️ **告警优化** — 桌面告警优化／通用分析',
      '• 📊 **复盘** / **看板** — 告警看板',
      '• 🧩 **技能** — CFD 定价 RCA（旧价成交／Bad Tick／LP 切源／…）',
      '• 📚 **知识库** — CFD Broker Pricing 知识库',
      '• 📖 **文档** — 飞书 Wiki／文档只读',
      '• 📊 **周报** — 本周汇总（周五 16:00 东八区推送 @Yan Haixiang）',
      '• ⚠️ **震荡行情预警** — 主要品种振幅／突发新闻 → 群 + @Yan Haixiang 私聊',
      '• 🌅 **每日 24h 早报** — 东八区每天 09:00 推群',
      '• ✅ **完成** — 归档本次排查',
      '• ❓ **帮助** — 本说明',
      '',
      '_说中文会用中文回复；English keywords 仍可用。_',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '你好 🙂 我是 **报价 AI排查助手**——**CFD 定價風控專家**（Lark；與 V Exchange／永續無關）。',
      '',
      '**中文關鍵詞：群聊 @我 + 關鍵詞；私聊直接說。**',
      '**也可用自然語言／貼告警／截圖／表格**（不必先打出關鍵詞）。',
      '',
      '• 📈 **行情** — 加密／股指／外匯／商品跨資產市況',
      '• 🔍 **排查** — 貼定價告警／截圖／表格做 CFD RCA',
      '• 🛠️ **告警優化** — 桌面告警優化／通用分析',
      '• 📊 **複盤** / **看板** — 告警看板',
      '• 🧩 **技能** — CFD 定價 RCA（舊價成交／Bad Tick／LP 切源／…）',
      '• 📚 **知識庫** — CFD Broker Pricing 知識庫',
      '• 📖 **文檔** — 飛書 Wiki／文檔唯讀',
      '• 📊 **週報** — 本週匯總（週五 16:00 東八區推送 @Yan Haixiang）',
      '• ⚠️ **震盪行情預警** — 主要品種振幅／突發新聞 → 群 + @Yan Haixiang 私聊',
      '• 🌅 **每日 24h 早報** — 東八區每天 09:00 推群',
      '• ✅ **完成** — 歸檔本次排查',
      '• ❓ **幫助** — 本說明',
      '',
      '_說中文會用中文回覆；English keywords 仍可用。_',
    ].join('\n')
  }
  return [
    'Hi 🙂 I’m **报价 AI排查助手** — a **CFD pricing risk-control expert** on Lark (not V Exchange / not perpetual).',
    '',
    '**Keywords: group = @me + keyword; DM = just say the keyword.**',
    '**Natural language / paste alerts / screenshots / tables also work** (keywords not required).',
    '',
    '• 📈 **market** — multi-asset market trends',
    '• 🔍 **investigate** — paste pricing alert / screenshot / table for CFD RCA',
    '• 🛠️ **alert optimize** — desk Alert optimize / General analysis',
    '• 📊 **review** / **dashboard** — alerts board',
    '• 🧩 **skills** — CFD pricing RCA playbooks (stale quote / Bad Tick / LP failover / …)',
    '• 📚 **knowledge** / **kb** — CFD Broker Pricing knowledge base',
    '• 📖 **wiki** — Lark Wiki / Docs read-only',
    '• 📊 **weekly** — weekly digest (Fri 16:00 Asia/Shanghai → @Yan Haixiang)',
    '• ⚠️ **oscillation alert** — major-market vol / news → group + @Yan Haixiang DM',
    '• 🌅 **daily 24h** — group digest at 09:00 Asia/Shanghai',
    '• ✅ **done** — archive this investigation',
    '• ❓ **help** — this guide',
    '',
    '_I mirror your language (EN / 中文)._',
  ].join('\n')
}
