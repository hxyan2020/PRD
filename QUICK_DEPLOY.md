# 🚀 Quick Deploy: 报价 AI排查助手

Since this Cloud Agent cannot authenticate to your Vercel account, please run this deployment from your local machine.

## ✅ One-Command Deploy

Open your terminal and run:

```bash
# Clone the repo (if you haven't already)
git clone https://github.com/hxyan2020/PRD.git
cd PRD

# Checkout the branch
git checkout cursor/quote-troubleshooting-bot-3287

# Navigate to the bot directory
cd xauusd-source-monitor

# Run the deployment script
./deploy.sh
```

That's it! The script will:
1. ✅ Log you into Vercel (if needed)
2. ✅ Build the application
3. ✅ Deploy to production with permanent URL
4. ✅ Show you the production URL

## 🔧 After Deployment

You'll need to set environment variables. Choose one method:

### Method A: Via CLI (Quickest)

```bash
npx vercel env add LARK_APP_ID production
# Enter when prompted: cli_ab8c9f207938df05

npx vercel env add LARK_APP_SECRET production
# Enter when prompted: hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb

# Then redeploy
npx vercel --prod --yes
```

### Method B: Via Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project → Settings → Environment Variables
3. Add:
   - `LARK_APP_ID` = `cli_ab8c9f207938df05`
   - `LARK_APP_SECRET` = `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb`
4. Deployments → Redeploy latest

## 🤖 Configure Lark

1. Go to https://open.feishu.cn/app
2. Find: 报价 bot (`cli_ab8c9f207938df05`)
3. Event Subscriptions → Request URL: `https://your-url.vercel.app/api/lark/event`
4. Subscribe: `im.message.receive_v1`, `card.action.trigger`
5. Encrypt Key: Leave OFF
6. Save & Publish

## ✅ Test

1. Open Lark/Feishu
2. Search: "报价 bot"
3. Send: `Hi`

---

**Your production URL will look like:**
- `https://quote-troubleshooting-bot.vercel.app`
- Or: `https://quote-troubleshooting-bot-[random].vercel.app`

**Total time:** ~5 minutes from clone to working bot! 🎉

---

## Alternative: Use Temporary Deployment

If you prefer to claim the already-deployed temporary URL:

**Temporary URL (expires in 60 min):** https://brisk-frost-3k9uio9.tmp.now

**Claim it here:** https://vercel.com/claim-deployment?code=172a44ec-2cb0-4eba-9a3e-bed6c21afeda

After claiming:
1. Add environment variables in Vercel Dashboard
2. Redeploy
3. Configure Lark webhook with the URL

---

## Need More Details?

See [`DEPLOY_INSTRUCTIONS.md`](./DEPLOY_INSTRUCTIONS.md) for comprehensive step-by-step instructions.
