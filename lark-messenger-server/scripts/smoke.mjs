#!/usr/bin/env node
/** Smoke test against a running lark-messenger-server */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8790'

async function req(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${path} ${r.status}: ${data.error || JSON.stringify(data)}`)
  return data
}

const health = await req('/health')
console.log('health', health.ok, 'mode', health.mode, 'templates', health.templates)

const list = await req('/api/templates')
console.log('listed', list.templates.length)

for (const id of ['risk-alert', 'rca-report', 'market-briefing', 'follow-up', 'stats-digest']) {
  const rendered = await req('/api/lark/render', {
    templateId: id,
    vars: { title: `Smoke ${id}`, severity: 'P1', severity_tag: 'YELLOW' },
  })
  if (!rendered.payload?.msg_type) throw new Error(`${id} missing msg_type`)
  console.log('render', id, rendered.payload.msg_type)
}

const dry = await req('/api/lark/send', {
  templateId: 'risk-alert',
  vars: { title: 'Smoke send', alert_id: 'SMOKE-1' },
})
console.log('send dryRun', Boolean(dry.dryRun || dry.ok))

const challenge = await req('/api/lark/events', { type: 'url_verification', challenge: 'abc' })
if (challenge.challenge !== 'abc') throw new Error('url verification failed')
console.log('events challenge ok')

const ingest = await req('/api/alarms/ingest', {
  title: 'Smoke multi-source alert',
  severity: 'P0',
  trigger: '≥3 alert sources',
  breached: 'OKX, Bitget',
  summary: 'Sudden stress — no clear cause',
  facts: 'XAUUSD sources breached vs composite. Sudden stress. Check Mark/Index.',
  autoAnalyze: true,
})
console.log('ingest alarm', ingest.alarm?.id, 'rca', ingest.rca?.incident?.id || 'none')

const follow = await req('/api/followup', {
  incidentId: ingest.rca?.incident?.id,
  question: 'Why is severity P0?',
})
console.log('followup', Boolean(follow.followUp?.answer))

const stats = await req('/api/stats/summary')
console.log('stats', {
  alarms: stats.alarmsTotal,
  rca: stats.rcaTotal,
  followups: stats.followups,
})

const digest = await req('/api/stats/digest', {})
console.log('digest', Boolean(digest.payload?.msg_type))

if (health.openai) {
  const chat = await req('/api/chat', {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Reply with exactly: OK' },
      { role: 'user', content: 'ping' },
    ],
  })
  console.log('chat', (chat.text || '').slice(0, 80))
} else {
  console.log('chat skipped (no OPENAI_API_KEY)')
}

console.log('SMOKE_OK')
