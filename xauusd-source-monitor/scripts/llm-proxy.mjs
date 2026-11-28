#!/usr/bin/env node
/**
 * Local / CI LLM proxy for Investigate — keeps API keys off the static Pages bundle.
 * Usage:
 *   GEMINI_API_KEY=... node scripts/llm-proxy.mjs
 * Listens on :8787  POST /api/chat  (same contract as api/chat.ts)
 */
import http from 'node:http'

const PORT = Number(process.env.LLM_PROXY_PORT || 8787)

function json(res, code, body) {
  const raw = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(raw)
}

async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

async function runGemini(key, model, messages) {
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

async function runOpenAiCompatible(kind, key, model, messages) {
  const url =
    kind === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(kind === 'openrouter'
        ? {
            'HTTP-Referer': 'https://hxyan2020.github.io',
            'X-Title': 'V Exchange Risk Copilot',
          }
        : {}),
    },
    body: JSON.stringify({
      model: model || (kind === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'),
      messages,
      temperature: 0.2,
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error?.message || `${kind} ${r.status}`)
  const text = data.choices?.[0]?.message?.content || ''
  if (!text) throw new Error(`empty ${kind} response`)
  return text
}

async function runAnthropic(key, model, messages) {
  const system = messages.find((m) => m.role === 'system')?.content || ''
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-5',
      max_tokens: 4096,
      system,
      messages: messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error?.message || `anthropic ${r.status}`)
  const text = data.content?.filter((c) => c.type === 'text').map((c) => c.text || '').join('') || ''
  if (!text) throw new Error('empty anthropic response')
  return text
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true,
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    })
  }
  if (req.method !== 'POST' || !String(req.url || '').startsWith('/api/chat')) {
    return json(res, 404, { error: 'not found' })
  }
  try {
    const body = await readBody(req)
    const provider = body.provider || 'gemini'
    const model = body.model || ''
    const messages = body.messages || []
    if (!messages.length) return json(res, 400, { error: 'messages required' })
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
    if (!key) return json(res, 400, { error: `No API key for ${provider}` })

    let text = ''
    if (provider === 'openai' || provider === 'openrouter') {
      text = await runOpenAiCompatible(provider, key, model, messages)
    } else if (provider === 'anthropic') {
      text = await runAnthropic(key, model, messages)
    } else {
      text = await runGemini(key, model, messages)
    }
    return json(res, 200, { text })
  } catch (e) {
    return json(res, 500, { error: e instanceof Error ? e.message : 'server error' })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`llm-proxy listening on http://127.0.0.1:${PORT}/api/chat`)
})
