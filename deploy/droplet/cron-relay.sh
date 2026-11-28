#!/usr/bin/env bash
# Keep VE + Quote Lark bots' durable heartbeats alive without Cursor agent timers.
# Safe subset only — no alert-nudge / full cron-tick fan-out (avoids group spam).
set -euo pipefail

LOG_DIR="${LARK_CRON_LOG_DIR:-/var/log/lark-cron-relay}"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LOG="$LOG_DIR/relay.log"

VE_HOST="${VE_BOT_HOST:-https://vex-llm-proxy.vercel.app}"
QUOTE_HOST="${QUOTE_BOT_HOST:-https://quote-ai-troubleshooting-bot.vercel.app}"

hdr=(-H 'x-vercel-cron: 1' -H 'user-agent: lark-droplet-cron-relay/1.0')

hit() {
  local name="$1" url="$2"
  local code body
  body="$(curl -sS "${hdr[@]}" --max-time 45 -w '\n%{http_code}' "$url" || true)"
  code="$(printf '%s' "$body" | tail -n1)"
  body="$(printf '%s' "$body" | sed '$d')"
  printf '%s %s http=%s body=%s\n' "$STAMP" "$name" "$code" "$(printf '%s' "$body" | tr '\n' ' ' | cut -c1-240)" >>"$LOG"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $name http=$code" >&2
    return 1
  fi
  if ! printf '%s' "$body" | grep -q '"ok":true'; then
    echo "FAIL $name ok!=true" >&2
    return 1
  fi
  return 0
}

MODE="${1:-all}"
rc=0

case "$MODE" in
  osc|ping)
    hit ve-osc-ping "$VE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit quote-osc-ping "$QUOTE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    ;;
  health)
    hit ve-cron-health "$VE_HOST/api/lark/cron-health" || rc=1
    hit quote-cron-health "$QUOTE_HOST/api/lark/cron-health" || rc=1
    ;;
  all|*)
    hit ve-osc-ping "$VE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit quote-osc-ping "$QUOTE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit ve-cron-health "$VE_HOST/api/lark/cron-health" || rc=1
    hit quote-cron-health "$QUOTE_HOST/api/lark/cron-health" || rc=1
    ;;
esac

exit "$rc"
