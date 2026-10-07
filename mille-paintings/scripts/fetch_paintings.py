#!/usr/bin/env python3
"""Fetch ~1000 most-linked paintings from Wikidata + Wikipedia extracts."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Line-buffer logs when piped to tee.
try:
    sys.stdout.reconfigure(line_buffering=True)  # type: ignore[attr-defined]
except Exception:  # noqa: BLE001
    pass

UA = "MillePaintings/1.0 (educational open gallery; contact: github.com/hxyan2020/prd)"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "paintings.json"
SPARQL = "https://query.wikidata.org/sparql"
WD_API = "https://www.wikidata.org/w/api.php"
WIKI_API = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/"

RANK_QUERY = """
SELECT ?painting ?sitelinks WHERE {
  ?painting wdt:P31 wd:Q3305213;
            wikibase:sitelinks ?sitelinks;
            wdt:P18 ?image;
            wdt:P170 ?creator.
  FILTER(?sitelinks >= 5)
}
ORDER BY DESC(?sitelinks)
LIMIT 1800
"""


def http_get(url: str, retries: int = 8) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    delay = 3.0
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last_err = exc
            # Wikidata SPARQL aggressively 429s during outages.
            wait = 70.0 if exc.code == 429 else delay
            print(f"  HTTP {exc.code} on attempt {attempt + 1}; sleeping {wait:.0f}s")
            time.sleep(wait)
            delay = min(delay * 2, 60)
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"  request error on attempt {attempt + 1}: {exc}; sleeping {delay:.0f}s")
            time.sleep(delay)
            delay = min(delay * 2, 60)
    raise RuntimeError(f"GET failed: {url}") from last_err


def sparql(query: str) -> list[dict]:
    params = urllib.parse.urlencode({"format": "json", "query": query})
    data = json.loads(http_get(f"{SPARQL}?{params}"))
    return data["results"]["bindings"]


def wd_api(params: dict) -> dict:
    url = f"{WD_API}?{urllib.parse.urlencode(params)}"
    return json.loads(http_get(url))


def val(row: dict, key: str, default: str = "") -> str:
    item = row.get(key)
    if not item:
        return default
    return str(item.get("value", default)).strip()


def year_of(time_str: str) -> str | None:
    if not time_str:
        return None
    m = re.match(r"^[+-]?(\d{1,4})", time_str.lstrip("+"))
    if not m:
        # Wikidata time like +1452-04-15T00:00:00Z
        m = re.search(r"([+-]?\d{1,4})-", time_str)
        if not m:
            return None
        return str(int(m.group(1)))
    return str(int(m.group(1)))


def commons_url(filename: str, width: int | None = 1600) -> str:
    if not filename:
        return ""
    name = filename.split("Special:FilePath/")[-1]
    name = urllib.parse.unquote(name)
    base = COMMONS + urllib.parse.quote(name)
    if width:
        return f"{base}?width={width}"
    return base


def qid(uri_or_id: str) -> str:
    return uri_or_id.rsplit("/", 1)[-1]


def claim_values(entity: dict, prop: str) -> list:
    out = []
    for claim in entity.get("claims", {}).get(prop, []):
        snak = claim.get("mainsnak", {})
        if snak.get("snaktype") != "value":
            continue
        out.append(snak.get("datavalue", {}).get("value"))
    return out


def claim_entity_ids(entity: dict, prop: str) -> list[str]:
    ids = []
    for value in claim_values(entity, prop):
        if isinstance(value, dict) and "id" in value:
            ids.append(value["id"])
    return ids


def claim_time_year(entity: dict, prop: str) -> str | None:
    for value in claim_values(entity, prop):
        if isinstance(value, dict) and "time" in value:
            y = year_of(value["time"])
            if y:
                return y
    return None


def claim_filename(entity: dict, prop: str = "P18") -> list[str]:
    names = []
    for value in claim_values(entity, prop):
        if isinstance(value, str):
            names.append(value)
    return names


def label_of(entity: dict, lang: str = "en") -> str:
    labels = entity.get("labels", {})
    if lang in labels:
        return labels[lang]["value"]
    if labels:
        return next(iter(labels.values()))["value"]
    return entity.get("id", "")


def desc_of(entity: dict, lang: str = "en") -> str:
    descs = entity.get("descriptions", {})
    if lang in descs:
        return descs[lang]["value"]
    return ""


def fetch_entities(ids: list[str]) -> dict[str, dict]:
    entities: dict[str, dict] = {}
    for i in range(0, len(ids), 40):
        batch = ids[i : i + 40]
        data = wd_api(
            {
                "action": "wbgetentities",
                "ids": "|".join(batch),
                "props": "labels|descriptions|claims",
                "languages": "en",
                "format": "json",
            }
        )
        entities.update(data.get("entities", {}))
        print(f"  entities {min(i + 40, len(ids))}/{len(ids)}")
        time.sleep(0.5)
    return entities


def fetch_wikipedia_extracts(titles: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for i in range(0, len(titles), 20):
        batch = titles[i : i + 20]
        params = {
            "action": "query",
            "format": "json",
            "prop": "extracts",
            "exintro": "1",
            "explaintext": "1",
            "redirects": "1",
            "titles": "|".join(batch),
        }
        url = f"{WIKI_API}?{urllib.parse.urlencode(params)}"
        try:
            data = json.loads(http_get(url))
        except Exception as exc:  # noqa: BLE001
            print(f"  wikipedia batch failed: {exc}")
            time.sleep(1)
            continue
        for page in data.get("query", {}).get("pages", {}).values():
            title = page.get("title")
            extract = (page.get("extract") or "").strip()
            if title and extract:
                if len(extract) > 900:
                    extract = extract[:897].rsplit(" ", 1)[0] + "…"
                out[title] = extract
        time.sleep(0.3)
    return out


def build_anecdote(painter: str, extract: str) -> str:
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


DESTROYED_IDS = {"Q56556915", "Q56644435", "Q208887", "Q106574501", "Q24354019"}


def main() -> None:
    print("Ranking popular paintings on Wikidata…")
    rank_rows = sparql(RANK_QUERY)
    ranked: list[tuple[str, int]] = []
    seen: set[str] = set()
    for row in rank_rows:
        pid = qid(val(row, "painting"))
        if pid in seen:
            continue
        seen.add(pid)
        ranked.append((pid, int(float(val(row, "sitelinks") or "0"))))
    ranked = ranked[:1300]
    print(f"Ranked unique paintings: {len(ranked)}")
    sitelink_map = dict(ranked)

    print("Hydrating painting entities…")
    painting_entities = fetch_entities([pid for pid, _ in ranked])

    creator_ids: set[str] = set()
    genre_ids: set[str] = set()
    place_ids: set[str] = set()
    collection_ids: set[str] = set()
    country_ids: set[str] = set()
    destroyed_ids: set[str] = set()

    for pid, entity in painting_entities.items():
        if "missing" in entity:
            continue
        creator_ids.update(claim_entity_ids(entity, "P170"))
        genre_ids.update(claim_entity_ids(entity, "P136"))
        place_ids.update(claim_entity_ids(entity, "P1071"))
        place_ids.update(claim_entity_ids(entity, "P495"))
        collection_ids.update(claim_entity_ids(entity, "P195"))
        collection_ids.update(claim_entity_ids(entity, "P276"))
        destroyed_ids.update(claim_entity_ids(entity, "P5816"))

    print("Hydrating related entities (creators, places, collections)…")
    related_ids = sorted(creator_ids | genre_ids | place_ids | collection_ids | destroyed_ids)
    related = fetch_entities(related_ids)

    for cid in creator_ids:
        ent = related.get(cid)
        if not ent or "missing" in ent:
            continue
        country_ids.update(claim_entity_ids(ent, "P27"))

    print("Hydrating country labels…")
    countries = fetch_entities(sorted(country_ids))
    related.update(countries)

    def name_of(eid: str) -> str:
        ent = related.get(eid) or painting_entities.get(eid)
        if not ent:
            return eid
        return label_of(ent)

    paintings: list[dict] = []
    for pid, sitelinks in ranked:
        entity = painting_entities.get(pid)
        if not entity or "missing" in entity:
            continue
        title = label_of(entity)
        if not title or (title.startswith("Q") and title[1:].isdigit()):
            continue

        images = claim_filename(entity, "P18")
        if not images:
            continue

        creators = claim_entity_ids(entity, "P170")
        if not creators:
            continue
        cid = creators[0]
        creator = related.get(cid, {})
        painter = label_of(creator) if creator else "Unknown"

        birth = claim_time_year(creator, "P569") if creator else None
        death = claim_time_year(creator, "P570") if creator else None
        ctries = [name_of(x) for x in claim_entity_ids(creator, "P27")] if creator else []
        painter_country = " / ".join(ctries[:2]) if ctries else "Unknown"

        genres = [name_of(x) for x in claim_entity_ids(entity, "P136")]
        places = [name_of(x) for x in claim_entity_ids(entity, "P1071")]
        if not places:
            places = [name_of(x) for x in claim_entity_ids(entity, "P495")]
        collections = [name_of(x) for x in claim_entity_ids(entity, "P195")]
        if not collections:
            collections = [name_of(x) for x in claim_entity_ids(entity, "P276")]

        status_ids = set(claim_entity_ids(entity, "P5816"))
        status_labels = [name_of(x).lower() for x in status_ids]
        is_lost = bool(status_ids & DESTROYED_IDS) or any(
            any(word in lab for word in ("destroyed", "lost", "missing", "demolished"))
            for lab in status_labels
        )

        collection = collections[0] if collections else "Unknown / private collection"
        if is_lost:
            collection = "Lost or destroyed" if collection.startswith("Unknown") else f"{collection} (lost / destroyed)"

        photos = [commons_url(f, width=800) for f in claim_filename(creator, "P18")[:9]] if creator else []

        paintings.append(
            {
                "id": pid,
                "rank": 0,
                "sitelinks": sitelink_map.get(pid, sitelinks),
                "name": title,
                "image": commons_url(images[0], width=1600),
                "imageFull": commons_url(images[0], width=None),
                "painter": painter,
                "painterId": cid,
                "painterBirthYear": birth or "Unknown",
                "painterDeathYear": death or "Unknown",
                "painterCountry": painter_country,
                "placeOfCreation": places[0] if places else "Unknown",
                "collection": collection,
                "lostOrDestroyed": is_lost,
                "intro": desc_of(entity),
                "genre": ", ".join(genres[:3]) if genres else "Painting",
                "anecdote": "",
                "painterPhotos": photos,
            }
        )

    # Deduplicate by name+painter
    unique: dict[tuple[str, str], dict] = {}
    for entry in paintings:
        key = (entry["name"].casefold(), entry["painter"].casefold())
        prev = unique.get(key)
        if not prev or entry["sitelinks"] > prev["sitelinks"]:
            unique[key] = entry

    paintings = sorted(unique.values(), key=lambda e: e["sitelinks"], reverse=True)[:1000]
    print(f"Selected paintings: {len(paintings)}")

    print("Fetching Wikipedia extracts…")
    painting_extracts = fetch_wikipedia_extracts([e["name"] for e in paintings])
    painter_extracts = fetch_wikipedia_extracts(sorted({e["painter"] for e in paintings}))

    for rank, e in enumerate(paintings, start=1):
        e["rank"] = rank
        extract = painting_extracts.get(e["name"], "")
        if extract:
            e["intro"] = extract
        elif e["intro"]:
            intro = e["intro"]
            e["intro"] = intro[0].upper() + intro[1:]
            if not e["intro"].endswith("."):
                e["intro"] += "."
        else:
            e["intro"] = (
                f"{e['name']} is a celebrated work by {e['painter']}. "
                f"Created in {e['placeOfCreation']}, it remains a touchstone of {e['genre'].lower()} "
                f"and is associated with {e['collection']}."
            )
        e["anecdote"] = build_anecdote(e["painter"], painter_extracts.get(e["painter"], ""))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": "Wikidata + Wikipedia (sitelinks popularity proxy)",
        "count": len(paintings),
        "paintings": paintings,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({len(paintings)} paintings)")


if __name__ == "__main__":
    main()
