# V Exchange Risk Tool（VE排查助手）

Public SPA for **XAUUSD MVP perpetual** risk ops on V Exchange.

## Permanent URL (Vercel)

**https://quote-ai-troubleshooting-bot.vercel.app**

Investigate entry: **https://quote-ai-troubleshooting-bot.vercel.app/#/investigate**

OpenAI runs **server-side only** (`OPENAI_API_KEY` on the Vercel project). The browser never asks for an API key.

GitHub Pages mirror (proxies LLM to the Vercel host):  
https://hxyan2020.github.io/PRD/xauusd-source-monitor/#/investigate

## Product tabs

1. **Investigate (RCA)** — alert screenshot RCA desk (skills + knowledge, thinking, timeline, next steps)
2. **Market Condition** — Briefings, Health, Rules, Archive
3. **Skills** — L1–L2 investigation skills (**Admin write**; others read-only)
4. **Knowledge Base** — tree RAG / memory used by Investigate (**Admin write**)
5. **Alerts & Reports** — past alerts / RCA board
6. **Realtime Statistics** — auto-ingest every triggered RCA

**Access:** only `admin` may change Skills, RAG knowledge (memory), and skill overrides. Ops/Analyst can Investigate and view.

## Demo login (Hytech email)

| Email | Password | Role |
| --- | --- | --- |
| `ops@hytech.com` | `OpsDemo2026!` | risk_ops |
| `risk.ops@hytech.com` | `RiskDemo2026!` | risk_ops |
| `analyst@hytech.com` | `RiskDemo2026!` | analyst |
| `admin@hytech.com` | `AdminDemo2026!` | admin |

Accepted domains: `@hytech.com`, `@hytechc.com`, `@hytechpro.com`.

## Local

```bash
npm install
npm run dev
# Optional local LLM proxy (reads OPENAI_API_KEY from env):
# node scripts/llm-proxy.mjs
```

## Deploy permanent Vercel host

```bash
cd xauusd-source-monitor
bash scripts/deploy-vercel.sh   # requires: npx vercel login  or  VERCEL_TOKEN
```

Production env on the `vex-llm-proxy` Vercel project:

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Server-side OpenAI key (never shipped to the browser) |
| `DESK_GATEWAY_TOKEN` | yes | Must match `public/llm-config.json` → `deskToken` |
| `DAILY_BUDGET_USD` | no | Default `10` |

On Vercel the SPA uses **same-origin** `POST /api/chat`.  
On GitHub Pages, `llm-config.json` → `proxyBase` points at `https://quote-ai-troubleshooting-bot.vercel.app`.
