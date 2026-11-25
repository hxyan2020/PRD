#!/usr/bin/env bash
# Deploy xauusd-source-monitor (SPA + /api/chat) to the permanent Vercel project.
# Permanent URL: https://quote-ai-troubleshooting-bot.vercel.app
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

# Prefer linking to the permanent project name when unlinked.
if [[ ! -f .vercel/project.json ]]; then
  echo "==> Linking to permanent project vex-llm-proxy…"
  if [[ -n "${VERCEL_TOKEN:-}" ]]; then
    npx vercel link --yes --project vex-llm-proxy --token "$VERCEL_TOKEN"
  else
    npx vercel link --yes --project vex-llm-proxy
  fi
fi

echo "==> Building SPA…"
npm ci
npm run build

echo "==> Deploying to Vercel (production)…"
npx vercel deploy "${ARGS[@]}"

echo ""
echo "==> Permanent desk: https://quote-ai-troubleshooting-bot.vercel.app/#/investigate"
echo "    Env (Production): OPENAI_API_KEY, DESK_GATEWAY_TOKEN"
echo "    Browser never asks for an OpenAI API key."
