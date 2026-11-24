#!/usr/bin/env bash
# Deploy Lark messenger bot to Vercel production.
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

if [[ ! -f .vercel/project.json ]]; then
  echo "==> Linking / creating project vex-lark-messenger…"
  npx vercel link --yes --project vex-lark-messenger ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} || \
    npx vercel project add vex-lark-messenger ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}
  npx vercel link --yes --project vex-lark-messenger ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}
fi

echo "==> Deploying lark-messenger-server to Vercel (production)…"
npx vercel deploy "${ARGS[@]}"

echo ""
echo "==> Live: https://vex-lark-messenger.vercel.app"
echo "    Health:     GET  /health"
echo "    Ingest:     POST /api/alarms/ingest"
echo "    Events:     POST /api/lark/events   ← Feishu event subscription URL"
echo "    Playground: GET  /"
echo ""
echo "==> Ensure Production env vars on the Vercel project:"
echo "    OPENAI_API_KEY"
echo "    LARK_WEBHOOK_URL          (group incoming webhook)"
echo "    LARK_VERIFICATION_TOKEN   (event subscription)"
echo "    LARK_ENCRYPT_KEY          (optional)"
echo "    DESK_BASE_URL=https://vex-llm-proxy.vercel.app"
echo "    LARK_AUTO_ANALYZE=1"
