#!/usr/bin/env bash
# Deploy Canon to the HX DigitalOcean droplet when SSH is available.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DO_HOST:-root@188.166.214.47}"
DEST="${DO_DEST:-/var/www/canon}"
KEY="${DO_SSH_KEY:-$HOME/.ssh/haixiang-bio_ed25519}"

cd "$ROOT"
npm ci
npm run build

if [[ -f "$KEY" ]]; then
  SSH=(ssh -i "$KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
  RSYNC=(rsync -az -e "ssh -i $KEY -o BatchMode=yes -o StrictHostKeyChecking=accept-new")
else
  SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
  RSYNC=(rsync -az)
fi

"${SSH[@]}" "$HOST" "mkdir -p '$DEST'"
"${RSYNC[@]}" "$ROOT/dist/" "$HOST:$DEST/"
"${RSYNC[@]}" "$ROOT/nginx.conf" "$HOST:$DEST/nginx.conf"
echo "Uploaded dist to $HOST:$DEST"
echo "Point nginx server_name canon.188.166.214.47.nip.io at $DEST and reload nginx."
