# Deploy 报价 AI排查助手 to Vercel (Permanent URL)

Since I cannot authenticate to your Vercel account from this Cloud Agent environment, here are the instructions to deploy with a permanent URL from your local machine:

## Option 1: Quick Deploy Script (Recommended)

```bash
cd xauusd-source-monitor
./deploy.sh
```

The script will:
1. Log you into Vercel (if needed)
2. Deploy to production with permanent URL
3. Show you the next steps

## Option 2: Manual Deployment

### Step 1: Login to Vercel

```bash
cd xauusd-source-monitor
npx vercel login
```

This will open your browser to authenticate.

### Step 2: Link or Deploy

```bash
# Deploy to production
npx vercel --prod --yes
```

You'll get a permanent URL like: `https://quote-troubleshooting-bot.vercel.app` or `https://your-project-name.vercel.app`

### Step 3: Set Environment Variables

**Method A: Via Vercel CLI**

```bash
# Set environment variables
npx vercel env add LARK_APP_ID production
# When prompted, enter: cli_ab8c9f207938df05

npx vercel env add LARK_APP_SECRET production
# When prompted, enter: hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb

# Optional: OpenAI key for image analysis
npx vercel env add OPENAI_API_KEY production
# Enter your OpenAI key
```

**Method B: Via Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `LARK_APP_ID` = `cli_ab8c9f207938df05`
   - `LARK_APP_SECRET` = `hriPDyHLYsPIadXJVTDJGh1e1Q2ItHvb`
   - `OPENAI_API_KEY` = (your key - optional)

### Step 4: Redeploy to Apply Environment Variables

```bash
npx vercel --prod --yes
```

Or in Vercel Dashboard: Deployments → Click "..." → Redeploy

### Step 5: Configure Lark Webhook

1. Go to [Lark Developer Console](https://open.feishu.cn/app)
2. Find: 报价 bot (`cli_ab8c9f207938df05`)
3. Event Subscriptions → Request URL: `https://your-project-name.vercel.app/api/lark/event`
4. Subscribe to: `im.message.receive_v1`, `card.action.trigger`
5. Leave Encrypt Key OFF
6. Save and Publish

### Step 6: Test

1. Open Lark/Feishu
2. Search: "报价 bot"
3. Send: `Hi` or `帮我排查价差问题`

## Option 3: Use GitHub Integration (Automatic Deployments)

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Connect to GitHub and select: `hxyan2020/PRD`
4. Set Root Directory: `xauusd-source-monitor`
5. Add Environment Variables (same as above)
6. Deploy

Every push to your branch will auto-deploy!

## Verify Deployment

Check if the bot is ready:

```bash
curl https://your-project-name.vercel.app/api/lark/event
```

Should return:
```json
{
  "readyForConversation": true,
  "hasAppId": true,
  "hasAppSecret": true,
  ...
}
```

## Troubleshooting

### "No existing credentials found"

You need to run this from your local machine, not in the Cloud Agent. The agent doesn't have access to your Vercel account.

### Environment variables not working

Make sure to redeploy after adding environment variables. They don't apply to existing deployments automatically.

### Webhook verification fails

1. Ensure environment variables are set
2. Redeploy after adding them
3. Check the URL is exactly: `/api/lark/event`

## Need Help?

The temporary deployment is still available:
- **Temporary URL:** https://brisk-frost-3k9uio9.tmp.now (expires soon)
- **Claim it:** https://vercel.com/claim-deployment?code=172a44ec-2cb0-4eba-9a3e-bed6c21afeda

After claiming, you can add env vars and it becomes permanent!
