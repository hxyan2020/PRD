# 报价 AI排查助手 — Permanent Deployment

## Live

| Item | Value |
|------|-------|
| **Production** | https://quote-ai-troubleshooting-bot.vercel.app |
| **Webhook** | https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event |
| **Vercel project** | `quote-ai-troubleshooting-bot` (separate from `vex-llm-proxy`) |
| **Code baseline** | VE tip `cursor/group-alert-auto-inv-457d` @ `485f5f579` |
| **App ID** | `cli_ab8c9f207938df05` |
| **Bot name** | 报价 AI风控小助手 |

## Parity vs VE (reviewed)

| Capability | Quote | VE |
|------------|-------|-----|
| Greeting / help / skills(34) / knowledge | ✅ | ✅ |
| Hourly market scan + K-line | ✅ | ✅ |
| Investigate + Done/Skip guide steps | ✅ | ✅ |
| Lark token OK / readyForConversation | ✅ | ✅ |
| OPENAI (OCR / richer LLM / offtopic) | ❌ missing key | ✅ |
| Lark eventsDelivered (console webhook) | ❌ not pointed yet | depends |

Prod smoke: **16/16 PASS** (`node scripts/lark-prod-smoke.mjs`).

## Remaining setup

1. Lark console → Request URL = `https://quote-ai-troubleshooting-bot.vercel.app/api/lark/event`
2. Add `OPENAI_API_KEY` on Vercel Production, then `npx vercel deploy --prod --yes`
