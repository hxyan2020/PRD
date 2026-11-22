# V Exchange Risk Tool（VE排查助手）

Public SPA for **XAUUSD MVP perpetual** risk ops on V Exchange.

## Permanent URL (Vercel)

**https://vex-llm-proxy.vercel.app**

Investigate entry: **https://vex-llm-proxy.vercel.app/#/investigate**

OpenAI runs **server-side only** (`OPENAI_API_KEY` on the Vercel project). The browser never asks for an API key.

GitHub Pages mirror (proxies LLM to the Vercel host):  
https://hxyan2020.github.io/PRD/xauusd-source-monitor/#/investigate

## Product tabs

1. **Investigate (RCA)** — alert screenshot RCA desk (skills + knowledge, thinking, timeline, next steps)
2. **Market Condition** — Briefings, Health, Rules, Archive
3. **Skills** — create / edit / disable / archive L1–L2 investigation skills
4. **Knowledge Base** — tree RAG used by Investigate
5. **Realtime Statistics** — auto-ingest every triggered RCA

## Demo login (Hytech email)

| Email | Password | Role |
| --- | --- | --- |
| `risk.ops@hytech.com` | `RiskDemo2026!` | risk_ops |
| `analyst@hytechc.com` | `RiskDemo2026!` | analyst |
| `admin@hytech.com` | `RiskDemo2026!` | admin |

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
On GitHub Pages, `llm-config.json` → `proxyBase` points at `https://vex-llm-proxy.vercel.app`.
