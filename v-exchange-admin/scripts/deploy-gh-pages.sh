#!/usr/bin/env bash
# Build MatchingManagement and publish to origin/gh-pages:/matching-management/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/v-exchange-admin"
WORKTREE="$ROOT/.gh-pages-deploy"
TARGET_DIR="matching-management"

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
# SPA fallback for nested path (also covered by repo-root 404.html handshake)
cp "$WORKTREE/$TARGET_DIR/index.html" "$WORKTREE/$TARGET_DIR/404.html"
touch "$WORKTREE/$TARGET_DIR/.nojekyll"
touch "$WORKTREE/.nojekyll"

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "No changes to deploy."
else
  git commit -m "Deploy MatchingManagement admin to GitHub Pages (/$TARGET_DIR)

Includes latest: Index Price modal, Index Market Link popup, split risk/monitor
menus, and DB接仓账户管理.

Co-authored-by: hxyan2020 <hxyan2020@users.noreply.github.com>"
  git push origin gh-pages
  echo "==> Pushed to origin/gh-pages"
fi

cd "$ROOT"
git worktree remove --force "$WORKTREE"
echo "==> Live at https://hxyan2020.github.io/PRD/matching-management/"
