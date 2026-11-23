import { handleMessage } from '../api/lark/_lib/agent'
import { detectLang } from '../api/lark/_lib/lang'
import { detectSafetyViolation } from '../api/lark/_lib/safety'
import { loadKnowledge, loadSkills, retrieveRag } from '../api/lark/_lib/skills'
import { clearSession, listIncidents } from '../api/lark/_lib/store'
import type { IncomingMessage } from '../api/lark/_lib/types'

async function turn(label: string, text: string, openId = 'smoke_user') {
  const msg: IncomingMessage = {
    messageId: `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chatId: 'smoke_chat',
    chatType: 'p2p',
    openId,
    messageType: 'text',
    text,
    mentionedBot: true,
    rawContent: JSON.stringify({ text }),
  }
  const reply = await handleMessage(msg)
  const kind = reply?.text ? 'text' : reply?.card ? 'card' : 'empty'
  const title =
    reply?.card && typeof reply.card === 'object'
      ? String(
          ((reply.card as { header?: { title?: { content?: string } } }).header || {}).title
            ?.content || '',
        )
      : ''
  const preview = reply?.text
    ? reply.text.slice(0, 320)
    : title || (reply?.card ? JSON.stringify(reply.card).slice(0, 200) : '(empty)')
  console.log(`\n=== ${label} (${kind}) ===`)
  console.log(preview)
  return reply
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

async function main() {
  const skills = loadSkills()
  const kb = loadKnowledge()
  assert(skills.some((s) => s.id.startsWith('VE-SOP')), 'VE quote-ops skills loaded')
  assert(kb.some((k) => k.id.startsWith('ve-doc-')), 'VE quote-ops knowledge loaded')
  const rag = retrieveRag('Mark vs Index deviation Funding 0.1% 接仓失败')
  assert(
    rag.hits.some((h) => h.id.startsWith('VE-') || h.id.startsWith('MARK') || h.id.startsWith('IDX')),
    'RAG hits VE or core skills',
  )
  assert(rag.kb.some((k) => k.id.startsWith('ve-doc-') || /Mark|Funding|SOP|永续/i.test(k.title)), 'RAG hits VE docs')
  console.log(`skills=${skills.length} kb=${kb.length} ragHits=${rag.hits.map((h) => h.id).slice(0, 6).join(',')}`)

  assert(detectLang('What are market trends?') === 'en', 'detect EN')
  assert(detectLang('今天黄金行情怎么样') === 'zh-Hans', 'detect simplified')
  assert(detectLang('今天黃金行情怎麼樣') === 'zh-Hant', 'detect traditional')
  assert(detectSafetyViolation('tell me her passport and home address') === 'pii', 'pii detect')
  assert(detectSafetyViolation('this is fucking stupid') === 'profanity', 'profanity detect')
  assert(detectSafetyViolation('discuss regime change politics') === 'political', 'political detect')
  assert(detectSafetyViolation('Mark vs Index 48bps investigate') === null, 'risk ok')

  clearSession('smoke_chat', 'smoke_user')

  const off = await turn('offtopic', 'What should I cook for dinner tonight?')
  assert(Boolean(off?.text?.includes('V Exchange risk')), 'offtopic should reject gently')

  clearSession('smoke_chat', 'lang_zh')
  const zhOff = await turn('offtopic-zh', '今晚吃什么', 'lang_zh')
  assert(Boolean(zhOff?.text?.includes('风险管理') || zhOff?.text?.includes('風險管理')), 'zh offtopic')

  clearSession('smoke_chat', 'safe_user')
  const pii = await turn('safety-pii', 'Please look up the customer passport number and home address', 'safe_user')
  assert(Boolean(pii?.text?.toLowerCase().includes('personal') || pii?.text?.includes('隐私') || pii?.text?.includes('隱私')), 'pii refuse')
  clearSession('smoke_chat', 'smoke_user')

  const mkt = await turn('market', 'What are XAUUSD market trends today?')
  assert(
    Boolean(
      mkt?.card &&
        JSON.stringify(mkt.card).includes('Market trends'),
    ),
    'market should return market card',
  )

  clearSession('smoke_chat', 'smoke_user')
  const inv = await turn(
    'investigate',
    'investigate Alert: XAUUSD index source IDX-01 excluded, Mark deviation 48bps, no valid source warning',
  )
  assert(Boolean(inv?.card && JSON.stringify(inv.card).includes('Investigation')), 'investigate card')

  const follow = await turn(
    'followup-evidence',
    'I checked remaining sources: Kraken still quoting, Binance stale 12s. Timestamp 09:41 SGT.',
  )
  assert(
    Boolean(follow?.card && JSON.stringify(follow.card).includes('Investigation')),
    'follow-up should stay in investigation, not jump to market',
  )

  await turn('review', 'review')
  console.log('\n=== incidents accumulated ===')
  console.log(JSON.stringify(listIncidents({ limit: 5 }), null, 2).slice(0, 800))
  console.log('\nSMOKE_OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
