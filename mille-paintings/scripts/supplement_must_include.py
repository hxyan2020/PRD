#!/usr/bin/env python3
"""Ensure iconic works missing from the strict P31=painting query are included."""

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
WD_API = "https://www.wikidata.org/w/api.php"
WIKI_API = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/"

# Famous works often typed as pastel/fresco/etc. rather than painting.
MUST_INCLUDE = [
    "Q471379",  # The Scream (pastel — missed by P31=painting)
    "Q500242",  # The Creation of Adam (fresco)
    "Q1044815",  # The School of Athens
    "Q47505",  # The Last Judgment (Sistine)
    "Q321303",  # The Garden of Earthly Delights
    "Q2419018",  # Primavera (Botticelli)
    "Q151921",  # The Ambassadors
    "Q12418",  # Mona Lisa
    "Q219831",  # The Night Watch
    "Q175036",  # Guernica
]

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
            print(f"  HTTP {exc.code}; sleep {wait:.0f}s")
            time.sleep(wait)
            delay = min(delay * 2, 60)
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(delay)
            delay = min(delay * 2, 60)
    raise RuntimeError(url) from last_err


def wd_api(params: dict) -> dict:
    return json.loads(http_get(f"{WD_API}?{urllib.parse.urlencode(params)}"))


def commons_url(filename: str, width: int | None = 1600) -> str:
    base = COMMONS + urllib.parse.quote(filename)
    return f"{base}?width={width}" if width else base


def label_of(entity: dict) -> str:
    labels = entity.get("labels", {})
    if "en" in labels:
        return labels["en"]["value"]
    if labels:
        return next(iter(labels.values()))["value"]
    return entity.get("id", "")


def desc_of(entity: dict) -> str:
    descs = entity.get("descriptions", {})
    return descs.get("en", {}).get("value", "")


def claim_values(entity: dict, prop: str) -> list:
    out = []
    for claim in entity.get("claims", {}).get(prop, []):
        snak = claim.get("mainsnak", {})
        if snak.get("snaktype") != "value":
            continue
        out.append(snak.get("datavalue", {}).get("value"))
    return out


def claim_ids(entity: dict, prop: str) -> list[str]:
    return [v["id"] for v in claim_values(entity, prop) if isinstance(v, dict) and "id" in v]


def claim_files(entity: dict, prop: str = "P18") -> list[str]:
    return [v for v in claim_values(entity, prop) if isinstance(v, str)]


def year_of(time_str: str) -> str | None:
    m = re.search(r"([+-]?\d{1,4})-", time_str)
    return str(int(m.group(1))) if m else None


def claim_year(entity: dict, prop: str) -> str:
    for v in claim_values(entity, prop):
        if isinstance(v, dict) and "time" in v:
            y = year_of(v["time"])
            if y:
                return y
    return "Unknown"


def fetch_entities(ids: list[str]) -> dict[str, dict]:
    entities: dict[str, dict] = {}
    for i in range(0, len(ids), 40):
        batch = ids[i : i + 40]
        data = wd_api(
            {
                "action": "wbgetentities",
                "ids": "|".join(batch),
                "props": "labels|descriptions|claims|sitelinks",
                "languages": "en",
                "format": "json",
            }
        )
        entities.update(data.get("entities", {}))
        time.sleep(0.4)
    return entities


def wiki_extract(title: str) -> str:
    params = {
        "action": "query",
        "format": "json",
        "prop": "extracts",
        "exintro": "1",
        "explaintext": "1",
        "redirects": "1",
        "titles": title,
    }
    data = json.loads(http_get(f"{WIKI_API}?{urllib.parse.urlencode(params)}"))
    for page in data.get("query", {}).get("pages", {}).values():
        extract = (page.get("extract") or "").strip()
        if extract and "may refer to:" not in extract.lower():
            if len(extract) > 900:
                extract = extract[:897].rsplit(" ", 1)[0] + "…"
            return extract
    return ""


def anecdote(painter: str, extract: str) -> str:
    if not extract:
        return (
            f"Little is recorded in popular anecdote about {painter}, yet their work continues "
            "to shape how we see color, form, and narrative."
        )
    parts = re.split(r"(?<=[.!?])\s+", extract)
    text = " ".join(parts[:2]).strip()
    return text[:417] + "…" if len(text) > 420 else text


DESTROYED = {"Q56556915", "Q56644435", "Q208887", "Q106574501", "Q24354019"}


def build_entry(pid: str, entity: dict, related: dict[str, dict]) -> dict | None:
    if "missing" in entity:
        return None
    title = label_of(entity)
    images = claim_files(entity, "P18")
    creators = claim_ids(entity, "P170")
    if not title or not images or not creators:
        return None
    cid = creators[0]
    creator = related.get(cid, {})
    painter = label_of(creator) if creator else "Unknown"
    countries = [label_of(related[x]) for x in claim_ids(creator, "P27") if x in related]
    genres = [label_of(related[x]) for x in claim_ids(entity, "P136") if x in related]
    places = [label_of(related[x]) for x in claim_ids(entity, "P1071") if x in related]
    if not places:
        places = [label_of(related[x]) for x in claim_ids(entity, "P495") if x in related]
    collections = [label_of(related[x]) for x in claim_ids(entity, "P195") if x in related]
    if not collections:
        collections = [label_of(related[x]) for x in claim_ids(entity, "P276") if x in related]
    status = set(claim_ids(entity, "P5816"))
    is_lost = bool(status & DESTROYED)
    collection = collections[0] if collections else "Unknown / private collection"
    if is_lost:
        collection = (
            "Lost or destroyed"
            if collection.startswith("Unknown")
            else f"{collection} (lost / destroyed)"
        )
    sitelinks = len(entity.get("sitelinks", {}))
    intro = wiki_extract(title) or desc_of(entity)
    painter_extract = wiki_extract(painter)
    photos = [commons_url(f, 800) for f in claim_files(creator, "P18")[:9]]
    return {
        "id": pid,
        "rank": 0,
        "sitelinks": sitelinks,
        "name": title,
        "image": commons_url(images[0], 1600),
        "imageFull": commons_url(images[0], None),
        "painter": painter,
        "painterId": cid,
        "painterBirthYear": claim_year(creator, "P569") if creator else "Unknown",
        "painterDeathYear": claim_year(creator, "P570") if creator else "Unknown",
        "painterCountry": " / ".join(countries[:2]) if countries else "Unknown",
        "placeOfCreation": places[0] if places else "Unknown",
        "collection": collection,
        "lostOrDestroyed": is_lost,
        "intro": intro
        or f"{title} is a celebrated work by {painter}.",
        "genre": ", ".join(genres[:3]) if genres else "Painting",
        "anecdote": anecdote(painter, painter_extract),
        "painterPhotos": photos,
    }


def main() -> None:
    data = json.loads(OUT.read_text(encoding="utf-8"))
    existing = {p["id"] for p in data["paintings"]}
    needed = [qid for qid in MUST_INCLUDE if qid not in existing]
    print(f"Already present: {len(MUST_INCLUDE) - len(needed)}; need: {len(needed)}")
    if not needed:
        print("Nothing to add")
        return

    paintings_ent = fetch_entities(needed)
    related_ids: set[str] = set()
    for ent in paintings_ent.values():
        if "missing" in ent:
            continue
        related_ids.update(claim_ids(ent, "P170"))
        related_ids.update(claim_ids(ent, "P136"))
        related_ids.update(claim_ids(ent, "P1071"))
        related_ids.update(claim_ids(ent, "P495"))
        related_ids.update(claim_ids(ent, "P195"))
        related_ids.update(claim_ids(ent, "P276"))
        related_ids.update(claim_ids(ent, "P5816"))
    related = fetch_entities(sorted(related_ids))
    country_ids: set[str] = set()
    for cid in list(related_ids):
        ent = related.get(cid)
        if ent and "missing" not in ent:
            country_ids.update(claim_ids(ent, "P27"))
    related.update(fetch_entities(sorted(country_ids)))

    added = []
    for qid in needed:
        entry = build_entry(qid, paintings_ent.get(qid, {"missing": ""}), related)
        if entry:
            added.append(entry)
            print(f"  + {entry['name']} ({qid}) sitelinks={entry['sitelinks']}")

    # Merge, keep highest sitelinks unique by name+painter, cap 1000 preferring higher sitelinks
    # but always keep must-include.
    merged = {p["id"]: p for p in data["paintings"]}
    for entry in added:
        merged[entry["id"]] = entry
    must = set(MUST_INCLUDE)
    paintings = sorted(merged.values(), key=lambda e: (e["id"] in must, e["sitelinks"]), reverse=True)
    # Ensure all must-include that exist stay, then fill to 1000 by sitelinks
    keep: list[dict] = []
    seen_keys: set[tuple[str, str]] = set()
    for p in paintings:
        if p["id"] in must:
            key = (p["name"].casefold(), p["painter"].casefold())
            if key in seen_keys:
                continue
            seen_keys.add(key)
            keep.append(p)
    for p in sorted(merged.values(), key=lambda e: e["sitelinks"], reverse=True):
        if len(keep) >= 1000:
            break
        if p["id"] in {x["id"] for x in keep}:
            continue
        key = (p["name"].casefold(), p["painter"].casefold())
        if key in seen_keys:
            continue
        seen_keys.add(key)
        keep.append(p)

    keep = sorted(keep, key=lambda e: e["sitelinks"], reverse=True)[:1000]
    for i, p in enumerate(keep, start=1):
        p["rank"] = i

    data["paintings"] = keep
    data["count"] = len(keep)
    data["generatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} count={data['count']} added={len(added)}")


if __name__ == "__main__":
    main()
