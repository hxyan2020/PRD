/**
 * Cursor / edge-style handler: POST /api/chat
 * Reads OPENAI_API_KEY (and optional others) from the host environment — never from the client bundle.
 */
const ALLOWED_ORIGINS = new Set([
  'https://hxyan2020.github.io',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4177',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:4173',
])

function corsHeaders(request) {
  const origin = request.headers.get('origin') || ''
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://hxyan2020.github.io'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(request, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request) },
  })
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
  return text
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const provider = body.provider || 'openai'
    const model = body.model || 'gpt-4o-mini'
    const messages = body.messages || []
    if (!messages.length) return json(request, 400, { error: 'messages required' })

    const key =
      (provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : provider === 'openrouter'
          ? process.env.OPENROUTER_API_KEY
          : provider === 'anthropic'
            ? process.env.ANTHROPIC_API_KEY
            : process.env.GEMINI_API_KEY) || ''

    // Never accept client-supplied keys on this public gateway.
    if (!key) {
      return json(request, 503, {
        error: 'LLM gateway not configured yet (OPENAI_API_KEY missing on host).',
        sample: true,
      })
    }

    if (provider !== 'openai' && provider !== 'openrouter') {
      return json(request, 400, { error: `gateway supports openai/openrouter (got ${provider})` })
    }

    const text = await runOpenAI(key, model, messages)
    return json(request, 200, { text })
  } catch (e) {
    return json(request, 500, { error: e instanceof Error ? e.message : 'server error' })
  }
}

export async function GET(request) {
  return json(request, 200, {
    ok: true,
    service: 'vex-llm-gateway',
    openai: Boolean(process.env.OPENAI_API_KEY),
  })
}
