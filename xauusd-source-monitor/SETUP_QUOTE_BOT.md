# 报价 AI排查助手 Setup Guide

Complete setup guide for deploying the Quote Troubleshooting Assistant Lark bot.

## Bot Information

| Property | Value |
|----------|-------|
| **Bot Name** | 报价 bot |
| **App ID** | `cli_ab8c9f207938df05` |
| **App Secret** | `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb` |
| **Purpose** | V-Exchange quote/pricing troubleshooting |

## Quick Start

### 1. Deploy to Vercel

```bash
cd xauusd-source-monitor

# Login to Vercel (first time only)
npx vercel login

# Deploy to production
npx vercel --prod
```

After deployment, you'll get a URL like: `https://your-app-name.vercel.app`

### 2. Set Environment Variables on Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production**:

| Variable | Value |
|----------|-------|
| `LARK_APP_ID` | `cli_ab8c9f207938df05` |
| `LARK_APP_SECRET` | `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb` |
| `OPENAI_API_KEY` | Your OpenAI API key (optional, for better responses) |

### 3. Configure Lark Developer Console

1. Go to [Lark/Feishu Developer Console](https://open.feishu.cn/app)
2. Find your app: 报价 bot (`cli_ab8c9f207938df05`)
3. Navigate to **Features** → **Bot**
4. Enable Bot capability if not already enabled

### 4. Set Up Event Subscription

1. In Developer Console, go to **Event Subscriptions**
2. Set mode to: **将事件发送至开发者服务器** (Send events to developer server)
   - **Important:** Do NOT use 长连接 (long connection mode)
3. Set Request URL: `https://your-app-name.vercel.app/api/lark/event`
4. Click **Save** - it should pass URL verification
5. Subscribe to these events:
   - `im.message.receive_v1` (Receive messages)
   - `card.action.trigger` (Interactive card actions)

### 5. Configure Permissions

In **Permissions & Scopes**:
- `im:message` - Send messages as bot
- `im:message.p2p_msg` - Send private messages
- `im:message.group_msg` - Send group messages  
- `im:resource` - Upload images (optional, for OCR)

### 6. Encryption Settings

**Important:** Leave **Encrypt Key** EMPTY or OFF. The current implementation does not support encrypted events.

### 7. Publish the Bot

1. Go to **Version Management**
2. Create a new version with all changes
3. Submit for review (or publish directly if you have permissions)
4. Once published, the bot is ready to use

## Testing the Bot

### 1. Find the Bot in Lark

1. Open Lark/Feishu app
2. Search for "报价 bot" or use App ID: `cli_ab8c9f207938df05`
3. Start a Direct Message with the bot

### 2. Test Basic Interaction

Send these messages to test:

```
Hi
```
Should get a greeting.

```
帮我排查 XAUUSD 报价差异
```
Should provide troubleshooting steps for price discrepancies.

```
价差过宽
```
Should provide spread troubleshooting guidance.

```
标记价格告警
```
Should provide mark price alert troubleshooting.

### 3. Test Screenshot Analysis (if OpenAI is configured)

Upload a screenshot of a pricing alert or monitoring dashboard. The bot should:
1. Analyze the image using OCR
2. Extract key information
3. Provide relevant troubleshooting steps

## Bot Capabilities

The 报价 AI排查助手 can help with:

### 1. 报价差异 (Price Discrepancies)
- Index price calculation issues
- Mark price vs external exchange comparison
- Price source verification
- Basis moving average configuration

### 2. 无交易监控 (No Trade Monitoring)
- Last trade time verification
- Market maker status check
- Order book depth analysis
- Trading pair status

### 3. 价差异常 (Spread Issues)
- Bid-ask spread analysis
- Market maker quote status
- Volatility impact assessment
- Depth threshold configuration

### 4. 报价源问题 (Price Source Problems)
- Data source health monitoring
- Weight configuration verification
- Latency and outlier detection
- Anomaly filtering mechanisms

### 5. 标记价格告警 (Mark Price Alerts)
- Mark price calculation verification
- Deviation threshold analysis
- Degradation mode handling
- Observation period management

## Commands

Users can send these commands in Lark:

| Command | Description |
|---------|-------------|
| `hi` / `你好` | Greeting and menu |
| `help` | Show available commands |
| `market` | Get current market snapshot |
| `investigate` | Start investigation mode |
| `报价差异` | Price discrepancy troubleshooting |
| `价差` | Spread issue troubleshooting |
| `标记价格` | Mark price troubleshooting |

## Troubleshooting

### Bot doesn't respond to messages

1. Check Vercel deployment status
2. Verify `LARK_APP_ID` and `LARK_APP_SECRET` are set correctly
3. Check event subscription is using "developer server" mode (not long connection)
4. Verify webhook URL is correct: `https://your-app.vercel.app/api/lark/event`
5. Check Vercel function logs for errors

### URL verification fails

1. Ensure the app is deployed and accessible
2. Check that `LARK_APP_ID` and `LARK_APP_SECRET` are set
3. Verify the webhook URL path is exactly `/api/lark/event`
4. Try redeploying and saving the webhook URL again

### Bot responds to wrong bot

This can happen if `LARK_BOT_OPEN_ID` is incorrect. Solution:
1. Remove `LARK_BOT_OPEN_ID` from environment variables
2. Let it auto-fetch on first request

## Maintenance

### Viewing Logs

```bash
# View real-time Vercel function logs
npx vercel logs --follow

# View logs for specific function
npx vercel logs api/lark/event --follow
```

### Updating the Bot

1. Make code changes
2. Commit to git
3. Redeploy: `npx vercel --prod`
4. Environment variables persist across deployments

### Monitoring

Check bot health:
```bash
curl https://your-app-name.vercel.app/api/lark/event
```

Should return JSON with:
- `readyForConversation: true`
- `hasAppId: true`
- `hasAppSecret: true`

## Security Notes

- **Never commit** `LARK_APP_SECRET` to git
- Keep environment variables in Vercel only
- Use `LARK_VERIFICATION_TOKEN` for additional security (optional)
- The bot cannot access internal V-Exchange admin systems directly
- Users must provide screenshots or manually query data

## Support

For issues or questions:
1. Check Vercel function logs
2. Verify Lark Developer Console configuration
3. Test webhook endpoint manually
4. Review LARK.md for detailed API documentation
