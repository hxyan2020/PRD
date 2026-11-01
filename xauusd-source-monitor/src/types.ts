export type SourceKind = 'exchange' | 'exchange_index' | 'lp' | 'composite_index'
export type FeedMode = 'live' | 'derived' | 'offline'
export type HealthLevel = 'healthy' | 'watch' | 'alert' | 'stale' | 'offline'
export type BriefingSeverity = 'watch' | 'alert' | 'critical'

export interface SourceDef {
  id: string
  label: string
  kind: SourceKind
  /** Static basis vs composite in bps for derived venues */
  basisBps: number
  /** Extra noise scale for derived quotes */
  noiseBps: number
}

export interface SourceQuote {
  id: string
  price: number | null
  updatedAt: number
  latencyMs: number | null
  mode: FeedMode
  error?: string
}

export interface SourceHealth extends SourceQuote {
  label: string
  kind: SourceKind
  deviationBps: number | null
  health: HealthLevel
  score: number
  consecutiveBreaches: number
}

export interface MonitorRules {
  /** Absolute deviation from composite median to enter watch (bps) */
  watchDeviationBps: number
  /** Absolute deviation from composite median to enter alert (bps) */
  alertDeviationBps: number
  /** Minimum sources in alert to fire briefing */
  minAlertSources: number
  /** Or: exchanges + LPs that must breach watch together */
  minExchangeWatch: number
  minLpWatch: number
  /** Composite 5-minute absolute move (bps) that alone can fire */
  compositeMoveBps5m: number
  /** Quote older than this is stale (ms) */
  staleAfterMs: number
  /** Briefing cooldown (ms) */
  cooldownMs: number
  pollIntervalMs: number
}

export interface TriggerEvent {
  id: string
  firedAt: number
  severity: BriefingSeverity
  reason: string
  breachedSources: string[]
  compositePrice: number
  compositeMoveBps5m: number
}

export type CitationCategory = 'price_api' | 'venue' | 'macro' | 'news' | 'positioning'

export interface BriefingCitation {
  id: string
  /** Short human label */
  label: string
  /** Exact URL to open for verification (API endpoint, instrument page, or article) */
  url: string
  category: CitationCategory
  /** Optional snapshot note, e.g. last price at briefing time */
  note?: string
}

export interface Briefing {
  id: string
  createdAt: number
  severity: BriefingSeverity
  /** Language the briefing body was generated in */
  lang?: 'en' | 'zh-Hant'
  title: string
  triggerReason: string
  breachedSources: string[]
  compositePrice: number
  why: string[]
  impact: string[]
  actions: string[]
  /** @deprecated Prefer citations with clickable URLs */
  sourcesConsulted: string[]
  /** Verifiable deep links (APIs, instrument pages, specific articles) */
  citations: BriefingCitation[]
}

export interface MacroSnapshot {
  spotXau: number | null
  dxyHint: string
  basisBps: number | null
  sessionNote: string
  fetchedAt: number
}

export interface PricePoint {
  t: number
  px: number
  spot?: number
}

export type ProbeStatus = 'ok' | 'degraded' | 'down' | 'checking'
export type InfoSourceKind = 'price' | 'venue' | 'macro' | 'policy' | 'news'

export interface InfoSourceProbe {
  id: string
  label: string
  url: string
  kind: InfoSourceKind
  /** How this health check is performed */
  check: 'json' | 'http' | 'cors_opaque'
  status: ProbeStatus
  latencyMs: number | null
  detail?: string
  checkedAt: number | null
}
