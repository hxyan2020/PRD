# V Exchange Risk Tool

Public SPA for **XAUUSD MVP perpetual** risk ops on V Exchange (formerly branded XAUUSD Source Monitor).

## Permanent link

https://hxyan2020.github.io/PRD/xauusd-source-monitor/

Risk desk entry: https://hxyan2020.github.io/PRD/xauusd-source-monitor/#/investigate

## Product tabs

1. **Market Condition** — Briefings, Health, Rules, Archive (source monitor + trigger policy)
2. **Skills** — create / edit / disable / archive L1–L2 investigation skills
3. **Knowledge Base** — tree RAG used by Investigate
4. **Investigate** — alert screenshot RCA desk (skills + knowledge, thinking, timeline, next steps)
5. **Realtime Statistics** — auto-ingest every triggered RCA (archive gates weekly optimisation only)

## Demo login (Hytech email)

Auth is required. Seeded demo users (browser session / localStorage):

| Email | Password | Role |
| --- | --- | --- |
| `risk.ops@hytech.com` | `RiskDemo2026!` | risk_ops |
| `analyst@hytechc.com` | `RiskDemo2026!` | analyst |
| `admin@hytech.com` | `RiskDemo2026!` | admin |

Accepted domains: `@hytech.com`, `@hytechc.com`, `@hytechpro.com`.

## Default trigger policy (Market Condition → Rules)

- Watch at **8 bps**, Alert at **15 bps** vs composite median
- Fire when **≥3 sources** are in Alert
- Or **≥2 exchange** + **≥1 LP** at Watch/Alert
- Or composite moves **≥35 bps** in 5 minutes
- **10 minute** briefing cooldown (Critical escalations bypass)

## Live anchors

- OKX `XAU-USDT-SWAP`
- Bitget `XAUUSDT` (when reachable)
- gold-api XAU spot (`RC_INDEX` / LMAX-style)

Other venues (BINANCE, BYBIT, indexes, ISPRIME, STARPRIME, VELOCITY) use correlated derived mirrors when browser CORS/geo blocks direct pulls.

## Local

```bash
npm install
npm run dev
GITHUB_PAGES=1 npm run build
bash scripts/deploy-gh-pages.sh
```
