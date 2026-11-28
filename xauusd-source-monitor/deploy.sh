#!/bin/bash

# Deploy 报价 AI排查助手 to Vercel Production
# This script deploys the bot with a permanent URL

echo "🚀 Deploying 报价 AI排查助手 to Vercel..."
echo ""

# Check if logged in
if ! npx vercel whoami &>/dev/null; then
  echo "📝 Not logged in to Vercel. Logging in..."
  npx vercel login
  echo ""
fi

# Deploy to production
echo "🔨 Building and deploying to production..."
npx vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the production URL from above"
echo "2. Set environment variables in Vercel Dashboard:"
echo "   - LARK_APP_ID: (your Lark App ID)"
echo "   - LARK_APP_SECRET: (your Lark App Secret)"
echo "3. Redeploy to apply environment variables"
echo "4. Configure Lark webhook with: https://[YOUR-URL].vercel.app/api/lark/event"
echo ""
echo "See DEPLOY_INSTRUCTIONS.md for the actual credentials and detailed steps."
echo ""
