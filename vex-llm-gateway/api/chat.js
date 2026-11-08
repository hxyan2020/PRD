/**
 * Authenticated LLM gateway: POST /api/chat
 * - Desk token only (DESK_GATEWAY_TOKEN via x-desk-token) — no open Cursor-identity spend
 * - Per-caller daily spend cap (default USD 10) + basic rate limit
 * Host OPENAI_API_KEY never accepted from the client body.
 */
import { createHash, timingSafeEqual } from 'node:crypto'

const DAILY_BUDGET_USD = Number(process.env.DAILY_BUDGET_USD || 10)
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 20)

/** @type {Map<string, { spentUsd: number, calls: number }>} */
const dailySpend = new Map()
/** @type {Map<string, number[]>} */
const recentCalls = new Map()

function dayKey() {
  return new Date().toISOString().slice(0, 10)
}

function callerBudgetKey(caller) {
  return `${dayKey()}:${caller}`
}

function corsHeaders(request) {
  const origin = request.headers.get('origin') || ''
  // Reflect only loopback / known desk origins; never wildcard.
  const allowList = new Set([
    'https://hxyan2020.github.io',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4177',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8791',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:8791',
  ])
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Desk-Token',
    Vary: 'Origin',
  }
  if (allowList.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function json(request, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request) },
  })
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8')
  const bb = Buffer.from(String(b || ''), 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function fingerprintToken(token) {
  return createHash('sha256').update(String(token), 'utf8').digest('hex').slice(0, 24)
}

/**
 * Public-safe auth: only a matching DESK_GATEWAY_TOKEN authorizes spend.
 * Cursor identity alone is never enough (would let any signed-in visitor spend).
 */
function authorize(request) {
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) {
    return { ok: false, reason: 'desk_token_not_configured' }
  }
  const provided = request.headers.get('x-desk-token') || ''
  if (!safeEqual(expected, provided)) {
    return { ok: false, reason: 'invalid_desk_token' }
  }
  return { ok: true, caller: `desk:${fingerprintToken(provided)}`, kind: 'desk' }
}

function rateLimit(caller) {
  const now = Date.now()
  const windowMs = 60_000
  const stamps = (recentCalls.get(caller) || []).filter((t) => now - t < windowMs)
  if (stamps.length >= RATE_LIMIT_PER_MIN) return false
  stamps.push(now)
  recentCalls.set(caller, stamps)
  return true
}

function budgetState(caller) {
  const key = callerBudgetKey(caller)
  let row = dailySpend.get(key)
  if (!row) {
    row = { spentUsd: 0, calls: 0 }
    dailySpend.set(key, row)
  }
  return row
}

function estimateUsd(usage, model) {
  // gpt-4o-mini list prices (USD / 1M tokens). Conservative fallback if usage missing.
  const inRate = 0.15
  const outRate = 0.6
  const prompt = Number(usage?.prompt_tokens || 0)
  const completion = Number(usage?.completion_tokens || 0)
  if (prompt + completion > 0) {
    return (prompt * inRate + completion * outRate) / 1_000_000
  }
  // Unknown usage — charge a small floor so unbounded free calls are impossible.
  void model
  return 0.01
}

async function runOpenAI(key, model, messages) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages,
      temperature: 0.2,
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error?.message || `openai ${r.status}`)
  const text = data.choices?.[0]?.message?.content || ''
  if (!text) throw new Error('empty openai response')
  return { text, usage: data.usage || null }
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request) {
  try {
    const auth = authorize(request)
    if (!auth.ok) {
      return json(request, 401, {
        error: 'Unauthorized — send a valid desk token.',
        reason: auth.reason,
      })
    }
    if (!rateLimit(auth.caller)) {
      return json(request, 429, { error: 'Rate limit exceeded. Try again in a minute.' })
    }

    const budget = budgetState(auth.caller)
    if (budget.spentUsd >= DAILY_BUDGET_USD) {
      return json(request, 429, {
        error: `Daily spend limit of USD ${DAILY_BUDGET_USD} reached for this caller. Resets at UTC midnight.`,
        spentUsd: Number(budget.spentUsd.toFixed(4)),
      })
    }

    const body = await request.json()
    const provider = body.provider || 'openai'
    const model = body.model || 'gpt-4o-mini'
    const messages = body.messages || []
    if (!messages.length) return json(request, 400, { error: 'messages required' })
    // Reject client-supplied secrets even if present.
    if (body.apiKey) return json(request, 400, { error: 'client apiKey not allowed' })

    const key = process.env.OPENAI_API_KEY || ''
    if (!key) {
      return json(request, 503, {
        error: 'LLM gateway not configured yet (OPENAI_API_KEY missing on host).',
        sample: true,
      })
    }
    if (provider !== 'openai' && provider !== 'openrouter') {
      return json(request, 400, { error: `gateway supports openai (got ${provider})` })
    }

    const { text, usage } = await runOpenAI(key, model, messages)
    const cost = estimateUsd(usage, model)
    budget.spentUsd += cost
    budget.calls += 1

    return json(request, 200, {
      text,
      usage,
      spend: {
        day: dayKey(),
        spentUsd: Number(budget.spentUsd.toFixed(6)),
        budgetUsd: DAILY_BUDGET_USD,
        remainingUsd: Number(Math.max(0, DAILY_BUDGET_USD - budget.spentUsd).toFixed(6)),
      },
    })
  } catch (e) {
    return json(request, 500, { error: e instanceof Error ? e.message : 'server error' })
  }
}

/** Public GET: no config, keys, or spend. Authenticated GET returns that caller's spend only. */
export async function GET(request) {
  const auth = authorize(request)
  if (!auth.ok) {
    return json(request, 200, { ok: true, service: 'vex-llm-gateway' })
  }
  const budget = budgetState(auth.caller)
  return json(request, 200, {
    ok: true,
    service: 'vex-llm-gateway',
    ready: Boolean(process.env.OPENAI_API_KEY),
    spend: {
      day: dayKey(),
      spentUsd: Number(budget.spentUsd.toFixed(4)),
      budgetUsd: DAILY_BUDGET_USD,
    },
  })
}
