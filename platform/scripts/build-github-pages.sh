#!/usr/bin/env bash
# Static-export CRMP Admin for GitHub Pages (no API routes in the snapshot).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
API_DIR="$ROOT/src/app/api"
STASH="$ROOT/.api-stash-pages"
ACTIONS="$ROOT/src/app/admin/interventions/actions.ts"
ACTIONS_STASH="$ROOT/.actions-stash-pages.ts"
STUB="$ROOT/scripts/static-stubs/interventions-actions.ts"
INSTRUMENTATION="$ROOT/src/instrumentation.ts"
INSTRUMENTATION_STASH="$ROOT/.instrumentation-stash-pages.ts"
if [[ -d "$API_DIR" ]]; then
  rm -rf "$STASH"
  mv "$API_DIR" "$STASH"
fi
if [[ -f "$ACTIONS" && -f "$STUB" ]]; then
  cp "$ACTIONS" "$ACTIONS_STASH"
  cp "$STUB" "$ACTIONS"
fi
if [[ -f "$INSTRUMENTATION" ]]; then
  mv "$INSTRUMENTATION" "$INSTRUMENTATION_STASH"
fi
cleanup() {
  if [[ -d "$STASH" && ! -d "$API_DIR" ]]; then
    mv "$STASH" "$API_DIR"
  fi
  if [[ -f "$ACTIONS_STASH" ]]; then
    mv "$ACTIONS_STASH" "$ACTIONS"
  fi
  if [[ -f "$INSTRUMENTATION_STASH" && ! -f "$INSTRUMENTATION" ]]; then
    mv "$INSTRUMENTATION_STASH" "$INSTRUMENTATION"
  fi
}
trap cleanup EXIT

export NEXT_PUBLIC_STATIC_EXPORT=1
export STATIC_EXPORT=1
export NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/PRD/crmp-admin}"
npx next build
echo "Static snapshot written to out"
