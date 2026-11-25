import type { MonitorRules } from '../types'

/**
 * Default trigger policy for XAUUSD MVP perp.
 * Tuned for gold's typical venue dispersion (~2–8 bps calm; stress >15 bps).
 */
export const DEFAULT_RULES: MonitorRules = {
  watchDeviationBps: 8,
  alertDeviationBps: 15,
  minAlertSources: 3,
  minExchangeWatch: 2,
  minLpWatch: 1,
  compositeMoveBps5m: 35,
  staleAfterMs: 45_000,
  cooldownMs: 10 * 60_000,
  pollIntervalMs: 4_000,
}

export const RULE_COPY = [
  {
    id: 'dev-watch',
    title: 'Per-source watch',
    detail:
      'A source enters Watch when its mid vs the healthy composite median exceeds 8 bps (0.08%).',
  },
  {
    id: 'dev-alert',
    title: 'Per-source alert',
    detail:
      'A source enters Alert when deviation exceeds 15 bps (0.15%). Alert sources drive briefing eligibility.',
  },
  {
    id: 'multi-alert',
    title: 'Multi-source alert trigger',
    detail:
      'Fire a briefing when ≥3 sources are simultaneously in Alert — reduces single-venue noise.',
  },
  {
    id: 'cross-tier',
    title: 'Cross-tier watch trigger',
    detail:
      'Or fire when ≥2 exchange venues AND ≥1 LP are in Watch or worse — captures exchange/LP dislocation.',
  },
  {
    id: 'composite-move',
    title: 'Composite shock',
    detail:
      'Or fire when the composite median itself moves ≥35 bps (0.35%) over 5 minutes.',
  },
  {
    id: 'stale',
    title: 'Stale / offline',
    detail:
      'Quotes older than 45s are Stale; failed pulls are Offline. They lower health score but do not alone fire briefings.',
  },
  {
    id: 'cooldown',
    title: 'Cooldown',
    detail: 'After a briefing, wait 10 minutes before the next auto-briefing unless severity escalates to Critical.',
  },
]
