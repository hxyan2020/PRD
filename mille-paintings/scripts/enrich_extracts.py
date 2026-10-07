#!/usr/bin/env python3
"""Re-fetch Wikipedia extracts for paintings/painters with thin text."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MillePaintings/1.0 (educational open gallery)"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "paintings.json"
WIKI_API = "https://en.wikipedia.org/w/api.php"

try:
    sys.stdout.reconfigure(line_buffering=True)  # type: ignore[attr-defined]
except Exception:  # noqa: BLE001
    pass


def http_get(url: str, retries: int = 6) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    delay = 2.0
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last_err = exc
            wait = 75.0 if exc.code == 429 else delay
            print(f"  HTTP {exc.code}; sleep {wait:.0f}s (attempt {attempt + 1})")
            time.sleep(wait)
            delay = min(delay * 2, 60)
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(delay)
            delay = min(delay * 2, 60)
    raise RuntimeError(url) from last_err


def fetch_extracts(titles: list[str]) -> dict[str, str]:
    """Return map from requested title -> extract, following redirects."""
    out: dict[str, str] = {}
    for i in range(0, len(titles), 15):
        batch = titles[i : i + 15]
        params = {
            "action": "query",
            "format": "json",
            "prop": "extracts",
            "exintro": "1",
            "explaintext": "1",
            "redirects": "1",
            "titles": "|".join(batch),
        }
        data = json.loads(http_get(f"{WIKI_API}?{urllib.parse.urlencode(params)}"))
        query = data.get("query", {})
        pages = query.get("pages", {})
        # Build redirect/normalized maps to original request titles
        title_alias: dict[str, set[str]] = {}
        for t in batch:
            title_alias.setdefault(t, set()).add(t)
        for n in query.get("normalized", []):
            title_alias.setdefault(n["to"], set()).add(n["from"])
            if n["from"] in title_alias:
                title_alias[n["to"]].update(title_alias[n["from"]])
        for r in query.get("redirects", []):
            title_alias.setdefault(r["to"], set()).add(r["from"])
            if r["from"] in title_alias:
                title_alias[r["to"]].update(title_alias[r["from"]])

        for page in pages.values():
            title = page.get("title")
            extract = (page.get("extract") or "").strip()
            if not title or not extract:
                continue
            # Skip disambiguation-style pages
            if "may refer to:" in extract.lower() or extract.lower().startswith("this is a redirect"):
                continue
            if len(extract) > 900:
                extract = extract[:897].rsplit(" ", 1)[0] + "…"
            aliases = title_alias.get(title, {title})
            for alias in aliases:
                out[alias] = extract
            out[title] = extract
        print(f"  extracts {min(i + 15, len(titles))}/{len(titles)} (mapped {len(out)})")
        time.sleep(0.8)
    return out


def anecdote(painter: str, extract: str) -> str:
    if not extract:
        return (
            f"Little is recorded in popular anecdote about {painter}, yet their work continues "
            "to shape how we see color, form, and narrative."
        )
    parts = re.split(r"(?<=[.!?])\s+", extract)
    text = " ".join(parts[:2]).strip()
    if len(text) > 420:
        text = text[:417].rsplit(" ", 1)[0] + "…"
    return text


def main() -> None:
    data = json.loads(OUT.read_text(encoding="utf-8"))
    paintings = data["paintings"]
    thin = [p["name"] for p in paintings if len(p.get("intro") or "") < 220]
    painters = sorted(
        {
            p["painter"]
            for p in paintings
            if p.get("anecdote", "").startswith("Little is recorded") or len(p.get("anecdote") or "") < 100
        }
    )
    print(f"Thin intros: {len(thin)}; thin anecdotes: {len(painters)}")
    painting_extracts = fetch_extracts(thin) if thin else {}
    painter_extracts = fetch_extracts(painters) if painters else {}

    intro_updates = 0
    anecdote_updates = 0
    for p in paintings:
        extract = painting_extracts.get(p["name"])
        if extract and len(extract) > len(p.get("intro") or ""):
            p["intro"] = extract
            intro_updates += 1
        if p["painter"] in painter_extracts:
            p["anecdote"] = anecdote(p["painter"], painter_extracts[p["painter"]])
            anecdote_updates += 1

    data["generatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Intros updated: {intro_updates}; anecdotes updated: {anecdote_updates}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
