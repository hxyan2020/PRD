import type { Briefing, BriefingSeverity, SourceHealth, TriggerEvent } from '../types'

function directionWord(bps: number): string {
  if (bps > 5) return 'bid higher / offer lifted'
  if (bps < -5) return 'offer lower / bid hit'
  return 'two-way but uneven'
}

function sessionBucket(d = new Date()): string {
  const h = d.getUTCHours()
  if (h >= 0 && h < 7) return 'Asia late / London pre-open'
  if (h >= 7 && h < 12) return 'London cash gold hours'
  if (h >= 12 && h < 17) return 'London–NY overlap'
  return 'NY afternoon / Asia pre-open'
}

function techNote(history: { t: number; px: number }[], composite: number): string {
  if (history.length < 5) return 'Insufficient local ticks for RSI/MA; relying on cross-venue structure.'
  const window = history.slice(-30)
  const first = window[0]!.px
  const last = composite
  const ret = ((last - first) / first) * 100
  const highs = window.map((w) => w.px)
  const max = Math.max(...highs)
  const min = Math.min(...highs)
  const rangeBps = ((max - min) / last) * 10_000
  return `Local ${window.length}-tick window: ${ret >= 0 ? '+' : ''}${ret.toFixed(3)}%, range ${rangeBps.toFixed(1)} bps; last ${last.toFixed(2)} vs window high ${max.toFixed(2)} / low ${min.toFixed(2)}.`
}

export function generateBriefing(args: {
  trigger: TriggerEvent
  health: SourceHealth[]
  composite: number
  spot: number | null
  history: { t: number; px: number }[]
}): Briefing {
  const { trigger, health, composite, spot, history } = args
  const breached = health.filter((h) => trigger.breachedSources.includes(h.id))
  const exch = breached.filter((h) => h.kind === 'exchange' || h.kind === 'exchange_index')
  const lps = breached.filter((h) => h.kind === 'lp')
  const avgDev =
    breached.reduce((s, h) => s + Math.abs(h.deviationBps ?? 0), 0) /
    Math.max(1, breached.length)
  const move = trigger.compositeMoveBps5m
  const basis =
    spot != null && Number.isFinite(spot) ? ((composite - spot) / spot) * 10_000 : null
  const session = sessionBucket()
  const severity: BriefingSeverity = trigger.severity

  const title =
    severity === 'critical'
      ? `Critical XAUUSD venue stress — ${breached.length} sources breached`
      : severity === 'alert'
        ? `XAUUSD multi-source alert — investigate index inputs`
        : `XAUUSD cross-tier watch — exchange/LP dislocation`

  const why: string[] = [
    `Trigger: ${trigger.reason}. Session context: ${session} (UTC).`,
    `Composite median ${composite.toFixed(2)}; 5m composite move ${move >= 0 ? '+' : ''}${move.toFixed(1)} bps; average |deviation| of breached sources ${avgDev.toFixed(1)} bps (${directionWord(move)}).`,
  ]

  if (exch.length) {
    why.push(
      `Exchange / index venues involved: ${exch
        .map((h) => `${h.id} (${(h.deviationBps ?? 0) >= 0 ? '+' : ''}${(h.deviationBps ?? 0).toFixed(1)} bps)`)
        .join(', ')}. Suggests perp/index books reprinting faster than LPs or vice versa.`,
    )
  }
  if (lps.length) {
    why.push(
      `LP quotes involved: ${lps
        .map((h) => `${h.id} (${(h.deviationBps ?? 0) >= 0 ? '+' : ''}${(h.deviationBps ?? 0).toFixed(1)} bps)`)
        .join(', ')}. LP skew often reflects inventory/hedge latency vs crypto-exchange XAUUSDT prints.`,
    )
  }
  if (basis != null) {
    why.push(
      `Perp composite vs LBMA-style spot (gold-api XAU): basis ${basis >= 0 ? '+' : ''}${basis.toFixed(1)} bps. ${
        Math.abs(basis) > 40
          ? 'Wide basis — check whether crypto venues are leading physical/spot hedges.'
          : 'Basis inside normal crypto-gold premium/discount band.'
      }`,
    )
  }
  why.push(
    `Macro / rates lens: gold is inversely sensitive to real yields and USD. A synchronized multi-venue jump without a DXY/yield catalyst often means venue microstructure (funding, liquidations, index weight jumps) rather than a fundamental gold shock.`,
  )
  why.push(`Technical (local monitor series): ${techNote(history, composite)}`)
  why.push(
    `News / catalyst checklist to confirm offline: COMEX inventory, US real-yield / DXY prints, geopolitical risk headlines, and exchange maintenance or XAUUSDT funding spikes on Binance/OKX/Bybit/Bitget.`,
  )

  const impact: string[] = [
    `V Exchange XAUUSD index may temporarily overweight or underweight a diverging venue if the index still includes breached sources — fair/mark can drift vs peers.`,
    `Traders on V Exchange may see mark-price jumps, wider basis vs competitors, and elevated liquidation risk if leverage is high on XAUUSD MVP perp.`,
    `Funding / inventory: if crypto exchanges lead LPs, V Exchange market makers hedging on LMAX/ISPrime may face adverse selection until LP quotes catch up.`,
    `Ops load: risk monitors (spread, depth, no-trade) are more likely to false-positive until the dislocation clears.`,
  ]

  const actions: string[] = [
    `Confirm which sources breached and whether live (OKEX/BITGET/RC_INDEX/LMAX-derived) vs derived mirrors are driving the median.`,
    `If ≥3 sources remain >15 bps for >2 minutes, temporarily exclude the worst outlier(s) from the XAUUSD index basket and re-run trial calc.`,
    `Tighten observation / re-enable windows on the offending venue; avoid auto-reintroducing a stale LP after a spike.`,
    `Raise XAUUSD risk: reduce max leverage / market-take levels; pause new opens if Critical severity persists >5 minutes.`,
    `Notify MM desk to widen quotes and hedge preferentially on healthy venues; watch competitor mark/index on Binance/OKX/Bybit.`,
    `After cooldown, require a successful trial calc + healthy health scores before restoring full weight.`,
  ]

  return {
    id: `brf_${trigger.firedAt}`,
    createdAt: trigger.firedAt,
    severity,
    title,
    triggerReason: trigger.reason,
    breachedSources: trigger.breachedSources,
    compositePrice: composite,
    why,
    impact,
    actions,
    sourcesConsulted: [
      'OKX XAU-USDT-SWAP ticker (live)',
      'Bitget XAUUSDT mix ticker (live when reachable)',
      'gold-api XAU spot (live)',
      'Derived exchange/LP mirrors (BINANCE/BYBIT/indexes/ISPRIME/STARPRIME/VELOCITY)',
      'Local composite tick history (technical)',
      'Session + basis heuristics (macro lens)',
    ],
  }
}

const STORAGE_KEY = 'xauusd-monitor-briefings-v1'

export function loadBriefings(): Briefing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedBriefings()
    const parsed = JSON.parse(raw) as Briefing[]
    return Array.isArray(parsed) ? parsed : seedBriefings()
  } catch {
    return seedBriefings()
  }
}

export function saveBriefings(list: Briefing[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)))
}

function seedBriefings(): Briefing[] {
  const now = Date.now()
  return [
    {
      id: 'brf_seed_1',
      createdAt: now - 36 * 3600_000,
      severity: 'alert',
      title: 'XAUUSD multi-source alert — London open dislocation',
      triggerReason: '4 sources in Alert (≥3 required)',
      breachedSources: ['BINANCE', 'BYBIT', 'ISPRIME', 'VELOCITY'],
      compositePrice: 3884.2,
      why: [
        'London cash open coincided with crypto XAUUSDT catching up to spot after a quiet Asia session.',
        'Exchange perps reprinted higher first; LP quotes lagged ~10–20 bps for ~3 minutes.',
        'Basis vs spot briefly widened then compressed — typical open auction catch-up, not a macro surprise.',
      ],
      impact: [
        'V Exchange index risked a short-lived mark bounce if Binance/Bybit weights were high.',
        'MM hedges on LPs may have been late vs exchange-led moves.',
      ],
      actions: [
        'Kept index basket intact after 5m normalization.',
        'Documented LP lag; no permanent exclusion.',
      ],
      sourcesConsulted: ['OKX', 'Bitget', 'gold-api', 'session clock'],
    },
    {
      id: 'brf_seed_2',
      createdAt: now - 5 * 3600_000,
      severity: 'watch',
      title: 'XAUUSD cross-tier watch — LP soft vs exchanges',
      triggerReason: 'Cross-tier dislocation: 2 exchange + 1 LP at Watch/Alert',
      breachedSources: ['OKEX', 'BITGET', 'STARPRIME'],
      compositePrice: 3890.55,
      why: [
        'STARPRIME quoted soft vs OKX/Bitget while indexes stayed tight.',
        'Isolated LP inventory skew; composite move under shock threshold.',
      ],
      impact: [
        'Limited index impact if STARPRIME weight is low.',
        'Watch for copycat LP widening.',
      ],
      actions: [
        'Raised watch on STARPRIME only.',
        'No leverage change.',
      ],
      sourcesConsulted: ['OKX live', 'Bitget live', 'derived STARPRIME'],
    },
  ]
}
