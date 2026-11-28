# vex-llm-proxy

Permanent Vercel host for **VE排查助手** (V Exchange Risk Tool):

**https://vex-llm-proxy.vercel.app**

Investigate: **https://vex-llm-proxy.vercel.app/#/investigate**

The live site is the full `xauusd-source-monitor` SPA (login → desk) plus
`POST /api/chat` with a **server-side** `OPENAI_API_KEY`. Users are never asked
to paste an API key in the browser.

Deploy from the SPA folder:

```bash
cd ../xauusd-source-monitor
bash scripts/deploy-vercel.sh
```

## Env (Vercel Production)

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Server-side OpenAI key |
| `DESK_GATEWAY_TOKEN` | yes | Must match desk `llm-config.json` `deskToken` |
| `DAILY_BUDGET_USD` | no | Default `10` |
