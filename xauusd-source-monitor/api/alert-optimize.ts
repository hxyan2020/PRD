/**
 * POST /api/alert-optimize
 * - action=fetch: server-side GET of a data API (bypasses browser CORS)
 * - action=analyze: optional LLM polish of a local analysis draft
 * Auth: DESK_GATEWAY_TOKEN via X-Desk-Token when configured.
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = new Set([
  'https://quote-ai-troubleshooting-bot.vercel.app',
  'https://hxyan2020.github.io',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5180',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:5180',
])

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '')
  const allowed =
    ALLOWED_ORIGINS.has(origin) ||
    /^https:\/\/[\w-]+(?:-[\w]+)*\.vercel\.app$/.test(origin)
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token')
}

function authorizeDesk(req: VercelRequest): boolean {
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return true
  const provided = String(req.headers['x-desk-token'] || '')
  return safeEqual(expected, provided)
}

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    // Block obvious SSRF to link-local / metadata
    const host = u.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.startsWith('169.254.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      // Allow Vercel/self only when explicitly public — still block RFC1918.
      return false
    }
    return true
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!authorizeDesk(req)) return res.status(401).json({ error: 'Unauthorized' })

  const body = (req.body || {}) as {
    action?: string
    url?: string
    headers?: Record<string, string>
    question?: string
    draftMarkdown?: string
    lang?: string
  }
  const action = String(body.action || 'fetch')

  if (action === 'fetch') {
    const url = String(body.url || '').trim()
    if (!url || !isSafeUrl(url)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid or blocked URL (https public hosts only)',
      })
    }
    const hdrs: Record<string, string> = {
      accept: 'application/json, text/csv, text/plain;q=0.9,*/*;q=0.8',
      'user-agent': 'vex-alert-optimize/1',
    }
    if (body.headers && typeof body.headers === 'object') {
      for (const [k, v] of Object.entries(body.headers)) {
        if (!k || typeof v !== 'string') continue
        const key = k.toLowerCase()
        if (key === 'host' || key === 'cookie' || key.startsWith('x-forwarded')) continue
        hdrs[k] = v.slice(0, 2000)
      }
    }
    /**
     * Proxy memory window only (serverless RAM) — not an analysis quota.
     * Client preprocess agent full-scans whatever arrives in this window.
     */
    const MAX_BYTES = 32_000_000
    try {
      const r = await fetch(url, { method: 'GET', headers: hdrs, cache: 'no-store' })
      const upstreamLen = Number(r.headers.get('content-length') || 0)
      // Absurd bodies only — still not an AO product quota; ask upstream to page.
      if (Number.isFinite(upstreamLen) && upstreamLen > 200_000_000) {
        return res.status(413).json({
          ok: false,
          error: `Remote Content-Length ${upstreamLen} exceeds proxy process memory. Page/stream upstream; AO itself has no row analysis quota.`,
        })
      }

      const reader = r.body?.getReader?.()
      let text = ''
      let truncated = false
      if (reader) {
        const chunks: Uint8Array[] = []
        let total = 0
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          if (!value?.byteLength) continue
          if (total + value.byteLength > MAX_BYTES) {
            const remain = MAX_BYTES - total
            if (remain > 0) chunks.push(value.slice(0, remain))
            truncated = true
            try {
              await reader.cancel()
            } catch {
              /* ignore */
            }
            break
          }
          chunks.push(value)
          total += value.byteLength
        }
        text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
      } else {
        const full = await r.text()
        truncated = full.length > MAX_BYTES
        text = full.slice(0, MAX_BYTES)
      }

      const ct = r.headers.get('content-type') || ''
      let json: unknown = null
      if (/json/i.test(ct) || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          json = JSON.parse(text)
        } catch {
          json = null
        }
      }
      return res.status(200).json({
        ok: r.ok,
        status: r.status,
        contentType: ct,
        text,
        json,
        truncated,
        maxBytes: MAX_BYTES,
      })
    } catch (e) {
      return res.status(502).json({
        ok: false,
        error: e instanceof Error ? e.message : 'fetch failed',
      })
    }
  }

  if (action === 'analyze') {
    // Lightweight echo — client does primary analysis; optional LLM polish via /api/chat.
    const draft = String(body.draftMarkdown || '').trim()
    if (!draft) return res.status(400).json({ ok: false, error: 'draftMarkdown required' })
    return res.status(200).json({
      ok: true,
      polished: false,
      markdown: draft,
      note: 'Use /api/chat for LLM polish when desk token + OpenAI are configured.',
    })
  }

  return res.status(400).json({ ok: false, error: 'Unknown action' })
}
