# vex-llm-proxy

Vercel project name for the Risk Tool production host:

**https://vex-llm-proxy.vercel.app**

The live site is the full `xauusd-source-monitor` SPA (login → desk) plus
`POST /api/chat`. Deploy from that folder:

```bash
cd ../xauusd-source-monitor
npx vercel link --yes --project vex-llm-proxy
npx vercel deploy --prod --yes
```

## Env (Vercel Production)

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Server-side OpenAI key |
| `DESK_GATEWAY_TOKEN` | yes | Must match desk `llm-config.json` `deskToken` |
| `DAILY_BUDGET_USD` | no | Default `10` |

Login sessions persist forever in the browser `localStorage` until Log out.
