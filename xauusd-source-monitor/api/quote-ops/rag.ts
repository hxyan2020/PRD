/**
 * Proxy to quote-ops V Exchange RAG — POST /api/quote-ops/rag
 * Always scopes to perpetual (v-exchange-perp); never CFD Broker Pricing.
 *
 * Body: { question: string, productLine?: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const UPSTREAM = process.env.QUOTE_OPS_BASE || 'https://quote-ops-three.vercel.app'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token')
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'quote-ops-rag-proxy',
      upstream: `${UPSTREAM}/api/rag`,
      productLine: 'v-exchange-perp',
      note: 'POST { question } — V Exchange perpetual only',
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = (req.body || {}) as { question?: string; productLine?: string }
  const question = String(body.question || '').trim()
  if (!question) return res.status(400).json({ error: 'question required' })
  if (question.length > 2000) return res.status(400).json({ error: 'question too long' })

  try {
    const r = await fetch(`${UPSTREAM}/api/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        question,
        // Upstream auto-routes VE keywords to perpetual; keep explicit hint.
        productLine: body.productLine || 'vexchange',
      }),
      signal: AbortSignal.timeout(25_000),
    })
    const data = (await r.json()) as Record<string, unknown>
    if (!r.ok) return res.status(r.status).json(data)

    // Soft-guard: if upstream somehow returned CFD, mark it
    const product = String(data.product || data.productHint || '')
    const cfd =
      /cfd|broker|pricing/i.test(product) && !/v-exchange|perpetual|永续/i.test(product)
    return res.status(200).json({
      ...data,
      proxy: {
        upstream: UPSTREAM,
        productLineFilter: 'v-exchange-perp',
        cfdRejected: cfd,
      },
    })
  } catch (e) {
    return res.status(502).json({
      error: e instanceof Error ? e.message : 'upstream unreachable',
      upstream: UPSTREAM,
    })
  }
}
