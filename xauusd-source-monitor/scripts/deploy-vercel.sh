#!/usr/bin/env bash
# Deploy V Exchange Risk Tool (SPA + /api/chat) to Vercel production.
# This is the ONLY supported deploy path — do not use GitHub Pages.
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

echo "==> Deploying xauusd-source-monitor to Vercel (production)…"
echo "    Project: vex-llm-proxy (SPA + /api/chat)"
npx vercel deploy "${ARGS[@]}"

echo ""
echo "==> Live: https://vex-llm-proxy.vercel.app"
echo "    Investigate: https://vex-llm-proxy.vercel.app/#/investigate"
echo ""
echo "==> Ensure Production env vars on the Vercel project:"
echo "    OPENAI_API_KEY       = (server-side OpenAI key)"
echo "    DESK_GATEWAY_TOKEN   = (same as public/llm-config.json deskToken)"
echo "    DAILY_BUDGET_USD     = 10   (optional)"
