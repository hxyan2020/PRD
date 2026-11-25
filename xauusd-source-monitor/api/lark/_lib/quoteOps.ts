/**
 * Live RAG against quote-ops CFD Broker Pricing KB.
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
  // Refuse perpetual bleed-through — this bot is CFD pricing only.
  if (/v-exchange|perpetual|永续/i.test(product) && !/cfd|broker/i.test(product)) {
    return null
  }
  const lines: string[] = [
    '[quote-ops CFD Pricing RAG]',
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
    return (
      (await callQuoteOpsRag(q, 'cfd')) ||
      (await callQuoteOpsRag(q, 'cfd-broker')) ||
      (await callQuoteOpsRag(q, 'pricing'))
    )
  } catch {
    return null
  }
}
