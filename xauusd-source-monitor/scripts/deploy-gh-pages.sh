#!/usr/bin/env bash
# Build XAUUSD source monitor and publish to origin/gh-pages:/xauusd-source-monitor/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/xauusd-source-monitor"
WORKTREE="$ROOT/.gh-pages-deploy"
TARGET_DIR="xauusd-source-monitor"

cd "$APP"
echo "==> Building with GitHub Pages base..."
GITHUB_PAGES=1 npm run build

echo "==> Preparing gh-pages worktree..."
rm -rf "$WORKTREE"
git -C "$ROOT" fetch origin gh-pages
git -C "$ROOT" worktree remove --force "$WORKTREE" 2>/dev/null || true
git -C "$ROOT" worktree add -B gh-pages "$WORKTREE" origin/gh-pages

echo "==> Syncing $TARGET_DIR..."
rm -rf "$WORKTREE/$TARGET_DIR"
mkdir -p "$WORKTREE/$TARGET_DIR"
cp -a "$APP/dist/." "$WORKTREE/$TARGET_DIR/"
cp "$WORKTREE/$TARGET_DIR/index.html" "$WORKTREE/$TARGET_DIR/404.html"
touch "$WORKTREE/$TARGET_DIR/.nojekyll"
touch "$WORKTREE/.nojekyll"

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "No changes to deploy."
else
  git commit -m "Deploy XAUUSD source monitor to GitHub Pages (/$TARGET_DIR)

Public live health, rules, and briefing archive for XAUUSD MVP perp venues.

Co-authored-by: hxyan2020 <hxyan2020@users.noreply.github.com>"
  git push origin gh-pages
  echo "==> Pushed to origin/gh-pages"
fi

cd "$ROOT"
git worktree remove --force "$WORKTREE"
echo "==> Live at https://hxyan2020.github.io/PRD/xauusd-source-monitor/"
