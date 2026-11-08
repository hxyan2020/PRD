# vex-llm-proxy

Minimal Vercel serverless OpenAI proxy for the V Exchange Risk Tool desk.

- `GET /api/chat` → health
- `POST /api/chat` → OpenAI chat (requires `X-Desk-Token`)

## Env (Vercel)

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Server-side OpenAI key |
| `DESK_GATEWAY_TOKEN` | yes | Must match desk `llm-config.json` `deskToken` |
| `DAILY_BUDGET_USD` | no | Default `10` |

## Deploy

```bash
npx vercel login
npx vercel --prod \
  --env OPENAI_API_KEY=… \
  --env DESK_GATEWAY_TOKEN=… \
  --yes
```

Point `xauusd-source-monitor/public/llm-config.json` `proxyBase` at the production URL.
