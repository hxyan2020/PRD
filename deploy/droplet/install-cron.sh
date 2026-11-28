#!/usr/bin/env bash
# Install permanent VE + Quote cron relays on a DigitalOcean droplet.
# Survives reboot via /etc/cron.d + systemd timers.
# UNINSTALL REQUIRES: CONFIRM_STOP=yan-said-so  (Yan must explicitly ask)
set -euo pipefail

if [[ "${1:-}" == "uninstall" ]]; then
  if [[ "${CONFIRM_STOP:-}" != "yan-said-so" ]]; then
    echo "Refusing uninstall. Crons stay permanent unless Yan explicitly asks." >&2
    echo "To uninstall after Yan confirms: CONFIRM_STOP=yan-said-so $0 uninstall" >&2
    exit 1
  fi
  rm -f /etc/cron.d/lark-bot-heartbeat
  systemctl disable --now lark-bot-tick.timer lark-bot-health.timer 2>/dev/null || true
  rm -f /etc/systemd/system/lark-bot-tick.timer /etc/systemd/system/lark-bot-tick.service
  rm -f /etc/systemd/system/lark-bot-health.timer /etc/systemd/system/lark-bot-health.service
  systemctl daemon-reload 2>/dev/null || true
  echo "Uninstalled after CONFIRM_STOP=yan-said-so"
  exit 0
fi

ROOT="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-/opt/lark-cron-relay}"
LOG_DIR="${LARK_CRON_LOG_DIR:-/var/log/lark-cron-relay}"
# Match Vercel: keep alert-nudge on unless Yan asks to pause group nudges.
ENABLE_ALERT_NUDGE="${ENABLE_ALERT_NUDGE:-1}"

mkdir -p "$INSTALL_DIR" "$LOG_DIR"
install -m 0755 "$ROOT/cron-relay.sh" "$INSTALL_DIR/cron-relay.sh"
install -m 0644 "$ROOT/JOBS.md" "$INSTALL_DIR/JOBS.md" 2>/dev/null || true

cat >"$INSTALL_DIR/env" <<EOF
# Permanent relay env — do not delete unless Yan says so.
VE_BOT_HOST=https://vex-llm-proxy.vercel.app
QUOTE_BOT_HOST=https://quote-ai-troubleshooting-bot.vercel.app
LARK_CRON_LOG_DIR=$LOG_DIR
ENABLE_ALERT_NUDGE=$ENABLE_ALERT_NUDGE
EOF
chmod 0644 "$INSTALL_DIR/env"

cat >"$INSTALL_DIR/run.sh" <<EOF
#!/usr/bin/env bash
set -a
# shellcheck disable=SC1091
source "$INSTALL_DIR/env"
set +a
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
exec "$INSTALL_DIR/cron-relay.sh" "\$@"
EOF
chmod 0755 "$INSTALL_DIR/run.sh"

# Guard file — ops docs + refuse silent removal.
cat >"$INSTALL_DIR/DO_NOT_STOP" <<'EOF'
These crons are permanent for VE AI助手 + 报价 AI助手.
Do NOT disable /etc/cron.d/lark-bot-heartbeat or systemd lark-bot-*.timer
unless Yan explicitly asks. Uninstall: CONFIRM_STOP=yan-said-so install-cron.sh uninstall
EOF

CRON_FILE=/etc/cron.d/lark-bot-heartbeat
cat >"$CRON_FILE" <<EOF
# PERMANENT — VE AI助手 + 报价 AI助手. Do not remove unless Yan says so.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Primary: cron-tick fan-out + osc ping (both bots) every 5 minutes
*/5 * * * * root $INSTALL_DIR/run.sh tick >>$LOG_DIR/cron.out 2>&1
# Health backup at :03/:33 (mirrors Vercel */30 + 5,35 catch-up intent)
3,33 * * * * root $INSTALL_DIR/run.sh health >>$LOG_DIR/cron.out 2>&1
# Osc evaluate backup every 10 minutes (VE schedule); ping always included in tick
*/10 * * * * root $INSTALL_DIR/run.sh oscillation-alert >>$LOG_DIR/cron.out 2>&1
# Weekly demo every 15 minutes
*/15 * * * * root $INSTALL_DIR/run.sh weekly-demo >>$LOG_DIR/cron.out 2>&1
# Quote market-report every 30 minutes
*/30 * * * * root $INSTALL_DIR/run.sh market-report >>$LOG_DIR/cron.out 2>&1
# Alert nudge every minute (self-gated / campaign-day aware)
* * * * * root $INSTALL_DIR/run.sh alert-nudge >>$LOG_DIR/cron.out 2>&1
# Daily market 09:00 CST = 01:00 UTC
0 1 * * * root $INSTALL_DIR/run.sh daily-market-report >>$LOG_DIR/cron.out 2>&1
# Token usage 18:00 CST = 10:00 UTC
0 10 * * * root $INSTALL_DIR/run.sh token-usage-report >>$LOG_DIR/cron.out 2>&1
# Friday weekly 16:00 CST = 08:00 UTC
0 8 * * 5 root $INSTALL_DIR/run.sh weekly-report >>$LOG_DIR/cron.out 2>&1
EOF
chmod 0644 "$CRON_FILE"

# Dual layer: systemd timers so a broken cron daemon still fires tick/health.
if command -v systemctl >/dev/null 2>&1; then
  cat >/etc/systemd/system/lark-bot-tick.service <<EOF
[Unit]
Description=Lark VE+Quote cron-tick relay
After=network-online.target
[Service]
Type=oneshot
EnvironmentFile=$INSTALL_DIR/env
ExecStart=$INSTALL_DIR/run.sh tick
Nice=10
EOF
  cat >/etc/systemd/system/lark-bot-tick.timer <<'EOF'
[Unit]
Description=Lark VE+Quote cron-tick every 5 minutes (permanent)
[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=30s
Unit=lark-bot-tick.service
Persistent=true
[Install]
WantedBy=timers.target
EOF
  cat >/etc/systemd/system/lark-bot-health.service <<EOF
[Unit]
Description=Lark VE+Quote cron-health relay
After=network-online.target
[Service]
Type=oneshot
EnvironmentFile=$INSTALL_DIR/env
ExecStart=$INSTALL_DIR/run.sh health
Nice=10
EOF
  cat >/etc/systemd/system/lark-bot-health.timer <<'EOF'
[Unit]
Description=Lark VE+Quote cron-health every 30 minutes (permanent)
[Timer]
OnBootSec=2min
OnUnitActiveSec=30min
AccuracySec=1min
Unit=lark-bot-health.service
Persistent=true
[Install]
WantedBy=timers.target
EOF
  systemctl daemon-reload
  systemctl enable --now lark-bot-tick.timer lark-bot-health.timer
fi

# Ensure cron service is on (Ubuntu/Debian)
systemctl enable --now cron 2>/dev/null || systemctl enable --now crond 2>/dev/null || true

echo "Installed permanent relay at $INSTALL_DIR"
echo "Crontab: $CRON_FILE"
echo "Logs: $LOG_DIR"
echo "Uninstall only with: CONFIRM_STOP=yan-said-so $0 uninstall"

# Smoke: ping+health only (avoid immediate group nudge spam during install)
"$INSTALL_DIR/run.sh" ping || true
"$INSTALL_DIR/run.sh" health || true
echo "Smoke ping+health done. Full tick runs on schedule."
