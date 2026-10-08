#!/usr/bin/env python3
"""
For each Ludus Atlas game, search YouTube for tutorial / how-to videos,
require at least MIN_CANDIDATES results, score by recency + popularity
(views + likes), and write the winner into public/data/tutorials.json.

Usage:
  python3 scripts/fetch-tutorials.py
  python3 scripts/fetch-tutorials.py --limit 20   # smoke test
  python3 scripts/fetch-tutorials.py --concurrency 8
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import math
import random
import re
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLLECTION = ROOT / "public" / "data" / "collection.json"
OUT = ROOT / "public" / "data" / "tutorials.json"
CACHE = ROOT / "scripts" / ".tutorial-cache.json"

MIN_CANDIDATES = 5
SEARCH_LIMIT = 10  # solicit more than 5 so filters still leave ≥5
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
CLIENT = {
    "clientName": "WEB",
    "clientVersion": "2.20240101.00.00",
    "hl": "en",
    "gl": "US",
}

_lock = threading.Lock()
_cache: dict = {}
_rate = threading.Semaphore(1)
_last_req = 0.0


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def throttle(min_interval: float = 0.05) -> None:
    global _last_req
    with _rate:
        now = time.monotonic()
        wait = min_interval - (now - _last_req)
        if wait > 0:
            time.sleep(wait)
        _last_req = time.monotonic()


def post_innertube(path: str, body: dict, retries: int = 4) -> dict:
    url = f"https://www.youtube.com/youtubei/v1/{path}?prettyPrint=false"
    data = json.dumps(body).encode("utf-8")
    last_err = None
    for attempt in range(retries):
        throttle()
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": UA,
                "Accept-Language": "en-US,en;q=0.9",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(0.6 * (attempt + 1) + random.random() * 0.4)
    raise RuntimeError(f"innertube {path} failed: {last_err}")


def parse_view_count(text: str | None) -> int:
    if not text:
        return 0
    s = text.lower().replace(",", "").replace(" views", "").replace(" view", "").strip()
    m = re.match(r"^([\d.]+)\s*([kmb])?$", s)
    if not m:
        digits = re.sub(r"[^\d]", "", text)
        return int(digits) if digits else 0
    n = float(m.group(1))
    mult = {None: 1, "k": 1_000, "m": 1_000_000, "b": 1_000_000_000}[m.group(2)]
    return int(n * mult)


def parse_relative_age_days(text: str | None) -> float:
    """Convert YouTube relative publish strings to approximate age in days."""
    if not text:
        return 3650.0  # unknown → treat as old
    t = text.strip().lower()
    if t in ("streamed", "premiere", "live"):
        return 30.0
    m = re.match(
        r"(?:streamed\s+)?(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago",
        t,
    )
    if not m:
        return 3650.0
    n = int(m.group(1))
    unit = m.group(2)
    return {
        "second": n / 86400,
        "minute": n / 1440,
        "hour": n / 24,
        "day": float(n),
        "week": n * 7.0,
        "month": n * 30.0,
        "year": n * 365.0,
    }[unit]


def parse_like_count_from_next(payload: dict) -> int | None:
    raw = json.dumps(payload)
    # "like this video along with 386,932 other people"
    m = re.search(
        r"like this video along with ([\d,]+) other people",
        raw,
        flags=re.I,
    )
    if m:
        return int(m.group(1).replace(",", ""))
    # factoid accessibilityText: "386 thousand likes"
    m = re.search(
        r'"accessibilityText":"([\d,.]+)\s*(thousand|million|billion)?\s*likes?"',
        raw,
        flags=re.I,
    )
    if m:
        n = float(m.group(1).replace(",", ""))
        unit = (m.group(2) or "").lower()
        mult = {"": 1, "thousand": 1_000, "million": 1_000_000, "billion": 1_000_000_000}[unit]
        return int(n * mult)
    m = re.search(r'"simpleText":"([\d.]+[KMB]?)"[^}]*"Likes"', raw)
    if m:
        return parse_view_count(m.group(1) + " views")  # reuse suffix parser
    return None


def walk_video_renderers(obj, out: list) -> None:
    if isinstance(obj, dict):
        if "videoRenderer" in obj:
            out.append(obj["videoRenderer"])
        for v in obj.values():
            walk_video_renderers(v, out)
    elif isinstance(obj, list):
        for v in obj:
            walk_video_renderers(v, out)


def search_videos(query: str, limit: int = SEARCH_LIMIT) -> list[dict]:
    cache_key = f"search::{query}::{limit}"
    with _lock:
        if cache_key in _cache:
            return list(_cache[cache_key])

    body = {"context": {"client": CLIENT}, "query": query}
    data = post_innertube("search", body)
    renderers: list = []
    walk_video_renderers(data, renderers)
    rows = []
    seen = set()
    for vr in renderers:
        vid = vr.get("videoId")
        if not vid or vid in seen:
            continue
        seen.add(vid)
        title_runs = (vr.get("title") or {}).get("runs") or []
        title = "".join(r.get("text", "") for r in title_runs) or (
            (vr.get("title") or {}).get("simpleText") or ""
        )
        views_text = (vr.get("viewCountText") or {}).get("simpleText")
        if not views_text:
            views_text = (
                ((vr.get("viewCountText") or {}).get("accessibility") or {})
                .get("accessibilityData", {})
                .get("label")
            )
        published = (vr.get("publishedTimeText") or {}).get("simpleText")
        channel_runs = ((vr.get("ownerText") or {}).get("runs")) or []
        channel = channel_runs[0].get("text") if channel_runs else ""
        length = (vr.get("lengthText") or {}).get("simpleText")
        rows.append(
            {
                "videoId": vid,
                "title": title,
                "viewCount": parse_view_count(views_text),
                "publishedText": published,
                "ageDays": parse_relative_age_days(published),
                "channelTitle": channel,
                "durationText": length,
                "url": f"https://www.youtube.com/watch?v={vid}",
            }
        )
        if len(rows) >= limit:
            break

    with _lock:
        _cache[cache_key] = list(rows)
    return rows


def fetch_likes(video_id: str) -> int | None:
    cache_key = f"likes::{video_id}"
    with _lock:
        if cache_key in _cache:
            return _cache[cache_key]
    try:
        data = post_innertube(
            "next",
            {"context": {"client": CLIENT}, "videoId": video_id},
        )
        likes = parse_like_count_from_next(data)
    except Exception:  # noqa: BLE001
        likes = None
    with _lock:
        _cache[cache_key] = likes
    return likes


TUTORIAL_RE = re.compile(
    r"\b(how\s*to(\s+play)?|tutorial|learn(\s+to\s+play)?|rules?|beginner|guide|"
    r"instruction|lesson|teach|explained|basics)\b",
    re.I,
)
PROCESS_RE = re.compile(
    r"\b(how\s+to\s+play|rules?\s+for\s+beginners?|complete\s+guide|"
    r"beginner('s)?\s+guide|learn\s+how\s+to\s+play|full\s+tutorial)\b",
    re.I,
)
NOISE_RE = re.compile(
    r"\b(unity|unreal|godot|blender|coding|programming|javascript|python|"
    r"react|c\+\+|game\s*dev|game\s*maker|roblox|minecraft|fortnite|"
    r"speedrun|asmr|music\s+video|trailer|ost|soundtrack|"
    r"pokemon|pokémon|tcg|cult of the lamb|disc golf|"
    r"drinking game|drunk|alcohol|beer pong|"
    r"gardening|vegetable|agriculture|farming|plant(ing)?\s+seeds|"
    r"sowing\s+seeds|seed\s+starting|start(ing)?\s+your\s+first\s+seeds|"
    r"first\s+seeds|grow(ing)?\s+(tomatoes|vegetables|flowers)|"
    r"nfl|fifa|premier league|flag football|"
    r"kinetic sand|dandy.?s?\s*world|dandysworld|squid game|boat race\s*\||"
    r"flames\s+game|etheria|wingspan|missouri star|quilt|"
    r"sink\s*n[’']?\s*sand|kokeshi\??\s*official how to play|"
    r"gotquestions|bible|biblical|casting lots\s*\?)\b",
    re.I,
)

# Ambiguous short titles → force distinctive search tokens
SEARCH_ALIASES = {
    "go": "Go Weiqi board game",
    "go (weiqi)": "Go Weiqi board game",
    "tag": "tag playground game how to play",
    "catch": "catch playground game",
    "memory": "memory matching card game",
    "war": "war card game",
    "snap": "snap card game",
    "race": "racing board game traditional",
    "yo-yo": "yo-yo tricks beginner tutorial",
    "poi": "poi spinning beginner tutorial maori",
    "dakon": "dakon congklak how to play",
    "palín": "palín mapuche juego tradicional chile",
    "hide-and-seek": "how to play hide and seek kids",
    "tea set toy": "children pretend tea party playset how to play",
    "kapu kuapu / jackstraws / spillikins": "how to play pick up sticks jackstraws mikado",
    "local pit-and-seed sowing": "how to play mancala board game rules oware",
    "infant rattle": "DIY baby rattle toy how to make",
    "animal pull toy": "wooden animal pull toy for toddlers",
    "clay or wood whistle toy": "how to make wooden whistle toy",
    "sewn cloth or hide ball": "how to play hacky sack footbag beginner",
    "local cloth doll": "how to make a rag doll traditional",
    "local festival kite": "how to fly a kite beginner tutorial",
    "local spinning top craft": "how to play wooden spinning top trompo",
    "local string figures": "cats cradle string figures how to",
    "folk race board (local)": "how to play ludo pachisi board game",
    "pocket skill stones": "how to play jacks knucklebones game",
    "story lots / casting sticks": "story dice cubes how to play storytelling",
    "shadow figures play": "hand shadow puppets tutorial for kids",
    "blind man's tag / call games": "how to play blind mans bluff kids party game",
    "elimination chant game": "eeny meeny miny moe counting out rhyme kids",
    "youth wrestling play": "olympic wrestling rules for beginners kids",
    "play stilts": "how to walk on stilts beginner tutorial",
    "leaf or bark boat race": "how to make paper boat kids race",
    "sand or snow figure play": "how to build a sandcastle step by step",
    "finger-flick football": "how to play paper football finger flick",
    "local riddle exchange": "fun riddles to ask kids back and forth",
    "festival noisemaker toy": "how to make maracas DIY kids instrument",
    "cord & knot puzzle toy": "string disentanglement puzzle how to solve",
    "miniature household play set": "dollhouse pretend play for kids",
    "toy bow or dart play set": "kids toy bow and arrow how to use safely",
    "frisbee / flying disc": "how to throw a frisbee beginner tutorial",
    "knucklebones": "how to play jacks knucklebones real game",
    "spinning top": "wooden spinning top how to spin tutorial",
    "building blocks": "wooden building blocks toddlers play ideas",
    "playing cards (french-suited deck)": "how to play simple card games beginners",
    "slinky": "how to make a slinky walk down stairs",
    "kokeshi": "what are kokeshi dolls japanese wooden doll",
    "buckingham palace toy soldiers aside: toy soldiers": (
        "tin toy soldiers miniature figures collecting play"
    ),
    "tug of war": "tug of war rules how to play kids",
    "jump-rope & skipping rhymes": "jump rope skipping rhymes kids playground",
}


def _norm_text(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[-_/]+", " ", s)
    s = re.sub(r"[^\w\s]+", " ", s, flags=re.UNICODE)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# Extra title tokens accepted as “mentions the game” when the catalog name
# is a generic archetype (so mancala videos can match “Local pit-and-seed…”).
RELATED_TITLE_TOKENS = {
    "local pit-and-seed sowing": [
        "mancala",
        "oware",
        "congkak",
        "congklak",
        "sungka",
        "bao",
        "gabata",
        "sowing game",
    ],
    "pocket skill stones": ["knucklebones", "jacks", "astragali", "gonggi"],
    "sewn cloth or hide ball": ["hacky", "footbag", "jianzi", "shuttlecock", "takraw"],
    "folk race board (local)": ["pachisi", "ludo", "snakes and ladders", "parcheesi"],
    "local string figures": ["string figure", "cat's cradle", "cats cradle", "ayatori"],
    "jump-rope & skipping rhymes": ["jump rope", "skipping rope", "skip rope"],
    "blind man's tag / call games": ["blind man", "blindmans", "blind man's bluff"],
    "shadow figures play": ["shadow puppet", "hand shadow", "wayang"],
    "finger-flick football": ["paper football", "finger football", "flick football"],
    "festival noisemaker toy": ["maracas", "rattle", "noisemaker"],
    "infant rattle": ["rattle", "baby toy"],
    "animal pull toy": ["pull toy", "pull-along"],
    "clay or wood whistle toy": ["whistle", "toy flute"],
    "local spinning top craft": ["spinning top", "spin top", "dreidel", "trompo"],
    "local festival kite": ["kite"],
    "local cloth doll": ["rag doll", "cloth doll", "corn husk"],
    "play stilts": ["stilts"],
    "leaf or bark boat race": ["paper boat", "leaf boat"],
    "sand or snow figure play": ["sandcastle", "sand castle", "snowman"],
    "story lots / casting sticks": [
        "story dice",
        "storytelling dice",
        " Rory's story cubes",
        "story cubes",
    ],
    "elimination chant game": ["eeny meeny", "elimination", "counting out"],
    "cord & knot puzzle toy": ["knot puzzle", "string puzzle", "tangled"],
    "miniature household play set": ["dollhouse", "doll house", "tea party", "tea set"],
    "toy bow or dart play set": ["toy bow", "bow and arrow", "toy dart"],
    "youth wrestling play": ["wrestling"],
    "local riddle exchange": ["riddle"],
    "knucklebones": ["knucklebones", "jacks", "astragali"],
    "kapu kuapu / jackstraws / spillikins": [
        "jackstraws",
        "pick up sticks",
        "pickup sticks",
        "mikado",
        "spillikins",
    ],
    "frisbee / flying disc": ["frisbee", "flying disc", "throw a disc"],
    "bilboquet / balero / kendama family": ["kendama", "balero", "bilboquet", "cup and ball"],
    "hanafuda / karuta": ["hanafuda", "koi-koi", "karuta"],
    "mesoamerican ballgame / ulama": ["ulama", "pok ta", "mesoamerican ball"],
    "alquerque / draughts family": ["alquerque", "draughts", "checkers"],
    "go bang / gomoku": ["gomoku", "five in a row", "renju"],
    "reversi / othello": ["othello", "reversi"],
    "jianzi (shuttlecock kicking)": ["jianzi", "shuttlecock"],
    "hacky sack / footbag": ["hacky", "footbag"],
    "tea set toy": ["tea set", "tea party"],
    # Never match bare "palin" (hits unrelated video-game characters).
    "palín": [
        "palín",
        "palin",
        "chueca",
        "mapuche",
    ],
    "building blocks": ["building blocks", "wooden blocks", "unit blocks"],
    "kokeshi": ["kokeshi doll", "kokeshi dolls", "wooden doll"],
    "poi": ["poi spinning", "poi spin", "fire poi", "poi beginner", "maori poi"],
}

# Titles that need an extra context word besides the bare name token.
AMBIGUOUS_CONTEXT = {
    "palín": ("mapuche", "chile", "chueca", "tradicional", "traditional", "hockey", "stick"),
    "palin": ("mapuche", "chile", "chueca", "tradicional", "traditional", "hockey", "stick"),
    "kokeshi": ("doll", "wooden", "japan", "japanese", "tohoku", "souvenir"),
}


def game_stems(game_name: str) -> list[str]:
    """Distinctive tokens that should appear in a relevant video title."""
    name = game_name or ""
    paren = re.findall(r"\(([^)]+)\)", name)
    stem = re.split(r"\s+[—–-]\s+", name)[0].strip()
    stem_noparen = re.sub(r"\s*\([^)]*\)\s*", " ", stem).strip()
    # Slash-separated alternate titles: "Kapu kuapu / Jackstraws / Spillikins"
    alts = [a.strip() for a in re.split(r"\s*/\s*", stem_noparen) if a.strip()]
    tokens = alts + paren
    extras = []
    for t in tokens:
        nt = _norm_text(t)
        if nt:
            extras.append(nt)
        for part in nt.split():
            if len(part) >= 3 or part in {"go", "yi", "om", "ot", "poi"}:
                extras.append(part)
    related = RELATED_TITLE_TOKENS.get(stem.lower())
    if related:
        extras.extend(_norm_text(r) for r in related)
    out = []
    seen = set()
    for t in extras:
        t = _norm_text(t).strip()
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return out


# Catalog filler words that must not alone prove title relevance.
GENERIC_STEM_WORDS = {
    "local",
    "folk",
    "play",
    "toy",
    "toys",
    "craft",
    "game",
    "games",
    "set",
    "figure",
    "figures",
    "cloth",
    "hide",
    "seed",
    "seeds",
    "sowing",
    "pit",
    "and",
    "or",
    "the",
    "race",
    "board",
    "skill",
    "stones",
    "lots",
    "casting",
    "sticks",
    "story",
    "exchange",
    "riddle",
    "festival",
    "noisemaker",
    "miniature",
    "household",
    "animal",
    "pull",
    "clay",
    "wood",
    "whistle",
    "sewn",
    "ball",
    "pocket",
    "youth",
    "wrestling",
    "elimination",
    "chant",
    "cord",
    "knot",
    "puzzle",
    "leaf",
    "bark",
    "boat",
    "sand",
    "snow",
    "finger",
    "flick",
    "football",
    "blind",
    "man",
    "mans",
    "tag",
    "call",
    "shadow",
    "infant",
    "jump",
    "rope",
    "skipping",
    "rhymes",
}


def title_mentions_game(title: str, game_name: str) -> bool:
    tl = _norm_text(title)
    stem = re.split(r"\s+[—–-]\s+", game_name or "")[0].strip()
    related = RELATED_TITLE_TOKENS.get(stem.lower()) or []
    related_norm = [_norm_text(r) for r in related if r]
    # For archetype / aliased titles, require a concrete related token so
    # "seed"/"sowing" cannot match gardening videos, etc.
    if related_norm:
        tl_compact = tl.replace(" ", "")
        hit = False
        matched = ""
        for s in related_norm:
            if len(s) < 3:
                continue
            if s in tl or (
                len(s.replace(" ", "")) >= 4 and s.replace(" ", "") in tl_compact
            ):
                hit = True
                matched = s
                break
        if not hit:
            return False
        # Ambiguous short names need a second context cue in the title.
        ctx = AMBIGUOUS_CONTEXT.get(matched) or AMBIGUOUS_CONTEXT.get(stem.lower())
        if ctx and not any(c in tl for c in ctx):
            return False
        return True

    stems = game_stems(game_name)
    if not stems:
        return False
    primary = stems[0]
    if len(primary) <= 3:
        if re.search(rf"\b{re.escape(primary)}\b", tl):
            if any(
                x in tl
                for x in (
                    "board",
                    "game",
                    "weiqi",
                    "baduk",
                    "igo",
                    "spin",
                    "trick",
                    "lesson",
                    "tutorial",
                    "beginner",
                    "maori",
                    "māori",
                    "mapuche",
                )
            ):
                return True
        return any(len(s) > 3 and s in tl for s in stems[1:])
    tl_compact = tl.replace(" ", "")
    for s in stems:
        if len(s) < 3 or s in GENERIC_STEM_WORDS:
            continue
        if s in tl:
            return True
        # Compact form: "yo yo" ↔ "yoyo", "jack straws" ↔ "jackstraws"
        sc = s.replace(" ", "")
        if len(sc) >= 4 and sc in tl_compact:
            return True
    return False


CRAFT_RE = re.compile(
    r"\b(how\s+to\s+make|diy|craft|fold|build|assemble|demonstration|"
    r"demo|history|origins?|explained)\b",
    re.I,
)


def looks_like_tutorial(title: str, game_name: str, *, soft: bool = False) -> bool:
    if not title or NOISE_RE.search(title):
        return False
    if not title_mentions_game(title, game_name):
        return False
    if PROCESS_RE.search(title) or TUTORIAL_RE.search(title):
        return True
    if soft and CRAFT_RE.search(title):
        return True
    return False


def search_query_for(game: dict) -> str:
    name = game.get("name") or ""
    stem = re.split(r"\s+[—–-]\s+", name)[0].strip()
    key = stem.lower()
    if key in SEARCH_ALIASES:
        # Aliases already include instructional phrasing — use as-is.
        return SEARCH_ALIASES[key]
    base = stem
    # Prefer first slash-alt when the catalog packs several names together.
    if "/" in base:
        base = base.split("/")[0].strip()
    category = (game.get("category") or "").lower()
    # Generic “Local …” matrix titles need a concrete toy/game keyword.
    if base.lower().startswith("local ") or base.lower().startswith("folk "):
        return f"{base} traditional children's game how to play"
    if any(
        x in category
        for x in ("doll", "construction", "musical", "spinning", "string")
    ):
        return f"{base} traditional toy how to make play tutorial"
    return f"{base} how to play tutorial rules"


def score_candidate(c: dict, game_name: str = "") -> float:
    """Higher is better: relevance first, then popularity + recency."""
    title = c.get("title") or ""
    views = max(0, int(c.get("viewCount") or 0))
    likes = c.get("likeCount")
    if likes is None:
        likes = 0
        likes_weight = 0.0
        views_weight = 0.35
        recency_weight = 0.25
        relevance_weight = 0.40
    else:
        likes = max(0, int(likes))
        likes_weight = 0.20
        views_weight = 0.25
        recency_weight = 0.20
        relevance_weight = 0.35

    view_score = min(1.0, math.log1p(views) / math.log1p(5_000_000))
    like_score = min(1.0, math.log1p(likes) / math.log1p(200_000))
    age = float(c.get("ageDays") or 3650)
    recency = 1.0 / (1.0 + age / 365.0)

    relevance = 0.15
    if title_mentions_game(title, game_name):
        relevance += 0.35
    if PROCESS_RE.search(title):
        relevance += 0.35
    elif TUTORIAL_RE.search(title):
        relevance += 0.20
    if NOISE_RE.search(title):
        relevance = 0.0
    relevance = min(1.0, relevance)

    return (
        relevance_weight * relevance
        + views_weight * view_score
        + likes_weight * like_score
        + recency_weight * recency
    )


def pick_tutorial(game: dict) -> dict | None:
    query = search_query_for(game)
    name = game.get("name") or ""
    # Regional matrix titles share a stem/query — reuse the same pick.
    pick_key = f"pickquery::{query.lower()}"
    with _lock:
        cached_pick = _cache.get(pick_key)
        if cached_pick is not None:
            return None if cached_pick == "__none__" else dict(cached_pick)

    queries = [
        query,
        f"{query} beginner",
        f"{query} explained",
        f"{query} demonstration",
    ]
    # Extra short-name / craft passes
    stem = re.split(r"\s+[—–-]\s+", name)[0].strip()
    if stem and stem.lower() not in query.lower():
        queries.append(f"{stem} how to play")
    queries.append(f"{stem} tutorial")

    by_id: dict[str, dict] = {}
    for q in queries:
        for row in search_videos(q, SEARCH_LIMIT):
            by_id.setdefault(row["videoId"], row)

    all_rows = list(by_id.values())
    filtered = [c for c in all_rows if looks_like_tutorial(c["title"], name)]

    if len(filtered) < MIN_CANDIDATES:
        soft = [
            c
            for c in all_rows
            if looks_like_tutorial(c["title"], name, soft=True)
        ]
        for c in soft:
            if c["videoId"] not in {x["videoId"] for x in filtered}:
                filtered.append(c)

    # Last resort: any non-noise title that clearly names the game (still need ≥5)
    if len(filtered) < MIN_CANDIDATES:
        named = [
            c
            for c in all_rows
            if title_mentions_game(c["title"], name)
            and not NOISE_RE.search(c["title"] or "")
        ]
        for c in named:
            if c["videoId"] not in {x["videoId"] for x in filtered}:
                filtered.append(c)

    # Rare cultural games may not yield 5 clean candidates; accept ≥1 strong
    # title match rather than leaving the entry blank.
    min_needed = MIN_CANDIDATES
    if len(filtered) < MIN_CANDIDATES:
        strong = [
            c
            for c in filtered
            if title_mentions_game(c.get("title") or "", name)
            and (PROCESS_RE.search(c.get("title") or "") or TUTORIAL_RE.search(c.get("title") or "") or CRAFT_RE.search(c.get("title") or ""))
        ]
        if strong:
            filtered = strong
            min_needed = 1
        else:
            with _lock:
                _cache[pick_key] = "__none__"
            return None

    def key(c: dict) -> float:
        return score_candidate(c, name)

    prelim = sorted(filtered, key=key, reverse=True)[: max(min_needed, 8)]
    for c in prelim:
        likes = fetch_likes(c["videoId"])
        if likes is not None:
            c["likeCount"] = likes

    ranked = sorted(prelim, key=key, reverse=True)
    considered = ranked[: max(min_needed, len(ranked))]
    winner = considered[0]
    result = {
        "videoId": winner["videoId"],
        "title": winner["title"],
        "url": winner["url"],
        "channelTitle": winner.get("channelTitle") or "",
        "publishedText": winner.get("publishedText"),
        "viewCount": winner.get("viewCount") or 0,
        "likeCount": winner.get("likeCount"),
        "score": round(key(winner), 4),
        "query": query,
        "candidatesConsidered": len(considered),
        "candidates": [
            {
                "videoId": c["videoId"],
                "title": c["title"],
                "viewCount": c.get("viewCount") or 0,
                "likeCount": c.get("likeCount"),
                "publishedText": c.get("publishedText"),
                "score": round(key(c), 4),
            }
            for c in considered[:MIN_CANDIDATES]
        ],
    }
    with _lock:
        _cache[pick_key] = dict(result)
    return result


def main() -> None:
    global _cache
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="Process only first N games (0=all)")
    ap.add_argument("--concurrency", type=int, default=6)
    ap.add_argument("--force", action="store_true", help="Re-fetch even if tutorial exists")
    ap.add_argument("--ids", type=str, default="", help="Comma-separated game ids")
    args = ap.parse_args()

    collection = load_json(COLLECTION, {"games": []})
    games = collection.get("games") or []
    _cache = load_json(CACHE, {})
    tutorials = load_json(OUT, {})
    if not isinstance(tutorials, dict):
        tutorials = {}

    if args.ids:
        want = {x.strip() for x in args.ids.split(",") if x.strip()}
        games = [g for g in games if g.get("id") in want]
    if args.limit and args.limit > 0:
        games = games[: args.limit]

    todo = []
    for g in games:
        gid = g["id"]
        if not args.force and gid in tutorials and tutorials[gid].get("videoId"):
            continue
        todo.append(g)

    # Deduplicate by search query so regional variants share one YouTube pick.
    by_query: dict[str, list] = {}
    for g in todo:
        by_query.setdefault(search_query_for(g), []).append(g)

    # Drop stale pickquery cache entries for queries we are about to re-resolve
    # so prior false positives (gardening-as-mancala, etc.) cannot win again.
    for query in by_query:
        _cache.pop(f"pickquery::{query.lower()}", None)

    print(
        f"games={len(games)} todo={len(todo)} unique_queries={len(by_query)} "
        f"concurrency={args.concurrency}",
        flush=True,
    )
    done = 0
    failed = 0
    query_items = list(by_query.items())

    def work(item):
        query, group = item
        try:
            picked = pick_tutorial(group[0])
            return query, group, picked, None
        except Exception as e:  # noqa: BLE001
            return query, group, None, str(e)

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futs = [ex.submit(work, item) for item in query_items]
        for fut in concurrent.futures.as_completed(futs):
            query, group, picked, err = fut.result()
            done += 1
            if err:
                failed += len(group)
                print(f"[{done}/{len(query_items)}] FAIL {query!r}: {err}", flush=True)
            elif picked:
                for g in group:
                    tutorials[g["id"]] = picked
                print(
                    f"[{done}/{len(query_items)}] OK ×{len(group)} {query!r} → "
                    f"{picked['videoId']} views={picked.get('viewCount')} "
                    f"likes={picked.get('likeCount')} age={picked.get('publishedText')}",
                    flush=True,
                )
            else:
                failed += len(group)
                print(
                    f"[{done}/{len(query_items)}] MISS ×{len(group)} {query!r} "
                    f"(<{MIN_CANDIDATES} candidates)",
                    flush=True,
                )

            if done % 10 == 0 or done == len(query_items):
                with _lock:
                    save_json(CACHE, _cache)
                save_json(OUT, tutorials)
                print(f"  checkpoint saved ({len(tutorials)} tutorials)", flush=True)

    with _lock:
        save_json(CACHE, _cache)
    # Strip bulky candidates list from public file to keep payload lean
    public = {}
    for gid, t in tutorials.items():
        if not t or not t.get("videoId"):
            continue
        public[gid] = {
            "videoId": t["videoId"],
            "title": t.get("title") or "",
            "url": t.get("url") or f"https://www.youtube.com/watch?v={t['videoId']}",
            "channelTitle": t.get("channelTitle") or "",
            "publishedText": t.get("publishedText"),
            "viewCount": t.get("viewCount") or 0,
            "likeCount": t.get("likeCount"),
            "candidatesConsidered": t.get("candidatesConsidered") or MIN_CANDIDATES,
            "query": t.get("query"),
        }
    save_json(OUT, public)
    print(
        f"done written={len(public)} failed_or_miss={failed} path={OUT}",
        flush=True,
    )


if __name__ == "__main__":
    main()
