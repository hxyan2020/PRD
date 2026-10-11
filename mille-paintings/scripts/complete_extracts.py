#!/usr/bin/env python3
"""Re-fetch full Wikipedia lead sections for painting intros and painter bios.

Avoid mid-sentence ellipsis truncation used by earlier import scripts.
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MillePaintings/1.0 (educational open gallery; complete extracts)"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "paintings.json"
WIKI_API = "https://en.wikipedia.org/w/api.php"
# Soft ceiling so the JSON stays manageable; always end on a sentence boundary.
MAX_CHARS = 4000

try:
    sys.stdout.reconfigure(line_buffering=True)  # type: ignore[attr-defined]
except Exception:  # noqa: BLE001
    pass


def http_get(url: str, retries: int = 8) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    delay = 2.0
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last_err = exc
            wait = 90.0 if exc.code == 429 else delay
            print(f"  HTTP {exc.code}; sleep {wait:.0f}s (attempt {attempt + 1})")
            time.sleep(wait)
            delay = min(delay * 2, 60)
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(delay)
            delay = min(delay * 2, 60)
    raise RuntimeError(url) from last_err


def finish_cleanly(text: str, max_chars: int = MAX_CHARS) -> str:
    """Keep whole sentences; never append an artificial ellipsis."""
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return text
    if len(text) <= max_chars:
        # Prefer ending on sentence punctuation when present.
        if text[-1] in ".!?…”\"":
            return text
        # If Wikipedia lead has no terminal punctuation, keep as-is.
        return text
    chunk = text[:max_chars]
    # Last sentence end inside the window.
    ends = [m.end() for m in re.finditer(r"[.!?…][\"'”’)]*\s", chunk)]
    if ends and ends[-1] > max_chars * 0.45:
        return chunk[: ends[-1]].strip()
    # Fallback: last word boundary without ellipsis marker.
    cut = chunk.rsplit(" ", 1)[0].rstrip(",;:")
    return cut


def fetch_extracts(titles: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    titles = [t for t in titles if t and t != "Unknown"]
    for i in range(0, len(titles), 12):
        batch = titles[i : i + 12]
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
        title_alias: dict[str, set[str]] = {t: {t} for t in batch}
        for n in query.get("normalized", []):
            title_alias.setdefault(n["to"], set()).add(n["from"])
            title_alias[n["to"]].update(title_alias.get(n["from"], set()))
        for r in query.get("redirects", []):
            title_alias.setdefault(r["to"], set()).add(r["from"])
            title_alias[r["to"]].update(title_alias.get(r["from"], set()))

        for page in pages.values():
            title = page.get("title")
            extract = (page.get("extract") or "").strip()
            if not title or not extract:
                continue
            low = extract.lower()
            if "may refer to:" in low or low.startswith("this is a redirect"):
                continue
            cleaned = finish_cleanly(extract)
            aliases = title_alias.get(title, {title})
            for alias in aliases:
                out[alias] = cleaned
            out[title] = cleaned
        print(f"  extracts {min(i + 12, len(titles))}/{len(titles)} (mapped {len(out)})")
        time.sleep(0.7)
    return out


def looks_cut(text: str) -> bool:
    t = (text or "").rstrip()
    if not t:
        return True
    if t.endswith(("…", "...")):
        return True
    # Mid-thought endings without sentence close
    if t[-1] not in ".!?…\"”'’)" and len(t) > 80:
        return True
    return False


def main() -> None:
    data = json.loads(OUT.read_text(encoding="utf-8"))
    paintings = data["paintings"]

    painting_titles = sorted(
        {
            p["name"]
            for p in paintings
            if looks_cut(p.get("intro") or "") or len(p.get("intro") or "") < 280
        }
    )
    # Always refresh painter bios that look cut, plus all painters of cut intros.
    painter_titles = sorted(
        {
            p["painter"]
            for p in paintings
            if p.get("painter")
            and (
                looks_cut(p.get("anecdote") or "")
                or len(p.get("anecdote") or "") < 180
                or looks_cut(p.get("intro") or "")
            )
        }
    )

    print(f"Paintings to refresh: {len(painting_titles)}; painters: {len(painter_titles)}")
    painting_extracts = fetch_extracts(painting_titles)
    painter_extracts = fetch_extracts(painter_titles)

    intro_updates = 0
    anecdote_updates = 0
    for p in paintings:
        extract = painting_extracts.get(p["name"])
        if extract and (looks_cut(p.get("intro") or "") or len(extract) > len(p.get("intro") or "")):
            # Prefer complete text even if slightly shorter (old had ellipsis padding).
            if extract != p.get("intro"):
                p["intro"] = extract
                intro_updates += 1

        painter_ex = painter_extracts.get(p["painter"])
        if painter_ex:
            # Full painter lead as life note — complete sentences, no artificial …
            if painter_ex != p.get("anecdote"):
                p["anecdote"] = painter_ex
                anecdote_updates += 1

    data["generatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Intros updated: {intro_updates}; painter bios updated: {anecdote_updates}")
    cut_intro = sum(1 for p in paintings if looks_cut(p.get("intro") or ""))
    cut_anec = sum(1 for p in paintings if looks_cut(p.get("anecdote") or ""))
    print(f"Remaining cut intros: {cut_intro}; cut painter notes: {cut_anec}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
