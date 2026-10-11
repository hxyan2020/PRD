#!/usr/bin/env python3
"""Expand thin painting intros / painter notes for the whole catalogue.

Uses Wikidata QID → Wikipedia sitelinks (en, then fr/de/es/it) so renamed
works like “Réunion de famille” still resolve to “The Family Reunion (painting)”.
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

UA = "MillePaintings/1.0 (educational open gallery; optimize intros)"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "paintings.json"
WD_API = "https://www.wikidata.org/w/api.php"
MAX_CHARS = 4000
MIN_INTRO = 160
MIN_ANECDOTE = 120

# Prefer English leads; fall back across major art Wikipedias.
WIKI_ORDER = ("enwiki", "frwiki", "dewiki", "eswiki", "itwiki", "nlwiki")

STUB_RE = re.compile(
    r"^(painting|oil painting|portrait painting|artwork|work|drawing|fresco|"
    r"tableau|óleo|pintura|gemälde|quadro)\b.*\bby\b.+$",
    re.I,
)

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


def finish_cleanly(text: str) -> str:
    text = re.sub(r"\s*==+\s*[^=]+?\s*==+\s*", " ", text or "")
    text = re.sub(r"\s+", " ", text.strip())
    if not text:
        return text
    if len(text) <= MAX_CHARS:
        return text
    chunk = text[:MAX_CHARS]
    ends = [m.end() for m in re.finditer(r"[.!?…][\"'”’)]*\s", chunk)]
    if ends and ends[-1] > MAX_CHARS * 0.45:
        return chunk[: ends[-1]].strip()
    return chunk.rsplit(" ", 1)[0].rstrip(",;:")


def is_thin_intro(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return True
    if t.endswith(("…", "...")):
        return True
    if len(t) < MIN_INTRO:
        return True
    if STUB_RE.match(t) and len(t) < 280:
        return True
    # One very short sentence that is just an attribution.
    if t.count(".") <= 1 and re.search(r"\bpainting by\b", t, re.I) and len(t) < 220:
        return True
    return False


def is_thin_anecdote(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return True
    if t.startswith("Little is recorded"):
        return True
    if t.endswith(("…", "...")):
        return True
    if len(t) < MIN_ANECDOTE:
        return True
    return False


def composed_intro(p: dict) -> str:
    """Last-resort readable blurb from structured fields."""
    name = p.get("name") or "This work"
    painter = p.get("painter") or "an unknown artist"
    year = ""
    # Prefer creation year tokens already in the name; else birth era hint.
    collection = (p.get("collection") or "").strip()
    place = (p.get("placeOfCreation") or "").strip()
    genre = (p.get("genre") or "Painting").split(",")[0].strip() or "Painting"
    bits = [f"{name} is a {genre.lower()} by {painter}"]
    if place and place.lower() not in ("unknown",):
        bits.append(f", associated with {place}")
    if collection and collection.lower() not in ("unknown",):
        bits.append(f". It is held in the collection of {collection}")
    bits.append(
        ". The work remains part of the wider conversation of art history, "
        "linking the painter’s practice to the museums and audiences that still keep it in view."
    )
    return finish_cleanly("".join(bits))


def wd_sitelinks(qids: list[str]) -> dict[str, dict[str, str]]:
    """qid -> { wiki: title }"""
    out: dict[str, dict[str, str]] = {}
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
            links = {}
            for wiki, payload in (ent.get("sitelinks") or {}).items():
                title = payload.get("title")
                if title and wiki.endswith("wiki") and not wiki.startswith("commons"):
                    links[wiki] = title
            if links:
                out[qid] = links
        print(f"  wikidata sitelinks {min(i + 40, len(qids))}/{len(qids)}")
        time.sleep(0.35)
    return out


def wiki_extracts(wiki: str, titles: list[str], *, intro_only: bool = True) -> dict[str, str]:
    lang = wiki[:-4] if wiki.endswith("wiki") else wiki
    api = f"https://{lang}.wikipedia.org/w/api.php"
    out: dict[str, str] = {}
    titles = [t for t in titles if t]
    for i in range(0, len(titles), 12):
        batch = titles[i : i + 12]
        params = {
            "action": "query",
            "format": "json",
            "prop": "extracts",
            "explaintext": "1",
            "redirects": "1",
            "titles": "|".join(batch),
        }
        if intro_only:
            params["exintro"] = "1"
        else:
            # Broader pull when the lead section alone is too thin.
            params["exchars"] = "1800"
        data = json.loads(http_get(f"{api}?{urllib.parse.urlencode(params)}"))
        query = data.get("query", {})
        alias: dict[str, set[str]] = {t: {t} for t in batch}
        for n in query.get("normalized", []):
            alias.setdefault(n["to"], set()).add(n["from"])
            alias[n["to"]].update(alias.get(n["from"], set()))
        for r in query.get("redirects", []):
            alias.setdefault(r["to"], set()).add(r["from"])
            alias[r["to"]].update(alias.get(r["from"], set()))
        for page in query.get("pages", {}).values():
            title = page.get("title")
            extract = finish_cleanly(page.get("extract") or "")
            if not title or not extract:
                continue
            low = extract.lower()
            if "may refer to:" in low or low.startswith("this is a redirect"):
                continue
            for a in alias.get(title, {title}):
                if a not in out or len(extract) > len(out[a]):
                    out[a] = extract
            if title not in out or len(extract) > len(out[title]):
                out[title] = extract
        mode = "intro" if intro_only else "exchars"
        print(f"  {wiki} {mode} {min(i + 12, len(titles))}/{len(titles)} (ok {len(out)})")
        time.sleep(0.65)
    return out


def best_extract_for_qid(
    qid: str,
    sitelinks: dict[str, dict[str, str]],
    extract_cache: dict[str, dict[str, str]],
) -> str:
    links = sitelinks.get(qid) or {}
    best = ""
    for wiki in WIKI_ORDER:
        title = links.get(wiki)
        if not title:
            continue
        extract = (extract_cache.get(wiki) or {}).get(title) or ""
        if not extract:
            continue
        if len(extract) > len(best):
            best = extract
        if len(best) >= MIN_INTRO and wiki == "enwiki":
            return best
    return best


def main() -> None:
    data = json.loads(OUT.read_text(encoding="utf-8"))
    paintings: list[dict] = data["paintings"]

    thin_paintings = [p for p in paintings if is_thin_intro(p.get("intro") or "")]
    thin_painter_ids = sorted(
        {
            p["painterId"]
            for p in paintings
            if p.get("painterId", "").startswith("Q") and is_thin_anecdote(p.get("anecdote") or "")
        }
    )
    print(f"Thin intros: {len(thin_paintings)}; thin painter bios: {len(thin_painter_ids)}")

    qids = sorted(
        {
            *(p["id"] for p in thin_paintings if str(p.get("id", "")).startswith("Q")),
            *thin_painter_ids,
        }
    )
    sitelinks = wd_sitelinks(qids) if qids else {}

    # Collect titles per wiki for batch extract fetches.
    titles_by_wiki: dict[str, set[str]] = {w: set() for w in WIKI_ORDER}
    for qid in qids:
        links = sitelinks.get(qid) or {}
        for wiki in WIKI_ORDER:
            if wiki in links:
                titles_by_wiki[wiki].add(links[wiki])

    extract_cache: dict[str, dict[str, str]] = {}
    for wiki in WIKI_ORDER:
        titles = sorted(titles_by_wiki[wiki])
        if not titles:
            continue
        print(f"Fetching {wiki}: {len(titles)} titles")
        extract_cache[wiki] = wiki_extracts(wiki, titles, intro_only=True)

    # Second pass: expand still-thin leads with a longer plain-text pull (enwiki first).
    need_more: set[str] = set()
    for p in thin_paintings:
        extract = best_extract_for_qid(p["id"], sitelinks, extract_cache)
        if not extract or len(extract) < 280:
            title = (sitelinks.get(p["id"]) or {}).get("enwiki")
            if title:
                need_more.add(title)
    for pid in thin_painter_ids:
        extract = best_extract_for_qid(pid, sitelinks, extract_cache)
        if not extract or len(extract) < 220:
            title = (sitelinks.get(pid) or {}).get("enwiki")
            if title:
                need_more.add(title)
    if need_more:
        print(f"Expanding short leads via enwiki exchars: {len(need_more)}")
        deeper = wiki_extracts("enwiki", sorted(need_more), intro_only=False)
        merged = dict(extract_cache.get("enwiki") or {})
        for title, extract in deeper.items():
            if title not in merged or len(extract) > len(merged[title]):
                merged[title] = extract
        extract_cache["enwiki"] = merged

    intro_n = 0
    anec_n = 0
    composed_n = 0
    for p in paintings:
        if is_thin_intro(p.get("intro") or "") or "wider conversation of art history" in (
            p.get("intro") or ""
        ):
            extract = best_extract_for_qid(p["id"], sitelinks, extract_cache)
            if extract and (
                len(extract) > len(p.get("intro") or "")
                or "wider conversation of art history" in (p.get("intro") or "")
            ):
                if extract != p.get("intro"):
                    p["intro"] = extract
                    intro_n += 1
            elif is_thin_intro(p.get("intro") or ""):
                composed = composed_intro(p)
                if len(composed) > len(p.get("intro") or ""):
                    p["intro"] = composed
                    composed_n += 1

        pid = p.get("painterId") or ""
        if pid.startswith("Q") and is_thin_anecdote(p.get("anecdote") or ""):
            extract = best_extract_for_qid(pid, sitelinks, extract_cache)
            if extract and len(extract) > len(p.get("anecdote") or ""):
                p["anecdote"] = extract
                anec_n += 1

    data["generatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    remaining = sum(1 for p in paintings if is_thin_intro(p.get("intro") or ""))
    remaining_a = sum(1 for p in paintings if is_thin_anecdote(p.get("anecdote") or ""))
    print(f"Intros from Wikipedia: {intro_n}; composed fallbacks: {composed_n}")
    print(f"Painter notes updated: {anec_n}")
    print(f"Remaining thin intros: {remaining}; thin painter notes: {remaining_a}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
