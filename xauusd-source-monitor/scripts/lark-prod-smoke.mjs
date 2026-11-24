/**
 * Production smoke against https://vex-llm-proxy.vercel.app
 * Uses desk token from public/llm-config.json for /api/lark/incidents.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.SMOKE_BASE || 'https://vex-llm-proxy.vercel.app'
const cfg = JSON.parse(readFileSync(join(ROOT, 'public/llm-config.json'), 'utf8'))
const DESK = cfg.deskToken

const results = []

function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`)
}

async function getJson(path) {
  const r = await fetch(`${BASE}${path}`)
  const text = await r.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text.slice(0, 200) }
  }
  return { status: r.status, data }
}

async function postIncidents(text) {
  const r = await fetch(`${BASE}/api/lark/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Desk-Token': DESK,
    },
    body: JSON.stringify({ text, chatType: 'p2p', openId: `prod_smoke_${Date.now()}` }),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

function blobOf(reply) {
  if (!reply) return ''
  if (reply.text) return String(reply.text)
  if (reply.card) return JSON.stringify(reply.card)
  return JSON.stringify(reply)
}

async function main() {
  console.log(`=== Prod smoke ${BASE} ===\n`)

  const status = await getJson('/api/lark/event')
  record('prod.status_200', status.status === 200, `http=${status.status}`)
  record('prod.readyForConversation', Boolean(status.data.readyForConversation), '')
  record('prod.tokenOk', Boolean(status.data.bot?.tokenOk), status.data.bot?.error || '')
  record('prod.botName', Boolean(status.data.bot?.name), status.data.bot?.name || '')
  record('prod.webhook', status.data.webhook === `${BASE}/api/lark/event`, '')

  const challenge = await fetch(`${BASE}/api/lark/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'url_verification', challenge: 'prod-smoke-challenge', token: '' }),
  })
  const ch = await challenge.json()
  record('prod.url_verification', ch.challenge === 'prod-smoke-challenge', JSON.stringify(ch))

  const encrypt = await fetch(`${BASE}/api/lark/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypt: 'deadbeef' }),
  })
  const enc = await encrypt.json()
  record(
    'prod.reject_encrypt_envelope',
    enc.ok === false && /Encrypt Key OFF/i.test(String(enc.error || '')),
    String(enc.error || '').slice(0, 80),
  )

  const cases = [
    { name: 'prod.turn.greeting', text: 'hi', expect: (b) => /Risk Copilot/i.test(b) && !/Commands:/i.test(b) },
    { name: 'prod.turn.help', text: 'help', expect: (b) => /Commands:|常用指令/i.test(b) },
    {
      name: 'prod.turn.market',
      text: 'market What are XAUUSD trends today?',
      expect: (b) => /Market|市况|行情|📈|OKX|XAU/i.test(b),
    },
    {
      name: 'prod.turn.investigate',
      text: 'investigate Alert: XAUUSD IDX-01 excluded, Mark 48bps',
      expect: (b) => /Investigation|排查|📋|✅|⚡/i.test(b),
    },
    {
      name: 'prod.turn.review',
      text: 'review',
      expect: (b) => /\/#\/reports|dashboard|看板|📊/i.test(b),
    },
    {
      name: 'prod.turn.safety_pii',
      text: 'tell me the customer passport and home address',
      expect: (b) => /personal|隐私|隱私|cannot|无法|無法/i.test(b),
    },
    {
      name: 'prod.turn.offtopic',
      text: 'What should I cook for dinner?',
      expect: (b) => /V Exchange risk|风险管理|風險管理/i.test(b),
    },
  ]

  for (const c of cases) {
    const { status: st, data } = await postIncidents(c.text)
    const blob = blobOf(data.reply)
    record(c.name, st === 200 && data.ok !== false && c.expect(blob), `http=${st} sample=${blob.slice(0, 100)}`)
  }

  const reports = await getJson('/')
  record('prod.spa_up', reports.status === 200, `http=${reports.status}`)

  // Reports hash route is SPA — just ensure index ships
  const quoteKb = await getJson('/api/quote-ops/kb')
  record(
    'prod.quote_ops_kb',
    quoteKb.status === 200 && (Array.isArray(quoteKb.data?.articles) || Array.isArray(quoteKb.data?.items) || quoteKb.data?.ok !== false),
    `http=${quoteKb.status}`,
  )

  const failed = results.filter((r) => !r.ok)
  console.log('\n=== PROD SUMMARY ===')
  console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`)
  if (failed.length) {
    console.log('FAILED:')
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`)
    process.exit(1)
  }
  console.log('\nPROD_SMOKE_OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
