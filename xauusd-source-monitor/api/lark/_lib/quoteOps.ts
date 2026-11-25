/**
 * Live RAG against quote-ops V Exchange perpetual KB.
 * Falls back silently when upstream is down (local snapshot still used via skills.ts).
 */

const UPSTREAM = process.env.QUOTE_OPS_BASE || 'https://quote-ops-three.vercel.app'

async function callQuoteOpsRag(question: string, productLine: string): Promise<string | null> {
  const r = await fetch(`${UPSTREAM}/api/rag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ question, productLine }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!r.ok) return null
  const data = (await r.json()) as {
    summary?: string
    understoodAs?: string
    product?: string
    sections?: { heading?: string; paragraphs?: string[]; bullets?: string[] }[]
  }
  const product = String(data.product || '')
  if (/cfd|broker/i.test(product) && !/v-exchange|perpetual|永续/i.test(product)) {
    return null // refuse CFD bleed-through
  }
  const lines: string[] = [
    '[quote-ops V Exchange RAG]',
    data.understoodAs || '',
    data.summary || '',
  ]
  for (const sec of data.sections || []) {
    if (sec.heading) lines.push(sec.heading)
    for (const p of sec.paragraphs || []) lines.push(p)
    for (const b of sec.bullets || []) lines.push(`• ${b}`)
  }
  const text = lines.filter(Boolean).join('\n').trim()
  return text.slice(0, 6000) || null
}

export async function fetchQuoteOpsRag(question: string): Promise<string | null> {
  const q = question.trim().slice(0, 2000)
  if (!q) return null
  try {
    // Prefer explicit perpetual product line; fall back to legacy alias.
    return (
      (await callQuoteOpsRag(q, 'v-exchange-perp')) ||
      (await callQuoteOpsRag(q, 'vexchange'))
    )
  } catch {
    return null
  }
}
