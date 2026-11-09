/**
 * Vercel Serverless — POST /api/web-search
 * Returns concrete external page URLs for Investigate RCA.
 * Auth: same DESK_GATEWAY_TOKEN as /api/chat when configured.
 *
 * Providers (first available):
 * 1) BRAVE_API_KEY → Brave Search
 * 2) SERPER_API_KEY → Google via Serper
 * 3) DuckDuckGo Instant Answer (no key; limited)
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Hit = { title: string; url: string; source: string }

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function authorize(req: VercelRequest): boolean {
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return true
  const provided = String(req.headers['x-desk-token'] || '')
  return safeEqual(expected, provided)
}

function applyCors(res: VercelResponse, origin: string) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token')
}

function isHttpUrl(u: string): boolean {
  try {
    const x = new URL(u)
    return x.protocol === 'http:' || x.protocol === 'https:'
  } catch {
    return false
  }
}

async function braveSearch(q: string, limit: number): Promise<Hit[]> {
  const key = process.env.BRAVE_API_KEY || ''
  if (!key) return []
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${limit}`
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': key },
  })
  if (!r.ok) return []
  const data = (await r.json()) as { web?: { results?: { title?: string; url?: string }[] } }
  return (data.web?.results || [])
    .filter((x) => x.url && isHttpUrl(x.url))
    .slice(0, limit)
    .map((x) => ({ title: x.title || x.url!, url: x.url!, source: 'brave' }))
}

async function serperSearch(q: string, limit: number): Promise<Hit[]> {
  const key = process.env.SERPER_API_KEY || ''
  if (!key) return []
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
    body: JSON.stringify({ q, num: limit }),
  })
  if (!r.ok) return []
  const data = (await r.json()) as { organic?: { title?: string; link?: string }[] }
  return (data.organic || [])
    .filter((x) => x.link && isHttpUrl(x.link))
    .slice(0, limit)
    .map((x) => ({ title: x.title || x.link!, url: x.link!, source: 'serper' }))
}

async function duckDuckGoSearch(q: string, limit: number): Promise<Hit[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) return []
  const data = (await r.json()) as {
    AbstractURL?: string
    AbstractText?: string
    Heading?: string
    RelatedTopics?: { Text?: string; FirstURL?: string; Topics?: { Text?: string; FirstURL?: string }[] }[]
  }
  const hits: Hit[] = []
  if (data.AbstractURL && isHttpUrl(data.AbstractURL)) {
    hits.push({
      title: data.Heading || data.AbstractText || data.AbstractURL,
      url: data.AbstractURL,
      source: 'duckduckgo',
    })
  }
  const flatten = data.RelatedTopics || []
  for (const row of flatten) {
    if (row.FirstURL && isHttpUrl(row.FirstURL)) {
      hits.push({ title: row.Text || row.FirstURL, url: row.FirstURL, source: 'duckduckgo' })
    }
    for (const sub of row.Topics || []) {
      if (sub.FirstURL && isHttpUrl(sub.FirstURL)) {
        hits.push({ title: sub.Text || sub.FirstURL, url: sub.FirstURL, source: 'duckduckgo' })
      }
    }
  }
  const seen = new Set<string>()
  return hits.filter((h) => {
    if (seen.has(h.url)) return false
    seen.add(h.url)
    return true
  }).slice(0, limit)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '')
  applyCors(res, origin)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  if (!authorize(req)) {
    res.status(401).json({ error: 'Unauthorized — invalid desk token' })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const query = String(body.query || '').trim().slice(0, 240)
  const limit = Math.min(Number(body.limit) || 6, 10)
  if (!query) {
    res.status(400).json({ error: 'query required' })
    return
  }

  try {
    let results = await braveSearch(query, limit)
    if (!results.length) results = await serperSearch(query, limit)
    if (!results.length) results = await duckDuckGoSearch(query, limit)
    res.status(200).json({
      query,
      results,
      provider: results[0]?.source || 'none',
      note:
        results.length === 0
          ? 'No live search hits — client should fall back to curated venue/API deep links.'
          : undefined,
    })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
  }
}
