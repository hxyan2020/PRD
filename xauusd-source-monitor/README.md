# V Exchange Risk Tool

Public SPA for **XAUUSD MVP perpetual** risk ops on V Exchange.

## Permanent link (Vercel only)

https://vex-llm-proxy.vercel.app

Risk desk entry: https://vex-llm-proxy.vercel.app/#/investigate

> **Deploy policy:** production is **Vercel only**. Do not publish this app to GitHub Pages.

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
| `ops@hytech.com` | `OpsDemo2026!` | risk_ops |
| `risk.ops@hytech.com` | `RiskDemo2026!` | risk_ops |
| `admin@hytech.com` | `AdminDemo2026!` | admin |

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
```

## Deploy (Vercel only)

SPA + `POST /api/chat` ship together on the `vex-llm-proxy` Vercel project.

```bash
bash scripts/deploy-vercel.sh   # requires: npx vercel login  OR  VERCEL_TOKEN
```

Production env vars (Vercel project → Settings → Environment Variables):

- `OPENAI_API_KEY` — server-side OpenAI key
- `DESK_GATEWAY_TOKEN` — same value as `deskToken` in `public/llm-config.json`
- `DAILY_BUDGET_USD` — optional (default 10)

`public/llm-config.json` uses empty `proxyBase` so the browser calls same-origin `/api/chat`.

Optional GitHub Actions: repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (workflow `deploy-llm-vercel.yml`).
