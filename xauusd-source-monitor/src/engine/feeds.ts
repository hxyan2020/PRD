export interface AnchorPrices {
  okx: number | null
  bitget: number | null
  spot: number | null
  errors: Record<string, string>
  latency: Record<string, number>
}

async function timedFetch(url: string, timeoutMs = 8000): Promise<{ json: unknown; ms: number }> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  const started = performance.now()
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    const ms = performance.now() - started
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return { json, ms }
  } finally {
    clearTimeout(t)
  }
}

export async function fetchAnchors(): Promise<AnchorPrices> {
  const out: AnchorPrices = {
    okx: null,
    bitget: null,
    spot: null,
    errors: {},
    latency: {},
  }

  const jobs = [
    (async () => {
      try {
        const { json, ms } = await timedFetch(
          'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP',
        )
        const last = Number((json as { data?: { last?: string }[] })?.data?.[0]?.last)
        if (!Number.isFinite(last)) throw new Error('bad payload')
        out.okx = last
        out.latency.okx = ms
      } catch (e) {
        out.errors.okx = e instanceof Error ? e.message : 'okx failed'
      }
    })(),
    (async () => {
      try {
        const { json, ms } = await timedFetch(
          'https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=XAUUSDT',
        )
        const last = Number((json as { data?: { lastPr?: string }[] })?.data?.[0]?.lastPr)
        if (!Number.isFinite(last)) throw new Error('bad payload')
        out.bitget = last
        out.latency.bitget = ms
      } catch (e) {
        out.errors.bitget = e instanceof Error ? e.message : 'bitget failed'
      }
    })(),
    (async () => {
      try {
        const { json, ms } = await timedFetch('https://api.gold-api.com/price/XAU')
        const price = Number((json as { price?: number })?.price)
        if (!Number.isFinite(price)) throw new Error('bad payload')
        out.spot = price
        out.latency.spot = ms
      } catch (e) {
        out.errors.spot = e instanceof Error ? e.message : 'spot failed'
      }
    })(),
  ]

  await Promise.all(jobs)
  return out
}

/** Deterministic pseudo-noise so derived venues stay coherent across clients for a short window. */
export function seededNoise(seed: string, nowMs: number, amplitudeBps: number): number {
  const bucket = Math.floor(nowMs / 3000)
  let h = 2166136261
  const s = `${seed}:${bucket}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const u = ((h >>> 0) % 10_000) / 10_000 // 0..1
  return (u * 2 - 1) * amplitudeBps
}
