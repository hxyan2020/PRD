/**
 * Fresh Vercel OpenAI proxy for the Risk Tool desk.
 * Auth: DESK_GATEWAY_TOKEN via X-Desk-Token
 * Secret: OPENAI_API_KEY on the host only (never from the client body)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token')
}

function authorize(req: VercelRequest) {
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return { ok: false as const, status: 503, error: 'DESK_GATEWAY_TOKEN missing' }
  const provided = String(req.headers['x-desk-token'] || '')
  if (!safeEqual(expected, provided)) return { ok: false as const, status: 401, error: 'Unauthorized' }
  return { ok: true as const, caller: 'desk' }
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
  return (spendByDay.get(`${dayKey()}:${caller}`) || 0) < DAILY_BUDGET_USD
}

function addSpend(caller: string, usd: number) {
  const key = `${dayKey()}:${caller}`
  spendByDay.set(key, (spendByDay.get(key) || 0) + usd)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'vex-llm-proxy' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const auth = authorize(req)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })
  if (!rateLimit(auth.caller)) return res.status(429).json({ error: 'Rate limit exceeded' })
  if (!budgetOk(auth.caller)) {
    return res.status(429).json({ error: `Daily spend limit USD ${DAILY_BUDGET_USD} reached` })
  }

  try {
    const body = (req.body || {}) as {
      provider?: string
      model?: string
      messages?: Msg[]
      apiKey?: string
    }
    if (body.apiKey) return res.status(400).json({ error: 'client apiKey not allowed' })
    const messages = body.messages || []
    if (!messages.length) return res.status(400).json({ error: 'messages required' })

    const key = process.env.OPENAI_API_KEY || ''
    if (!key) return res.status(503).json({ error: 'OPENAI_API_KEY missing' })

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: body.model || 'gpt-4o-mini',
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
    const text = data.choices?.[0]?.message?.content || ''
    if (!text) return res.status(502).json({ error: 'empty model response' })

    const prompt = Number(data.usage?.prompt_tokens || 0)
    const completion = Number(data.usage?.completion_tokens || 0)
    addSpend(
      auth.caller,
      prompt + completion > 0 ? (prompt * 0.15 + completion * 0.6) / 1_000_000 : 0.01,
    )
    return res.status(200).json({ text, usage: data.usage || null })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'server error' })
  }
}
