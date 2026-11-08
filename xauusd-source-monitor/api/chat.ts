/**
 * Vercel Serverless — POST /api/chat
 * Auth: DESK_GATEWAY_TOKEN via X-Desk-Token (required when set on the host).
 * Server env: OPENAI_API_KEY (and optional Gemini/Anthropic/OpenRouter).
 * Client-supplied apiKey is rejected when the host has a server key for that provider.
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Msg = { role: string; content: string }

const ALLOWED_ORIGINS = new Set([
  'https://hxyan2020.github.io',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:4173',
])

const DAILY_BUDGET_USD = Number(process.env.DAILY_BUDGET_USD || 10)
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 30)

/** Soft in-memory limits (reset on cold start — still useful as a brake). */
const spendByDay = new Map<string, number>()
const callsByCaller = new Map<string, number[]>()

function dayKey() {
  return new Date().toISOString().slice(0, 10)
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '')
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token')
}

function authorizeDesk(req: VercelRequest): { ok: true; caller: string } | { ok: false; status: number; error: string } {
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) {
    // Misconfigured host — do not run open proxy.
    return { ok: false, status: 503, error: 'DESK_GATEWAY_TOKEN not configured on host' }
  }
  const provided = String(req.headers['x-desk-token'] || '')
  if (!safeEqual(expected, provided)) {
    return { ok: false, status: 401, error: 'Unauthorized — invalid desk token' }
  }
  return { ok: true, caller: 'desk' }
}

function rateLimit(caller: string) {
  const now = Date.now()
  const stamps = (callsByCaller.get(caller) || []).filter((t) => now - t < 60_000)
  if (stamps.length >= RATE_LIMIT_PER_MIN) return false
  stamps.push(now)
  callsByCaller.set(caller, stamps)
  return true
}

function budgetOk(caller: string) {
  const key = `${dayKey()}:${caller}`
  const spent = spendByDay.get(key) || 0
  return spent < DAILY_BUDGET_USD
}

function addSpend(caller: string, usd: number) {
  const key = `${dayKey()}:${caller}`
  spendByDay.set(key, (spendByDay.get(key) || 0) + usd)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'xauusd-llm-proxy' })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const auth = authorizeDesk(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })
  if (!rateLimit(auth.caller)) return res.status(429).json({ error: 'Rate limit exceeded' })
  if (!budgetOk(auth.caller)) {
    return res.status(429).json({ error: `Daily spend limit of USD ${DAILY_BUDGET_USD} reached` })
  }

  try {
    const body = req.body as {
      provider?: string
      model?: string
      messages?: Msg[]
      apiKey?: string
    }
    const provider = body.provider || 'openai'
    const model = body.model || ''
    const messages = body.messages || []
    if (!messages.length) return res.status(400).json({ error: 'messages required' })

    // Never accept client keys when proxying managed OpenAI spend.
    if (body.apiKey) return res.status(400).json({ error: 'client apiKey not allowed' })

    const key =
      (provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : provider === 'anthropic'
          ? process.env.ANTHROPIC_API_KEY
          : provider === 'openrouter'
            ? process.env.OPENROUTER_API_KEY
            : process.env.GEMINI_API_KEY) || ''

    if (!key) return res.status(503).json({ error: `No server API key for ${provider}` })

    let text = ''
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
            ? { 'HTTP-Referer': 'https://hxyan2020.github.io', 'X-Title': 'V Exchange Risk Copilot' }
            : {}),
        },
        body: JSON.stringify({
          model: model || (provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'),
          messages,
          temperature: 0.2,
        }),
      })
      const data = (await r.json()) as {
        choices?: { message?: { content?: string } }[]
        error?: { message?: string }
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'upstream' })
      text = data.choices?.[0]?.message?.content || ''
      const prompt = Number(data.usage?.prompt_tokens || 0)
      const completion = Number(data.usage?.completion_tokens || 0)
      const cost =
        prompt + completion > 0 ? (prompt * 0.15 + completion * 0.6) / 1_000_000 : 0.01
      addSpend(auth.caller, cost)
    } else if (provider === 'anthropic') {
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
      const data = (await r.json()) as {
        content?: { type: string; text?: string }[]
        error?: { message?: string }
      }
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'upstream' })
      text = data.content?.filter((c) => c.type === 'text').map((c) => c.text || '').join('') || ''
      addSpend(auth.caller, 0.01)
    } else {
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
      const data = (await r.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
        error?: { message?: string }
      }
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'upstream' })
      text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
      addSpend(auth.caller, 0.01)
    }

    if (!text) return res.status(502).json({ error: 'empty model response' })
    return res.status(200).json({ text })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'server error' })
  }
}
