/**
 * Full planned-function smoke for the Lark Risk Copilot brain.
 * Forces rules path (OPENAI_API_KEY cleared by parent) for deterministic asserts.
 */
import { handleCardAction, handleMessage } from '../api/lark/_lib/agent'
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
  isCasualChat,
  isDeskFaqQuestion,
  isLarkWikiQuestion,
  looksLikeIncidentEvidence,
  needsInaccessibleAccess,
  sharedDocReadReply,
} from '../api/lark/_lib/scope'
import { extractWikiQuery } from '../api/lark/_lib/larkDocs'
import { formatWebSearchAnswer, searchWeb } from '../api/lark/_lib/webSearch'
import {
  buildWeeklyReport,
  shanghaiWeekKey,
  weeklyWindow,
} from '../api/lark/_lib/weeklyReport'
import type { IncidentRecord } from '../api/lark/_lib/types'
import {
  formatRagAnswer,
  loadKnowledge,
  loadSkills,
  preferredActions,
  retrieveRag,
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

async function turn(label: string, text: string, openId = 'smoke_user', chatId = 'smoke_chat') {
  const msg: IncomingMessage = {
    messageId: `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chatId,
    chatType: 'p2p',
    openId,
    messageType: 'text',
    text,
    mentionedBot: true,
    rawContent: JSON.stringify({ text }),
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
  record('safety.risk_ok', detectSafetyViolation('Mark vs Index 48bps investigate') === null, '')

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
  record('intent.offtopic', classifyIntent('What should I cook tonight?', {}) === 'offtopic', '')

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
    const triggerHint =
      lang === 'en'
        ? g.includes('group = @me + keyword') &&
          g.includes('**market**') &&
          (g.includes('Natural language') || g.includes('keywords not required'))
        : g.includes('群聊') &&
          g.includes('@我') &&
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
        g.includes('**market**') &&
        g.includes('investigate') &&
        g.includes('**skills**') &&
        (g.includes('**knowledge**') || g.includes('**kb**')) &&
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
        greetZhBlob.includes('**market**') &&
        greetZhBlob.includes('@我') &&
        (greetZhBlob.includes('自然语言') || greetZhBlob.includes('不必先打出关键词')) &&
        greetZhBlob.includes('[Skills](https://vex-llm-proxy.vercel.app/#/skills)') &&
        greetZhBlob.includes('[知识库](https://vex-llm-proxy.vercel.app/#/knowledge)') &&
        !greetZhBlob.includes('截图欢迎') &&
        !greetZhBlob.includes('生产操作需人工审批'),
    ),
    greetZhBlob.slice(0, 160),
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

  // 7) Offtopic + safety turns
  clearSession('smoke_chat', 'smoke_user')
  const off = await turn('offtopic', 'What should I cook for dinner tonight?')
  record('turn.offtopic_en', Boolean(off.reply?.text?.includes('V Exchange risk')), '')
  clearSession('smoke_chat', 'lang_zh')
  const zhOff = await turn('offtopic-zh', '今晚吃什么', 'lang_zh')
  record(
    'turn.offtopic_zh',
    Boolean(zhOff.reply?.text?.includes('风险管理') || zhOff.reply?.text?.includes('風險管理')) &&
      !Boolean(zhOff.reply?.text?.includes('Thanks for asking')),
    '',
  )
  clearSession('smoke_chat', 'doc_zh')
  const docRead = await turn('doc-read-zh', '你能读取这里面的数据吗', 'doc_zh')
  record(
    'turn.doc_read_zh_not_en_offtopic',
    Boolean(docRead.reply?.card) &&
      (docRead.blob.includes('可以试着读') || docRead.blob.includes('文档')) &&
      !docRead.blob.includes('Thanks for asking') &&
      !docRead.blob.includes('That one'),
    docRead.blob.slice(0, 200),
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
        poli.reply?.text?.includes('風險管理') ||
        poli.reply?.text?.includes('risk'),
    ),
    '',
  )

  // 8) Market (EN + 简)
  clearSession('smoke_chat', 'smoke_user')
  const { fetchMarketSnapshot, formatMarketAnswer } = await import('../api/lark/_lib/market')
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
  record(
    'market.hourly_attached',
    Boolean(liveSnap.hourly?.tldr?.length || liveSnap.hourly?.opportunity || liveSnap.hourly?.risk),
    `tldr=${liveSnap.hourly?.tldr?.length ?? 0} kline=${liveSnap.hourly?.kline?.bars?.length ?? 0}`,
  )

  const mkt = await turn('market', 'market')
  record(
    'turn.market_en',
    Boolean(
      (mkt.blob.includes('Hourly') || mkt.blob.includes('TL;DR') || mkt.blob.includes('📈')) &&
        mkt.blob.includes('Opportunity') &&
        mkt.blob.includes('Risk') &&
        (mkt.blob.includes('UTC+8') || mkt.blob.includes('Last scan')),
    ),
    mkt.blob.slice(0, 160),
  )
  clearSession('smoke_chat', 'mkt_zh')
  const mktZh = await turn('market-zh', '行情', 'mkt_zh')
  record(
    'turn.market_zh',
    Boolean(
      (mktZh.blob.includes('市') || mktZh.blob.includes('📈') || mktZh.blob.includes('扫报') || mktZh.blob.includes('掃報')) &&
        mktZh.blob.includes('TL;DR') &&
        (mktZh.blob.includes('东八区') || mktZh.blob.includes('東八區')),
    ),
    mktZh.blob.slice(0, 160),
  )

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
    greetLater.includes('weekly') &&
      greetLater.includes('周报') &&
      greetLater.includes('Yan Haixiang') &&
      greetLater.includes('UAT') &&
      !greetLater.includes('截图欢迎直接丢过来') &&
      greetLater.includes('wiki'),
    greetLater.slice(0, 120),
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
      (openSkill.blob.includes('Check') || openSkill.blob.includes('**Check**')) &&
      openSkill.blob.includes('•') &&
      (openSkill.blob.includes('Skill ·') || openSkill.blob.includes('L1-07')),
    openSkill.blob.slice(0, 160),
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
    /可能原因|Possible causes|排查路径|Investigation path|研判|Judgement/i.test(invZh.blob),
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
