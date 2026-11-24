#!/usr/bin/env bash
# Deploy V Exchange Risk Tool (SPA + /api/chat + Lark bot APIs) to Vercel production.
# This is the ONLY supported deploy path — do not use GitHub Pages.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
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

echo "==> Syncing lark-messenger-server into vendor-lark/ for serverless APIs…"
rm -rf "$ROOT/vendor-lark"
mkdir -p "$ROOT/vendor-lark"
# Prefer rsync when available; fall back to cp (Cloud Agent images may lack rsync).
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude '.vercel' \
    --exclude '.data' \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude '.env.*' \
    "$REPO/lark-messenger-server/" "$ROOT/vendor-lark/"
else
  cp -a "$REPO/lark-messenger-server/." "$ROOT/vendor-lark/"
  rm -rf "$ROOT/vendor-lark/.vercel" "$ROOT/vendor-lark/.data" "$ROOT/vendor-lark/node_modules"
  rm -f "$ROOT/vendor-lark/.env" "$ROOT/vendor-lark/.env.local" "$ROOT/vendor-lark/.env.vercel"
fi

echo "==> Deploying xauusd-source-monitor to Vercel (production)…"
echo "    Project: vex-llm-proxy (SPA + /api/chat + Lark bot)"
npx vercel deploy "${ARGS[@]}"

echo ""
echo "==> Live desk:  https://vex-llm-proxy.vercel.app"
echo "    Investigate: https://vex-llm-proxy.vercel.app/#/investigate"
echo "    Lark health: https://vex-llm-proxy.vercel.app/api/lark-health"
echo "    Lark events: https://vex-llm-proxy.vercel.app/api/lark/events"
echo "    Alarm ingest:https://vex-llm-proxy.vercel.app/api/alarms/ingest"
echo ""
echo "==> Ensure Production env vars on the Vercel project:"
echo "    OPENAI_API_KEY"
echo "    DESK_GATEWAY_TOKEN"
echo "    LARK_WEBHOOK_URL          (group incoming webhook — required to push cards)"
echo "    LARK_VERIFICATION_TOKEN   (Feishu event subscription)"
echo "    DESK_BASE_URL=https://vex-llm-proxy.vercel.app"
echo "    DAILY_BUDGET_USD=10       (optional)"
