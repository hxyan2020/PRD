# Lark Messenger Server

Dynamic **Lark interactive message templates** + **OpenAI chat proxy** for the V Exchange Risk Tool desk.

Repo path: `lark-messenger-server/` (lives beside `xauusd-source-monitor/` on GitHub).

## What it does

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Template playground UI |
| `GET /health` | Status + which keys are loaded |
| `GET /api/templates` | List template metadata |
| `POST /api/lark/render` | Build Lark card JSON from `templateId` + `vars` |
| `POST /api/lark/send` | Render + POST to Lark bot webhook (or dry-run) |
| `POST /api/chat` | OpenAI / Gemini / OpenRouter proxy (same shape as desk Investigate) |

### Built-in templates

- `risk-alert` — monitor / threshold alert card (Ack · Escalate · Open desk)
- `rca-report` — Investigate RCA summary card
- `market-briefing` — Market Condition red/yellow/green briefing

Templates are JSON under `templates/`. Card layout is rendered in `server.mjs` (Lark interactive schema 2.0).

## Run locally

```bash
cd lark-messenger-server
# Optional: copy keys (never commit)
cp ../xauusd-source-monitor/.env .env   # OPENAI_API_KEY=…
# Optional Lark delivery
# LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/...

npm start
# → http://127.0.0.1:8790/
```

Smoke:

```bash
npm test
```

## Env

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | for `/api/chat` | Also reads `../xauusd-source-monitor/.env` |
| `LARK_WEBHOOK_URL` | for live send | Without it, `/api/lark/send` returns dry-run payload |
| `PORT` | no | Default `8790` |

`.env` is gitignored. **Never** put keys in the gh-pages SPA bundle.

## Point the Risk Tool desk at this proxy

1. Start this server (`npm start`).
2. Open [setup-llm.html](https://hxyan2020.github.io/PRD/xauusd-source-monitor/setup-llm.html) (or local `xauusd-source-monitor/public/setup-llm.html`).
3. Set **Proxy base** to `http://127.0.0.1:8790` (or your hosted URL) and save.
4. Investigate → **Run RCA** uses `POST {proxyBase}/api/chat` instead of shipping the key in public JS.

You can also paste a personal OpenAI key into Investigate settings (BYOK, localStorage only).

## Host on your stack

Any Node 20+ host works (Fly, Railway, Render, VPS):

```bash
git clone https://github.com/hxyan2020/PRD.git
cd PRD/lark-messenger-server
# set OPENAI_API_KEY + LARK_WEBHOOK_URL in the host secrets UI
npm start
```

Expose HTTPS, then set the desk `proxyBase` / `LARK_WEBHOOK_URL` accordingly.

## Example: render a risk alert

```bash
curl -s http://127.0.0.1:8790/api/lark/render \
  -H 'Content-Type: application/json' \
  -d '{"templateId":"risk-alert","vars":{"title":"OKX mark drift","severity":"P1","breached":"OKX","alert_id":"ALT-42"}}' \
  | jq .
```
