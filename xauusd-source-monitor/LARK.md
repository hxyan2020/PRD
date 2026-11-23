# V Exchange Risk Copilot — Lark bot

The **web desk stays live** (`/#/investigate`, Market, Skills, KB, Stats).  
This adds a parallel **Lark / Feishu** interaction surface on the same Vercel project.

Public host: `https://vex-llm-proxy.vercel.app`  
Webhook: `https://vex-llm-proxy.vercel.app/api/lark/event`

## Minimum to enable live conversation

You only need to provide **two secrets** (never paste into chat/PR):

| Secret | Where |
|--------|--------|
| `LARK_APP_ID` | Vercel project **`vex-llm-proxy`** → Settings → Environment Variables → Production |
| `LARK_APP_SECRET` | same |

Then in **Lark / Feishu Developer Console** (no extra secrets):

1. Enable **Bot** capability.
2. Event subscription Request URL → `https://vex-llm-proxy.vercel.app/api/lark/event` (pass URL verification).
3. Subscribe: `im.message.receive_v1`, `card.action.trigger`.
4. Permissions: reply/send messages; get message resources (images) if you want screenshot OCR.
5. **Leave Encrypt Key OFF / empty** (encrypt envelopes are not supported).
6. Verification Token: optional — leave empty on both sides, or copy the console token into Vercel as `LARK_VERIFICATION_TOKEN`.
7. Publish the app → add the bot to the risk group → **@bot** (DMs work without @).

Check readiness:

```bash
curl -sS https://vex-llm-proxy.vercel.app/api/lark/event
# want: "larkConfigured": true, "readyForConversation": true, "missingSecrets": []
```

`OPENAI_API_KEY` is already on the host (`hasOpenAI: true`) — better answers + image OCR. Rules/RAG still work without it.

## Optional env (not required for first conversation)

| Name | When needed |
|------|-------------|
| `LARK_VERIFICATION_TOKEN` | If you set a Verification Token in the Lark console |
| `LARK_BOT_OPEN_ID` | Rare — auto-fetched after ID/secret work; only set if @ matching misfires |
| `LARK_API_HOST` | International Lark: `https://open.larksuite.com` (default is `https://open.feishu.cn`) |
| `LARK_REPLY_ALL_GROUP=1` | Reply to every group message without @ (not recommended) |
| `LARK_ENCRYPT_KEY` | **Do not use** until decrypt is implemented — keep Encrypt Key off |
| `DESK_GATEWAY_TOKEN` | Protects desk smoke `/api/lark/incidents` only; unrelated to Lark chat |

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/lark/event` | Webhook (challenge + messages + card actions) |
| GET/POST | `/api/lark/incidents` | List / simulate turns (smoke) |

## Bot behaviour

1. **Greeting** — natural hello on @mention / hi / 你好 (SGT time-of-day).
2. **Market Q&A** — OKX + desk links.
3. **Off-topic / safety** — gentle reject; no PII, cursing, or political topics.
4. **Investigate** — alerts/text/image/table; adaptive steps; emoji + bold bullets.
5. **RAG + Skills** — desk + quote-ops V Exchange perpetual (`v-exchange-perp`; CFD excluded).
6. **Dashboard** — `review` / `dashboard` → KPI card + https://vex-llm-proxy.vercel.app/#/reports

Commands: `help` · `market` · `investigate` · `review` · `dashboard` · `done` / `archive`

## Smoke without Lark credentials

```bash
curl -sS -X POST https://vex-llm-proxy.vercel.app/api/lark/incidents \
  -H 'Content-Type: application/json' \
  -d '{"text":"investigate IDX-01 excluded, Mark 48bps"}'
```

(May return `Unauthorized` if `DESK_GATEWAY_TOKEN` is set on the host.)

## Security

- Never paste App Secret into chat or git.
- Preferred Actions always need human approval — the bot never claims production execution.
