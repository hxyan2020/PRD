#!/usr/bin/env node
/**
 * V Exchange Lark Messenger + OpenAI proxy
 * - GET  /health
 * - GET  /api/templates
 * - POST /api/lark/render   { templateId, vars } → Lark interactive payload
 * - POST /api/lark/send     { templateId, vars, webhookUrl? } → posts to Lark bot
 * - POST /api/chat          OpenAI/Gemini/OpenRouter proxy (OPENAI_API_KEY etc.)
 * - Static playground at /
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8790)
const HOST = process.env.HOST || '0.0.0.0'
const TEMPLATES_DIR = path.join(__dirname, 'templates')
const PUBLIC_DIR = path.join(__dirname, 'public')

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  if (s.includes('P1') || s.includes('YELLOW') || s.includes('WARN')) return 'orange'
  if (s.includes('P2') || s.includes('GREEN')) return 'green'
  return 'blue'
}

/** Build Lark interactive card (schema 2.0) from template id + vars */
function renderLarkCard(templateId, inputVars = {}) {
  const meta = getTemplate(templateId)
  if (!meta) throw new Error(`Unknown template: ${templateId}`)
  const vars = {
    ...meta.defaults,
    time_sgt: nowSgt(),
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
          title: { tag: 'plain_text', content: `🚨 ${vars.title}` },
          subtitle: { tag: 'plain_text', content: `${vars.severity} · ${vars.alert_id} · ${vars.time_sgt}` },
        },
        body: {
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: [
                  `**Contract:** ${vars.contract}`,
                  `**Trigger:** ${vars.trigger}`,
                  `**Breached:** ${vars.breached}`,
                  '',
                  vars.summary,
                ].join('\n'),
              },
            },
            { tag: 'hr' },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: 'Open desk' },
                  type: 'primary',
                  url: vars.desk_url,
                },
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: 'Ack' },
                  type: 'default',
                  value: JSON.stringify({ action: 'ack', alert_id: vars.alert_id }),
                },
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: 'Escalate' },
                  type: 'danger',
                  value: JSON.stringify({ action: 'escalate', alert_id: vars.alert_id }),
                },
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
          title: { tag: 'plain_text', content: `🔎 RCA · ${vars.title}` },
          subtitle: {
            tag: 'plain_text',
            content: `${vars.severity} · ${vars.model} · ${vars.incident_id} · ${vars.time_sgt}`,
          },
        },
        body: {
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: [
                  `**Skills:** ${vars.skills}`,
                  `**Thinking:** ${vars.thinking}`,
                  '',
                  `**Next steps**`,
                  vars.next_steps,
                  vars.report_excerpt ? `\n---\n${vars.report_excerpt.slice(0, 1200)}` : '',
                ].join('\n'),
              },
            },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: 'Open Investigate' },
                  type: 'primary',
                  url: vars.desk_url,
                },
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
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: [
                  `**Trigger:** ${vars.trigger}`,
                  `**Causes:** ${vars.causes}`,
                  `**Observations:** ${vars.observations}`,
                  `**Actions:** ${vars.actions}`,
                ].join('\n'),
              },
            },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: 'Open Market Condition' },
                  type: 'primary',
                  url: vars.desk_url,
                },
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
        openai: Boolean(process.env.OPENAI_API_KEY),
        larkWebhook: Boolean(process.env.LARK_WEBHOOK_URL),
        templates: listTemplates().map((t) => t.id),
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
  console.log(`  playground:  http://127.0.0.1:${PORT}/`)
  console.log(`  chat proxy:  http://127.0.0.1:${PORT}/api/chat`)
  console.log(`  openai key:  ${process.env.OPENAI_API_KEY ? 'yes' : 'no'}`)
})
