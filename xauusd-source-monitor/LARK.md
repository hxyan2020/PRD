# 报价 AI排查助手 (Quote Troubleshooting Assistant) — Lark bot

V Exchange Quote & Pricing troubleshooting assistant for Lark / Feishu.

**Bot Name:** 报价 bot  
**App ID:** `cli_ab8c9f207938df05`  
**Focus:** Quote / Pricing / Market Data troubleshooting for V-Exchange

Public host: TBD (deploy to Vercel)  
Webhook: TBD (after deployment)

## Minimum to enable live conversation

You only need to provide **two secrets**:

| Secret | Value (for 报价 bot) | Where to set |
|--------|--------|--------|
| `LARK_APP_ID` | `cli_ab8c9f207938df05` | Vercel project → Settings → Environment Variables → Production |
| `LARK_APP_SECRET` | `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb` | same |

Then in **Lark / Feishu Developer Console** (required — without this, DMs stay silent):

1. Enable **Bot** capability.
2. **Event Subscription** mode = **将事件发送至开发者服务器 / Send to developer’s server**  
   (**Do not** use 长连接 / long connection — Vercel cannot receive that.)
3. Request URL → `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event` → **Save** and pass URL verification.
4. Subscribe: `im.message.receive_v1`, `card.action.trigger`.
5. Permissions: `im:message` / send-as-bot; image resources if you want OCR.
6. **Leave Encrypt Key OFF / empty**.
7. Verification Token: optional.
8. **Publish** the app version → open DM → send `Hi`.

Check readiness:

```bash
curl -sS https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event
# want: readyForConversation=true AND eventsDelivered=true after you message the bot
```

If `eventsDelivered` stays `false` after messaging, the Request URL is still wrong or long-connection mode is selected.

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
| `LARK_ADMIN_OPEN_ID` | **Required for weekly push** — Yan Haixiang’s Feishu `open_id` (DM target) |
| `LARK_ADMIN_EMAIL` | Optional fallback to resolve open_id via Contact API |
| `CRON_SECRET` | Optional; Vercel Cron Authorization bearer for `/api/lark/weekly-report` |

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/lark/event` | Webhook (challenge + messages + card actions) |
| GET/POST | `/api/lark/incidents` | List / simulate turns (smoke) |
| GET/POST | `/api/lark/weekly-report` | Weekly digest (cron Fridays 16:00 CST → Yan); `?dry=1` preview |

## Weekly report (Yan Haixiang)

- **Schedule:** every **Friday 16:00 Asia/Shanghai** (Vercel cron `0 8 * * 5` UTC)
- **Content:** this week’s handled incidents + aggregated recommendations / Skills
- **Delivery:** Feishu DM card to `LARK_ADMIN_OPEN_ID` (Yan Haixiang)
- **On-demand:** send `weekly` / `周报` in chat
- **Preview:** `curl -sS 'https://quote-ai-troubleshooting-bot.vercel.app/api/lark/weekly-report?dry=1' -H "X-Desk-Token: $DESK_GATEWAY_TOKEN"`
- **Force send:** `POST /api/lark/weekly-report` with `{ "force": true }` + desk token

Set `LARK_ADMIN_OPEN_ID` on Vercel Production (Yan’s open_id from Feishu admin / bot conversation logs).

## Bot behaviour (报价 AI排查助手)

1. **Greeting** — natural hello on @mention / hi / 你好.
2. **Quote/Pricing Troubleshooting** — help diagnose:
   - 报价差异 (Price discrepancies)
   - 无交易监控 (No trade monitoring)
   - 价差异常 (Spread issues)
   - 报价源问题 (Price source problems)
   - 标记价格告警 (Mark price alerts)
3. **Market Data Q&A** — XAUUSD, BTCUSD quotes, index prices, mark prices.
4. **Knowledge Base** — V-Exchange quote operations, pricing parameters, monitoring thresholds.
5. **Investigation** — analyze screenshots, alerts, and pricing anomalies.

Commands: `help` · `market` · `investigate` · `报价差异` · `价差` · `标记价格`

## Smoke without Lark credentials

```bash
curl -sS -X POST https://quote-ai-troubleshooting-bot.vercel.app/api/lark/incidents \
  -H 'Content-Type: application/json' \
  -d '{"text":"investigate IDX-01 excluded, Mark 48bps"}'
```

(May return `Unauthorized` if `DESK_GATEWAY_TOKEN` is set on the host.)

## Security

- Never paste App Secret into chat or git.
- Preferred Actions always need human approval — the bot never claims production execution.
