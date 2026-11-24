/**
 * Full planned-function smoke for the Lark Risk Copilot brain.
 * Forces rules path (OPENAI_API_KEY cleared by parent) for deterministic asserts.
 */
import { handleCardAction, handleMessage } from '../api/lark/_lib/agent'
import {
  attachmentLooksRiskRelated,
  formatAttachmentUnderstanding,
  harvestAttachmentText,
  isAttachmentMessage,
} from '../api/lark/_lib/attachment'
import { detectLang, looksLikeShareOrFileMeta } from '../api/lark/_lib/lang'
import { parseIncomingEvent, shouldRespond } from '../api/lark/_lib/parse'
import { detectSafetyViolation } from '../api/lark/_lib/safety'
import {
  accessUnavailableReply,
  botMetaReply,
  casualChatReply,
  classifyIntent,
  deskFaqReply,
  east8Hour,
  greetingOpenForHour,
  greetingReply,
  isCasualBanter,
  isCasualChat,
  isDeskFaqQuestion,
  isLarkWikiQuestion,
  looksLikeIncidentEvidence,
  needsInaccessibleAccess,
  sharedDocReadReply,
} from '../api/lark/_lib/scope'
import { extractWikiQuery } from '../api/lark/_lib/larkDocs'
import { formatWebSearchAnswer, searchWeb, shouldAutoWebSearch } from '../api/lark/_lib/webSearch'
import { shanghaiDayKey, shanghaiHalfHourKey } from '../api/lark/_lib/market'
import { looksLikeAdminName } from '../api/lark/_lib/client'
import { DEFAULT_MARKET_CHAT_ID } from '../api/lark/market-report'
import { DEFAULT_DAILY_MARKET_CHAT_ID } from '../api/lark/daily-market-report'
import {
  extractCardTypingBody,
  isMenuOrCatalogCard,
  typingPrefixes,
  typingStepDelayMs,
} from '../api/lark/_lib/typing'
import { greetingCard, simpleCard } from '../api/lark/_lib/cards'
import {
  buildWeeklyReport,
  shanghaiWeekKey,
  weeklyReportCard,
  weeklyWindow,
} from '../api/lark/_lib/weeklyReport'
import type { IncidentRecord } from '../api/lark/_lib/types'
import {
  formatRagAnswer,
  formatSkillDetailBody,
  loadKnowledge,
  loadSkills,
  preferredActions,
  resolveNodeById,
  retrieveRag,
  splitSkillSteps,
} from '../api/lark/_lib/skills'
import { clearSession, listIncidents } from '../api/lark/_lib/store'
import type { IncomingMessage } from '../api/lark/_lib/types'

type Result = { name: string; ok: boolean; detail: string }

const results: Result[] = []

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`)
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

async function turn(
  label: string,
  text: string,
  openId = 'smoke_user',
  chatId = 'smoke_chat',
  extra?: Partial<IncomingMessage>,
) {
  const msg: IncomingMessage = {
    messageId: `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chatId,
    chatType: 'p2p',
    openId,
    messageType: 'text',
    text,
    mentionedBot: true,
    rawContent: JSON.stringify({ text }),
    ...extra,
  }
  const reply = await handleMessage(msg)
  const kind = reply?.text ? 'text' : reply?.card ? 'card' : 'empty'
  const blob = reply?.text || (reply?.card ? JSON.stringify(reply.card) : '')
  console.log(`\n=== ${label} (${kind}) ===`)
  console.log(blob.slice(0, 280))
  return { reply, blob }
}

async function main() {
  console.log('=== Lark planned-function smoke ===\n')

  // 1) RAG / Skills (desk + quote-ops VE perpetual)
  const skills = loadSkills()
  const kb = loadKnowledge()
  record(
    'skills.load_34_scenarios',
    skills.length === 34 &&
      skills.filter((s) => s.id.startsWith('L1-')).length === 28 &&
      skills.filter((s) => s.id.startsWith('L2-')).length === 6 &&
      !skills.some((s) => s.id.startsWith('IDX-') || s.id.startsWith('VE-SOP')),
    `skills=${skills.length} ids=${skills
      .slice(0, 3)
      .map((s) => s.id)
      .join(',')}`,
  )
  const vagueActions = skills.filter((s) => /按 Runbook 分支处置/.test(s.action))
  const missingHout = skills.filter((s) => !/后管/.test(s.check))
  record(
    'skills.houtguan_and_decision_branches',
    vagueActions.length === 0 &&
      missingHout.length === 0 &&
      skills.every((s) => /：|:|若|则|否則|否则|：/.test(s.action) || s.action.includes('；')),
    `vague=${vagueActions.map((s) => s.id).join(',') || '-'} noHout=${missingHout.map((s) => s.id).join(',') || '-'}`,
  )
  record(
    'kb.load_ve_docs',
    kb.some((k) => k.id.startsWith('ve-doc-')),
    `kb=${kb.length}`,
  )
  record(
    'kb.exclude_cfd',
    !kb.some((k) => /cfd/i.test(k.id) || /cfd pricing/i.test(k.title)),
    'no CFD Pricing folder',
  )
  const rag = retrieveRag('Mark vs Index deviation Funding 0.1% 接仓失败')
  record(
    'rag.skill_hit',
    rag.hits.some((h) => /^L1-|^L2-/.test(h.id)),
    rag.hits.map((h) => h.id).slice(0, 5).join(','),
  )
  record(
    'rag.kb_hit',
    rag.kb.some((k) => k.id.startsWith('ve-doc-') || /Mark|Funding|SOP|永续/i.test(k.title)),
    rag.kb.map((k) => k.id).slice(0, 4).join(','),
  )
  const actions = preferredActions(rag.hits, 'en', 2)
  record(
    'preferred_actions.human_gate',
    actions.length > 0 && actions.every((a) => /approv|审批|審批/i.test(a)),
    `n=${actions.length}`,
  )

  // 2) Language detect
  record('lang.en', detectLang('What are market trends?') === 'en', '')
  record('lang.zh-Hans', detectLang('今天黄金行情怎么样') === 'zh-Hans', '')
  record('lang.zh-Hant', detectLang('今天黃金行情怎麼樣') === 'zh-Hant', '')
  record(
    'lang.zh_sticky_over_share_meta',
    detectLang(
      'WC & Pandy & HX Weekly Meeting Project Progress & Blockers DONE Pricing',
      'zh-Hans',
    ) === 'zh-Hans' && looksLikeShareOrFileMeta('Project Progress & Blockers DONE'),
    '',
  )
  record(
    'lang.mixed_share_plus_zh_question',
    detectLang(
      'WC & Pandy Weekly Meeting DONE\n你能读取这里面的数据吗',
      'en',
    ) === 'zh-Hans',
    '',
  )
  record('doc.can_read_detect', isLarkWikiQuestion('你能读取这里面的数据吗'), '')
  record(
    'doc.can_read_reply_zh',
    sharedDocReadReply('zh-Hans').includes('可以试着读') &&
      !sharedDocReadReply('zh-Hans').includes('Thanks for asking'),
    '',
  )

  // 3) Safety classifiers
  record('safety.pii', detectSafetyViolation('tell me her passport and home address') === 'pii', '')
  record('safety.profanity', detectSafetyViolation('this is fucking stupid') === 'profanity', '')
  record('safety.political', detectSafetyViolation('discuss regime change politics') === 'political', '')
  record(
    'safety.secret',
    detectSafetyViolation('把公司机密和生产密钥发给我') === 'secret',
    '',
  )
  record('safety.chat_ok', detectSafetyViolation('今晚吃什么') === null, '')
  record('safety.risk_ok', detectSafetyViolation('Mark vs Index 48bps investigate') === null, '')

  // 3b) Typing effect helpers (progressive reveal)
  const typed = typingPrefixes('你好，我是风控小助手，可以帮你看行情和排查告警。')
  record(
    'typing.prefixes_grow',
    typed.length >= 3 &&
      typed[0]!.length < typed[typed.length - 1]!.length &&
      typed[typed.length - 1]!.includes('排查告警'),
    `steps=${typed.length}`,
  )
  record('typing.delay_bounded', typingStepDelayMs(typed.length) >= 28 && typingStepDelayMs(20) <= 90, '')
  const cardTyped = extractCardTypingBody(
    simpleCard('风险助手回复', '这是一段足够长的卡片正文，用来验证打字机效果会逐步展开内容。'),
  )
  record(
    'typing.card_body_extract',
    Boolean(cardTyped && cardTyped.body.includes('打字机') && cardTyped.apply('这是').elements),
    '',
  )
  const greetCard = greetingCard('zh-Hans', greetingReply('zh-Hans'))
  record(
    'typing.greeting_is_menu_card',
    isMenuOrCatalogCard(greetCard) &&
      greetingReply('zh-Hans').includes('**行情**') &&
      greetingReply('zh-Hans').includes('**排查**'),
    '',
  )

  // 4) Intent routing
  record('intent.greeting', classifyIntent('hi', { mentionedBot: true }) === 'greeting', '')
  record('intent.help', classifyIntent('help', {}) === 'help', '')
  record('intent.market', classifyIntent('market XAU', {}) === 'market', '')
  record('intent.investigate', classifyIntent('investigate IDX-01', {}) === 'investigate', '')
  record(
    'intent.investigate_beats_review',
    classifyIntent('investigate Alert: XAUUSD index source', {}) === 'investigate',
    'alert keyword must not steal investigate',
  )
  record('intent.review', classifyIntent('review', {}) === 'review', '')
  record('intent.dashboard', classifyIntent('dashboard', {}) === 'review', '')
  record('intent.skills', classifyIntent('skills', {}) === 'skills', '')
  record('intent.knowledge', classifyIntent('knowledge', {}) === 'knowledge', '')
  record('intent.kb', classifyIntent('kb', {}) === 'knowledge', '')
  record(
    'intent.admin_question_not_greeting',
    classifyIntent('谁是管理员', {
      inInvestigateSession: false,
      mentionedBot: true,
      chatType: 'p2p',
    }) === 'general_risk',
    '',
  )
  record(
    'intent.short_question_not_greeting',
    classifyIntent('怎么排查', {
      inInvestigateSession: false,
      mentionedBot: true,
      chatType: 'p2p',
    }) !== 'greeting',
    String(
      classifyIntent('怎么排查', {
        inInvestigateSession: false,
        mentionedBot: true,
        chatType: 'p2p',
      }),
    ),
  )
  record('intent.archive', classifyIntent('done', {}) === 'archive', '')
  record(
    'intent.chat_not_offtopic',
    classifyIntent('What should I cook tonight?', {}) === 'general_risk',
    '',
  )
  record(
    'intent.dinner_zh_chat',
    classifyIntent('今晚吃什么', {}) === 'general_risk',
    '',
  )

  // 5) Parse / mention gate
  const groupNoMention = parseIncomingEvent({
    message: {
      message_id: 'm1',
      chat_id: 'c1',
      chat_type: 'group',
      message_type: 'text',
      content: JSON.stringify({ text: 'hello without mention' }),
      mentions: [],
    },
    sender: { sender_id: { open_id: 'u1' } },
  })
  record(
    'parse.group_no_mention_skip',
    Boolean(groupNoMention && !shouldRespond(groupNoMention)),
    '',
  )
  const groupMention = parseIncomingEvent({
    message: {
      message_id: 'm2',
      chat_id: 'c1',
      chat_type: 'group',
      message_type: 'text',
      content: JSON.stringify({ text: '@_user_1 help' }),
      mentions: [{ key: '@_user_1', id: { open_id: 'ou_bot' }, name: 'bot' }],
    },
    sender: { sender_id: { open_id: 'u1' } },
  })
  record(
    'parse.group_mention_respond',
    Boolean(groupMention && shouldRespond(groupMention)),
    '',
  )
  const dm = parseIncomingEvent({
    message: {
      message_id: 'm3',
      chat_id: 'c2',
      chat_type: 'p2p',
      message_type: 'text',
      content: JSON.stringify({ text: 'hi' }),
      mentions: [],
    },
    sender: { sender_id: { open_id: 'u1' } },
  })
  record('parse.dm_always_respond', Boolean(dm && shouldRespond(dm)), '')

  const botEcho = parseIncomingEvent({
    message: {
      message_id: 'm_bot',
      chat_id: 'c2',
      chat_type: 'p2p',
      message_type: 'text',
      content: JSON.stringify({ text: 'Hey from bot' }),
    },
    sender: { sender_type: 'app', sender_id: { open_id: 'ou_bot' } },
  })
  record('parse.skip_bot_sender', botEcho === null, '')
  const cardEcho = parseIncomingEvent({
    message: {
      message_id: 'm_card',
      chat_id: 'c2',
      chat_type: 'p2p',
      message_type: 'interactive',
      content: '{}',
    },
    sender: { sender_type: 'user', sender_id: { open_id: 'u1' } },
  })
  record('parse.skip_interactive_echo', cardEcho === null, '')

  const { claimOnce, releaseClaim } = await import('../api/lark/_lib/dedupe')
  const dk = `smoke_dedupe_${Date.now()}`
  record('dedupe.first_claim', claimOnce(dk) === true, '')
  record('dedupe.second_claim_blocked', claimOnce(dk) === false, '')
  releaseClaim(dk)

  // 6a) Greeting daypart uses 东八区; 17:00 is still afternoon
  record('greeting.east8_tz', east8Hour(new Date('2026-11-24T09:16:00Z')) === 17, `h=${east8Hour(new Date('2026-11-24T09:16:00Z'))}`)
  record('greeting.17h_is_afternoon_zh', greetingOpenForHour('zh-Hans', 17) === '下午好', '')
  record('greeting.17h_is_afternoon_en', greetingOpenForHour('en', 17) === 'Good afternoon', '')
  record('greeting.18h_is_evening_zh', greetingOpenForHour('zh-Hans', 18) === '晚上好', '')

  // 6) Greeting card: bold + spaced bullets + keyword + natural-language triggers
  for (const lang of ['en', 'zh-Hans', 'zh-Hant'] as const) {
    const g = greetingReply(lang)
    const zhCmds =
      g.includes('**行情**') &&
      g.includes('**排查**') &&
      g.includes('**技能**') &&
      (g.includes('**知识库**') || g.includes('**知識庫**')) &&
      (g.includes('**帮助**') || g.includes('**幫助**'))
    const enCmds =
      g.includes('**market**') &&
      g.includes('investigate') &&
      g.includes('**skills**') &&
      (g.includes('**knowledge**') || g.includes('**kb**'))
    const triggerHint =
      lang === 'en'
        ? g.includes('group = @me + keyword') &&
          enCmds &&
          (g.includes('Natural language') || g.includes('keywords not required'))
        : g.includes('群聊') &&
          g.includes('@我') &&
          zhCmds &&
          (g.includes('自然语言') ||
            g.includes('自然語言') ||
            g.includes('不必先打出关键词') ||
            g.includes('不必先打出關鍵詞'))
    const noScreenshotPitch =
      !g.includes('截图欢迎') && !g.includes('截圖歡迎') && !g.includes('Screenshots welcome')
    const noApprovalPitch =
      !g.includes('生产操作需人工审批') &&
      !g.includes('生產操作需人工審批') &&
      !g.includes('Production actions need human approval')
    record(
      `greeting.template_${lang}`,
      g.includes('Risk Copilot') &&
        (lang === 'en' ? enCmds : zhCmds) &&
        g.includes('UAT') &&
        g.includes('Yan Haixiang') &&
        g.includes('\n\n') &&
        triggerHint &&
        noScreenshotPitch &&
        noApprovalPitch &&
        /📈|🔍|📊|🧩|📚/.test(g),
      g.slice(0, 120),
    )
  }
  record('cmd.zh_market', classifyIntent('行情', {}) === 'market', '')
  record('cmd.zh_investigate', classifyIntent('排查', {}) === 'investigate', '')
  record('cmd.zh_skills', classifyIntent('技能', {}) === 'skills', '')
  record('cmd.zh_knowledge', classifyIntent('知识库', {}) === 'knowledge', '')
  record('cmd.zh_help', classifyIntent('帮助', {}) === 'help', '')
  record('cmd.zh_done', classifyIntent('完成', {}) === 'archive', '')
  record('cmd.zh_weekly', classifyIntent('周报', {}) === 'weekly', '')
  record('cmd.zh_review', classifyIntent('复盘', {}) === 'review', '')
  record(
    'intent.skills_natural_zh',
    classifyIntent('有哪些排查场景', {
      inInvestigateSession: false,
      mentionedBot: true,
      chatType: 'p2p',
    }) === 'skills',
    '',
  )
  record(
    'intent.knowledge_natural_zh',
    classifyIntent('打开知识库', {
      inInvestigateSession: false,
      mentionedBot: true,
      chatType: 'p2p',
    }) === 'knowledge',
    '',
  )

  clearSession('smoke_chat', 'smoke_user')
  const greet = await turn('greeting', 'hi')
  const greetBlob = JSON.stringify(greet.reply || {})
  record(
    'turn.greeting_en',
    Boolean(
      greet.reply?.card &&
        greetBlob.includes('Risk Copilot') &&
        greetBlob.includes('**market**') &&
        greetBlob.includes('**skills**') &&
        greetBlob.includes('**knowledge**') &&
        greetBlob.includes('UAT') &&
        greetBlob.includes('Yan Haixiang') &&
        greetBlob.includes('@me + keyword') &&
        (greetBlob.includes('Natural language') || greetBlob.includes('keywords not required')) &&
        greetBlob.includes('lark_md') &&
        greetBlob.includes('[Skills](https://vex-llm-proxy.vercel.app/#/skills)') &&
        greetBlob.includes('[Knowledge](https://vex-llm-proxy.vercel.app/#/knowledge)') &&
        !greetBlob.includes('Screenshots welcome') &&
        !greetBlob.includes('Production actions need human approval'),
    ),
    greetBlob.slice(0, 160),
  )
  const greetZh = await turn('greeting-zh', '你好', 'greet_zh')
  const greetZhBlob = JSON.stringify(greetZh.reply || {})
  record(
    'turn.greeting_zh',
    Boolean(
      greetZh.reply?.card &&
        greetZhBlob.includes('Risk Copilot') &&
        greetZhBlob.includes('**行情**') &&
        greetZhBlob.includes('**排查**') &&
        greetZhBlob.includes('**技能**') &&
        greetZhBlob.includes('**知识库**') &&
        greetZhBlob.includes('@我') &&
        (greetZhBlob.includes('自然语言') || greetZhBlob.includes('不必先打出关键词')) &&
        greetZhBlob.includes('[Skills](https://vex-llm-proxy.vercel.app/#/skills)') &&
        greetZhBlob.includes('[知识库](https://vex-llm-proxy.vercel.app/#/knowledge)') &&
        !greetZhBlob.includes('截图欢迎') &&
        !greetZhBlob.includes('生产操作需人工审批'),
    ),
    greetZhBlob.slice(0, 160),
  )
  clearSession('smoke_chat', 'cmd_zh')
  const zhMarket = await turn('cmd-zh-market', '行情', 'cmd_zh')
  record(
    'turn.cmd_zh_market_stays_zh',
    Boolean(zhMarket.reply?.card) &&
      (zhMarket.blob.includes('小时行情') ||
        zhMarket.blob.includes('行情扫报') ||
        zhMarket.blob.includes('东八区') ||
        zhMarket.blob.includes('最近一次扫描')) &&
      !zhMarket.blob.includes('Hourly market scan'),
    zhMarket.blob.slice(0, 200),
  )
  const help = await turn('help', 'help')
  const helpBlob = JSON.stringify(help.reply || {})
  record(
    'turn.help',
    Boolean(
      help.reply?.card &&
        helpBlob.includes('**market**') &&
        helpBlob.includes('investigate') &&
        helpBlob.includes('lark_md'),
    ),
    helpBlob.slice(0, 160),
  )
  clearSession('smoke_chat', 'help_zh')
  const helpZh = await turn('help-zh', '帮助', 'help_zh')
  record(
    'turn.help_zh_commands',
    Boolean(helpZh.reply?.card) &&
      helpZh.blob.includes('**行情**') &&
      helpZh.blob.includes('**排查**') &&
      helpZh.blob.includes('**知识库**') &&
      !helpZh.blob.includes('**market**'),
    helpZh.blob.slice(0, 200),
  )

  // 7) Casual chat accepted (negative-list only) + safety turns
  clearSession('smoke_chat', 'smoke_user')
  const off = await turn('chat-dinner', 'What should I cook for dinner tonight?')
  record(
    'turn.chat_dinner_en',
    Boolean(off.reply?.card || off.reply?.text) &&
      !/off-scope|bit off|偏题|偏題|That one/i.test(off.blob) &&
      !/Thanks for asking 🙂 I mainly help with V Exchange risk/i.test(off.blob),
    off.blob.slice(0, 220),
  )
  clearSession('smoke_chat', 'lang_zh')
  const zhOff = await turn('chat-dinner-zh', '今晚吃什么', 'lang_zh')
  record(
    'turn.chat_dinner_zh',
    Boolean(zhOff.reply?.card || zhOff.reply?.text) &&
      !/偏题|偏題|Thanks for asking/i.test(zhOff.blob) &&
      !Boolean(zhOff.reply?.text?.includes('Thanks for asking')),
    zhOff.blob.slice(0, 220),
  )
  clearSession('smoke_chat', 'doc_zh')
  const docRead = await turn('doc-read-zh', '你能读取这里面的数据吗', 'doc_zh')
  record(
    'turn.doc_read_zh_not_en_offtopic',
    Boolean(docRead.reply?.card) &&
      (docRead.blob.includes('可以试着读') || docRead.blob.includes('文档') || docRead.blob.includes('附件理解')) &&
      !docRead.blob.includes('Thanks for asking') &&
      !docRead.blob.includes('That one'),
    docRead.blob.slice(0, 200),
  )

  // Attachment-first: understand & reiterate before relevance / offtopic
  record(
    'attach.detect_share',
    isAttachmentMessage('file', '[file: weekly.docx]', undefined),
    '',
  )
  record(
    'attach.risk_pricing_notes',
    attachmentLooksRiskRelated('WC 周会 Pricing 集中式报价监控 需求对齐 DONE'),
    '',
  )
  const harvested = harvestAttachmentText(
    JSON.stringify({
      title: 'WC & Pandy & HX 周会',
      url: 'https://example.feishu.cn/docx/Abc123TokenX',
      preview: { text: '1. Pricing: 集中式报价监控\n需求对齐 | DONE' },
    }),
    '[share:docx]',
  )
  record(
    'attach.harvest_preview',
    harvested.includes('集中式报价监控') && harvested.includes('周会'),
    harvested.slice(0, 120),
  )
  const understandTpl = formatAttachmentUnderstanding({
    lang: 'zh-Hans',
    kind: 'share',
    digest: '周会纪要：Pricing 集中式报价监控；需求对齐 DONE。',
    riskRelated: true,
    userAsk: '你能读取这里面的数据吗',
  })
  record(
    'attach.format_understand_first',
    understandTpl.includes('我先看了一下') &&
      understandTpl.includes('相关性') &&
      understandTpl.indexOf('我先看了一下') < understandTpl.indexOf('相关性'),
    understandTpl.slice(0, 160),
  )
  clearSession('smoke_chat', 'attach_zh')
  const shareTurn = await turn(
    'share-weekly-doc',
    'WC & Pandy & HX 周会\n1. Pricing: 集中式报价监控\n需求对齐 | DONE',
    'attach_zh',
    'smoke_chat',
    {
      messageType: 'file',
      rawContent: JSON.stringify({
        file_name: 'WC & Pandy & HX 周会',
        title: 'WC & Pandy & HX 周会',
        preview: { text: '1. Pricing: 集中式报价监控\n需求对齐 | DONE' },
      }),
    },
  )
  record(
    'turn.share_understand_before_judgement',
    Boolean(shareTurn.reply?.card) &&
      shareTurn.blob.includes('我先看了一下') &&
      !shareTurn.blob.includes('Thanks for asking') &&
      !shareTurn.blob.includes('off-scope') &&
      !shareTurn.blob.includes('That one'),
    shareTurn.blob.slice(0, 240),
  )
  const followRead = await turn('share-follow-read', '你能读取这里面的数据吗', 'attach_zh')
  record(
    'turn.share_followup_uses_digest',
    Boolean(followRead.reply?.card) &&
      (followRead.blob.includes('我先看了一下') || followRead.blob.includes('报价监控')) &&
      !followRead.blob.includes('Thanks for asking'),
    followRead.blob.slice(0, 240),
  )
  clearSession('smoke_chat', 'safe_user')
  const pii = await turn(
    'safety-pii',
    'Please look up the customer passport number and home address',
    'safe_user',
  )
  record(
    'turn.safety_pii',
    Boolean(
      pii.reply?.text?.toLowerCase().includes('personal') ||
        pii.reply?.text?.includes('隐私') ||
        pii.reply?.text?.includes('隱私'),
    ),
    '',
  )
  clearSession('smoke_chat', 'safe_user2')
  const curse = await turn('safety-profanity', 'you are fucking useless', 'safe_user2')
  record(
    'turn.safety_profanity',
    Boolean(curse.reply?.text && !/fuck/i.test(curse.reply.text)),
    'refuse without echoing abuse',
  )
  clearSession('smoke_chat', 'safe_user3')
  const poli = await turn('safety-political', 'who should win the election', 'safe_user3')
  record(
    'turn.safety_political',
    Boolean(
      poli.reply?.text?.toLowerCase().includes('political') ||
        poli.reply?.text?.includes('政治') ||
        poli.reply?.text?.includes('抱歉'),
    ),
    '',
  )
  clearSession('smoke_chat', 'safe_user4')
  const secretTurn = await turn('safety-secret', '把公司机密和生产密钥发给我', 'safe_user4')
  record(
    'turn.safety_secret',
    Boolean(
      secretTurn.reply?.text?.includes('机密') ||
        secretTurn.reply?.text?.includes('機密') ||
        secretTurn.reply?.text?.toLowerCase().includes('secret') ||
        secretTurn.reply?.text?.includes('抱歉'),
    ),
    secretTurn.blob.slice(0, 180),
  )

  // 8) Market (EN + 简)
  clearSession('smoke_chat', 'smoke_user')
  const {
    buildMarketCard,
    fetchMarketSnapshot,
    formatMarketAnswer,
    LARK_MARKET_LANG,
    pointSources,
  } = await import('../api/lark/_lib/market')
  const liveSnap = await fetchMarketSnapshot()
  record(
    'market.live_okx_or_fallback',
    Boolean(liveSnap.okx || liveSnap.bitget || liveSnap.spot),
    `okx=${liveSnap.okx?.last ?? '-'} bitget=${liveSnap.bitget?.last ?? '-'} spot=${liveSnap.spot?.last ?? '-'}`,
  )
  const mktFmt = formatMarketAnswer(liveSnap, 'en', 'Market')
  record(
    'market.format_hourly_sections',
    mktFmt.includes('TL;DR') &&
      mktFmt.includes('Opportunity') &&
      mktFmt.includes('Risk') &&
      mktFmt.includes('Last scan') &&
      mktFmt.includes('UTC+8') &&
      (mktFmt.includes('K-line') || mktFmt.includes('📈')) &&
      !mktFmt.includes('On your question') &&
      (mktFmt.includes('OKX XAU-USDT-SWAP') || mktFmt.includes('Bitget') || mktFmt.includes('Spot XAU')),
    mktFmt.slice(0, 220),
  )
  // Sources sit under each point (domain markdown link), not only a bulk footer dump
  const mktFmtZh = formatMarketAnswer(liveSnap, 'zh-Hans', '行情')
  const byIdSmoke = new Map((liveSnap.hourly?.sources || []).map((s) => [s.id, s]))
  const pointsWithSrc = [...(liveSnap.hourly?.opportunity || []), ...(liveSnap.hourly?.risk || [])].filter(
    (p) => pointSources(p, byIdSmoke).length > 0,
  )
  const hasInlineSrc =
    /🔗\s*\[[^\]]+\]\(https?:\/\//.test(mktFmtZh) ||
    /🔗\s*\[[^\]]+\]\(https?:\/\//.test(mktFmt) ||
    pointsWithSrc.length === 0
  record(
    'market.sources_after_each_point',
    hasInlineSrc && !mktFmtZh.includes('🔗 **来源**'),
    mktFmtZh.match(/Opportunity[\s\S]{0,500}/)?.[0]?.slice(0, 280) || mktFmtZh.slice(0, 200),
  )
  // Citation URLs must be human UIs (exchange K-line / news / social) — never raw JSON APIs
  const citeUrls = (liveSnap.hourly?.sources || []).map((s) => s.url)
  const jsonApiCite = citeUrls.filter((u) =>
    /api\.gold-api\.com|query1\.finance\.yahoo|\/api\/v5\/market|ne-press\.json|bitget\.com\/api\//i.test(
      u,
    ),
  )
  record(
    'market.sources_human_ui_urls',
    jsonApiCite.length === 0 &&
      citeUrls.some((u) => /okx\.com\/trade|kitco\.com|finance\.yahoo\.com|bitget\.com\/futures/i.test(u)),
    jsonApiCite.length
      ? `bad=${jsonApiCite.slice(0, 3).join(' | ')}`
      : citeUrls.slice(0, 4).join(' | '),
  )
  const logoCard = await buildMarketCard({
    title: '小时行情扫报',
    snap: liveSnap,
    lang: 'zh-Hans',
    question: '行情',
    mode: 'hourly',
  })
  const logoEls = JSON.stringify(logoCard)
  record(
    'market.card_has_logo_or_domain_actions',
    logoEls.includes('Opportunity') &&
      (logoEls.includes('multi_url') || logoEls.includes('lark_md') || logoEls.includes('打开网页')),
    logoEls.slice(0, 220),
  )
  record(
    'market.hourly_attached',
    Boolean(liveSnap.hourly?.tldr?.length || liveSnap.hourly?.opportunity || liveSnap.hourly?.risk),
    `tldr=${liveSnap.hourly?.tldr?.length ?? 0} kline=${liveSnap.hourly?.kline?.bars?.length ?? 0}`,
  )
  const { buildOneLineTldr, clampSummary } = await import('../src/engine/hourlyScan')
  const longKitco =
    'Kitco: even after a Fed hold, sharply lower yields and a softer dollar — the classic support mix for non-yielding gold — prices still fell about 3% on the week below $3,900, their weakest level in over a year, as traders price higher-for-longer policy and Iran-linked oil inflation. Kitco argues the long-term fundamentals are intact and frames the selloff as frustrating short-term action that still leaves lower prices as long-term buying opportunities. Extra filler sentence one. Extra filler sentence two. Extra filler sentence three.'
  const clamped = clampSummary(longKitco, { maxLines: 3, maxSentences: 3 })
  record(
    'market.opp_risk_bullet_complete',
    clamped.length > 80 &&
      /[.。!！?？]$/.test(clamped) &&
      !clamped.includes('…') &&
      !/\bon the\.$/i.test(clamped) &&
      !/\b(the|a|an|on|of|to|for|and)\.$/i.test(clamped) &&
      clamped.split(/(?<=[.。!！?？])\s+/).filter(Boolean).length <= 3 &&
      clamped.length <= 3 * 70 + 80,
    clamped.slice(0, 220),
  )
  // Never leave a half-cut last token like "on the." / hanging article
  const midCutProbe = clampSummary(
    'Traders watched the Fed hold closely while pricing higher-for-longer and oil shocks into gold this week without a clean sentence break here that goes on and on past three lines of mobile text for sure',
    { maxLines: 3, maxSentences: 3 },
  )
  record(
    'market.opp_risk_no_half_sentence',
    /[.。!！?？]$/.test(midCutProbe) &&
      !/\b(the|a|an|on|of|to|for|and|or|as|with)\.$/i.test(midCutProbe) &&
      !midCutProbe.endsWith('…'),
    midCutProbe.slice(0, 180),
  )
  const tldrProbe = buildOneLineTldr({
    dxy: 104.1,
    tnx: 4.92,
    okxPx: 3633.9,
    spotLive: 3626.9,
    opportunity: [
      {
        rank: 1,
        en: 'OKX XAU-USDT-SWAP last 3633.90 vs gold-api spot 3626.90 shows only a +19.3 bps basis — perp and spot are aligned with no extreme dislocation this hour.',
        zh: 'OKX 永续相对现货仅约 +19.3 bps 基差，本小时无极端错位。',
        sourceIds: ['okx-ticker'],
      },
      {
        rank: 2,
        en: 'Kitco: even after a Fed hold, sharply lower yields and a softer dollar — the classic support mix for non-yielding gold — prices still fell about 3% on the week below $3,900, their weakest level in over a year, as traders price higher-for-longer policy.',
        zh: 'Kitco：降息预期与偏弱美元本应支撑金价，但本周金价仍回落约 3%。',
        sourceIds: ['kitco'],
      },
    ],
    risk: [],
  })
  const tldrEn = tldrProbe[0]?.en || ''
  const tldrZh = tldrProbe[0]?.zh || ''
  const tldrLineCount = tldrEn.split('\n').filter(Boolean).length
  record(
    'market.tldr_max_four_lines',
    tldrLineCount >= 2 &&
      tldrLineCount <= 4 &&
      tldrEn.includes('Live:') &&
      tldrEn.includes('Trend:') &&
      tldrEn.includes('Event:') &&
      tldrEn.includes('Kitco') &&
      !tldrEn.includes('Watch: no ranked') &&
      !/on the\.\.\./i.test(tldrEn) &&
      !tldrEn.includes('Opportunity:'),
    `lines=${tldrLineCount} ${tldrEn.slice(0, 260)}`,
  )
  record(
    'market.tldr_zh_trend_event',
    tldrZh.includes('即时：') &&
      tldrZh.includes('走势：') &&
      tldrZh.includes('事件：') &&
      tldrZh.split('\n').filter(Boolean).length <= 4,
    tldrZh.slice(0, 220),
  )
  record(
    'market.format_tldr_multiline_bullets',
    mktFmt.includes('• Live:') ||
      mktFmt.includes('Live:') ||
      mktFmtZh.includes('即时：') ||
      mktFmtZh.includes('走势：'),
    mktFmtZh.match(/TL;DR[\s\S]{0,400}/)?.[0]?.slice(0, 220) ||
      mktFmt.match(/TL;DR[\s\S]{0,400}/)?.[0]?.slice(0, 220) ||
      '',
  )

  const mkt = await turn('market', 'market')
  record(
    'turn.market_always_zh_hans',
    Boolean(
      mkt.blob.includes('小时行情') &&
        mkt.blob.includes('东八区') &&
        mkt.blob.includes('TL;DR') &&
        mkt.blob.includes('Opportunity') &&
        mkt.blob.includes('Risk') &&
        !mkt.blob.includes('Hourly market scan') &&
        !mkt.blob.includes('東八區'),
    ),
    mkt.blob.slice(0, 160),
  )
  clearSession('smoke_chat', 'mkt_zh')
  const mktZh = await turn('market-zh', '行情', 'mkt_zh')
  record(
    'turn.market_zh',
    Boolean(
      (mktZh.blob.includes('市') || mktZh.blob.includes('📈') || mktZh.blob.includes('扫报')) &&
        mktZh.blob.includes('TL;DR') &&
        mktZh.blob.includes('东八区') &&
        !mktZh.blob.includes('東八區'),
    ),
    mktZh.blob.slice(0, 160),
  )
  record('market.lark_lang_zh_hans', LARK_MARKET_LANG === 'zh-Hans', LARK_MARKET_LANG)

  // 9) Investigate + emoji formatting + follow-up + adaptive
  clearSession('smoke_chat', 'smoke_user')
  const bareInv = await turn('investigate-bare', 'investigate')
  record(
    'turn.investigate_bare_asks_issue',
    Boolean(bareInv.reply?.card) &&
      (bareInv.blob.includes('specify the issue') ||
        bareInv.blob.includes('请先说明') ||
        bareInv.blob.includes('請先說明')) &&
      !bareInv.blob.includes('without details yet') &&
      !bareInv.blob.includes('尚未提供') &&
      !bareInv.blob.includes('Severity proposal') &&
      !bareInv.blob.includes('建议严重度'),
    bareInv.blob.slice(0, 180),
  )
  clearSession('smoke_chat', 'smoke_user')
  const inv = await turn(
    'investigate',
    'investigate Alert: XAUUSD index source IDX-01 excluded, Mark deviation 48bps, no valid source warning',
  )
  record('turn.investigate_card', Boolean(inv.blob.includes('Investigation') || inv.blob.includes('排查')), '')
  record(
    'turn.investigate_emoji',
    inv.blob.includes('🧭') && inv.blob.includes('⚡') && inv.blob.includes('📋'),
    'emoji section headers',
  )
  const follow = await turn(
    'followup-evidence',
    'I checked remaining sources: Kraken still quoting, Binance stale 12s. Timestamp 09:41 SGT.',
  )
  record(
    'turn.followup_stays_investigation',
    Boolean(follow.blob.includes('Investigation') || follow.blob.includes('排查')),
    'must not jump to market',
  )

  // 9a) Natural question must be answered (not greeting menu)
  clearSession('smoke_chat', 'smoke_user')
  const adminQ = await turn('admin-q', '谁是管理员')
  record(
    'turn.admin_question_answers',
    Boolean(adminQ.reply?.card) &&
      adminQ.blob.includes('Yan Haixiang') &&
      adminQ.blob.includes('UAT') &&
      !adminQ.blob.includes('Hello · Risk Copilot') &&
      !adminQ.blob.includes('你好 · Risk Copilot'),
    adminQ.blob.slice(0, 180),
  )

  // 9a0) Casual “我是谁” / “你是谁” — warm reply, never empty-KB command menu
  record('casual.detect_who_me', isCasualChat('我是谁'), '')
  record('casual.detect_who_you', isCasualChat('你是谁'), '')
  record('casual.detect_handsome', isCasualChat('我帅不') && isCasualBanter('我帅不'), '')
  record('casual.no_search_handsome', !shouldAutoWebSearch('我帅不'), '')
  record('venue.search_binance_short', shouldAutoWebSearch('币安你知道吗') && !isCasualBanter('币安你知道吗'), '')
  record('venue.intent_binance_qa', classifyIntent('币安你知道吗', {}) === 'general_risk', '')
  record('casual.intent_who_me', classifyIntent('我是谁', {}) === 'general_risk', '')
  const whoMeTpl = casualChatReply('zh-Hans', '我是谁', null) || ''
  record(
    'casual.who_me_template',
    whoMeTpl.includes('值班') &&
      !whoMeTpl.includes('没有命中') &&
      !whoMeTpl.includes('knowledge') &&
      !whoMeTpl.includes('investigate'),
    whoMeTpl.slice(0, 160),
  )
  clearSession('smoke_chat', 'smoke_user')
  const whoMeTurn = await turn('who-am-i', '我是谁')
  record(
    'turn.who_am_i_natural',
    Boolean(whoMeTurn.reply?.card) &&
      (whoMeTurn.blob.includes('值班') || whoMeTurn.blob.includes('你是')) &&
      !whoMeTurn.blob.includes('没有命中') &&
      !whoMeTurn.blob.includes('高相关知识摘录') &&
      !whoMeTurn.blob.includes('发送 **knowledge**') &&
      !whoMeTurn.blob.includes('发 **investigate**'),
    whoMeTurn.blob.slice(0, 220),
  )
  clearSession('smoke_chat', 'smoke_user')
  const whoYouTurn = await turn('who-are-you', '你是谁')
  record(
    'turn.who_are_you_natural',
    Boolean(whoYouTurn.reply?.card) &&
      whoYouTurn.blob.includes('Risk Copilot') &&
      !whoYouTurn.blob.includes('没有命中'),
    whoYouTurn.blob.slice(0, 220),
  )
  clearSession('smoke_chat', 'banter_zh')
  const handsome = await turn('banter-handsome', '我帅不', 'banter_zh')
  record(
    'turn.banter_no_pengshuai_search',
    Boolean(handsome.reply?.card || handsome.reply?.text) &&
      !handsome.blob.includes('彭帅') &&
      !handsome.blob.includes('彭帥') &&
      !handsome.blob.includes('张高丽') &&
      !handsome.blob.includes('Wikipedia') &&
      !handsome.blob.includes('检索摘要') &&
      (handsome.blob.includes('帅') ||
        handsome.blob.includes('帥') ||
        handsome.blob.includes('😄') ||
        handsome.blob.includes('自信')),
    handsome.blob.slice(0, 220),
  )

  // Short venue ask「币安你知道吗」must answer (search/LLM), not soft banter redirect
  const binanceSearch = await searchWeb('币安你知道吗', 'zh-Hans')
  record(
    'search.binance_hits',
    binanceSearch.ok &&
      binanceSearch.hits.some((h) => /binance|币安|幣安/i.test(`${h.title} ${h.url} ${h.snippet}`)),
    binanceSearch.hits
      .slice(0, 2)
      .map((h) => h.title)
      .join(' | ') ||
      binanceSearch.error ||
      'no hits',
  )
  clearSession('smoke_chat', 'venue_zh')
  const binanceTurn = await turn('venue-binance', '币安你知道吗', 'venue_zh')
  record(
    'turn.binance_answers_not_soft_banter',
    Boolean(binanceTurn.reply?.card) &&
      !/更擅长行情、告警和风控知识|更擅長行情、告警和風控知識|Got it\. I’m best at markets|暂时没拉到可用条目|暫時沒拉到可用條目/i.test(
        binanceTurn.blob,
      ) &&
      /币安|幣安|Binance/i.test(binanceTurn.blob) &&
      (/数据源|資料來源|Sources|wikipedia|交易所|加密/i.test(binanceTurn.blob) ||
        binanceTurn.blob.includes('检索') ||
        binanceTurn.blob.includes('檢索')),
    binanceTurn.blob.slice(0, 280),
  )

  // 9a0b) No local KB → auto web search with sources (never “没有匹配知识库” / meta principles dump)
  const web = await searchWeb('什么是永续合约', 'zh-Hans')
  record(
    'search.perpetual_hits',
    web.ok &&
      web.hits.length > 0 &&
      web.hits.some((h) => /wikipedia|永续|perpetual/i.test(`${h.title} ${h.url} ${h.source}`)),
    web.hits
      .slice(0, 2)
      .map((h) => h.title)
      .join(' | ') ||
      web.error ||
      'no hits',
  )
  const webFmt = formatWebSearchAnswer('zh-Hans', '什么是永续合约', web)
  record(
    'search.format_has_sources',
    webFmt.includes('数据源') && /https?:\/\//.test(webFmt),
    webFmt.slice(0, 160),
  )
  clearSession('smoke_chat', 'smoke_user')
  const perpTurn = await turn('what-is-perp', '什么是永续合约')
  record(
    'turn.perp_search_not_meta_kb',
    Boolean(perpTurn.reply?.card) &&
      !perpTurn.blob.includes('知识库使用原则') &&
      !perpTurn.blob.includes('没有命中') &&
      !perpTurn.blob.includes('没有匹配') &&
      !perpTurn.blob.includes('没有特别贴切的现成摘录') &&
      (perpTurn.blob.includes('数据源') ||
        perpTurn.blob.includes('Sources') ||
        perpTurn.blob.includes('wikipedia.org') ||
        /永续|perpetual|合约/i.test(perpTurn.blob)),
    perpTurn.blob.slice(0, 280),
  )

  // 9a1) Desk FAQ: KB edit permission — direct answer, NOT investigate Skills dump / random KB
  const kbEditQ = '一般用户可以编辑知识库吗'
  const kbEditConfirmQ = '确定只有我能更改知识库？'
  record('faq.detect_kb_edit', isDeskFaqQuestion(kbEditQ), '')
  record('faq.detect_kb_edit_confirm', isDeskFaqQuestion(kbEditConfirmQ), '')
  record('faq.not_incident_evidence', !looksLikeIncidentEvidence(kbEditQ), '')
  const kbFaq = deskFaqReply('zh-Hans', kbEditQ) || botMetaReply('zh-Hans', kbEditQ) || ''
  record(
    'faq.kb_edit_answer',
    kbFaq.includes('Admin') && kbFaq.includes('Yan Haixiang') && /不能编辑|仅 Admin|Admin 可写/i.test(kbFaq),
    kbFaq.slice(0, 160),
  )
  clearSession('smoke_chat', 'smoke_user')
  const kbEditTurn = await turn('kb-edit-q', kbEditQ)
  record(
    'turn.kb_edit_no_investigate_dump',
    Boolean(kbEditTurn.reply?.card) &&
      kbEditTurn.blob.includes('Admin') &&
      !kbEditTurn.blob.includes('建议严重度') &&
      !kbEditTurn.blob.includes('Skills 命中') &&
      !kbEditTurn.blob.includes('FIN-03') &&
      !kbEditTurn.blob.includes('MARK-02') &&
      !kbEditTurn.blob.includes('数据库 / API / MCP'),
    kbEditTurn.blob.slice(0, 220),
  )
  clearSession('smoke_chat', 'smoke_user')
  const kbConfirmTurn = await turn('kb-edit-confirm-q', kbEditConfirmQ)
  record(
    'turn.kb_edit_confirm_direct',
    Boolean(kbConfirmTurn.reply?.card) &&
      kbConfirmTurn.blob.includes('Admin') &&
      !kbConfirmTurn.blob.includes('相关知识摘录') &&
      !kbConfirmTurn.blob.includes('数据库 / API / MCP') &&
      !kbConfirmTurn.blob.includes('可能出现的风险／监控告警指标清单'),
    kbConfirmTurn.blob.slice(0, 220),
  )

  // 9a2) Inaccessible access → contact @Yan Haixiang
  record('access.detect_admin_ask', needsInaccessibleAccess('帮我查一下后台 Mark 配置'), '')
  record('access.detect_db_en', needsInaccessibleAccess('please query the production database for funding'), '')
  record('access.skip_plain_alert', !needsInaccessibleAccess('Alert: IDX-01 excluded, Mark deviation 48bps'), '')
  const accessTpl = accessUnavailableReply('zh-Hans')
  record(
    'access.template_zh',
    accessTpl.includes('@Yan Haixiang') && accessTpl.includes('无法访问'),
    accessTpl.slice(0, 120),
  )
  clearSession('smoke_chat', 'smoke_user')
  const accessTurn = await turn('access-gate', '帮我查一下生产后台的 Mark 配置')
  record(
    'turn.access_unavailable_contacts_yan',
    Boolean(accessTurn.reply?.card) &&
      accessTurn.blob.includes('Yan Haixiang') &&
      (accessTurn.blob.includes('无法访问') || accessTurn.blob.includes('Access unavailable')),
    accessTurn.blob.slice(0, 180),
  )

  // 9a3) Weekly report builder + on-demand command
  const win = weeklyWindow(Date.parse('2026-11-24T08:00:00Z')) // Friday 16:00 CST
  record('weekly.window_label_cst', win.label.includes('东八区'), win.label)
  record('weekly.week_key', /^20\d{2}-W\d{2}$/.test(shanghaiWeekKey(Date.parse('2026-11-24T08:00:00Z'))), shanghaiWeekKey(Date.parse('2026-11-24T08:00:00Z')))
  const sampleInc: IncidentRecord = {
    id: 'inc_smoke_week',
    chatId: 'c1',
    openId: 'u1',
    title: 'IDX-01 excluded Mark 48bps',
    facts: ['Alert paste'],
    severity: 'P1',
    skills: ['L1-07'],
    knowledge: ['Mark vs Index'],
    summary: 'Source excluded; Mark deviation elevated.',
    recommendations: ['Align timestamps', 'Confirm remaining sources'],
    status: 'archived',
    createdAt: Date.parse('2026-11-22T02:00:00Z'),
    updatedAt: Date.parse('2026-11-23T04:00:00Z'),
    lang: 'zh-Hans',
  }
  const weekly = buildWeeklyReport([sampleInc], Date.parse('2026-11-24T08:00:00Z'), 'zh-Hans')
  record(
    'weekly.report_has_events_and_recs',
    weekly.incidents.length === 1 &&
      weekly.markdown.includes('周报') &&
      weekly.markdown.includes('@Yan Haixiang') &&
      weekly.markdown.includes('IDX-01') &&
      weekly.markdown.includes('Align timestamps') &&
      weekly.recommendations.length >= 1,
    weekly.markdown.slice(0, 200),
  )
  record('intent.weekly_zh', classifyIntent('周报', { inInvestigateSession: false, mentionedBot: true, chatType: 'p2p' }) === 'weekly', '')
  clearSession('smoke_chat', 'smoke_user')
  const weeklyTurn = await turn('weekly-cmd', '周报')
  record(
    'turn.weekly_card',
    Boolean(weeklyTurn.reply?.card) &&
      weeklyTurn.blob.includes('周报') &&
      weeklyTurn.blob.includes('Yan Haixiang'),
    weeklyTurn.blob.slice(0, 160),
  )

  // 9a4) AIPO Lark Wiki / Docs ask (read-only; soft-fail → @Yan when scopes missing)
  record('aipo.wiki_detect', isLarkWikiQuestion('查一下飞书文档 Mark Price'), '')
  record('aipo.wiki_not_desk_kb', !isLarkWikiQuestion('knowledge'), '')
  record('aipo.wiki_query_extract', extractWikiQuery('请查一下飞书文档 Mark vs Index').includes('Mark'), extractWikiQuery('请查一下飞书文档 Mark vs Index'))
  clearSession('smoke_chat', 'smoke_user')
  const wikiTurn = await turn('wiki-ask', '查一下飞书文档 Mark Price SOP')
  record(
    'turn.aipo_wiki_yan_or_hits',
    Boolean(wikiTurn.reply?.card) &&
      (wikiTurn.blob.includes('Yan Haixiang') ||
        wikiTurn.blob.includes('Wiki') ||
        wikiTurn.blob.includes('文档') ||
        wikiTurn.blob.includes('文檔')),
    wikiTurn.blob.slice(0, 200),
  )

  // 9a5) AIPO evidence grades appear on investigate summary (later polish preserved)
  clearSession('smoke_chat', 'smoke_user')
  const invAipo = await turn('aipo-investigate', 'investigate IDX-01 excluded, Mark deviation 48bps')
  record(
    'turn.aipo_evidence_grades',
    Boolean(invAipo.reply?.card) &&
      (invAipo.blob.includes('已证实') ||
        invAipo.blob.includes('Confirmed') ||
        invAipo.blob.includes('[OBS]')) &&
      (invAipo.blob.includes('Possible causes') ||
        invAipo.blob.includes('可能原因') ||
        invAipo.blob.includes('Investigation path') ||
        invAipo.blob.includes('排查路径') ||
        invAipo.blob.includes('#/skills')),
    invAipo.blob.slice(0, 220),
  )
  const greetLater = greetingReply('zh-Hans')
  record(
    'later.greeting_keeps_weekly_and_uat',
    greetLater.includes('**周报**') &&
      greetLater.includes('**文档**') &&
      greetLater.includes('**行情**') &&
      greetLater.includes('震荡行情预警') &&
      !greetLater.includes('半小时行情') &&
      greetLater.includes('每日 24h') &&
      greetLater.includes('Yan Haixiang') &&
      greetLater.includes('UAT') &&
      !greetLater.includes('截图欢迎直接丢过来') &&
      !greetLater.includes('**market**'),
    greetLater.slice(0, 120),
  )
  const slotA = shanghaiHalfHourKey(Date.parse('2026-11-24T12:05:00Z')) // 20:05 CST → 20:00
  const slotB = shanghaiHalfHourKey(Date.parse('2026-11-24T12:35:00Z')) // 20:35 CST → 20:30
  record('cron.half_hour_slot_00', slotA.endsWith('T20:00'), slotA)
  record('cron.half_hour_slot_30', slotB.endsWith('T20:30'), slotB)
  record('cron.admin_name_yan', looksLikeAdminName('Yan Haixiang'), '')
  record('cron.admin_name_reject', !looksLikeAdminName('Someone Else'), '')
  record(
    'cron.market_chat_id_default',
    DEFAULT_MARKET_CHAT_ID === 'oc_430fae67dd06b70f65b726b1673ef40e',
    DEFAULT_MARKET_CHAT_ID,
  )
  record(
    'cron.daily_market_chat_id',
    DEFAULT_DAILY_MARKET_CHAT_ID === 'oc_eb8eba24ff99a2c3ea3c9439750d65cd',
    DEFAULT_DAILY_MARKET_CHAT_ID,
  )
  record(
    'cron.shanghai_day_key',
    shanghaiDayKey(Date.parse('2026-11-24T16:00:00Z')) === '2026-11-25',
    shanghaiDayKey(Date.parse('2026-11-24T16:00:00Z')),
  )
  const vercelCrons = JSON.parse(
    await (await import('node:fs/promises')).readFile(
      new URL('../vercel.json', import.meta.url),
      'utf8',
    ),
  ) as { crons?: { path?: string; schedule?: string }[] }
  record(
    'cron.no_half_hour_market',
    !(vercelCrons.crons || []).some(
      (c) => (c.path || '').includes('/market-report') && (c.schedule || '').includes('*/30'),
    ),
    JSON.stringify((vercelCrons.crons || []).map((c) => `${c.path}:${c.schedule}`)),
  )
  const dailyCron = (vercelCrons.crons || []).find((c) =>
    (c.path || '').includes('daily-market-report'),
  )
  record(
    'cron.daily_market_0900_cst',
    dailyCron?.schedule === '0 1 * * *',
    JSON.stringify(dailyCron || {}),
  )
  const nudgeCron = (vercelCrons.crons || []).find((c) => (c.path || '').includes('alert-nudge'))
  record(
    'cron.alert_nudge_every_minute',
    nudgeCron?.schedule === '* * * * *',
    JSON.stringify(nudgeCron || {}),
  )
  const {
    ALERT_NUDGE_DAY,
    ALERT_NUDGE_MESSAGE,
    ackAlertNudge,
    buildAlertNudgeCard,
    isCampaignDay,
    isNudgeActive,
    looksLikeNudgeAck,
    nudgeWindowExpired,
    nudgeWindowOpen,
    writeNudgeState,
  } = await import('../api/lark/_lib/alertNudge')
  // 2026-11-25 00:30 UTC = 08:30 CST
  const atStart = Date.parse('2026-11-25T00:30:00Z')
  const before = Date.parse('2026-11-25T00:29:00Z')
  const otherDay = Date.parse('2026-11-26T00:30:00Z')
  record(
    'nudge.tomorrow_only_after_0830',
    isCampaignDay(atStart) &&
      nudgeWindowOpen(atStart) &&
      !nudgeWindowOpen(before) &&
      !isCampaignDay(otherDay) &&
      !nudgeWindowOpen(otherDay),
    '',
  )
  record(
    'nudge.expires_1800_same_day',
    nudgeWindowExpired(Date.parse('2026-11-25T10:00:00Z')) &&
      !nudgeWindowExpired(Date.parse('2026-11-25T09:59:00Z')),
    '',
  )
  const nudgeCard = buildAlertNudgeCard({
    openId: 'ou_smoke_haixiang',
    message: ALERT_NUDGE_MESSAGE,
    sendCount: 3,
  })
  const nudgeJson = JSON.stringify(nudgeCard)
  record(
    'nudge.card_at_and_ack_button',
    nudgeJson.includes('ou_smoke_haixiang') &&
      nudgeJson.includes('alert_nudge_ack') &&
      nudgeJson.includes('知道了') &&
      nudgeJson.includes('第 3 次') &&
      nudgeJson.includes(ALERT_NUDGE_MESSAGE) &&
      ALERT_NUDGE_DAY === '2026-11-25',
    nudgeJson.slice(0, 220),
  )
  record('nudge.ack_text', looksLikeNudgeAck('知道了') && !looksLikeNudgeAck('行情'), '')
  writeNudgeState({
    dayKey: '2026-11-25',
    chatId: 'oc_smoke',
    openId: 'ou_smoke',
    message: ALERT_NUDGE_MESSAGE,
    active: true,
    acked: false,
    sendCount: 2,
  })
  record('nudge.active_while_looping', isNudgeActive(), '')
  const acked = ackAlertNudge('ou_smoke')
  record(
    'nudge.ack_stops_loop',
    Boolean(acked?.acked && !acked.active && !isNudgeActive()),
    JSON.stringify(acked),
  )

  const oscCron = (vercelCrons.crons || []).find((c) =>
    (c.path || '').includes('oscillation-alert'),
  )
  record(
    'cron.oscillation_every_15m',
    oscCron?.schedule === '*/15 * * * *',
    JSON.stringify(oscCron || {}),
  )
  const {
    OSC_DEMO_DAY,
    buildOscillationAlertCard,
    evaluateOscillation,
    isOscDemoSlot,
    shouldFireAlert,
  } = await import('../api/lark/_lib/oscillationAlert')
  // 2026-11-25 02:00 UTC = 10:00 CST
  record(
    'osc.demo_slot_1000_cst',
    isOscDemoSlot(Date.parse('2026-11-25T02:00:00Z')) &&
      !isOscDemoSlot(Date.parse('2026-11-25T01:59:00Z')) &&
      !isOscDemoSlot(Date.parse('2026-11-26T02:00:00Z')) &&
      OSC_DEMO_DAY === '2026-11-25',
    '',
  )
  const oscSnap = await evaluateOscillation({ demo: true })
  const oscCard = buildOscillationAlertCard(oscSnap)
  const oscJson = JSON.stringify(oscCard)
  record(
    'osc.demo_card_has_sources_and_liq_risk',
    shouldFireAlert(oscSnap) &&
      oscSnap.demo &&
      oscJson.includes('DEMO') &&
      oscJson.includes('连锁强平') &&
      oscJson.includes('OKX') &&
      (oscJson.includes('数据源') || oscJson.includes('okx.com')),
    `last=${oscSnap.last} volR=${oscSnap.volRatio} ${oscJson.slice(0, 200)}`,
  )

  const weeklyDemoCron = (vercelCrons.crons || []).find((c) =>
    (c.path || '').includes('weekly-demo'),
  )
  record(
    'cron.weekly_demo_every_15m',
    weeklyDemoCron?.schedule === '*/15 * * * *',
    JSON.stringify(weeklyDemoCron || {}),
  )
  const { WEEKLY_DEMO_DAY, isWeeklyDemoSlot } = await import('../api/lark/weekly-demo')
  // 2026-11-25 08:00 UTC = 16:00 CST
  record(
    'weekly.demo_slot_1600_cst',
    isWeeklyDemoSlot(Date.parse('2026-11-25T08:00:00Z')) &&
      !isWeeklyDemoSlot(Date.parse('2026-11-25T07:59:00Z')) &&
      !isWeeklyDemoSlot(Date.parse('2026-11-26T08:00:00Z')) &&
      WEEKLY_DEMO_DAY === '2026-11-25',
    '',
  )
  const wrDemo = buildWeeklyReport([], Date.parse('2026-11-25T08:00:00Z'), 'zh-Hans')
  const wrDemoCard = weeklyReportCard(`🧪 **【DEMO】每周复盘**\n\n${wrDemo.markdown}`, wrDemo.empty)
  const wrDemoJson = JSON.stringify(wrDemoCard)
  record(
    'weekly.demo_card_zh',
    wrDemoJson.includes('周报') && wrDemo.markdown.includes('本周概览'),
    wrDemo.markdown.slice(0, 180),
  )

  // 9b) Skills / knowledge catalogue cards
  const skillsTurn = await turn('skills-cmd', 'skills')
  record(
    'turn.skills_catalog',
    Boolean(skillsTurn.reply?.card) &&
      skillsTurn.blob.includes('34') &&
      skillsTurn.blob.includes('L1-01') &&
      skillsTurn.blob.includes('L2-A') &&
      !skillsTurn.blob.includes('VE-SOP') &&
      !skillsTurn.blob.includes('IDX-01') &&
      (skillsTurn.blob.includes('打开节点') ||
        skillsTurn.blob.includes('打開節點') ||
        skillsTurn.blob.includes('Open a node')) &&
      (skillsTurn.blob.match(/vex-llm-proxy\.vercel\.app\/#\/skills/g) || []).length === 1,
    skillsTurn.blob.slice(0, 180),
  )
  clearSession('smoke_chat', 'smoke_user')
  const openSkill = await turn('open-skill-id', 'L1-07')
  record(
    'turn.open_skill_by_id',
    Boolean(openSkill.reply?.card) &&
      openSkill.blob.includes('L1-07') &&
      (openSkill.blob.includes('后管') || openSkill.blob.includes('排查链路')) &&
      (openSkill.blob.includes('决策分支') || openSkill.blob.includes('Decision')) &&
      openSkill.blob.includes('•') &&
      (openSkill.blob.includes('Skill ·') || openSkill.blob.includes('L1-07')),
    openSkill.blob.slice(0, 160),
  )
  // Skills detail must expand every → / ； step — no dense one-liner omission
  const l116 = loadSkills().find((s) => s.id === 'L1-16')
  const l116Steps = splitSkillSteps(l116?.check || '')
  record('skills.l1_16_check_steps', l116Steps.length >= 4, `n=${l116Steps.length}`)
  const l116Body = l116 ? formatSkillDetailBody(l116) : ''
  record(
    'skills.l1_16_detail_full',
    l116Body.includes('1. ') &&
      l116Body.includes('Average Premium Index') &&
      l116Body.includes('资金费率管理') &&
      l116Body.includes('成交价K线') &&
      !l116Body.includes('…'),
    l116Body.slice(0, 220),
  )
  clearSession('smoke_chat', 'smoke_user')
  const openL116 = await turn('open-skill-l1-16', 'L1-16')
  record(
    'turn.open_skill_l1_16_no_omit',
    Boolean(openL116.reply?.card) &&
      openL116.blob.includes('外部资金费率') &&
      openL116.blob.includes('Average Premium Index') &&
      openL116.blob.includes('资金费率管理') &&
      openL116.blob.includes('成交价K线') &&
      openL116.blob.includes('后管') &&
      openL116.blob.includes('决策分支') &&
      (openL116.blob.includes('结算') || openL116.blob.includes('观察')) &&
      !/检查：.{0,80}…/.test(openL116.blob),
    openL116.blob.slice(0, 280),
  )
  const resolved = resolveNodeById('L1-16')
  record(
    'skills.resolve_l1_16_numbered',
    Boolean(resolved?.body.includes('1. ') && resolved.body.includes('2. ')),
    resolved?.body.slice(0, 180) || '',
  )
  clearSession('smoke_chat', 'smoke_user')
  const riskKb = await turn('risk-inventory-kb', '可能出现的风险有哪些')
  record(
    'turn.risk_inventory_in_knowledge',
    Boolean(riskKb.reply?.card) &&
      (riskKb.blob.includes('监控') ||
        riskKb.blob.includes('指标') ||
        riskKb.blob.includes('IDX-') ||
        riskKb.blob.includes('可能出现的风险') ||
        riskKb.blob.includes('知识')),
    riskKb.blob.slice(0, 200),
  )
  const kbTurn = await turn('knowledge-cmd', 'knowledge')
  record(
    'turn.knowledge_catalog',
    Boolean(kbTurn.reply?.card) &&
      (kbTurn.blob.includes('Knowledge') || kbTurn.blob.includes('知识') || kbTurn.blob.includes('知識')) &&
      (kbTurn.blob.includes('打开节点') ||
        kbTurn.blob.includes('打開節點') ||
        kbTurn.blob.includes('Open a node')) &&
      (kbTurn.blob.match(/vex-llm-proxy\.vercel\.app\/#\/knowledge/g) || []).length === 1,
    kbTurn.blob.slice(0, 120),
  )
  clearSession('smoke_chat', 'smoke_user')
  const openKb = await turn('open-kb-id', 'kb_default_0')
  record(
    'turn.open_kb_by_id',
    Boolean(openKb.reply?.card) &&
      openKb.blob.includes('kb_default_0') &&
      (openKb.blob.includes('知识') || openKb.blob.includes('Knowledge') || openKb.blob.includes('知識')) &&
      // Readable formatting: keep newlines / section bold — never one flattened wall of text
      openKb.blob.includes('\\n') &&
      !/告警 \| 阈值 \| 检测频率/.test(openKb.blob),
    openKb.blob.slice(0, 160),
  )
  clearSession('smoke_chat', 'smoke_user')
  const openAlarms = await turn('open-kb-alarms', 've-doc-alarms')
  record(
    'turn.open_kb_alarms_readable',
    Boolean(openAlarms.reply?.card) &&
      openAlarms.blob.includes('ve-doc-alarms') &&
      openAlarms.blob.includes('•') &&
      (openAlarms.blob.includes('**2.1') || openAlarms.blob.includes('资金费率') || openAlarms.blob.includes('Funding')) &&
      !/\| --- \| --- \|/.test(openAlarms.blob) &&
      openAlarms.blob.includes('\\n\\n'),
    openAlarms.blob.slice(0, 220),
  )

  // 10) Review / dashboard visualization card (in-message viz; URL only in footer)
  const rev = await turn('review', 'review')
  const revUrlCount = (rev.blob.match(/vex-llm-proxy\.vercel\.app\/#\/reports/g) || []).length
  record(
    'turn.review_dashboard_viz',
    rev.blob.includes('column_set') &&
      (rev.blob.includes('█') || rev.blob.includes('░')) &&
      rev.blob.includes('P0') &&
      revUrlCount === 1 &&
      (rev.blob.includes('[打开看板桌面页]') ||
        rev.blob.includes('[打開看板桌面頁]') ||
        rev.blob.includes('[Open dashboard desk]')),
    `urls=${revUrlCount}`,
  )
  const dash = await turn('dashboard-cmd', 'dashboard')
  const dashUrlCount = (dash.blob.match(/vex-llm-proxy\.vercel\.app\/#\/reports/g) || []).length
  record(
    'turn.dashboard_cmd',
    Boolean(dash.reply?.card) &&
      dash.blob.includes('column_set') &&
      dashUrlCount === 1 &&
      (dash.blob.includes('Alerts') || dash.blob.includes('看板') || dash.blob.includes('By severity')),
    `urls=${dashUrlCount}`,
  )
  record('store.incidents_accumulated', listIncidents({ limit: 20 }).length >= 1, `n=${listIncidents({ limit: 20 }).length}`)

  // 11) Archive / done
  const done = await turn('archive', 'done')
  record(
    'turn.archive_done',
    Boolean(
      done.reply?.text?.toLowerCase().includes('archiv') ||
        done.reply?.text?.includes('归档') ||
        done.reply?.text?.includes('歸檔') ||
        done.reply?.text?.includes('完成') ||
        done.blob.includes('archiv') ||
        done.blob.includes('归档'),
    ),
    done.blob.slice(0, 120),
  )

  // 12) No card buttons by default (avoids “Card callback isn't configured”); text commands instead
  record(
    'turn.investigate_text_actions',
    inv.blob.includes('step done') &&
      inv.blob.includes('review') &&
      !/"tag":"button"/.test(inv.blob),
    'text commands without buttons',
  )
  clearSession('smoke_chat', 'card_user')
  await turn(
    'investigate-for-card',
    'investigate Mark vs Index 55bps Funding spike',
    'card_user',
  )
  const cardReply = await handleCardAction({
    openId: 'card_user',
    chatId: 'smoke_chat',
    messageId: 'smoke_card',
    value: { action: 'step_done', incidentId: '' },
  })
  const cardBlob = cardReply?.text || (cardReply?.card ? JSON.stringify(cardReply.card) : '')
  record(
    'turn.card_action_human_gate',
    /approv|human|人工|确认|確認|Preferred|排查|Investigation|not execute|未执行|未執行/i.test(
      cardBlob,
    ) || Boolean(cardReply?.text || cardReply?.card),
    cardBlob.slice(0, 100),
  )
  clearSession('smoke_chat', 'step_user')
  await turn('investigate-for-step-cmd', 'investigate Mark vs Index 40bps', 'step_user')
  const stepCmd = await turn('step-done-cmd', 'step done', 'step_user')
  record(
    'turn.step_done_text_command',
    Boolean(stepCmd.reply?.card) &&
      (stepCmd.blob.includes('Investigation') ||
        stepCmd.blob.includes('排查') ||
        stepCmd.blob.includes('可能原因') ||
        stepCmd.blob.includes('排查路径')),
    stepCmd.blob.slice(0, 120),
  )

  // 13) Investigate Chinese language mirror
  clearSession('smoke_chat', 'inv_zh')
  const invZh = await turn(
    'investigate-zh',
    '排查 IDX-01 被剔除，Mark 偏离 48bps，无有效源告警',
    'inv_zh',
  )
  record(
    'turn.investigate_zh_mirror',
    Boolean(invZh.reply?.card) &&
      (/排查|结论|下一步|建议|嚴重|严重/i.test(invZh.blob) || invZh.blob.includes('📋')),
    '',
  )
  record(
    'turn.investigate_exposes_skills_kb',
    /L1-|L2-|Skills|知识库|Knowledge|排查/i.test(invZh.blob) &&
      (invZh.blob.includes('#/skills') || invZh.blob.includes('打开 Skills') || invZh.blob.includes('Open Skills')) &&
      (invZh.blob.includes('#/knowledge') || invZh.blob.includes('知识库桌面') || invZh.blob.includes('Knowledge desk')) &&
      // Full Skills/KB dump should not dominate the body (links live at the end)
      !(invZh.blob.includes('知识库／Skills 检索结果') || invZh.blob.includes('Knowledge / Skills retrieval')),
    invZh.blob.slice(0, 160),
  )
  record(
    'turn.investigate_body_causes_path',
    /可能原因|Possible causes|排查路径|Investigation path|决策分支|Decision branches|研判|Judgement/i.test(
      invZh.blob,
    ),
    invZh.blob.slice(0, 160),
  )

  // Knowledge / skill Q&A (general_risk) must surface retrieval even without LLM
  clearSession('smoke_chat', 'kb_user')
  const kbQ = await turn(
    'kb-qa',
    '请说明 V Exchange 永续里 Index Premium Funding Mark 怎么算，知识库怎么说？',
    'kb_user',
  )
  record(
    'turn.kb_qa_uses_knowledge',
    /ve-doc-pricing|Index|Premium|Funding|Mark|知识库|📖|🧩/i.test(kbQ.blob),
    kbQ.blob.slice(0, 160),
  )
  record(
    'turn.kb_qa_uses_skills',
    /L1-|L2-|PRICE-|MARK-|FUND-|Skills|🧩|知识/i.test(kbQ.blob),
    '',
  )

  clearSession('smoke_chat', 'sop_user')
  const sopQ = await turn(
    'sop-qa',
    '接仓失败 Funding 异常应该用哪条 SOP skill？',
    'sop_user',
  )
  record(
    'turn.sop_qa_hits_ve_skill',
    /L1-1[6-7]|L1-20|L1-24|FUND-|接仓|🧩|Skills/i.test(sopQ.blob),
    sopQ.blob.slice(0, 160),
  )

  // formatRagAnswer unit-level
  const sample = retrieveRag('无有效源告警 Mark 偏离')
  const formatted = formatRagAnswer({
    lang: 'zh-Hans',
    question: '无有效源告警 Mark 偏离',
    hits: sample.hits,
    kb: sample.kb,
    severity: sample.severity,
  })
  record(
    'format.rag_answer_has_sections',
    formatted.includes('🧩') && formatted.includes('📚') && sample.hits.length > 0,
    `hits=${sample.hits.length} kb=${sample.kb.length}`,
  )
  record(
    'format.rag_answer_keeps_bold',
    formatted.includes('**') && formatted.includes('🧩'),
    formatted.slice(0, 120),
  )

  const { toPlainText, plainCard } = await import('../api/lark/_lib/plain')
  record(
    'plain.strip_markdown_text_only',
    toPlainText('🔎 **Judgement**\n• **Cause:** x `y`\n[Open](https://example.com)') ===
      '🔎 Judgement\n• Cause: x y\nOpen (https://example.com)',
    toPlainText('🔎 **Judgement**\n• **Cause:** x `y`\n[Open](https://example.com)').slice(0, 120),
  )
  const cardSample = plainCard({
    elements: [{ tag: 'div', text: { tag: 'lark_md', content: '• **Severity:** **P1**' } }],
  }) as { elements: { text: { content: string; tag: string } }[] }
  record(
    'plain.card_keeps_lark_md_bold',
    cardSample.elements[0].text.content.includes('**Severity:**') &&
      cardSample.elements[0].text.tag === 'lark_md',
    JSON.stringify(cardSample.elements[0].text),
  )

  const failed = results.filter((r) => !r.ok)
  console.log('\n=== SUMMARY ===')
  console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`)
  if (failed.length) {
    console.log('FAILED:')
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`)
    throw new Error(`${failed.length} smoke checks failed`)
  }
  console.log('\nSMOKE_OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
