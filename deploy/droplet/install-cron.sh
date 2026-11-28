#!/usr/bin/env bash
# Install VE + Quote heartbeat relays on a DigitalOcean droplet (or any Linux host).
# Run as root (or with sudo):  sudo bash install-cron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-/opt/lark-cron-relay}"
LOG_DIR="${LARK_CRON_LOG_DIR:-/var/log/lark-cron-relay}"

mkdir -p "$INSTALL_DIR" "$LOG_DIR"
install -m 0755 "$ROOT/cron-relay.sh" "$INSTALL_DIR/cron-relay.sh"

# Wrapper so cron has a stable PATH / env.
cat >"$INSTALL_DIR/run.sh" <<EOF
#!/usr/bin/env bash
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export LARK_CRON_LOG_DIR="$LOG_DIR"
export VE_BOT_HOST="\${VE_BOT_HOST:-https://vex-llm-proxy.vercel.app}"
export QUOTE_BOT_HOST="\${QUOTE_BOT_HOST:-https://quote-ai-troubleshooting-bot.vercel.app}"
exec "$INSTALL_DIR/cron-relay.sh" "\$@"
EOF
chmod 0755 "$INSTALL_DIR/run.sh"

CRON_FILE=/etc/cron.d/lark-bot-heartbeat
cat >"$CRON_FILE" <<EOF
# VE AI助手 + 报价 AI助手 — durable heartbeats (replaces Cursor agent quiet timers)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Oscillation ping every 5 minutes (both bots)
*/5 * * * * root $INSTALL_DIR/run.sh ping >>$LOG_DIR/cron.out 2>&1
# Cron-health every 30 minutes at :03/:33 (both bots)
3,33 * * * * root $INSTALL_DIR/run.sh health >>$LOG_DIR/cron.out 2>&1
EOF
chmod 0644 "$CRON_FILE"

# Smoke once
"$INSTALL_DIR/run.sh" all
echo "Installed. Logs: $LOG_DIR/relay.log"
echo "Crontab: $CRON_FILE"
