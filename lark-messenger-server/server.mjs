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
  archiveIncident,
  getAlarm,
  getIncident,
  ingestAlarm,
  listRecent,
  pushLog,
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

function actionBtn(label, type, valueOrUrl) {
  if (typeof valueOrUrl === 'string' && valueOrUrl.startsWith('http')) {
    return {
      tag: 'button',
      text: { tag: 'plain_text', content: label },
      type,
      url: valueOrUrl,
    }
  }
  return {
    tag: 'button',
    text: { tag: 'plain_text', content: label },
    type,
    value: typeof valueOrUrl === 'string' ? valueOrUrl : JSON.stringify(valueOrUrl),
  }
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
                `**Skills:** ${vars.skills}`,
                `**Thinking:** ${vars.thinking}`,
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
                actionBtn('Archive (weekly opt)', 'default', {
                  action: 'archive',
                  incident_id: vars.incident_id,
                }),
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
    return {
      msg_type: 'interactive',
      card: {
        schema: '2.0',
        config: { wide_screen_mode: true },
        header: {
          template: 'turquoise',
          title: { tag: 'plain_text', content: 'Realtime stats digest' },
          subtitle: {
            tag: 'plain_text',
            content: `${vars.window_label} · ${vars.time_sgt}`,
          },
        },
        body: {
          elements: [
            mdBlock(
              [
                `**Alarms ingested:** ${vars.alarms_total}`,
                `**RCAs total:** ${vars.rca_total} (open ${vars.rca_open} · archived ${vars.rca_archived})`,
                `**Follow-ups answered:** ${vars.followups}`,
                `**Top severity:** ${vars.top_severity}`,
              ].join('\n'),
            ),
            {
              tag: 'action',
              actions: [
                actionBtn(
                  'Open Stats',
                  'primary',
                  vars.desk_url.includes('#') ? vars.desk_url : `${DESK_BASE}/#/stats`,
                ),
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
      const alertSend = await sendLark(body.webhookUrl, alertCard)
      let rca = null
      if (AUTO_ANALYZE && alarm.autoAnalyze && body.autoAnalyze !== false) {
        rca = await runRcaFromAlarm(alarm, { webhookUrl: body.webhookUrl })
      }
      return json(res, 200, {
        ok: true,
        alarm,
        alertSend,
        rca: rca
          ? { incident: rca.incident, send: rca.send, dryRun: rca.send?.dryRun }
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
      const action =
        event.action?.value ||
        event.action?.option ||
        (typeof event.action === 'string' ? event.action : null)

      let parsed = null
      try {
        parsed = typeof action === 'string' ? JSON.parse(action) : action
      } catch {
        parsed = null
      }

      if (parsed?.action === 'ack' && parsed.alert_id) {
        pushLog('alarm_acked', { alertId: parsed.alert_id, user: event.operator?.open_id })
        return json(res, 200, { ok: true, handled: 'ack' })
      }
      if (parsed?.action === 'escalate' && parsed.alert_id) {
        pushLog('alarm_escalated', { alertId: parsed.alert_id, user: event.operator?.open_id })
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
        return json(res, 200, { ok: true, handled: 'escalate' })
      }
      if (parsed?.action === 'run_rca' && parsed.alert_id) {
        const alarm = getAlarm(parsed.alert_id) || ingestAlarm({ id: parsed.alert_id })
        const rca = await runRcaFromAlarm(alarm)
        return json(res, 200, { ok: true, handled: 'run_rca', incidentId: rca.incident.id })
      }
      if (parsed?.action === 'archive' && parsed.incident_id) {
        archiveIncident(parsed.incident_id)
        return json(res, 200, { ok: true, handled: 'archive' })
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
          user: event.sender?.sender_id?.open_id || event.operator?.open_id,
        })
        return json(res, 200, { ok: true, handled: 'followup', followUpId: result.followUp.id })
      }

      pushLog('lark_event_unhandled', { keys: Object.keys(body) })
      return json(res, 200, { ok: true, handled: 'noop' })
    }

    if (req.method === 'GET' && url.pathname === '/api/stats/summary') {
      const windowMs = Number(url.searchParams.get('windowMs') || 86400000)
      return json(res, 200, { ok: true, ...statsSummary(windowMs) })
    }

    if (req.method === 'POST' && url.pathname === '/api/stats/digest') {
      const body = await readBody(req)
      const summary = statsSummary(Number(body.windowMs || 86400000))
      const payload = renderLarkCard('stats-digest', {
        window_label: summary.windowLabel,
        alarms_total: String(summary.alarmsTotal),
        rca_total: String(summary.rcaTotal),
        rca_open: String(summary.rcaOpen),
        rca_archived: String(summary.rcaArchived),
        followups: String(summary.followups),
        top_severity: summary.topSeverity,
        desk_url: `${DESK_BASE}/#/stats`,
      })
      const send = await sendLark(body.webhookUrl, payload)
      pushLog('stats_digest_sent', { dryRun: Boolean(send.dryRun) })
      return json(res, 200, { ok: true, summary, send, payload })
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
