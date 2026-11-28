/**
 * Assert Lark keyword commands classify in EN / 简体 / 繁体 and reply language mirrors the trigger.
 * Run: npx tsx scripts/check-cmd-all-langs.ts
 */
import {
  classifyIntent,
  greetingReply,
  helpReply,
  isAlertOptimizeCommand,
  isDailyMarketCommand,
  isExplicitCommand,
  isInvReportCommand,
  isLarkWikiQuestion,
  isOscillationCommand,
  isStepDoneCommand,
} from '../api/lark/_lib/scope.ts'
import { detectLang } from '../api/lark/_lib/lang.ts'

const opts = { inInvestigateSession: false, mentionedBot: true, chatType: 'p2p' as const }

type Row = {
  intent: string
  en: string[]
  hans: string[]
  /** Distinctive Traditional forms — must detect zh-Hant */
  hant: string[]
}

const ROWS: Row[] = [
  { intent: 'market', en: ['market', 'trend', 'trends'], hans: ['行情', '市况', '趋势'], hant: ['市況', '趨勢'] },
  {
    intent: 'investigate',
    en: ['investigate'],
    hans: ['排查', '开始排查', '调查'],
    hant: ['開始排查', '調查'],
  },
  {
    intent: 'review',
    en: ['review', 'dashboard', 'alerts', 'alert board', 'archive'],
    hans: ['复盘', '看板', '仪表盘', '归档'],
    hant: ['複盤', '儀表盤', '歸檔'],
  },
  {
    intent: 'clear_review',
    en: ['clear review', 'clear review history', 'wipe review', 'confirm clear review'],
    hans: ['清空复盘', '清空历史案件', '确认清空复盘'],
    hant: ['清空複盤', '確認清空複盤'],
  },
  {
    intent: 'memory_submit',
    en: ['submit skill', 'submit knowledge', 'propose change'],
    hans: ['提交技能', '提交知识库', '提议修改'],
    hant: ['提交知識庫', '提議修改'],
  },
  { intent: 'help', en: ['help', 'guide', 'commands'], hans: ['帮助', '说明'], hant: ['幫助', '說明'] },
  {
    intent: 'archive',
    en: ['done', 'reset', 'finish'],
    hans: ['完成', '结束排查', '重置'],
    hant: ['結束排查'],
  },
  {
    intent: 'skills',
    en: ['skills', 'skill', 'skill list'],
    hans: ['技能', '技能库', '场景'],
    hant: ['技能庫', '場景'],
  },
  {
    intent: 'knowledge',
    en: ['knowledge', 'kb', 'rag'],
    hans: ['知识库', '知识', '打开知识库'],
    hant: ['知識庫'],
  },
  {
    intent: 'weekly_opt_log',
    en: ['accepted opts', 'accepted opt log', 'weekly opts'],
    hans: ['采纳日志', '已采纳', '采纳优化'],
    hant: ['週報採納', '採納優化'],
  },
  {
    intent: 'admin_console',
    en: ['console', 'admin console', 'desk status'],
    hans: ['控制台', '管理台', '私有控制台'],
    hant: ['控制台狀態', '管理狀態'],
  },
  {
    intent: 'cron_health',
    en: ['cron health', 'health check', 'health report'],
    hans: ['健康报告', '健康检查'],
    hant: ['健康報告', '健康檢查'],
  },
  {
    intent: 'token_usage',
    en: ['token usage', 'tokens', 'token report'],
    hans: ['Token用量', 'token用量', 'token消耗'],
    hant: ['Token用量報表'],
  },
  {
    intent: 'memory_queue',
    en: ['submissions', 'submission queue', 'pending skills'],
    hans: ['待审批', '提交队列', '审批队列'],
    hant: ['待審批', '提交隊列', '審批隊列'],
  },
  {
    intent: 'memory_log',
    en: ['submission log', 'approval log'],
    hans: ['审批日志', '提交日志'],
    hant: ['審批日誌'],
  },
  {
    intent: 'weekly',
    en: ['weekly', 'weekly report', 'week report'],
    hans: ['周报', '本周总结'],
    hant: ['週報', '本週總結'],
  },
  {
    intent: 'oscillation',
    en: ['oscillation', 'oscillation alert', 'osc status'],
    hans: ['震荡预警', '震荡行情', '震荡行情预警'],
    hant: ['震盪預警', '震盪行情', '震盪行情預警'],
  },
  {
    intent: 'daily_market',
    en: ['daily', 'morning report'],
    hans: ['每日早报', '早报', '晨报'],
    hant: ['每日早報', '早報', '晨報'],
  },
  {
    intent: 'alert_optimize',
    en: ['alert optimize', 'alert-optimise'],
    hans: ['告警优化', '优化告警'],
    hant: ['告警優化', '優化告警'],
  },
  { intent: 'greeting', en: ['hi', 'hello'], hans: ['你好', '早上好'], hant: [] },
  { intent: 'general_risk', en: ['wiki'], hans: ['文档'], hant: ['文檔'] },
  {
    intent: 'inv_report',
    en: ['investigation report', 'generate report'],
    hans: ['排查报告', '生成报告'],
    hant: ['排查報告', '生成報告'],
  },
]

const fails: string[] = []

for (const row of ROWS) {
  for (const text of row.en) {
    const intent = classifyIntent(text, opts)
    const lang = detectLang(text, 'zh-Hans')
    if (intent !== row.intent) fails.push(`EN intent ${JSON.stringify(text)} → ${intent} (want ${row.intent})`)
    if (lang !== 'en') fails.push(`EN lang ${JSON.stringify(text)} → ${lang} under ZH session (want en)`)
  }
  for (const text of row.hans) {
    const intent = classifyIntent(text, opts)
    const lang = detectLang(text, 'en')
    if (intent !== row.intent) fails.push(`Hans intent ${JSON.stringify(text)} → ${intent}`)
    if (lang !== 'zh-Hans' && lang !== 'zh-Hant') {
      fails.push(`Hans lang ${JSON.stringify(text)} → ${lang}`)
    }
  }
  for (const text of row.hant) {
    const intent = classifyIntent(text, opts)
    const lang = detectLang(text, 'en')
    if (intent !== row.intent) fails.push(`Hant intent ${JSON.stringify(text)} → ${intent}`)
    if (lang !== 'zh-Hant') fails.push(`Hant lang ${JSON.stringify(text)} → ${lang} (want zh-Hant)`)
  }
}

// Reply bodies match language
const helpEn = helpReply('en')
const helpHans = helpReply('zh-Hans')
const helpHant = helpReply('zh-Hant')
if (!/Keywords/i.test(helpEn) || /关键词|關鍵詞/.test(helpEn)) fails.push('helpReply(en) not English')
if (!/关键词/.test(helpHans)) fails.push('helpReply(zh-Hans) missing 关键词')
if (!/關鍵詞/.test(helpHant)) fails.push('helpReply(zh-Hant) missing 關鍵詞')
for (const lang of ['en', 'zh-Hans', 'zh-Hant'] as const) {
  if (!/Risk Copilot/.test(greetingReply(lang))) fails.push(`greetingReply(${lang}) missing brand`)
}

const helpers: Array<[string, boolean]> = [
  ['osc EN', isOscillationCommand('oscillation alert')],
  ['osc ZH', isOscillationCommand('震荡预警')],
  ['daily EN', isDailyMarketCommand('morning report')],
  ['daily ZH', isDailyMarketCommand('每日早报')],
  ['ao EN', isAlertOptimizeCommand('alert optimize')],
  ['ao ZH', isAlertOptimizeCommand('告警优化')],
  ['step EN', isStepDoneCommand('step done')],
  ['step ZH', isStepDoneCommand('已完成此步')],
  ['invReport EN', isInvReportCommand('generate investigation report')],
  ['invReport ZH', isInvReportCommand('生成排查报告')],
  ['wiki EN', isLarkWikiQuestion('wiki')],
  ['wiki ZH', isLarkWikiQuestion('飞书文档')],
  ['explicit market ZH', isExplicitCommand('行情', 'market')],
  ['explicit market EN', isExplicitCommand('market', 'market')],
]
for (const [name, ok] of helpers) {
  if (!ok) fails.push(`helper ${name}`)
}

if (fails.length) {
  console.error(`CMD_ALL_LANGS_FAIL ${fails.length}`)
  for (const f of fails) console.error(' -', f)
  process.exit(1)
}
console.log('CMD_ALL_LANGS_OK')
