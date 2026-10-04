#!/usr/bin/env python3
"""Prefix root-absolute assets in a nested GitHub Pages static export."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPLACEMENTS = (
    "/_next/",
    "/logo.png",
    "/favicon.ico",
    "/favicon.png",
    "/favicon-16.png",
    "/favicon-32.png",
    "/apple-touch-icon.png",
    "/icon-192.png",
    "/site.webmanifest",
    "/rc-study-bridge.js",
    "/demos/",
    "/study/",
    "/domains/",
)

TEXT_SUFFIXES = {".html", ".js", ".css", ".json", ".txt", ".webmanifest"}


def rewrite_text(text: str, prefix: str) -> str:
    if not prefix.startswith("/"):
        prefix = "/" + prefix
    prefix = prefix.rstrip("/")
    out = text
    for needle in REPLACEMENTS:
        out = out.replace(f'"{needle}', f'"{prefix}{needle}')
        out = out.replace(f"'{needle}", f"'{prefix}{needle}")
    # Next.js font CSS uses unquoted url(/_next/...)
    out = out.replace("url(/_next/", f"url({prefix}/_next/")
    out = out.replace('href="/"', f'href="{prefix}/"')
    out = out.replace("href='/'", f"href='{prefix}/'")
    out = out.replace('href="/#', f'href="{prefix}/#')
    out = out.replace("href='/#", f"href='{prefix}/#")
    out = out.replace('href:"/"', f'href:"{prefix}/"')
    out = out.replace("href:'/'", f"href:'{prefix}/'")
    out = out.replace('href:"/#', f'href:"{prefix}/#')
    out = out.replace("href:'/#", f"href:'{prefix}/#")
    out = out.replace('"start_url": "/"', f'"start_url": "{prefix}/"')
    out = out.replace('"start_url":"/"', f'"start_url":"{prefix}/"')
    return out


def rewrite_dir(root: Path, prefix: str) -> int:
    changed = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        original = path.read_text(encoding="utf-8", errors="replace")
        updated = rewrite_text(original, prefix)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    return changed


def _self_test() -> None:
    prefix = "/PRD/risk-champion-site"
    sample = (
        '<link href="/_next/foo.css"/>'
        "<a href=\"/\"></a>"
        "<a href=\"/demos/x/\"></a>"
        'src:url(/_next/static/media/a.woff2)'
        'let d=[{href:"/#domains"},{href:"/demos/"},{href:"/"}];'
        '{"start_url": "/", "src": "/logo.png"}'
    )
    out = rewrite_text(sample, prefix)
    assert f"{prefix}/_next/foo.css" in out, out
    assert f'href="{prefix}/"' in out, out
    assert f"{prefix}/demos/x/" in out, out
    assert f"url({prefix}/_next/static/media/a.woff2)" in out, out
    assert f'href:"{prefix}/#domains"' in out, out
    assert f'href:"{prefix}/demos/"' in out, out
    assert f'href:"{prefix}/"' in out, out
    assert f'"start_url": "{prefix}/"' in out, out
    assert f'"src": "{prefix}/logo.png"' in out, out
    assert rewrite_text(out, prefix) == out
    assert '"/_next/' not in out, out
    assert "url(/_next/" not in out, out
    assert 'href="/"' not in out, out
    assert 'href:"/"' not in out, out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path, nargs="?")
    parser.add_argument("--prefix", default="/PRD/risk-champion-site")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        _self_test()
        print("self-test ok")
        if args.root is None:
            return 0
    if args.root is None:
        print("root required", file=sys.stderr)
        return 1
    if not args.root.is_dir():
        print(f"missing dir {args.root}", file=sys.stderr)
        return 1
    n = rewrite_dir(args.root, args.prefix)
    print(f"rewrote {n} files under {args.root} -> {args.prefix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
