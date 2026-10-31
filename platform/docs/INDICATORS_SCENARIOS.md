# Indicators & Risk Scenarios

Operator catalogue for **Admin**, **Pricing**, and **Dealing** desks.

Interactive board: `/admin/docs/indicators-scenarios`  
Seed SQL explorer: `/admin/docs/simulated-data`

## Canonical forex CFD use-case — INC-1028

| Field | Value |
|-------|--------|
| Incident | `INC-1028` |
| LP / symbol | LP-A · XAUUSD |
| Severity | P2 Medium |
| Desk | Pricing Engine SG-02 |
| L1 | `LP_QUOTE_DELAY` → `M2-LP-022`, `FINAL_QUOTE_STALE` / `QUOTE_PUBLISH_LAG` → `M2-FEED-003` |
| L2 | `PRICING_FEED_PROPAGATION` |
| Seed monitors | `M2-LP-022`, `M2-FEED-003`, `M2-XAU-247`, `M2-HEDGE-007` |

### Desk flow (same story across modules)

1. **Monitor 2.0** — inspect `M2-LP-022` / `M2-FEED-003`
2. **Open Alerts** — live queue + AI RCA (`analyze_alert` may enrich via OpenAI when `OPENAI_API_KEY` is set)
3. **Indicator Aggregation** — L1 → L2 wait window (seed prefers forex pack monitors)
4. **Monitor labs → L2→RCA / Noise** — HTML walkthroughs on the same book
5. **AI Incident Workspace** — INC-1028 Static/Dynamic report
6. **Ops Inbox** — Messenger thread `THR-INC-1028`
7. **Closed Risk Log** — after close

Home dummy spine, discovery spikes, aggregation seeds, and lab chrome all import `lib/demo/forex-incident-1028.ts`.

### Companion cases (same CFD book)

| Id | Story | Monitors |
|----|--------|----------|
| LP-HEDGE-GAP | LP reject storm → hedge coverage gap | `M2-LP-022`, `M2-HEDGE-007` |
| XAU-WEEKEND | XAUUSD247 weekend exposure build-up | `M2-XAU-247`, `M2-HEDGE-007`, `M2-LP-022` |
| STALE-FEED-LIQ | Stale feed → liquidation / credit contagion | `M2-FEED-003`, `M2-MRG-014`, `M2-EQ-001` |

### BU lens

- **Admin / Risk Owner** — approve L2, severity weights, discovery promote
- **Pricing** — quote age, publish lag, product exposure (`M2-XAU-247`)
- **Dealing / LP** — reject rate, hedge coverage, A-book tilt

## Where the lists come from

| Layer | Source |
|-------|--------|
| Indicators | SQLite `monitor_indicators` (+ `monitor-indicator-meta`) |
| Domain scenarios | `lib/ai/risk-domain-scenarios.ts` |
| Skill playbooks | `lib/ai/risk-scenarios-catalog.ts` → `/admin/skills` |
| Linked timelines | same catalog → Knowledge Tree |

## AI / LLM

- Discovery **Analyse** can Connect OpenAI (`OPENAI_API_KEY`); live failures fall back to MOCK.
- Alert RCA / desk chat call OpenAI when the key is present (`CRMP_AI_LLM` defaults to auto). Heuristic path remains if the call fails.
- Unknown-risk **scan** models (`isolation_forest`, `cusum`, …) always sample from current seed monitor series in SQLite — not HTML fixtures.
