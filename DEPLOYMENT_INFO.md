# 报价 AI排查助手 — Permanent Deployment

## ✅ Live (permanent)

| Item | Value |
|------|-------|
| **Production URL** | https://quote-ai-troubleshooting-bot.vercel.app |
| **Lark webhook** | https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event |
| **Vercel project** | `quote-ai-troubleshooting-bot` |
| **Bot App ID** | `cli_ab8c9f207938df05` |
| **Bot name (Lark)** | 报价 AI风控小助手 |
| **SSO protection** | Disabled (Lark can POST freely) |

## Health check

```bash
curl -sS https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event
```

Expect: `readyForConversation: true`, `larkConfigured: true`, `tokenOk: true`.

## Configure Lark Developer Console

1. Open https://open.feishu.cn/app → 报价 bot (`cli_ab8c9f207938df05`)
2. **Event Subscription** → Send to developer server (NOT long connection)
3. Request URL: `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event`
4. Subscribe: `im.message.receive_v1`, `card.action.trigger`
5. Encrypt Key: OFF
6. Save + Publish
7. DM the bot: `Hi`

## Env vars (already set on Production)

- `LARK_APP_ID`
- `LARK_APP_SECRET`

Optional later: `OPENAI_API_KEY` for better answers / OCR.
