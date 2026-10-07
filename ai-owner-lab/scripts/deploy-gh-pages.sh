#!/usr/bin/env bash
# Deploy ai-owner-lab/dist → origin/gh-pages:ownlab/ without touching other site roots.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/ai-owner-lab"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$APP"
npm run build

git -C "$ROOT" fetch origin gh-pages
git -C "$ROOT" worktree add --force "$TMP/gh-pages" origin/gh-pages

DEST="$TMP/gh-pages/ownlab"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$APP/dist/." "$DEST/"

# Ensure Jekyll does not mangle asset folders under ownlab
touch "$TMP/gh-pages/.nojekyll"

cd "$TMP/gh-pages"
git add -A ownlab .nojekyll
if git diff --cached --quiet; then
  echo "No changes to deploy."
  exit 0
fi

git -c user.name="$(git -C "$ROOT" config user.name)" \
    -c user.email="$(git -C "$ROOT" config user.email)" \
    commit -m "Deploy OWNLAB AI Product Owner Academy to /ownlab/"
git push origin HEAD:gh-pages

echo "Live at: https://hxyan2020.github.io/PRD/ownlab/"
