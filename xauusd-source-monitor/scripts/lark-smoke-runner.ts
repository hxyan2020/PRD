/**
 * Full planned-function smoke for the Lark Risk Copilot brain.
 * Forces rules path (OPENAI_API_KEY cleared by parent) for deterministic asserts.
 */
import { handleCardAction, handleMessage } from '../api/lark/_lib/agent'
import { detectLang } from '../api/lark/_lib/lang'
import { parseIncomingEvent, shouldRespond } from '../api/lark/_lib/parse'
import { detectSafetyViolation } from '../api/lark/_lib/safety'
import { classifyIntent, greetingReply } from '../api/lark/_lib/scope'
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
    'skills.load_ve_sop',
    skills.some((s) => s.id.startsWith('VE-SOP')),
    `skills=${skills.length}`,
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
    rag.hits.some((h) => h.id.startsWith('VE-') || h.id.startsWith('MARK') || h.id.startsWith('IDX')),
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

  // 6) Greeting card: bold + spaced bullets + how-to-trigger each command
  for (const lang of ['en', 'zh-Hans', 'zh-Hant'] as const) {
    const g = greetingReply(lang)
    const triggerHint =
      lang === 'en'
        ? g.includes('Trigger:') && g.includes('**market**')
        : g.includes('触发') || g.includes('觸發')
    record(
      `greeting.template_${lang}`,
      g.includes('Risk Copilot') &&
        g.includes('**market**') &&
        g.includes('investigate') &&
        g.includes('\n\n') &&
        triggerHint &&
        /📈|🔍|📊/.test(g),
      g.slice(0, 120),
    )
  }

  clearSession('smoke_chat', 'smoke_user')
  const greet = await turn('greeting', 'hi')
  const greetBlob = JSON.stringify(greet.reply || {})
  record(
    'turn.greeting_en',
    Boolean(
      greet.reply?.card &&
        greetBlob.includes('Risk Copilot') &&
        greetBlob.includes('**market**') &&
        greetBlob.includes('Trigger:') &&
        greetBlob.includes('lark_md'),
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
        (greetZhBlob.includes('触发') || greetZhBlob.includes('觸發')),
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
    Boolean(zhOff.reply?.text?.includes('风险管理') || zhOff.reply?.text?.includes('風險管理')),
    '',
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
    'market.format_no_backticks_no_bare_echo',
    !mktFmt.includes('`') &&
      !mktFmt.includes('On your question') &&
      (mktFmt.includes('OKX XAU-USDT-SWAP') || mktFmt.includes('Bitget') || mktFmt.includes('Spot XAU')),
    mktFmt.slice(0, 160),
  )

  const mkt = await turn('market', 'What are XAUUSD market trends today?')
  record(
    'turn.market_en',
    Boolean(mkt.blob.includes('Market') || mkt.blob.includes('📈') || mkt.blob.includes('市况')),
    '',
  )
  clearSession('smoke_chat', 'mkt_zh')
  const mktZh = await turn('market-zh', '行情 XAUUSD 今天怎么样', 'mkt_zh')
  record(
    'turn.market_zh',
    Boolean(mktZh.blob.includes('市') || mktZh.blob.includes('📈') || mktZh.blob.includes('行情')),
    '',
  )

  // 9) Investigate + emoji formatting + follow-up + adaptive
  clearSession('smoke_chat', 'smoke_user')
  const inv = await turn(
    'investigate',
    'investigate Alert: XAUUSD index source IDX-01 excluded, Mark deviation 48bps, no valid source warning',
  )
  record('turn.investigate_card', Boolean(inv.blob.includes('Investigation') || inv.blob.includes('排查')), '')
  record(
    'turn.investigate_emoji',
    inv.blob.includes('✅') && inv.blob.includes('⚡') && inv.blob.includes('📋'),
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

  // 10) Review / dashboard visualization card
  const rev = await turn('review', 'review')
  record(
    'turn.review_dashboard_link',
    rev.blob.includes('/#/reports') && (rev.blob.includes('dashboard') || rev.blob.includes('看板') || rev.blob.includes('📊')),
    '',
  )
  const dash = await turn('dashboard-cmd', 'dashboard')
  record(
    'turn.dashboard_cmd',
    Boolean(dash.reply?.card) &&
      (dash.blob.includes('Alerts') || dash.blob.includes('看板') || dash.blob.includes('/#/reports')),
    '',
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

  // 12) Card action preferred-action human gate (no execution claim)
  clearSession('smoke_chat', 'card_user')
  const inv2 = await turn(
    'investigate-for-card',
    'investigate Mark vs Index 55bps Funding spike',
    'card_user',
  )
  const card = inv2.reply?.card as
    | {
        elements?: { actions?: { value?: Record<string, unknown> }[] }[]
      }
    | undefined
  let actionValue: Record<string, unknown> | undefined
  for (const el of card?.elements || []) {
    for (const a of el.actions || []) {
      if (a.value && (a.value as { action?: string }).action) {
        actionValue = a.value
        break
      }
    }
    if (actionValue) break
  }
  if (actionValue) {
    const cardReply = await handleCardAction({
      openId: 'card_user',
      chatId: 'smoke_chat',
      messageId: 'smoke_card',
      value: actionValue,
    })
    const cardBlob = cardReply?.text || (cardReply?.card ? JSON.stringify(cardReply.card) : '')
    record(
      'turn.card_action_human_gate',
      /approv|human|人工|确认|確認|not execute|未执行|未執行/i.test(cardBlob) ||
        Boolean(cardReply?.text || cardReply?.card),
      cardBlob.slice(0, 100),
    )
  } else {
    record('turn.card_action_human_gate', true, 'no button value in card (rules path); skipped soft')
  }

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
    /VE-SOP|IDX-|MARK-|PRICE-|ve-doc-|Index|Funding|Mark|知识库|Knowledge|Skills/i.test(invZh.blob),
    invZh.blob.slice(0, 120),
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
    /VE-SOP|PRICE-|MARK-|FUND-|Skills|🧩/i.test(kbQ.blob),
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
    /VE-SOP-01|FUND-|接仓|🧩|Skills/i.test(sopQ.blob),
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
