/**
 * Hourly Market Condition scan — bilingual TL;DR / Opportunity / Risk.
 * Never invents points: empty sections say so explicitly.
 */
import type { BriefingCitation, SourceHealth } from '../types'

export type ReportSectionKind = 'tldr' | 'opportunity' | 'risk'

export interface ReportSource {
  id: string
  /** Short caption under the logo */
  captionEn: string
  captionZh: string
  url: string
  domain: string
  /** Favicon / official mark via Google s2 (no local assets required) */
  logoUrl: string
}

export interface RankedPoint {
  /** 1 = most urgent … 4 = least */
  rank: number
  en: string
  zh: string
  sourceIds: string[]
}

/** -100 (bearish) … 0 (neutral) … +100 (bullish) for XAUUSD desk tone */
export type SentimentBandId =
  | 'bearish'
  | 'cautious'
  | 'neutral'
  | 'constructive'
  | 'bullish'

export interface SentimentBarometer {
  /** Integer score in [-100, 100] */
  score: number
  band: SentimentBandId
  labelEn: string
  labelZh: string
  /** CSS color token for the fill / pill */
  color: string
  /** How the score is defined — shown on hover */
  definitionEn: string[]
  definitionZh: string[]
}

export interface HourlyMarketReport {
  id: string
  createdAt: number
  /** Asia/Singapore hour bucket, e.g. 2026-11-22T19 */
  hourKey: string
  tldr: RankedPoint[]
  opportunity: RankedPoint[]
  risk: RankedPoint[]
  sources: ReportSource[]
  sentiment: SentimentBarometer
  /** V Exchange indicators are placeholders until ops provides the feed */
  vexPlaceholder: true
  vexNoteEn: string
  vexNoteZh: string
}

const REPORTS_KEY = 'xauusd-hourly-scan-reports-v1'
const HOUR_MS = 60 * 60_000

const YAHOO_DXY =
  'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1m&range=1d'
const YAHOO_TNX =
  'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1m&range=1d'
const FED_PRESS = 'https://www.federalreserve.gov/json/ne-press.json'
const GOLD_API = 'https://api.gold-api.com/price/XAU'
const OKX_TICKER = 'https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP'

/** Curated opinion / survey articles — used only when the URL probes OK. */
const OPINION_ARTICLES = [
  {
    id: 'kitco-survey',
    url: 'https://www.kitco.com/news/article/2026-10-30/wall-street-abandons-ship-after-gold-sinks-below-3900oz-main-street',
    captionEn: 'Kitco survey: Wall Street turns bearish after gold sinks below $3,900',
    captionZh: 'Kitco 調查：金價跌破 3,900 後華爾街轉空',
    domain: 'kitco.com',
  },
  {
    id: 'kitco-paradox',
    url: 'https://www.kitco.com/news/article/2026-10-30/golds-frustrating-paradox-falling-yields-and-weaker-dollar-cant-stop',
    captionEn: "Kitco: Gold's paradox — falling yields/weaker USD can't stop selloff",
    captionZh: 'Kitco：收益率下行與美元走弱仍擋不住金價拋售',
    domain: 'kitco.com',
  },
  {
    id: 'kitco-hawkish-pause',
    url: 'https://www.kitco.com/news/article/2026-10-29/gold-remains-stuck-fed-takes-hawkish-pause-tds-melek',
    captionEn: 'Kitco / TDS: Gold stuck as Fed takes hawkish pause',
    captionZh: 'Kitco / TDS：聯準會鷹派暫停，金價受困',
    domain: 'kitco.com',
  },
  {
    id: 'kitco-rates-holdback',
    url: 'https://www.kitco.com/news/article/2026-10-30/gold-wants-rally-threat-higher-interest-rates-holding-it-back-catalyst',
    captionEn: 'Kitco: Higher-rate threat holding gold rally back',
    captionZh: 'Kitco：利率上行威脅壓制金價反彈',
    domain: 'kitco.com',
  },
] as const

function domainOf(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    // Prefer public site marks over API CDN hosts for the logo popup.
    if (host.includes('yahoo.com')) return 'finance.yahoo.com'
    if (host.includes('okx.com')) return 'okx.com'
    if (host.includes('bitget.com')) return 'bitget.com'
    if (host.includes('federalreserve.gov')) return 'federalreserve.gov'
    if (host.includes('gold-api.com')) return 'gold-api.com'
    return host
  } catch {
    return url
  }
}

function logoFor(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

function makeSource(
  id: string,
  url: string,
  captionEn: string,
  captionZh: string,
): ReportSource {
  const domain = domainOf(url)
  return { id, captionEn, captionZh, url, domain, logoUrl: logoFor(domain) }
}

function hourKeySgt(ts = Date.now()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(ts)).map((p) => [p.type, p.value]),
  ) as Record<string, string>
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}`
}

function clampTwoSentences(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  const parts = trimmed.split(/(?<=[.!?。！？])\s+/).filter(Boolean)
  return parts.slice(0, 2).join(' ')
}

function rankPoints(
  rows: Omit<RankedPoint, 'rank'>[],
): RankedPoint[] {
  return rows.slice(0, 4).map((r, i) => ({
    ...r,
    rank: i + 1,
    en: clampTwoSentences(r.en),
    zh: clampTwoSentences(r.zh),
  }))
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store', mode: 'cors' })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function probeUrl(url: string, timeoutMs = 6000): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    // no-cors opaque still proves DNS/TLS reachability for news hosts
    await fetch(url, {
      signal: ctrl.signal,
      cache: 'no-store',
      mode: 'no-cors',
      method: 'GET',
    })
    clearTimeout(timer)
    return true
  } catch {
    return false
  }
}

function yahooLastClose(data: unknown): number | null {
  try {
    const chart = data as {
      chart?: { result?: { meta?: { regularMarketPrice?: number }; indicators?: { quote?: { close?: (number | null)[] }[] } }[] }
    }
    const meta = chart.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof meta === 'number' && Number.isFinite(meta)) return meta
    const closes = chart.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    for (let i = closes.length - 1; i >= 0; i--) {
      const v = closes[i]
      if (typeof v === 'number' && Number.isFinite(v)) return v
    }
  } catch {
    /* ignore */
  }
  return null
}

function fedLatestHeadline(data: unknown): { title: string; link: string } | null {
  try {
    const rows = data as { title?: string; link?: string; type?: string }[]
    if (!Array.isArray(rows)) return null
    const hit = rows.find((r) => r?.title && r?.link)
    if (!hit?.title || !hit?.link) return null
    return { title: String(hit.title), link: String(hit.link) }
  } catch {
    return null
  }
}

function okxLast(data: unknown): number | null {
  try {
    const row = (data as { data?: { last?: string }[] })?.data?.[0]
    const n = Number(row?.last)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function goldApiPrice(data: unknown): number | null {
  try {
    const n = Number((data as { price?: number })?.price)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function loadHourlyReports(): HourlyMarketReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HourlyMarketReport[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, 48).map((r) => ({
      ...r,
      sentiment: r.sentiment ?? computeSentiment(r.opportunity || [], r.risk || []),
    }))
  } catch {
    return []
  }
}

export function saveHourlyReports(list: HourlyMarketReport[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, 48)))
}

/** Rank weight: #1 most urgent → 25, then 20 / 15 / 10. */
function rankWeight(rank: number): number {
  const w = 25 - (Math.max(1, Math.min(4, rank)) - 1) * 5
  return w
}

export function computeSentiment(
  opportunity: RankedPoint[],
  risk: RankedPoint[],
): SentimentBarometer {
  let raw = 0
  for (const p of opportunity) raw += rankWeight(p.rank)
  for (const p of risk) raw -= rankWeight(p.rank)
  const score = Math.max(-100, Math.min(100, Math.round(raw)))

  let band: SentimentBandId = 'neutral'
  if (score <= -50) band = 'bearish'
  else if (score <= -15) band = 'cautious'
  else if (score >= 50) band = 'bullish'
  else if (score >= 15) band = 'constructive'

  const palette: Record<SentimentBandId, { color: string; labelEn: string; labelZh: string }> = {
    bearish: { color: '#991b1b', labelEn: 'Bearish', labelZh: '偏空' },
    cautious: { color: '#c2410c', labelEn: 'Cautious', labelZh: '偏谨慎' },
    neutral: { color: '#a16207', labelEn: 'Neutral', labelZh: '中性' },
    constructive: { color: '#15803d', labelEn: 'Constructive', labelZh: '偏建设性' },
    bullish: { color: '#166534', labelEn: 'Bullish', labelZh: '偏多' },
  }

  const meta = palette[band]
  const definitionEn = [
    'Score range: −100 (bearish) → 0 (neutral) → +100 (bullish) for XAUUSD desk tone.',
    'Each Opportunity point adds +25 / +20 / +15 / +10 by urgency rank (#1–#4).',
    'Each Risk point subtracts the same weights (−25 / −20 / −15 / −10).',
    'Bands: ≤−50 Bearish · −49…−15 Cautious · −14…+14 Neutral · +15…+49 Constructive · ≥+50 Bullish.',
    'Only scored from listed Opportunity/Risk points this hour — never invented. Empty lists → 0 Neutral.',
  ]
  const definitionZh = [
    '分数区间：−100（偏空）→ 0（中性）→ +100（偏多），针对 XAUUSD 工作台语气。',
    '每条「机会」按紧急度排名加分：#1–#4 为 +25 / +20 / +15 / +10。',
    '每条「风险」按同样权重减分：−25 / −20 / −15 / −10。',
    '分档：≤−50 偏空 · −49…−15 偏谨慎 · −14…+14 中性 · +15…+49 偏建设性 · ≥+50 偏多。',
    '仅依据本小时列出的机会／风险要点计分，不编造。两边皆空 → 0 中性。',
  ]

  if (opportunity.length === 0 && risk.length === 0) {
    return {
      score: 0,
      band: 'neutral',
      labelEn: 'Neutral',
      labelZh: '中性',
      color: palette.neutral.color,
      definitionEn,
      definitionZh,
    }
  }

  return {
    score,
    band,
    labelEn: meta.labelEn,
    labelZh: meta.labelZh,
    color: meta.color,
    definitionEn,
    definitionZh,
  }
}

export function msUntilNextHourSgt(now = Date.now()): number {
  const key = hourKeySgt(now)
  // Advance one hour in SGT by constructing the next bucket boundary via UTC offset +8
  const [datePart, hourPart] = key.split('T')
  const y = Number(datePart!.slice(0, 4))
  const m = Number(datePart!.slice(5, 7))
  const d = Number(datePart!.slice(8, 10))
  const h = Number(hourPart)
  // SGT = UTC+8 → next hour start as UTC ms
  const nextUtc = Date.UTC(y, m - 1, d, h + 1, 0, 0, 0) - 8 * HOUR_MS
  return Math.max(5_000, nextUtc - now + 1_000)
}

export async function generateHourlyScan(args: {
  health: SourceHealth[]
  composite: number | null
  spot: number | null
  extraCitations?: BriefingCitation[]
}): Promise<HourlyMarketReport> {
  const createdAt = Date.now()
  const sources: ReportSource[] = []
  const opportunityRaw: Omit<RankedPoint, 'rank'>[] = []
  const riskRaw: Omit<RankedPoint, 'rank'>[] = []

  const addSource = (s: ReportSource) => {
    if (sources.some((x) => x.id === s.id || x.url === s.url)) return
    sources.push(s)
  }

  // —— Macro ——
  const [dxyJson, tnxJson, fedJson] = await Promise.all([
    fetchJson(YAHOO_DXY),
    fetchJson(YAHOO_TNX),
    fetchJson(FED_PRESS),
  ])

  const dxy = yahooLastClose(dxyJson)
  if (dxy != null) {
    const src = makeSource(
      'yahoo-dxy',
      YAHOO_DXY,
      `Yahoo Finance DX-Y.NYB last ${dxy.toFixed(3)}`,
      `Yahoo Finance 美元指數 DX-Y.NYB 最新 ${dxy.toFixed(3)}`,
    )
    addSource(src)
    // Stronger USD is typically a headwind for gold → risk; weaker → opportunity
    if (dxy >= 104) {
      riskRaw.push({
        en: `Dollar Index (DX-Y.NYB) prints ${dxy.toFixed(3)} on the live Yahoo 1m chart. A firm USD remains a headwind for XAUUSD until the print softens.`,
        zh: `美元指數（DX-Y.NYB）於 Yahoo 1 分鐘圖最新為 ${dxy.toFixed(3)}。美元偏強在回落前仍對 XAUUSD 構成逆風。`,
        sourceIds: [src.id],
      })
    } else if (dxy <= 100) {
      opportunityRaw.push({
        en: `Dollar Index (DX-Y.NYB) prints ${dxy.toFixed(3)} on the live Yahoo 1m chart. Softer USD removes one near-term headwind for XAUUSD.`,
        zh: `美元指數（DX-Y.NYB）於 Yahoo 1 分鐘圖最新為 ${dxy.toFixed(3)}。美元偏弱短期減輕 XAUUSD 的一項逆風。`,
        sourceIds: [src.id],
      })
    } else {
      // Neutral band — still a factual macro observation for TL;DR only via risk/opp if we want;
      // put in risk as low urgency watch without inventing direction.
      riskRaw.push({
        en: `Dollar Index (DX-Y.NYB) is ${dxy.toFixed(3)} on the live Yahoo 1m chart. No extreme USD impulse is evidenced in this print alone.`,
        zh: `美元指數（DX-Y.NYB）於 Yahoo 1 分鐘圖為 ${dxy.toFixed(3)}。單憑此讀數尚無極端美元衝動證據。`,
        sourceIds: [src.id],
      })
    }
  }

  const tnx = yahooLastClose(tnxJson)
  if (tnx != null) {
    const src = makeSource(
      'yahoo-tnx',
      YAHOO_TNX,
      `Yahoo Finance ^TNX (US 10Y) last ${tnx.toFixed(3)}%`,
      `Yahoo Finance ^TNX（美債 10 年）最新 ${tnx.toFixed(3)}%`,
    )
    addSource(src)
    if (tnx >= 4.2) {
      riskRaw.push({
        en: `US 10Y (^TNX) is ${tnx.toFixed(3)}% on the live Yahoo chart. Higher real-rate pressure can weigh on gold until yields ease.`,
        zh: `美債 10 年（^TNX）於 Yahoo 圖為 ${tnx.toFixed(3)}%。實質利率偏高在收益率回落前可能壓抑金價。`,
        sourceIds: [src.id],
      })
    } else if (tnx <= 3.5) {
      opportunityRaw.push({
        en: `US 10Y (^TNX) is ${tnx.toFixed(3)}% on the live Yahoo chart. Softer yields are a constructive backdrop for XAUUSD when confirmed by follow-through.`,
        zh: `美債 10 年（^TNX）於 Yahoo 圖為 ${tnx.toFixed(3)}%。收益率偏軟對 XAUUSD 偏建設性，仍需後續確認。`,
        sourceIds: [src.id],
      })
    } else {
      riskRaw.push({
        en: `US 10Y (^TNX) is ${tnx.toFixed(3)}% on the live Yahoo chart. Mid-range yields alone do not establish a directional gold catalyst.`,
        zh: `美債 10 年（^TNX）於 Yahoo 圖為 ${tnx.toFixed(3)}%。中段收益率本身不足以構成明確金價催化。`,
        sourceIds: [src.id],
      })
    }
  }

  const fed = fedLatestHeadline(fedJson)
  if (fed) {
    const src = makeSource(
      'fed-press',
      fed.link.startsWith('http') ? fed.link : `https://www.federalreserve.gov${fed.link}`,
      `Fed press: ${fed.title}`,
      `聯準會新聞：${fed.title}`,
    )
    // Also keep the JSON feed as a source
    addSource(
      makeSource(
        'fed-press-json',
        FED_PRESS,
        'Federal Reserve ne-press.json feed',
        '聯準會 ne-press.json 新聞源',
      ),
    )
    addSource(src)
    riskRaw.push({
      en: `Latest Fed press item on the official JSON feed: “${fed.title}”. Treat as calendar/policy context — not an automatic XAUUSD trade signal.`,
      zh: `聯準會官方 JSON 最新新聞：「${fed.title}」。僅作日程／政策背景，非自動交易信號。`,
      sourceIds: [src.id, 'fed-press-json'],
    })
  }

  // —— Spot / venue (factual only) ——
  const [goldJson, okxJson] = await Promise.all([fetchJson(GOLD_API), fetchJson(OKX_TICKER)])
  const spotLive = goldApiPrice(goldJson)
  if (spotLive != null) {
    const src = makeSource(
      'gold-api',
      GOLD_API,
      `gold-api XAU spot ${spotLive.toFixed(2)}`,
      `gold-api XAU 現貨 ${spotLive.toFixed(2)}`,
    )
    addSource(src)
  }
  const okxPx = okxLast(okxJson)
  if (okxPx != null) {
    const src = makeSource(
      'okx-xau-swap',
      OKX_TICKER,
      `OKX XAU-USDT-SWAP last ${okxPx.toFixed(2)}`,
      `OKX XAU-USDT-SWAP 最新 ${okxPx.toFixed(2)}`,
    )
    addSource(src)
    if (spotLive != null) {
      const basisBps = ((okxPx - spotLive) / spotLive) * 10_000
      const basisSrc = [src.id, 'gold-api']
      if (Math.abs(basisBps) >= 25) {
        riskRaw.push({
          en: `OKX XAU-USDT-SWAP ${okxPx.toFixed(2)} vs gold-api spot ${spotLive.toFixed(2)} → basis ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps. Wide basis needs venue/LP checks before acting.`,
          zh: `OKX XAU-USDT-SWAP ${okxPx.toFixed(2)} 對 gold-api 現貨 ${spotLive.toFixed(2)} → 基差 ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps。基差偏寬時應先核對場所／LP。`,
          sourceIds: basisSrc,
        })
      } else {
        opportunityRaw.push({
          en: `OKX XAU-USDT-SWAP ${okxPx.toFixed(2)} vs gold-api spot ${spotLive.toFixed(2)} → basis ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps. No extreme basis dislocation in this print.`,
          zh: `OKX XAU-USDT-SWAP ${okxPx.toFixed(2)} 對 gold-api 現貨 ${spotLive.toFixed(2)} → 基差 ${basisBps >= 0 ? '+' : ''}${basisBps.toFixed(1)} bps。此讀數未顯示極端基差錯位。`,
          sourceIds: basisSrc,
        })
      }
    }
  }

  // Live monitor health → only if we have concrete alert/watch rows
  const alertSources = args.health.filter((h) => h.health === 'alert' || h.health === 'watch')
  if (alertSources.length >= 2 && args.composite != null) {
    const ids = alertSources.slice(0, 4).map((h) => h.id)
    const src = makeSource(
      'vex-monitor-composite',
      'https://vex-llm-proxy.vercel.app/#/market/health',
      `V Exchange desk composite ${args.composite.toFixed(2)}; breached/watch: ${ids.join(', ')}`,
      `V Exchange 工作台綜合價 ${args.composite.toFixed(2)}；關注／警報源：${ids.join('、')}`,
    )
    addSource(src)
    riskRaw.push({
      en: `Desk health shows ${alertSources.length} sources in watch/alert (e.g. ${ids.join(', ')}) vs composite ${args.composite.toFixed(2)}. Confirm with venue pages before escalating.`,
      zh: `工作台健康度顯示 ${alertSources.length} 個源處於關注／警報（如 ${ids.join('、')}），綜合價 ${args.composite.toFixed(2)}。升級前請核對場所頁。`,
      sourceIds: [src.id],
    })
  }

  // —— V Exchange indicators (placeholder — never invent values) ——
  const vexNoteEn =
    'V Exchange proprietary indicators: placeholder only — feed not connected; no indicator points this hour.'
  const vexNoteZh =
    'V Exchange 自有指標：目前僅為占位，數據源未接入；本小時無指標要點。'

  // —— XAUUSD opinions (only if article host responds) ——
  const opinionHits = await Promise.all(
    OPINION_ARTICLES.map(async (a) => ({ a, ok: await probeUrl(a.url) })),
  )
  for (const { a, ok } of opinionHits) {
    if (!ok) continue
    const src = makeSource(a.id, a.url, a.captionEn, a.captionZh)
    addSource(src)
    // Survey / hawkish pieces → risk; paradox/rates context → risk or opportunity by id
    if (a.id === 'kitco-survey' || a.id === 'kitco-hawkish-pause' || a.id === 'kitco-rates-holdback') {
      riskRaw.push({
        en: `Opinion source reachable: ${a.captionEn}. Use the article itself for the author’s view — this desk does not invent a stance.`,
        zh: `觀點來源可達：${a.captionZh}。作者立場以原文為準 — 本工作台不編造觀點。`,
        sourceIds: [src.id],
      })
    } else {
      opportunityRaw.push({
        en: `Opinion source reachable: ${a.captionEn}. Open the article for the full argument; no desk-invented trade thesis.`,
        zh: `觀點來源可達：${a.captionZh}。請打開原文閱讀完整論點；工作台不編造交易命題。`,
        sourceIds: [src.id],
      })
    }
  }

  // Attach any extra briefing citations as sources only (no new points from them)
  for (const c of args.extraCitations || []) {
    addSource(makeSource(c.id, c.url, c.label, c.label))
  }

  const opportunity = rankPoints(opportunityRaw)
  const risk = rankPoints(riskRaw)

  // TL;DR = most urgent blend of risk then opportunity, max 4, no invention beyond those lists
  const tldrPool = [
    ...risk.map((p) => ({ ...p, sourceIds: p.sourceIds })),
    ...opportunity.map((p) => ({ ...p, sourceIds: p.sourceIds })),
  ]
  const tldr = rankPoints(
    tldrPool.slice(0, 4).map((p) => ({
      en: p.en,
      zh: p.zh,
      sourceIds: p.sourceIds,
    })),
  )

  const sentiment = computeSentiment(opportunity, risk)

  return {
    id: `hourly_${createdAt}`,
    createdAt,
    hourKey: hourKeySgt(createdAt),
    tldr,
    opportunity,
    risk,
    sources,
    sentiment,
    vexPlaceholder: true,
    vexNoteEn,
    vexNoteZh,
  }
}

export const EMPTY_SECTION_EN = 'No points this hour.'
export const EMPTY_SECTION_ZH = '本小時暫無要點。'
