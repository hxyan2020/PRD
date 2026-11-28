#!/usr/bin/env bash
# From this Cloud Agent / laptop: push relay onto the droplet over SSH.
# Requires env:
#   DROPLET_SSH_HOST
#   DROPLET_SSH_PRIVATE_KEY  (PEM contents)  OR  DROPLET_SSH_KEY_PATH
# Optional:
#   DROPLET_SSH_USER (default root)
#   DROPLET_SSH_PORT (default 22)
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
"${SCP[@]}" "$ROOT/cron-relay.sh" "$ROOT/install-cron.sh" "$USER@$HOST:$REMOTE_TMP/"
"${SSH[@]}" "sudo bash $REMOTE_TMP/install-cron.sh && rm -rf $REMOTE_TMP"

echo "Droplet relay installed on $USER@$HOST"
echo "Next: unsubscribe Cursor quiet timers lark-osc-ping-5m / lark-cron-health-30m once logs look healthy."
