/**
 * Proxy to quote-ops CFD Broker Pricing RAG — POST /api/quote-ops/rag
 * Always scopes to CFD pricing (cfd / cfd-broker); never V Exchange perpetual.
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
      productLine: 'cfd-broker',
      note: 'POST { question } — CFD Broker Pricing only',
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
        productLine: body.productLine || 'cfd',
      }),
      signal: AbortSignal.timeout(25_000),
    })
    const data = (await r.json()) as Record<string, unknown>
    if (!r.ok) return res.status(r.status).json(data)

    const product = String(data.product || data.productHint || '')
    const perpBleed =
      /v-exchange|perpetual|永续/i.test(product) && !/cfd|broker/i.test(product)
    return res.status(200).json({
      ...data,
      proxy: {
        upstream: UPSTREAM,
        productLineFilter: 'cfd-broker',
        perpetualRejected: perpBleed,
      },
    })
  } catch (e) {
    return res.status(502).json({
      error: e instanceof Error ? e.message : 'upstream unreachable',
      upstream: UPSTREAM,
    })
  }
}
