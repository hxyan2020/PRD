#!/usr/bin/env node
/** Smoke: card.action.trigger callbacks return toast + handled */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8791'

async function req(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${path} ${r.status}: ${JSON.stringify(data)}`)
  return data
}

const rendered = await req('/api/lark/render', {
  templateId: 'rca-report',
  vars: {
    title: 'callback smoke',
    severity: 'P1',
    skills: 'IDX-01',
    thinking: 'matched',
    next_steps: '1) check',
    incident_id: 'RCA-CB-1',
  },
})
const actions = []
for (const el of rendered.payload.card.body.elements) {
  if (el.tag === 'action') actions.push(...(el.actions || []))
}
const callbackBtns = actions.filter((a) => a.behaviors?.[0]?.type === 'callback')
if (callbackBtns.length < 3) {
  throw new Error(`expected >=3 callback buttons, got ${callbackBtns.length}`)
}
for (const b of callbackBtns) {
  if (typeof b.value === 'string') throw new Error('value must be object, not string')
  if (!b.behaviors?.[0]?.value?.action) throw new Error('missing behaviors callback value')
}
console.log(
  'buttons',
  callbackBtns.map((b) => b.text.content + ':' + b.value.action).join(', '),
)

const ingest = await req('/api/alarms/ingest', {
  title: 'callback smoke alert',
  severity: 'P1',
  summary: 'smoke',
  facts: 'XAUUSD Mark vs Index smoke',
  autoAnalyze: true,
})
const incidentId = ingest.rca?.incident?.id
if (!incidentId) throw new Error('no rca from ingest')

async function trigger(value) {
  return req('/api/lark/events', {
    schema: '2.0',
    header: { event_type: 'card.action.trigger' },
    event: {
      operator: { open_id: 'ou_smoke' },
      action: { tag: 'button', value },
    },
  })
}

const complete = await trigger({ action: 'complete_step', incident_id: incidentId })
if (!complete.toast?.content || complete.handled !== 'complete_step') {
  throw new Error('complete_step failed: ' + JSON.stringify(complete))
}
console.log('complete_step', complete.toast.content)

const review = await trigger({ action: 'review_checklist', incident_id: incidentId })
if (!review.toast?.content || review.handled !== 'review_checklist') {
  throw new Error('review_checklist failed: ' + JSON.stringify(review))
}
console.log('review_checklist', review.toast.content)

const archive = await trigger({ action: 'archive', incident_id: incidentId })
if (!archive.toast?.content || archive.handled !== 'archive') {
  throw new Error('archive failed: ' + JSON.stringify(archive))
}
console.log('archive', archive.toast.content)

const digest = await req('/api/stats/digest', {})
if (!digest.digest?.id) throw new Error('digest missing id: ' + JSON.stringify(digest))
const digestCard = digest.payload?.card?.body?.elements || []
const digestActions = digestCard.flatMap((el) => (el.tag === 'action' ? el.actions || [] : []))
const reviewPeriodicBtn = digestActions.find(
  (a) => a.behaviors?.[0]?.value?.action === 'review_periodic',
)
if (!reviewPeriodicBtn) {
  throw new Error('stats-digest missing review_periodic button')
}

const periodic = await trigger({
  action: 'review_periodic',
  digest_id: digest.digest.id,
})
if (!periodic.toast?.content || periodic.handled !== 'review_periodic') {
  throw new Error('review_periodic failed: ' + JSON.stringify(periodic))
}
console.log('review_periodic', periodic.toast.content, periodic.digestId)

const listed = await fetch(`${BASE}/api/stats/digests`).then((r) => r.json())
if (!listed.digests?.some((d) => d.id === digest.digest.id)) {
  throw new Error('digest not listed: ' + JSON.stringify(listed))
}
console.log('digests', listed.digests.length)

console.log('card-callback-smoke ok')
