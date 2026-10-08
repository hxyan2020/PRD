#!/usr/bin/env python3
"""Publish mille-paintings/dist into origin/gh-pages under /mille/."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIST = Path(__file__).resolve().parents[1] / "dist"
TARGET = "mille"


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=str(cwd) if cwd else None)


def main() -> None:
    if not DIST.exists():
        raise SystemExit(f"Missing build output: {DIST}. Run npm run build first.")

    worktree = ROOT / ".gh-pages-worktree"
    if worktree.exists():
        shutil.rmtree(worktree)

    run(["git", "fetch", "origin", "gh-pages"], cwd=ROOT)
    run(["git", "worktree", "prune"], cwd=ROOT)
    run(
        ["git", "worktree", "add", "-B", "gh-pages-deploy", str(worktree), "origin/gh-pages"],
        cwd=ROOT,
    )

    dest = worktree / TARGET
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(DIST, dest)
    (worktree / ".nojekyll").write_text("", encoding="utf-8")

    run(["git", "add", TARGET, ".nojekyll"], cwd=worktree)
    status = subprocess.check_output(["git", "status", "--porcelain"], cwd=worktree, text=True).strip()
    if not status:
        print("No changes to deploy.")
    else:
        run(
            [
                "git",
                "commit",
                "-m",
                "Deploy Mille paintings gallery to /mille/",
            ],
            cwd=worktree,
        )
        run(["git", "push", "origin", "HEAD:gh-pages"], cwd=worktree)
        print("Deployed to https://hxyan2020.github.io/PRD/mille/")

    run(["git", "worktree", "remove", "--force", str(worktree)], cwd=ROOT)


if __name__ == "__main__":
    main()
