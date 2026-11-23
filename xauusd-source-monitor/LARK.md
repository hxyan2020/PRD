# V Exchange Risk Copilot — Lark bot

The **web desk stays live** (`/#/investigate`, Market, Skills, KB, Stats).  
This adds a parallel **Lark / Feishu** interaction surface on the same Vercel project.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/lark/event` | Lark event webhook (URL verification + messages + card actions) |
| GET/POST | `/api/lark/incidents` | List / simulate turns (smoke); GET lists accumulated incidents |

Public production host: `https://vex-llm-proxy.vercel.app`

## Vercel env vars

| Name | Required | Notes |
|------|----------|-------|
| `LARK_APP_ID` | yes (to reply) | Lark app id |
| `LARK_APP_SECRET` | yes (to reply) | Lark app secret — never commit |
| `LARK_VERIFICATION_TOKEN` | recommended | Event verification token |
| `LARK_ENCRYPT_KEY` | optional | If Encrypt Key enabled in console |
| `LARK_BOT_OPEN_ID` | optional | Precise @-mention matching in groups |
| `LARK_REPLY_ALL_GROUP` | optional | Set `1` to reply without @ (not recommended) |
| `OPENAI_API_KEY` | optional | Better answers + image OCR; rules/RAG always work |
| `DESK_GATEWAY_TOKEN` | optional | Protects `/api/lark/incidents` POST/GET when set |

Also set the same names in Cursor Secrets if you publish via Cursor apps.

## Lark Developer Console

1. Create enterprise app → enable **Bot**.
2. **Event subscription** Request URL:  
   `https://vex-llm-proxy.vercel.app/api/lark/event`
3. Subscribe: `im.message.receive_v1`, `card.action.trigger`.
4. Permissions: send messages, reply, get message resources (images).
5. Publish & add bot to risk ops chats.

## Bot behaviour

1. **Market Q&A** — OKX XAU-USDT + desk source links; friendly professional tone.
2. **Off-topic** — gentle reject; trained for V Exchange risk management.
3. **@ mention** — responds in groups when mentioned; always in DMs.
4. **RAG + Skills** — desk L1/L2 + **quote-ops V Exchange perpetual** KB/skills (`https://quote-ops-three.vercel.app`, folder `v-exchange-perp` only — CFD Pricing excluded). Live RAG via upstream `/api/rag` with local snapshot fallback (`api/lark/_data/veQuoteOps.json`). Proxies: `/api/quote-ops/kb`, `/api/quote-ops/rag`.
5. **Accumulate** — incidents stored for `review` (ephemeral per serverless instance + `/tmp`; treat as ops buffer — export regularly).
6. **Internal + external data** — skill/KB catalog + OKX (and web desk URLs).
7. **Adaptive guidance** — next steps re-rank from user replies / new evidence (not a mechanical full dump).

Commands: `help` · `market` · `investigate` · `review` · `done` / `archive`

## Safety

The bot refuses: personal-information disclosure, cursing / abusive language, and politically sensitive topics. It stays on V Exchange risk ops (market policy / rates for XAUUSD are allowed).

## Smoke without Lark

Open web desk → **Lark Bot** tab, or:

```bash
curl -sS -X POST https://vex-llm-proxy.vercel.app/api/lark/incidents \
  -H 'Content-Type: application/json' \
  -d '{"text":"investigate IDX-01 excluded, Mark 48bps"}'
```

## Security

- Never paste App Secret into chat or git.
- Prefer Verification Token on the webhook.
- Preferred Actions always require human approval — the bot never claims production execution.
