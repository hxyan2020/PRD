#!/usr/bin/env bash
# Deploy xauusd-source-monitor (SPA + /api/chat) to Vercel.
# Requires: vercel CLI logged in, or VERCEL_TOKEN in the environment.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]] && ! npx vercel whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: npx vercel login"
  echo "Or set VERCEL_TOKEN, then re-run this script."
  exit 1
fi

ARGS=(--yes --prod)
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  ARGS+=(--token "$VERCEL_TOKEN")
fi

echo "==> Deploying to Vercel (production)…"
npx vercel deploy "${ARGS[@]}"

echo ""
echo "==> Set these Environment Variables in the Vercel project (Production):"
echo "    OPENAI_API_KEY       = (your OpenAI key)"
echo "    DESK_GATEWAY_TOKEN   = (same as public/llm-config.json deskToken)"
echo "    DAILY_BUDGET_USD     = 10   (optional)"
echo ""
echo "Then point public/llm-config.json proxyBase at https://<project>.vercel.app"
echo "and run: bash scripts/deploy-gh-pages.sh"
