# 报价 AI排查助手 - Deployment Information

## ✅ Successfully Deployed!

**Deployment URL:** https://brisk-frost-3k9uio9.tmp.now

**Webhook URL for Lark:** https://brisk-frost-3k9uio9.tmp.now/api/lark/event

## ⚠️ Important: This is a Temporary Deployment

This deployment **expires in 60 minutes**. To make it permanent:

### Option 1: Claim This Deployment (Recommended - Keeps Same URL)

1. Visit: https://vercel.com/claim-deployment?code=172a44ec-2cb0-4eba-9a3e-bed6c21afeda
2. Sign in or create a Vercel account
3. The deployment will become permanent under your account
4. The URL `https://brisk-frost-3k9uio9.tmp.now` will stay active

### Option 2: Deploy with Your Vercel Account

```bash
cd /agent/repos/PRD/xauusd-source-monitor
vercel login
vercel --prod
```

## 🔧 Set Environment Variables

After claiming the deployment, add these environment variables in Vercel Dashboard:

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add these for **Production** environment:

| Variable | Value |
|----------|-------|
| `LARK_APP_ID` | `cli_ab8c9f207938df05` |
| `LARK_APP_SECRET` | `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb` |
| `OPENAI_API_KEY` | (Optional) Your OpenAI key |

3. After adding variables, redeploy:
   - In Vercel Dashboard → Deployments → Click "..." on latest deployment → Redeploy

## 🤖 Configure Lark Bot

Now configure your Lark bot to use the webhook:

1. Go to [Lark Developer Console](https://open.feishu.cn/app)
2. Find: 报价 bot (`cli_ab8c9f207938df05`)
3. Go to **Event Subscriptions**
4. Set **Request URL:** `https://brisk-frost-3k9uio9.tmp.now/api/lark/event`
5. Subscribe to events:
   - `im.message.receive_v1`
   - `card.action.trigger`
6. Leave **Encrypt Key** EMPTY/OFF
7. Click **Save** (should pass verification)
8. **Publish** the app version

## ✅ Test the Bot

1. Open Lark/Feishu
2. Search for "报价 bot"
3. Send: `Hi` or `你好`
4. Bot should respond with greeting and menu

## 📊 Monitor the Bot

Check deployment status:
```bash
curl https://brisk-frost-3k9uio9.tmp.now/api/lark/event
```

Should return JSON with:
- `readyForConversation: true` (after env vars are set)
- `hasAppId: true`
- `hasAppSecret: true`

## 🔍 Troubleshooting

### Bot doesn't respond after setup:

1. **Check environment variables are set** in Vercel Dashboard
2. **Redeploy** after adding env vars (they don't apply automatically)
3. **Verify webhook URL** is correct in Lark console
4. **Check Vercel logs:**
   ```bash
   vercel logs --follow
   ```

### URL verification fails:

1. Make sure the deployment is claimed (not temporary)
2. Verify env vars are set
3. Try redeploying
4. Check the webhook URL path is exactly `/api/lark/event`

## 📝 Next Steps

1. ✅ **Claim the deployment** (use link above)
2. ✅ **Add environment variables** in Vercel
3. ✅ **Redeploy** to apply env vars
4. ✅ **Configure Lark webhook** with the URL
5. ✅ **Test** by messaging the bot in Lark

---

**Deployment Details:**
- Deployment ID: `dpl_4kJsc1SVpDswXY1XbKf2vunxDPoq`
- URL: `https://brisk-frost-3k9uio9.tmp.now`
- Status: READY
- Claim URL: https://vercel.com/claim-deployment?code=172a44ec-2cb0-4eba-9a3e-bed6c21afeda
- Expires: 60 minutes from deployment (unless claimed)
