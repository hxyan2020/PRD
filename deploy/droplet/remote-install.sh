#!/usr/bin/env bash
# Push permanent relay onto the droplet over SSH.
# Requires: DROPLET_SSH_HOST + DROPLET_SSH_PRIVATE_KEY (or DROPLET_SSH_KEY_PATH)
set -euo pipefail

HOST="${DROPLET_SSH_HOST:?set DROPLET_SSH_HOST}"
USER="${DROPLET_SSH_USER:-root}"
PORT="${DROPLET_SSH_PORT:-22}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
KEY_FILE="$(mktemp)"
cleanup() { rm -f "$KEY_FILE"; }
trap cleanup EXIT

if [[ -n "${DROPLET_SSH_KEY_PATH:-}" ]]; then
  cp "$DROPLET_SSH_KEY_PATH" "$KEY_FILE"
elif [[ -n "${DROPLET_SSH_PRIVATE_KEY:-}" ]]; then
  printf '%s\n' "$DROPLET_SSH_PRIVATE_KEY" >"$KEY_FILE"
else
  echo "Set DROPLET_SSH_PRIVATE_KEY or DROPLET_SSH_KEY_PATH" >&2
  exit 1
fi
chmod 600 "$KEY_FILE"

SSH=(ssh -i "$KEY_FILE" -p "$PORT" -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes "$USER@$HOST")
SCP=(scp -i "$KEY_FILE" -P "$PORT" -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes)

REMOTE_TMP="/tmp/lark-cron-relay-$$"
"${SSH[@]}" "mkdir -p $REMOTE_TMP"
"${SCP[@]}" "$ROOT/cron-relay.sh" "$ROOT/install-cron.sh" "$ROOT/JOBS.md" "$ROOT/README.md" "$USER@$HOST:$REMOTE_TMP/"
"${SSH[@]}" "sudo bash $REMOTE_TMP/install-cron.sh && rm -rf $REMOTE_TMP"

echo "Permanent droplet relay installed on $USER@$HOST"
echo "Crons will NOT stop unless Yan runs: CONFIRM_STOP=yan-said-so install-cron.sh uninstall"
echo "After verifying /var/log/lark-cron-relay/relay.log, unsubscribe Cursor quiet timers only."
