#!/usr/bin/env bash
# Permanent dual-bot cron relay (VE + Quote).
# NEVER uninstall / disable unless Yan explicitly says so.
# Covers every Vercel cron path + cron-tick watchdog fan-out.
set -euo pipefail

LOG_DIR="${LARK_CRON_LOG_DIR:-/var/log/lark-cron-relay}"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LOG="$LOG_DIR/relay.log"

VE_HOST="${VE_BOT_HOST:-https://vex-llm-proxy.vercel.app}"
QUOTE_HOST="${QUOTE_BOT_HOST:-https://quote-ai-troubleshooting-bot.vercel.app}"

# alert-nudge can message the risk group. Default ON to match Vercel schedules.
# Set ENABLE_ALERT_NUDGE=0 only if Yan explicitly asks to pause group nudges.
ENABLE_ALERT_NUDGE="${ENABLE_ALERT_NUDGE:-1}"

hdr=(-H 'x-vercel-cron: 1' -H 'user-agent: lark-droplet-cron-relay/1.1')

log_line() {
  printf '%s %s\n' "$STAMP" "$*" >>"$LOG"
}

hit() {
  local name="$1" url="$2"
  local code body
  body="$(curl -sS "${hdr[@]}" --max-time 110 -w '\n%{http_code}' "$url" || true)"
  code="$(printf '%s' "$body" | tail -n1)"
  body="$(printf '%s' "$body" | sed '$d')"
  log_line "$name http=$code body=$(printf '%s' "$body" | tr '\n' ' ' | cut -c1-280)"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $name http=$code" >&2
    return 1
  fi
  # cron-tick may return ok:false when a child fails; still HTTP 200 — treat as soft fail.
  if printf '%s' "$body" | grep -q '"ok":false'; then
    echo "WARN $name ok=false" >&2
    return 1
  fi
  if ! printf '%s' "$body" | grep -q '"ok":true'; then
    echo "FAIL $name ok!=true" >&2
    return 1
  fi
  return 0
}

hit_both() {
  local path="$1" suffix="${2:-}"
  local rc=0
  hit "ve:${path}${suffix}" "${VE_HOST}${path}${suffix}" || rc=1
  hit "quote:${path}${suffix}" "${QUOTE_HOST}${path}${suffix}" || rc=1
  return "$rc"
}

MODE="${1:-help}"
rc=0

case "$MODE" in
  # Fast keep-alive — osc heartbeat only (no evaluate / no group cards).
  osc|ping)
    hit ve-osc-ping "$VE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit quote-osc-ping "$QUOTE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    ;;

  health)
    hit_both /api/lark/cron-health || rc=1
    ;;

  # Full fan-out + watchdog (preferred every 5m). Covers health, osc, weekly,
  # daily, token, weekly-demo, alert-nudge, and quote market-report.
  tick)
    hit ve-cron-tick "$VE_HOST/api/lark/cron-tick" || rc=1
    hit quote-cron-tick "$QUOTE_HOST/api/lark/cron-tick" || rc=1
    # Extra osc ping after tick so heartbeat stays green even if evaluate hung.
    hit ve-osc-ping "$VE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit quote-osc-ping "$QUOTE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    ;;

  # Direct path hits (schedule backups if tick is delayed).
  weekly-report) hit_both /api/lark/weekly-report || rc=1 ;;
  daily-market-report) hit_both /api/lark/daily-market-report || rc=1 ;;
  token-usage-report) hit_both /api/lark/token-usage-report || rc=1 ;;
  weekly-demo) hit_both /api/lark/weekly-demo || rc=1 ;;
  oscillation-alert)
    hit_both /api/lark/oscillation-alert || rc=1
    hit ve-osc-ping "$VE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit quote-osc-ping "$QUOTE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    ;;
  market-report)
    # Quote-only half-hour market scan (VE half-hour Yan DM stays disabled in handler).
    hit quote-market-report "$QUOTE_HOST/api/lark/market-report" || rc=1
    ;;
  alert-nudge)
    if [[ "$ENABLE_ALERT_NUDGE" == "0" ]]; then
      log_line "alert-nudge skipped ENABLE_ALERT_NUDGE=0"
    else
      hit_both /api/lark/alert-nudge || rc=1
    fi
    ;;

  # One-shot smoke of every path (install / manual verify).
  all)
    hit ve-cron-tick "$VE_HOST/api/lark/cron-tick" || rc=1
    hit quote-cron-tick "$QUOTE_HOST/api/lark/cron-tick" || rc=1
    hit ve-osc-ping "$VE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit quote-osc-ping "$QUOTE_HOST/api/lark/oscillation-alert?ping=1" || rc=1
    hit_both /api/lark/cron-health || rc=1
    hit_both /api/lark/weekly-demo || rc=1
    hit_both /api/lark/daily-market-report || rc=1
    hit_both /api/lark/weekly-report || rc=1
    hit_both /api/lark/token-usage-report || rc=1
    hit quote-market-report "$QUOTE_HOST/api/lark/market-report" || rc=1
    if [[ "$ENABLE_ALERT_NUDGE" != "0" ]]; then
      hit_both /api/lark/alert-nudge || rc=1
    fi
    ;;

  help|*)
    cat >&2 <<'EOF'
Usage: cron-relay.sh <tick|ping|health|all|weekly-report|daily-market-report|token-usage-report|weekly-demo|oscillation-alert|market-report|alert-nudge>
EOF
    exit 2
    ;;
esac

exit "$rc"
