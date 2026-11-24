#!/usr/bin/env node
/**
 * V Exchange Lark Messenger — parallel desk channel
 * - Template render / webhook send
 * - Alarm ingest → optional auto RCA → Lark cards
 * - Lark event callback (Ack / Escalate / follow-up IM)
 * - Stats log + digest
 * - OpenAI/Gemini/OpenRouter /api/chat proxy
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  alarmFingerprint,
  archiveIncident,
  findRecentDuplicateRca,
  getAlarm,
  getDigest,
  getIncident,
  ingestAlarm,
  listDigests,
  listRecent,
  pushLog,
  saveDigest,
  saveFollowUp,
  saveIncident,
  statsSummary,
} from './lib/store.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8790)
const HOST = process.env.HOST || '0.0.0.0'
const TEMPLATES_DIR = path.join(__dirname, 'templates')
const PUBLIC_DIR = path.join(__dirname, 'public')
const DESK_BASE =
  process.env.DESK_BASE_URL ||
  'https://hxyan2020.github.io/PRD/xauusd-source-monitor'
const AUTO_ANALYZE = process.env.LARK_AUTO_ANALYZE !== '0'
const VERIFY_TOKEN = process.env.LARK_VERIFICATION_TOKEN || ''
const ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY || ''

function loadEnvFile() {
  for (const p of [
    path.join(__dirname, '.env'),
    path.join(__dirname, '../xauusd-source-monitor/.env'),
  ]) {
    try {
      if (!fs.existsSync(p)) continue
      for (const line of fs.readFileSync(p, 'utf8').split(/\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (!m) continue
        if (process.env[m[1]]) continue
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch {
      /* ignore */
    }
  }
}
loadEnvFile()

function json(res, code, body) {
  const raw = JSON.stringify(body, null, 0)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Desk-Token, X-Lark-Signature',
  })
  res.end(raw)
}

async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function fill(str, vars) {
  return String(str ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    const v = vars[k]
    return v == null ? '' : String(v)
  })
}

function nowSgt() {
  return new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) + ' SGT'
}

function listTemplates() {
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8')))
}

function getTemplate(id) {
  const file = path.join(TEMPLATES_DIR, `${id}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function severityColor(sev) {
  const s = String(sev || '').toUpperCase()
  if (s.includes('P0') || s.includes('RED') || s.includes('CRIT')) return 'red'
  if (s.includes('P1') || s.includes('YELLOW') || s.includes('WARN') || s.includes('ALERT'))
    return 'orange'
  if (s.includes('P2') || s.includes('GREEN') || s.includes('WATCH')) return 'green'
  return 'blue'
}

function mdBlock(content) {
  return { tag: 'div', text: { tag: 'lark_md', content } }
}

/**
 * Schema 2.0 callback buttons need an object `value` (not a JSON string) plus
 * `behaviors: [{ type: 'callback', value }]` so Feishu/Lark actually fires
 * card.action.trigger. URL buttons stay multi_url / url.
 */
function actionBtn(label, type, valueOrUrl) {
  if (typeof valueOrUrl === 'string' && valueOrUrl.startsWith('http')) {
    return {
      tag: 'button',
      text: { tag: 'plain_text', content: label },
      type,
      url: valueOrUrl,
      multi_url: {
        url: valueOrUrl,
        pc_url: valueOrUrl,
        android_url: valueOrUrl,
        ios_url: valueOrUrl,
      },
    }
  }
  const value =
    typeof valueOrUrl === 'string'
      ? { action: valueOrUrl }
      : valueOrUrl && typeof valueOrUrl === 'object'
        ? valueOrUrl
        : { action: 'noop' }
  return {
    tag: 'button',
    text: { tag: 'plain_text', content: label },
    type,
    value,
    behaviors: [{ type: 'callback', value }],
  }
}

function toastOk(content, extra = {}) {
  return {
    toast: { type: 'success', content: String(content || 'OK') },
    ...extra,
  }
}

function toastFail(content, extra = {}) {
  return {
    toast: { type: 'error', content: String(content || 'Failed') },
    ...extra,
  }
}

/** Normalize Feishu/Lark card callback + legacy event shapes into { action, ... }. */
function extractCardAction(body) {
  const event = body?.event || body || {}
  const candidates = [
    event.action?.value,
    event.action?.option,
    body?.action?.value,
    typeof event.action === 'string' ? event.action : null,
    typeof body?.action === 'string' ? body.action : null,
  ]
  for (const raw of candidates) {
    if (raw == null || raw === '') continue
    if (typeof raw === 'object') return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return parsed
        return { action: raw }
      } catch {
        return { action: raw }
      }
    }
  }
  return null
}

function isCardActionRequest(body) {
  const t =
    body?.header?.event_type ||
    body?.type ||
    body?.event?.type ||
    ''
  if (String(t).includes('card.action')) return true
  if (body?.event?.action || body?.action) return true
  return false
}

/** Build Lark interactive card (schema 2.0) from template id + vars */
function renderLarkCard(templateId, inputVars = {}) {
  const meta = getTemplate(templateId)
  if (!meta) throw new Error(`Unknown template: ${templateId}`)
  const vars = {
    ...meta.defaults,
    time_sgt: nowSgt(),
    desk_url: DESK_BASE + '/',
    ...inputVars,
  }
  for (const [k, v] of Object.entries(vars)) vars[k] = fill(String(v), vars)

  if (templateId === 'risk-alert') {
    return {
      msg_type: 'interactive',
      card: {
        schema: '2.0',
        config: { wide_screen_mode: true, update_multi: true },
        header: {
          template: severityColor(vars.severity),
          title: { tag: 'plain_text', content: `Alert · ${vars.title}` },
          subtitle: {
            tag: 'plain_text',
            content: `${vars.severity} · ${vars.alert_id} · ${vars.time_sgt}`,
          },
        },
        body: {
          elements: [
            mdBlock(
              [
                `**Contract:** ${vars.contract}`,
                `**Trigger:** ${vars.trigger}`,
                `**Breached:** ${vars.breached}`,
                '',
                vars.summary,
                '',
                '_Reply in this thread to ask a follow-up. Bot will analyse and answer._',
              ].join('\n'),
            ),
            { tag: 'hr' },
            {
              tag: 'action',
              actions: [
                actionBtn('Open desk', 'primary', vars.desk_url),
                actionBtn('Run RCA', 'primary', {
                  action: 'run_rca',
                  alert_id: vars.alert_id,
                }),
                actionBtn('Ack', 'default', { action: 'ack', alert_id: vars.alert_id }),
                actionBtn('Escalate', 'danger', {
                  action: 'escalate',
                  alert_id: vars.alert_id,
                }),
              ],
            },
          ],
        },
      },
    }
  }

  if (templateId === 'rca-report') {
    const skillsText = String(vars.skills || '').trim() || '_none matched_'
    const knowledgeText = String(vars.knowledge || vars.rag || '').trim()
    const foldPanel = (title, body) => ({
      tag: 'collapsible_panel',
      expanded: false,
      header: {
        title: { tag: 'plain_text', content: title },
        vertical_align: 'center',
        icon: {
          tag: 'standard_icon',
          token: 'down-round_outlined',
        },
        icon_position: 'right',
        icon_expanded_angle: -180,
      },
      border: { color: 'grey', corner_radius: '8px' },
      elements: [mdBlock(body)],
    })
    return {
      msg_type: 'interactive',
      card: {
        schema: '2.0',
        config: { wide_screen_mode: true },
        header: {
          template: severityColor(vars.severity),
          title: { tag: 'plain_text', content: `RCA · ${vars.title}` },
          subtitle: {
            tag: 'plain_text',
            content: `${vars.severity} · ${vars.model} · ${vars.incident_id} · ${vars.time_sgt}`,
          },
        },
        body: {
          elements: [
            mdBlock(
              [
                `**Investigation path:** ${vars.path || 'ingest → skills → RAG → severity'}`,
                '',
                '**Data sources (direct links)**',
                vars.sources || '_none attached_',
                '',
                '**Recommendations (approval required)**',
                vars.next_steps,
                vars.report_excerpt ? `\n---\n${vars.report_excerpt.slice(0, 1200)}` : '',
                '',
                '_Ask a follow-up in the thread — answers are logged to realtime stats._',
              ].join('\n'),
            ),
            foldPanel(`🧩 Skills matches`, skillsText),
            foldPanel(
              `📚 Knowledge / RAG matches`,
              knowledgeText ||
                '_Titles stay folded here when available; open Investigate for the full tree._',
            ),
            foldPanel(`Thinking`, String(vars.thinking || '_n/a_')),
            {
              tag: 'action',
              actions: [
                actionBtn('已完成此步', 'primary', {
                  action: 'complete_step',
                  incident_id: vars.incident_id,
                }),
                actionBtn('归档报告', 'default', {
                  action: 'archive',
                  incident_id: vars.incident_id,
                }),
                actionBtn('复盘清单', 'default', {
                  action: 'review_checklist',
                  incident_id: vars.incident_id,
                }),
              ],
            },
            {
              tag: 'action',
              actions: [
                actionBtn(
                  'Open Investigate',
                  'default',
                  vars.desk_url.includes('#')
                    ? vars.desk_url
                    : `${DESK_BASE}/#/investigate`,
                ),
                actionBtn('Open Stats', 'default', `${DESK_BASE}/#/stats`),
              ],
            },
          ],
        },
      },
    }
  }

  if (templateId === 'market-briefing') {
    return {
      msg_type: 'interactive',
      card: {
        schema: '2.0',
        config: { wide_screen_mode: true },
        header: {
          template: severityColor(vars.severity_tag),
          title: { tag: 'plain_text', content: vars.title },
          subtitle: { tag: 'plain_text', content: `${vars.severity_tag} · ${vars.time_sgt}` },
        },
        body: {
          elements: [
            mdBlock(
              [
                `**Trigger:** ${vars.trigger}`,
                `**Causes:** ${vars.causes}`,
                `**Observations:** ${vars.observations}`,
                `**Actions:** ${vars.actions}`,
                vars.sources ? `\n**Sources:**\n${vars.sources}` : '',
              ].join('\n'),
            ),
            {
              tag: 'action',
              actions: [
                actionBtn(
                  'Open Market Condition',
                  'primary',
                  vars.desk_url.includes('#') ? vars.desk_url : `${DESK_BASE}/#/market`,
                ),
                actionBtn('Run Investigate', 'default', {
                  action: 'run_rca_from_briefing',
                  title: vars.title,
                }),
              ],
            },
          ],
        },
      },
    }
  }

  if (templateId === 'follow-up') {
    return {
      msg_type: 'interactive',
      card: {
        schema: '2.0',
        config: { wide_screen_mode: true },
        header: {
          template: 'blue',
          title: { tag: 'plain_text', content: `Follow-up · ${vars.incident_id}` },
          subtitle: { tag: 'plain_text', content: vars.time_sgt },
        },
        body: {
          elements: [
            mdBlock(
              [
                `**Q:** ${vars.question}`,
                '',
                `**A:** ${vars.answer}`,
                '',
                `_Severity context: ${vars.severity}_`,
              ].join('\n'),
            ),
            {
              tag: 'action',
              actions: [
                actionBtn(
                  'Open Investigate',
                  'primary',
                  vars.desk_url.includes('#')
                    ? vars.desk_url
                    : `${DESK_BASE}/#/investigate`,
                ),
              ],
            },
          ],
        },
      },
    }
  }

  if (templateId === 'stats-digest') {
    const deskStatsReview = `${DESK_BASE}/#/stats?review=periodic`
    return {
      msg_type: 'interactive',
      card: {
        schema: '2.0',
        config: { wide_screen_mode: true },
        header: {
          template: 'turquoise',
          title: { tag: 'plain_text', content: 'Periodic analysis digest' },
          subtitle: {
            tag: 'plain_text',
            content: `${vars.window_label} · ${vars.time_sgt}`,
          },
        },
        body: {
          elements: [
            mdBlock(
              [
                `Alarms ingested: ${vars.alarms_total}`,
                `RCAs total: ${vars.rca_total} (open ${vars.rca_open} · archived ${vars.rca_archived})`,
                `Follow-ups answered: ${vars.followups}`,
                `Top severity: ${vars.top_severity}`,
                vars.weekly_opt_preview
                  ? `\nWeekly opt inputs:\n${vars.weekly_opt_preview}`
                  : '\nWeekly opt inputs: (none archived yet)',
                vars.digest_id ? `\nDigest id: ${vars.digest_id}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            ),
            {
              tag: 'action',
              actions: [
                actionBtn('Review periodic analysis', 'primary', {
                  action: 'review_periodic',
                  digest_id: vars.digest_id || '',
                }),
                actionBtn('Open Stats review', 'default', deskStatsReview),
              ],
            },
          ],
        },
      },
    }
  }

  throw new Error(`No renderer for template ${templateId}`)
}

async function sendLark(webhookUrl, payload) {
  const url = webhookUrl || process.env.LARK_WEBHOOK_URL || ''
  if (!url) {
    return { ok: false, dryRun: true, payload, note: 'No LARK_WEBHOOK_URL — dry-run only' }
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await r.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!r.ok) throw new Error(`Lark webhook ${r.status}: ${text.slice(0, 300)}`)
  return { ok: true, response: data }
}

async function runChat(body) {
  const provider = body.provider || 'openai'
  const model = body.model || 'gpt-4o-mini'
  const messages = body.messages || []
  if (!messages.length) throw new Error('messages required')
  const key =
    body.apiKey ||
    (provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : provider === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY
        : provider === 'openrouter'
          ? process.env.OPENROUTER_API_KEY
          : process.env.GEMINI_API_KEY) ||
    ''
  if (!key) throw new Error(`No API key for ${provider}`)

  if (provider === 'openai' || provider === 'openrouter') {
    const base =
      provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions'
    const r = await fetch(base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        ...(provider === 'openrouter'
          ? {
              'HTTP-Referer': 'https://hxyan2020.github.io',
              'X-Title': 'V Exchange Lark Messenger',
            }
          : {}),
      },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data?.error?.message || `${provider} ${r.status}`)
    const text = data.choices?.[0]?.message?.content || ''
    if (!text) throw new Error('empty model response')
    return text
  }

  if (provider === 'gemini') {
    const system = messages.find((m) => m.role === 'system')?.content || ''
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    const m = model || 'gemini-2.0-flash'
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.2 },
        }),
      },
    )
    const data = await r.json()
    if (!r.ok) throw new Error(data?.error?.message || `gemini ${r.status}`)
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
    if (!text) throw new Error('empty gemini response')
    return text
  }

  throw new Error(`Unsupported provider ${provider}`)
}

function rulesAnalyze(facts) {
  const text = String(facts || '')
  const p0 = /P0|no clear cause|未發現|强平|ADL|critical|sudden stress/i.test(text)
  const severity = p0 ? 'P0' : /P1|alert|yellow|錯位|偏離/i.test(text) ? 'P1' : 'P2'
  const skills = []
  if (/mark|index|指數|標記/i.test(text)) skills.push('PRICE-01 Mark vs Index')
  if (/source|venue|OKX|Bitget|BINANCE|源/i.test(text)) skills.push('L2-01 External source → Index')
  if (/funding|資金費/i.test(text)) skills.push('L2-08 Funding → settlement')
  if (!skills.length) skills.push('PRICE-01 Mark vs Index', 'L2-03 External quote → internal pricing')
  const thinking = [
    'Ingested alarm / briefing facts from Lark channel.',
    `Matched skills: ${skills.join(', ')}.`,
    'Distinguish observations vs causes; no invented admin DB answers.',
    `Severity proposal ${severity} (human must confirm).`,
  ]
  const nextSteps = [
    '1) Verify Index/Mark timestamps and breached venue APIs',
    '2) Open citation URLs from the bound market scan',
    '3) Preferred action requires approval — do not auto-execute',
    '4) Archive only when ready for weekly optimisation input',
  ]
  const sources = [
    'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP',
    'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT',
    'https://api.gold-api.com/price/XAU',
  ]
  const report = [
    `【Recommended severity】${severity}`,
    '',
    '【Investigation path】',
    '• Lark alarm ingest → skills match → source links → recommendations',
    '',
    '【Thinking】',
    ...thinking.map((t) => `• ${t}`),
    '',
    '【Skills】',
    ...skills.map((s) => `• ${s}`),
    '',
    '【Data sources】',
    ...sources.map((u) => `• ${u}`),
    '',
    '【Recommendations (approval required)】',
    ...nextSteps.map((s) => `• ${s}`),
    '',
    '【Facts】',
    text || '(empty)',
  ].join('\n')
  return {
    severity,
    skills: skills.join(', '),
    thinking: thinking.join(' '),
    nextSteps: nextSteps.join('\n'),
    sources: sources.map((u) => `- ${u}`).join('\n'),
    path: 'alarm ingest → L1/L2 skills → citation URLs → approval-gated actions',
    report,
    model: process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'rules',
  }
}

async function maybeLlmEnhance(facts, base) {
  if (!process.env.OPENAI_API_KEY) return base
  try {
    const text = await runChat({
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are V Exchange Risk Copilot on Lark. Reply with a short structured English RCA: severity, investigation path, data-source URLs, recommendations (approval required). Be concise.',
        },
        {
          role: 'user',
          content: [
            facts,
            '',
            `Baseline severity ${base.severity}`,
            `Skills: ${base.skills}`,
            `Sources:\n${base.sources}`,
          ].join('\n'),
        },
      ],
    })
    return {
      ...base,
      model: 'openai/gpt-4o-mini',
      report: `${text}\n\n----------\n${base.report}`,
      reportExcerpt: text.slice(0, 900),
    }
  } catch (e) {
    return { ...base, llmNote: e instanceof Error ? e.message : String(e) }
  }
}

async function runRcaFromAlarm(alarm, opts = {}) {
  const fingerprint = alarm.fingerprint || alarmFingerprint(alarm)
  const existing = findRecentDuplicateRca({
    alarmId: alarm.id,
    fingerprint,
  })
  if (existing && opts.force !== true) {
    pushLog('rca_deduped', {
      incidentId: existing.id,
      alarmId: alarm.id,
      fingerprint,
    })
    const payload = renderLarkCard('rca-report', {
      title: existing.title,
      severity: existing.severity,
      model: existing.model,
      skills: existing.skills,
      thinking: existing.thinking,
      next_steps: existing.nextSteps,
      sources: (existing.sources || []).map((u) => `- ${u}`).join('\n'),
      path: 'deduped — same alert already investigated once',
      report_excerpt:
        (existing.report || '').slice(0, 900) ||
        'Same alert was already investigated. Continue in the thread — do not re-run.',
      incident_id: existing.id,
      desk_url: `${DESK_BASE}/#/investigate`,
      knowledge: '',
    })
    // Do not re-send the RCA card on dedupe unless explicitly asked.
    const send =
      opts.send === false || opts.resendDeduped !== true
        ? { dryRun: true, deduped: true, payload }
        : await sendLark(opts.webhookUrl, payload)
    return {
      incident: existing,
      analysis: {
        severity: existing.severity,
        skills: existing.skills,
        thinking: existing.thinking,
        nextSteps: existing.nextSteps,
        sources: (existing.sources || []).map((u) => `- ${u}`).join('\n'),
        path: 'deduped',
        report: existing.report,
        model: existing.model,
        deduped: true,
      },
      send,
      payload,
      deduped: true,
    }
  }

  const facts =
    alarm.facts ||
    [
      alarm.title,
      `severity=${alarm.severity}`,
      `trigger=${alarm.trigger}`,
      `breached=${alarm.breached}`,
      alarm.summary,
    ]
      .filter(Boolean)
      .join('\n')
  const base = rulesAnalyze(facts)
  const analysis = await maybeLlmEnhance(facts, base)
  const incident = saveIncident({
    alarmId: alarm.id,
    title: alarm.title,
    severity: analysis.severity,
    model: analysis.model,
    skills: analysis.skills,
    thinking: analysis.thinking,
    nextSteps: analysis.nextSteps,
    report: analysis.report,
    fingerprint,
    sources: (alarm.sources || []).length
      ? alarm.sources
      : analysis.sources.split('\n').map((l) => l.replace(/^- /, '')),
  })
  const payload = renderLarkCard('rca-report', {
    title: incident.title,
    severity: incident.severity,
    model: incident.model,
    skills: incident.skills,
    thinking: incident.thinking,
    next_steps: incident.nextSteps,
    sources: analysis.sources,
    path: analysis.path,
    report_excerpt: analysis.reportExcerpt || analysis.report.slice(0, 900),
    incident_id: incident.id,
    desk_url: `${DESK_BASE}/#/investigate`,
  })
  const send = opts.send === false ? { dryRun: true, payload } : await sendLark(opts.webhookUrl, payload)
  pushLog('rca_sent', { incidentId: incident.id, dryRun: Boolean(send.dryRun) })
  return { incident, analysis, send, payload }
}

async function answerFollowUp({ incidentId, question, user }) {
  const incident = incidentId ? getIncident(incidentId) : null
  const context = incident
    ? `Incident ${incident.id} sev=${incident.severity}\n${incident.report}`
    : 'No active incident context.'
  let answer
  if (process.env.OPENAI_API_KEY) {
    try {
      answer = await runChat({
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Answer Risk Ops follow-ups briefly. If you do not know, say so. Never invent admin DB answers (Phase 2). Mark any action as approval-required.',
          },
          {
            role: 'user',
            content: `${context}\n\nQuestion: ${question}`,
          },
        ],
      })
    } catch (e) {
      answer = `LLM unavailable (${e instanceof Error ? e.message : e}). From saved RCA: severity ${incident?.severity || '—'}; escalate to on-duty if unclear.`
    }
  } else {
    answer = incident
      ? `Based on saved RCA ${incident.id} (${incident.severity}): ${incident.thinking} Prefer verifying citation URLs before any production action (approval required).`
      : 'No incident context and no LLM key — please paste facts or bind an alert_id.'
  }
  const row = saveFollowUp({
    incidentId: incident?.id || incidentId || null,
    question,
    answer,
    user: user || 'lark-user',
  })
  const payload = renderLarkCard('follow-up', {
    incident_id: row.incidentId || 'none',
    question,
    answer,
    severity: incident?.severity || '—',
    desk_url: `${DESK_BASE}/#/investigate`,
  })
  const send = await sendLark(undefined, payload)
  return { followUp: row, payload, send }
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8'
  if (file.endsWith('.js')) return 'application/javascript; charset=utf-8'
  if (file.endsWith('.css')) return 'text/css; charset=utf-8'
  if (file.endsWith('.json')) return 'application/json; charset=utf-8'
  if (file.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

function serveStatic(req, res, urlPath) {
  let rel = urlPath === '/' ? '/index.html' : urlPath
  rel = rel.split('?')[0]
  const file = path.join(PUBLIC_DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''))
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return false
  }
  res.writeHead(200, {
    'Content-Type': contentType(file),
    'Access-Control-Allow-Origin': '*',
  })
  fs.createReadStream(file).pipe(res)
  return true
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  if (req.method === 'OPTIONS') return json(res, 204, {})

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, {
        ok: true,
        service: 'lark-messenger-server',
        mode: 'parallel-lark-desk',
        openai: Boolean(process.env.OPENAI_API_KEY),
        larkWebhook: Boolean(process.env.LARK_WEBHOOK_URL),
        autoAnalyze: AUTO_ANALYZE,
        verificationTokenConfigured: Boolean(VERIFY_TOKEN),
        encryptKeyConfigured: Boolean(ENCRYPT_KEY),
        templates: listTemplates().map((t) => t.id),
        deskBase: DESK_BASE,
      })
    }

    if (req.method === 'GET' && url.pathname === '/api/templates') {
      return json(res, 200, { templates: listTemplates() })
    }

    if (req.method === 'POST' && url.pathname === '/api/lark/render') {
      const body = await readBody(req)
      const templateId = body.templateId || body.template || 'risk-alert'
      const payload = renderLarkCard(templateId, body.vars || body.variables || {})
      return json(res, 200, { ok: true, templateId, payload })
    }

    if (req.method === 'POST' && url.pathname === '/api/lark/send') {
      const body = await readBody(req)
      const templateId = body.templateId || body.template || 'risk-alert'
      const payload =
        body.payload || renderLarkCard(templateId, body.vars || body.variables || {})
      const result = await sendLark(body.webhookUrl || body.webhook_url, payload)
      return json(res, 200, { templateId, ...result })
    }

    /** Collect alarms automatically (monitor / admin webhook → Lark) */
    if (req.method === 'POST' && url.pathname === '/api/alarms/ingest') {
      const body = await readBody(req)
      const alarm = ingestAlarm(body)
      const alertCard = renderLarkCard('risk-alert', {
        title: alarm.title,
        severity: alarm.severity,
        contract: alarm.contract,
        trigger: alarm.trigger,
        breached: alarm.breached,
        summary: alarm.summary,
        alert_id: alarm.id,
        desk_url: `${DESK_BASE}/#/investigate`,
      })
      const alreadyRca = findRecentDuplicateRca({
        alarmId: alarm.id,
        fingerprint: alarm.fingerprint,
      })
      // Skip re-posting the alert card when this ingest was a dedupe of an existing alarm.
      const alertSend = alreadyRca
        ? { dryRun: true, deduped: true }
        : await sendLark(body.webhookUrl, alertCard)
      let rca = null
      if (AUTO_ANALYZE && alarm.autoAnalyze && body.autoAnalyze !== false) {
        rca = await runRcaFromAlarm(alarm, { webhookUrl: body.webhookUrl })
      }
      return json(res, 200, {
        ok: true,
        alarm,
        alertSend,
        deduped: Boolean(alreadyRca || rca?.deduped),
        rca: rca
          ? {
              incident: rca.incident,
              send: rca.send,
              dryRun: rca.send?.dryRun,
              deduped: Boolean(rca.deduped),
            }
          : null,
      })
    }

    /** Trigger analysis manually or from card button */
    if (req.method === 'POST' && url.pathname === '/api/rca/run') {
      const body = await readBody(req)
      let alarm = body.alarmId ? getAlarm(body.alarmId) : null
      if (!alarm) {
        alarm = ingestAlarm({
          id: body.alarmId,
          title: body.title || 'Manual RCA',
          severity: body.severity || 'P1',
          facts: body.facts || body.summary || '',
          summary: body.summary || body.facts || '',
          trigger: body.trigger || 'manual',
          breached: body.breached || '',
          autoAnalyze: true,
        })
      }
      const rca = await runRcaFromAlarm(
        { ...alarm, facts: body.facts || alarm.facts },
        { webhookUrl: body.webhookUrl, send: body.send !== false },
      )
      return json(res, 200, { ok: true, ...rca })
    }

    /** Follow-up Q&A (thread reply or API) */
    if (req.method === 'POST' && url.pathname === '/api/followup') {
      const body = await readBody(req)
      if (!body.question) throw new Error('question required')
      const result = await answerFollowUp({
        incidentId: body.incidentId || body.incident_id,
        question: body.question,
        user: body.user,
      })
      return json(res, 200, { ok: true, ...result })
    }

    /** Lark event subscription + card action callback */
    if (req.method === 'POST' && url.pathname === '/api/lark/events') {
      const body = await readBody(req)
      // URL verification challenge
      if (body.type === 'url_verification' || body.challenge) {
        return json(res, 200, { challenge: body.challenge })
      }
      if (VERIFY_TOKEN && body.token && body.token !== VERIFY_TOKEN) {
        return json(res, 401, { error: 'invalid verification token' })
      }

      const event = body.event || body
      const operatorId =
        event.operator?.open_id ||
        event.operator?.user_id ||
        event.sender?.sender_id?.open_id ||
        body.open_id ||
        'unknown'
      const parsed = extractCardAction(body)
      const cardReq = isCardActionRequest(body)

      if (parsed?.action === 'ack' && parsed.alert_id) {
        pushLog('alarm_acked', { alertId: parsed.alert_id, user: operatorId })
        return json(
          res,
          200,
          toastOk('已确认告警 / Alert acked', { ok: true, handled: 'ack' }),
        )
      }
      if (parsed?.action === 'escalate' && parsed.alert_id) {
        pushLog('alarm_escalated', { alertId: parsed.alert_id, user: operatorId })
        const alarm = getAlarm(parsed.alert_id)
        if (alarm) {
          await sendLark(
            undefined,
            renderLarkCard('risk-alert', {
              ...alarm,
              title: `[ESCALATED] ${alarm.title}`,
              severity: 'P0',
              alert_id: alarm.id,
              summary: `${alarm.summary}\n\nEscalated by Lark operator.`,
            }),
          )
        }
        return json(
          res,
          200,
          toastOk('已升级为 P0 / Escalated', { ok: true, handled: 'escalate' }),
        )
      }
      if (parsed?.action === 'run_rca' && parsed.alert_id) {
        const alarm = getAlarm(parsed.alert_id) || ingestAlarm({ id: parsed.alert_id })
        const rca = await runRcaFromAlarm(alarm)
        return json(
          res,
          200,
          toastOk(
            rca.deduped
              ? '已有 RCA（同告警只排查一次）'
              : `RCA 已生成 ${rca.incident.id}`,
            {
              ok: true,
              handled: 'run_rca',
              incidentId: rca.incident.id,
              deduped: Boolean(rca.deduped),
            },
          ),
        )
      }
      if (parsed?.action === 'run_rca_from_briefing') {
        const alarm = ingestAlarm({
          title: parsed.title || 'Briefing → Investigate',
          severity: 'P1',
          summary: parsed.title || 'From market briefing card',
          facts: parsed.title || 'From market briefing card',
          trigger: 'briefing_card',
        })
        const rca = await runRcaFromAlarm(alarm)
        return json(
          res,
          200,
          toastOk(`已从简报启动排查 ${rca.incident.id}`, {
            ok: true,
            handled: 'run_rca_from_briefing',
            incidentId: rca.incident.id,
          }),
        )
      }
      if (
        (parsed?.action === 'archive' ||
          parsed?.action === 'archive_report' ||
          parsed?.action === '归档报告') &&
        parsed.incident_id
      ) {
        const row = archiveIncident(parsed.incident_id)
        if (!row) {
          return json(
            res,
            200,
            toastFail(`找不到事故 ${parsed.incident_id}`, {
              ok: false,
              handled: 'archive',
            }),
          )
        }
        return json(
          res,
          200,
          toastOk('报告已归档（进入周优化输入）', {
            ok: true,
            handled: 'archive',
            incidentId: parsed.incident_id,
          }),
        )
      }
      if (
        parsed?.action === 'complete_step' ||
        parsed?.action === '已完成此步'
      ) {
        pushLog('step_completed', {
          incidentId: parsed.incident_id || null,
          user: operatorId,
        })
        return json(
          res,
          200,
          toastOk('已记录：此步完成。有不清楚可继续追问。', {
            ok: true,
            handled: 'complete_step',
            incidentId: parsed.incident_id || null,
          }),
        )
      }
      if (
        parsed?.action === 'review_periodic' ||
        parsed?.action === 'review_digest'
      ) {
        const digest =
          (parsed.digest_id && getDigest(parsed.digest_id)) || listDigests(1)[0] || null
        const lines = digest
          ? [
              `Periodic digest ${digest.id} (${digest.windowLabel})`,
              `Alarms ${digest.summary?.alarmsTotal ?? '—'} · RCA ${digest.summary?.rcaTotal ?? '—'} (open ${digest.summary?.rcaOpen ?? '—'} / archived ${digest.summary?.rcaArchived ?? '—'})`,
              `Top severity: ${digest.summary?.topSeverity ?? '—'}`,
              digest.notes || '',
              '',
              'Weekly opt inputs:',
              ...((digest.weeklyOptItems || []).length
                ? digest.weeklyOptItems.map(
                    (i) => `- ${i.severity} ${i.id} ${i.title}${i.skills ? ` · ${i.skills}` : ''}`,
                  )
                : ['- (none archived yet)']),
              '',
              `Open desk review: ${DESK_BASE}/#/stats?review=periodic`,
            ]
          : [
              'No saved periodic digest yet.',
              'Post /api/stats/digest first, or open the desk Stats → Periodic analysis review.',
              `${DESK_BASE}/#/stats?review=periodic`,
            ]
        pushLog('periodic_review', {
          digestId: digest?.id || null,
          user: operatorId,
        })
        try {
          await sendLark(
            undefined,
            renderLarkCard('follow-up', {
              incident_id: digest?.id || 'digest',
              question: 'Review periodic analysis',
              answer: lines.join('\n'),
              severity: digest?.summary?.topSeverity || '—',
            }),
          )
        } catch {
          /* optional webhook */
        }
        return json(
          res,
          200,
          toastOk('周期性分析复盘已发送', {
            ok: true,
            handled: 'review_periodic',
            digestId: digest?.id || null,
            review: lines.join('\n'),
          }),
        )
      }
      if (
        parsed?.action === 'review_checklist' ||
        parsed?.action === '复盘清单'
      ) {
        const incident = parsed.incident_id ? getIncident(parsed.incident_id) : null
        const checklist = [
          '1. 告警原文 / 触发时间 / 成分源是否已核对',
          '2. 命中 Skill 与告警映射是否正确',
          '3. 建议动作是否已人工审批（禁止自动执行）',
          '4. 外网 / 行情直连链接是否已点开核验',
          '5. 是否需要归档进周优化，或升级值班',
        ].join('\n')
        pushLog('review_checklist', {
          incidentId: parsed.incident_id || null,
          user: operatorId,
        })
        // Post checklist as a follow-up card when possible
        try {
          await sendLark(
            undefined,
            renderLarkCard('follow-up', {
              incident_id: parsed.incident_id || incident?.id || 'none',
              question: '复盘清单',
              answer: checklist,
              severity: incident?.severity || '—',
            }),
          )
        } catch {
          /* webhook may be unset in local */
        }
        return json(
          res,
          200,
          toastOk('复盘清单已发送到会话', {
            ok: true,
            handled: 'review_checklist',
            incidentId: parsed.incident_id || null,
            checklist,
          }),
        )
      }

      if (cardReq && parsed?.action) {
        pushLog('lark_card_action_unknown', {
          action: parsed.action,
          user: operatorId,
        })
        return json(
          res,
          200,
          toastFail(`未识别的卡片动作: ${parsed.action}`, {
            ok: false,
            handled: 'unknown_card_action',
            action: parsed.action,
          }),
        )
      }

      // IM message → follow-up
      const text =
        event.message?.content ||
        event.text ||
        event.content?.text ||
        (typeof event.content === 'string' ? event.content : '')
      let question = ''
      try {
        const c = typeof text === 'string' && text.startsWith('{') ? JSON.parse(text) : null
        question = c?.text || text
      } catch {
        question = String(text || '')
      }
      question = String(question || '').trim()
      if (question && !question.startsWith('{')) {
        const incidentId =
          event.message?.root_id ||
          event.parent_id ||
          body.incidentId ||
          listRecent(1).incidents[0]?.id
        const result = await answerFollowUp({
          incidentId,
          question,
          user: operatorId,
        })
        return json(res, 200, {
          ok: true,
          handled: 'followup',
          followUpId: result.followUp.id,
        })
      }

      pushLog('lark_event_unhandled', { keys: Object.keys(body) })
      return json(
        res,
        200,
        cardReq
          ? toastFail('卡片回调未匹配到动作', { ok: true, handled: 'noop' })
          : { ok: true, handled: 'noop' },
      )
    }

    if (req.method === 'GET' && url.pathname === '/api/stats/summary') {
      const windowMs = Number(url.searchParams.get('windowMs') || 86400000)
      return json(res, 200, { ok: true, ...statsSummary(windowMs) })
    }

    if (req.method === 'POST' && url.pathname === '/api/stats/digest') {
      const body = await readBody(req)
      const summary = statsSummary(Number(body.windowMs || 86400000))
      const weeklyPreview = (summary.weeklyOptItems || [])
        .slice(0, 5)
        .map((i) => `- ${i.severity} ${i.id} ${i.title}`)
        .join('\n')
      const digest = saveDigest({
        windowLabel: summary.windowLabel,
        summary: {
          alarmsTotal: summary.alarmsTotal,
          rcaTotal: summary.rcaTotal,
          rcaOpen: summary.rcaOpen,
          rcaArchived: summary.rcaArchived,
          followups: summary.followups,
          topSeverity: summary.topSeverity,
        },
        weeklyOptItems: summary.weeklyOptItems || [],
        notes:
          (summary.weeklyOptItems || []).length === 0
            ? 'No archived RCAs in window — archive Investigate reports for weekly opt review.'
            : `Review ${(summary.weeklyOptItems || []).length} archived RCA(s) as weekly optimisation inputs.`,
      })
      const payload = renderLarkCard('stats-digest', {
        window_label: summary.windowLabel,
        alarms_total: String(summary.alarmsTotal),
        rca_total: String(summary.rcaTotal),
        rca_open: String(summary.rcaOpen),
        rca_archived: String(summary.rcaArchived),
        followups: String(summary.followups),
        top_severity: summary.topSeverity,
        weekly_opt_preview: weeklyPreview || '(none)',
        digest_id: digest.id,
        desk_url: `${DESK_BASE}/#/stats`,
      })
      const send = await sendLark(body.webhookUrl, payload)
      pushLog('stats_digest_sent', { dryRun: Boolean(send.dryRun), digestId: digest.id })
      return json(res, 200, { ok: true, summary, digest, send, payload })
    }

    if (req.method === 'GET' && url.pathname === '/api/stats/digests') {
      return json(res, 200, {
        ok: true,
        digests: listDigests(Number(url.searchParams.get('limit') || 20)),
      })
    }

    if (req.method === 'GET' && url.pathname === '/api/recent') {
      return json(res, 200, { ok: true, ...listRecent(Number(url.searchParams.get('limit') || 20)) })
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const body = await readBody(req)
      const text = await runChat(body)
      return json(res, 200, { text })
    }

    if (req.method === 'GET' && serveStatic(req, res, url.pathname)) return

    return json(res, 404, { error: 'not found' })
  } catch (e) {
    return json(res, 500, { error: e instanceof Error ? e.message : 'server error' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`lark-messenger-server on http://${HOST}:${PORT}`)
  console.log(`  playground:     http://127.0.0.1:${PORT}/`)
  console.log(`  alarms ingest:  POST /api/alarms/ingest`)
  console.log(`  lark events:    POST /api/lark/events`)
  console.log(`  stats:          GET  /api/stats/summary`)
  console.log(`  openai key:     ${process.env.OPENAI_API_KEY ? 'yes' : 'no'}`)
  console.log(`  auto-analyze:   ${AUTO_ANALYZE ? 'on' : 'off'}`)
})
