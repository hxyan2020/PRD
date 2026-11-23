/**
 * GET /api/quote-ops/kb — V Exchange perpetual folder from quote-ops (live + snapshot fallback).
 * Excludes CFD Broker Pricing roots.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const UPSTREAM = process.env.QUOTE_OPS_BASE || 'https://quote-ops-three.vercel.app'
const VE_ROOT = 'folder-v-exchange'
const VE_TAG = 'v-exchange-perp'

type Node = {
  id: string
  parentId?: string | null
  kind?: string
  titleZh?: string
  titleEn?: string
  summaryZh?: string
  summaryEn?: string
  bodyZh?: string
  bodyEn?: string
  tags?: string[]
  sortOrder?: number
  updatedAt?: number
}

function loadSnapshot() {
  const candidates = [
    join(process.cwd(), 'api/lark/_data/veQuoteOps.json'),
    join(process.cwd(), 'xauusd-source-monitor/api/lark/_data/veQuoteOps.json'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf8')) as {
        knowledge: { id: string; title: string; body: string }[]
        skills: unknown[]
        source?: string
      }
    }
  }
  return null
}

function extractVe(nodes: Node[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const children = new Map<string | null | undefined, Node[]>()
  for (const n of nodes) {
    const list = children.get(n.parentId) || []
    list.push(n)
    children.set(n.parentId, list)
  }
  const ids = new Set<string>()
  const stack = [VE_ROOT]
  while (stack.length) {
    const id = stack.pop()!
    if (ids.has(id)) continue
    ids.add(id)
    for (const c of children.get(id) || []) stack.push(c.id)
  }
  // Also include any node tagged v-exchange-perp outside tree (safety)
  for (const n of nodes) {
    if ((n.tags || []).includes(VE_TAG)) ids.add(n.id)
  }

  const veNodes = [...ids].map((id) => byId.get(id)).filter(Boolean) as Node[]
  const knowledge = veNodes
    .filter((n) => n.kind === 'article')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((n) => {
      const titleZh = n.titleZh || n.titleEn || n.id
      const titleEn = n.titleEn || titleZh
      const bodyParts = [n.bodyZh, n.bodyEn, n.summaryZh, n.summaryEn]
        .filter(Boolean)
        .map(String)
      return {
        id: n.id,
        title: titleZh === titleEn ? titleZh : `${titleZh} / ${titleEn}`,
        body: bodyParts.join('\n\n'),
        tags: n.tags || [],
        updatedAt: n.updatedAt || 0,
      }
    })

  return { knowledge, nodeCount: veNodes.length }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  const snapshot = loadSnapshot()

  try {
    const r = await fetch(`${UPSTREAM}/api/kb`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!r.ok) throw new Error(`upstream ${r.status}`)
    const data = (await r.json()) as { nodes?: Node[] }
    const extracted = extractVe(data.nodes || [])
    return res.status(200).json({
      ok: true,
      live: true,
      source: `${UPSTREAM}/api/kb`,
      productLine: VE_TAG,
      knowledge: extracted.knowledge,
      skills: snapshot?.skills || [],
      nodeCount: extracted.nodeCount,
    })
  } catch (e) {
    if (snapshot) {
      return res.status(200).json({
        ok: true,
        live: false,
        source: snapshot.source || 'local-snapshot',
        productLine: VE_TAG,
        knowledge: snapshot.knowledge,
        skills: snapshot.skills,
        warning: e instanceof Error ? e.message : 'upstream failed; served snapshot',
      })
    }
    return res.status(502).json({
      ok: false,
      error: e instanceof Error ? e.message : 'unreachable',
    })
  }
}
