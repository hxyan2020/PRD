# 报价 AI排查助手 - Quick Start Guide

## Overview

This repository now includes **报价 AI排查助手** (Quote Troubleshooting Assistant), a Lark bot that helps diagnose V-Exchange pricing and quote issues.

**Bot Info:**
- **Name:** 报价 bot
- **App ID:** `cli_ab8c9f207938df05`
- **Purpose:** Quote/Pricing troubleshooting for V-Exchange

## What Was Done

✅ Copied the VE AI排查助手 (VE Risk Assistant) architecture  
✅ Adapted it for quote/pricing troubleshooting instead of risk control  
✅ Configured with your 报价 bot credentials  
✅ Added comprehensive setup documentation  
✅ Ready for Vercel deployment  

## Bot Capabilities

The bot can help troubleshoot:

1. **报价差异** - Price discrepancies between exchanges
2. **无交易监控** - No trade alerts  
3. **价差异常** - Spread issues (bid-ask too wide)
4. **报价源问题** - Price source reliability issues
5. **标记价格告警** - Mark price alerts and degradation

## Deployment Steps

### 1. Deploy to Vercel

```bash
cd xauusd-source-monitor
npx vercel --prod
```

You'll get a URL like: `https://your-app.vercel.app`

### 2. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `LARK_APP_ID` | `cli_ab8c9f207938df05` |
| `LARK_APP_SECRET` | `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb` |
| `OPENAI_API_KEY` | (Optional) Your OpenAI key for image analysis |

### 3. Configure Lark Bot

1. Go to [Lark Developer Console](https://open.feishu.cn/app)
2. Find: 报价 bot (`cli_ab8c9f207938df05`)
3. Event Subscription → Request URL: `https://your-app.vercel.app/api/lark/event`
4. Subscribe to: `im.message.receive_v1`, `card.action.trigger`
5. Leave **Encrypt Key** OFF
6. Publish the app

### 4. Test

1. Open Lark/Feishu
2. Search for "报价 bot"
3. Send: `Hi` or `帮我排查价差问题`

## Example Interactions

**User:** `XAUUSD 报价与 Binance 差异过大`  
**Bot:** Provides checklist for index price calculation, source verification, basis MA settings

**User:** `价差突然变宽`  
**Bot:** Guides through spread analysis, market maker status, volatility check

**User:** `标记价格告警`  
**Bot:** Explains mark price calculation, deviation thresholds, degradation mode

**User:** Upload screenshot of pricing alert  
**Bot:** Analyzes image, extracts key info, provides relevant troubleshooting

## Documentation

- **Full Setup Guide:** [`xauusd-source-monitor/SETUP_QUOTE_BOT.md`](xauusd-source-monitor/SETUP_QUOTE_BOT.md)
- **Lark API Details:** [`xauusd-source-monitor/LARK.md`](xauusd-source-monitor/LARK.md)
- **Main README:** [`xauusd-source-monitor/README.md`](xauusd-source-monitor/README.md)

## File Structure

```
xauusd-source-monitor/
├── api/
│   └── lark/
│       ├── event.ts           # Main webhook handler
│       ├── _lib/
│       │   ├── agent.ts       # Bot logic & conversation handling
│       │   ├── client.ts      # Lark API client
│       │   ├── skills.ts      # Troubleshooting knowledge base
│       │   └── ...
│       └── _data/
│           └── veQuoteOps.json # V-Exchange quote ops knowledge
├── LARK.md                    # Lark integration guide
├── SETUP_QUOTE_BOT.md         # Complete setup guide
└── README.md                  # Project overview
```

## Differences from VE AI排查助手

| Aspect | VE AI排查助手 (Risk) | 报价 AI排查助手 (Quote) |
|--------|---------------------|------------------------|
| **Focus** | Risk control, liquidations, funding | Pricing, quotes, spreads, mark prices |
| **Bot** | VE 风控排查助手 | 报价 bot (`cli_ab8c9f207938df05`) |
| **Scenarios** | Position risk, DB alerts, ADL | Price discrepancies, spread issues, source problems |
| **Knowledge** | Risk management procedures | Quote operations, pricing parameters |

## Security Notes

⚠️ **Important:**
- Bot credentials are configured in Vercel environment variables
- Never commit `LARK_APP_SECRET` to git
- The `.env.example` files show structure only
- Actual secrets are on Vercel production environment

## Next Steps

1. **Deploy:** Follow the 3-step deployment above
2. **Test:** Send a test message to verify bot responds
3. **Customize:** Edit `api/lark/_data/veQuoteOps.json` to add more quote troubleshooting knowledge
4. **Monitor:** Check Vercel logs: `npx vercel logs --follow`

## Support

If the bot doesn't respond:
1. Check Vercel deployment status
2. Verify environment variables are set
3. Check Lark console webhook configuration  
4. View logs: `npx vercel logs api/lark/event`

For detailed troubleshooting, see [`xauusd-source-monitor/SETUP_QUOTE_BOT.md`](xauusd-source-monitor/SETUP_QUOTE_BOT.md).
