#!/usr/bin/env python3
"""Fix remaining cut/wrong intros using Wikidata → enwiki sitelinks."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MillePaintings/1.0 (educational open gallery; fix cut intros)"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "paintings.json"
WIKI_API = "https://en.wikipedia.org/w/api.php"
WD_API = "https://www.wikidata.org/w/api.php"
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


def looks_bad(text: str) -> bool:
    t = (text or "").rstrip()
    if not t:
        return True
    if t.endswith(("…", "...")):
        return True
    low = t.lower()
    if "may refer to:" in low or "may also refer to:" in low:
        return True
    if t[-1] not in ".!?…\"”')" and len(t) > 80:
        return True
    return False


def finish_cleanly(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return text
    if len(text) <= MAX_CHARS:
        return text
    chunk = text[:MAX_CHARS]
    ends = [m.end() for m in re.finditer(r"[.!?…][\"'”’)]*\s", chunk)]
    if ends and ends[-1] > MAX_CHARS * 0.45:
        return chunk[: ends[-1]].strip()
    return chunk.rsplit(" ", 1)[0].rstrip(",;:")


def wd_enwiki_titles(qids: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for i in range(0, len(qids), 40):
        batch = qids[i : i + 40]
        params = {
            "action": "wbgetentities",
            "format": "json",
            "props": "sitelinks",
            "ids": "|".join(batch),
        }
        data = json.loads(http_get(f"{WD_API}?{urllib.parse.urlencode(params)}"))
        for qid, ent in data.get("entities", {}).items():
            title = (ent.get("sitelinks") or {}).get("enwiki", {}).get("title")
            if title:
                out[qid] = title
        print(f"  wikidata sitelinks {min(i + 40, len(qids))}/{len(qids)}")
        time.sleep(0.4)
    return out


def wiki_extracts(titles: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
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
        pages = data.get("query", {}).get("pages", {})
        # Map redirects back
        alias: dict[str, set[str]] = {t: {t} for t in batch}
        for n in data.get("query", {}).get("normalized", []):
            alias.setdefault(n["to"], set()).add(n["from"])
            alias[n["to"]].update(alias.get(n["from"], set()))
        for r in data.get("query", {}).get("redirects", []):
            alias.setdefault(r["to"], set()).add(r["from"])
            alias[r["to"]].update(alias.get(r["from"], set()))
        for page in pages.values():
            title = page.get("title")
            extract = finish_cleanly(page.get("extract") or "")
            if not title or not extract or looks_bad(extract):
                continue
            for a in alias.get(title, {title}):
                out[a] = extract
            out[title] = extract
        print(f"  wiki extracts {min(i + 12, len(titles))}/{len(titles)} (ok {len(out)})")
        time.sleep(0.7)
    return out


def main() -> None:
    data = json.loads(OUT.read_text(encoding="utf-8"))
    paintings = data["paintings"]
    bad = [p for p in paintings if looks_bad(p.get("intro") or "")]
    print(f"Bad intros: {len(bad)}")
    qids = [p["id"] for p in bad if p.get("id", "").startswith("Q")]
    sitelinks = wd_enwiki_titles(qids)
    titles = sorted(set(sitelinks.values()))
    extracts = wiki_extracts(titles)

    # Painter fixes for remaining cut anecdotes
    bad_painters = sorted(
        {
            p["painterId"]
            for p in paintings
            if p.get("painterId", "").startswith("Q") and looks_bad(p.get("anecdote") or "")
        }
    )
    painter_links = wd_enwiki_titles(bad_painters) if bad_painters else {}
    painter_extracts = wiki_extracts(sorted(set(painter_links.values()))) if painter_links else {}
    painter_by_qid = {
        qid: painter_extracts[title]
        for qid, title in painter_links.items()
        if title in painter_extracts
    }

    intro_n = 0
    anec_n = 0
    for p in paintings:
        title = sitelinks.get(p["id"])
        if title and title in extracts:
            if extracts[title] != p.get("intro"):
                p["intro"] = extracts[title]
                intro_n += 1
        pid = p.get("painterId")
        if pid in painter_by_qid and painter_by_qid[pid] != p.get("anecdote"):
            p["anecdote"] = painter_by_qid[pid]
            anec_n += 1

    data["generatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    remaining = sum(1 for p in paintings if looks_bad(p.get("intro") or ""))
    remaining_a = sum(1 for p in paintings if looks_bad(p.get("anecdote") or ""))
    print(f"Intros fixed: {intro_n}; painter notes fixed: {anec_n}")
    print(f"Remaining bad intros: {remaining}; bad painter notes: {remaining_a}")


if __name__ == "__main__":
    main()
