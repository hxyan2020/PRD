# Indicators & Risk Scenarios

Operator catalogue for **Admin**, **Pricing**, and **Dealing** desks.

| Surface | Path |
|---------|------|
| Interactive board (filter by BU) | `/admin/docs/indicators-scenarios` |
| Seed SQL explorer | `/admin/docs/simulated-data` |
| Monitor 2.0 live registry | `/admin/monitor-2` |
| Domain scenario map | `/admin/risk-domains` |
| Skill playbooks | `/admin/skills` |

The board is the live catalogue: every row is read from SQLite (`monitor_indicators`) plus domain/skill catalogs in code. This markdown is the desk handbook overlay.

## Audience map

| Desk | Owns | Typical domains | Example monitors |
|------|------|-----------------|------------------|
| **Admin / Risk Owner** | Policy, L2 approve, discovery promote, severity weights | Credit / client, model & AI, fraud, infra | `M2-MRG-014`, `M2-EQ-001`, discovery `M2-DISC-*` |
| **Pricing** | Quote age, publish lag, product exposure, feed propagation | Market pricing, product config | `M2-LP-022`, `M2-FEED-003`, `M2-XAU-247` |
| **Dealing / LP** | Reject rate, hedge coverage, A-book tilt, weekend metals | LP & hedge, credit contagion companions | `M2-LP-022`, `M2-HEDGE-007`, `M2-XAU-247` |

Use the board’s **Admin / Pricing / Dealing** chips to filter indicators and domain scenarios.

## Canonical forex CFD use-case — INC-1028

| Field | Value |
|-------|--------|
| Incident | `INC-1028` |
| LP / symbol | LP-A · XAUUSD |
| Severity | P2 Medium |
| Desk | Pricing Engine SG-02 |
| L1 | `LP_QUOTE_DELAY` → `M2-LP-022`, `FINAL_QUOTE_STALE` / `QUOTE_PUBLISH_LAG` → `M2-FEED-003` |
| L2 | `PRICING_FEED_PROPAGATION` |
| Chain | `CHAIN-PRICING-FEED-PROPAGATION` |
| Seed monitors | `M2-LP-022`, `M2-FEED-003`, `M2-XAU-247`, `M2-HEDGE-007` |

### Desk flow (same story across modules)

1. **Monitor 2.0** — inspect `M2-LP-022` / `M2-FEED-003` (pack seeds WARN/BREACH)
2. **Open Alerts** — live `ALT-INC-1028` + companions; AI RCA enriches via OpenAI when keyed
3. **Monitor labs** — L2→RCA / AI Incident / Noise HTML walkthroughs on the same book
4. **Indicator Aggregation** — L1 → L2 via `CHAIN-PRICING-FEED-PROPAGATION`
5. **Unknown Risk Discovery** — each Scan builds a fresh SQLite feature window + process trail; Analyse regenerates thinking (OpenAI or MOCK)
6. **Ops Inbox** — Messenger thread `THR-INC-1028`
7. **Closed Risk Log** — closed companion trail (e.g. `ALT-STALE-FEED-LIQ`)

Home dummy spine, discovery spikes, aggregation seeds, and lab chrome all import `lib/demo/forex-incident-1028.ts`.

### Companion cases (same CFD book)

| Id | Story | Monitors | Primary desk |
|----|--------|----------|--------------|
| LP-HEDGE-GAP | LP reject storm → hedge coverage gap | `M2-LP-022`, `M2-HEDGE-007` | Dealing |
| XAU-WEEKEND | XAUUSD247 weekend exposure build-up | `M2-XAU-247`, `M2-HEDGE-007`, `M2-LP-022` | Pricing + Dealing |
| STALE-FEED-LIQ | Stale feed → liquidation / credit contagion | `M2-FEED-003`, `M2-MRG-014`, `M2-EQ-001` | Pricing + Admin |

## Where the lists come from

| Layer | Source |
|-------|--------|
| Indicators | SQLite `monitor_indicators` (+ `monitor-indicator-meta`) |
| Domain scenarios | `lib/ai/risk-domain-scenarios.ts` |
| Skill playbooks | `lib/ai/risk-scenarios-catalog.ts` → `/admin/skills` |
| Linked timelines | same catalog → Knowledge Tree |
| Forex pack | `lib/demo/forex-incident-1028.ts` |

## AI / LLM (real thinking each trigger)

| Trigger | Behaviour when `OPENAI_API_KEY` set (`CRMP_AI_LLM` not off) |
|---------|-------------------------------------------------------------|
| Discovery **Scan Now** | Stateless/ML on live SQLite window; unique `scan_seed` + thinking trail in `detail_json` / evidence (not HTML fixtures) |
| Discovery **Analyse** | Auto LIVE OpenAI; fresh `ANL-*` thinking each call; MOCK only if key missing / operator forced Mock |
| Alert **AI RCA** | Heuristic first, then OpenAI rewrite; LLM evidence + thinking stored on the analysis |
| Run detectors / Monitor run | New analyses are LLM-enriched after the batch |
| Home **dummy spine** | Enrich after RCA when keyed |
| Desk selection chat | Heuristic grounded reply, then OpenAI rewrite |

Failures always fall back to the heuristic / MOCK path — they never block the desk.
