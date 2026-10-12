#!/usr/bin/env python3
"""Fetch woody tree species from Catalogue of Life (ChecklistBank dataset 3LR).

Guidance: Wikipedia “List of tree genera” / GlobalTreeSearch-style woody families.
Writes scripts/data/col-tree-species.json and scripts/data/tree-seeds-col.json
for merge into generate-catalog.mjs.
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

UA = {
    "User-Agent": "SeenBrandAtlas/1.0 (educational catalog; https://github.com/hxyan2020/PRD)"
}
ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data"
OUT.mkdir(parents=True, exist_ok=True)

CORE_GENERA = [
    "Pinus", "Picea", "Abies", "Larix", "Cedrus", "Tsuga", "Pseudotsuga", "Cupressus",
    "Juniperus", "Thuja", "Chamaecyparis", "Sequoia", "Sequoiadendron", "Metasequoia",
    "Taxodium", "Cryptomeria", "Araucaria", "Agathis", "Podocarpus", "Taxus", "Ginkgo",
    "Sciadopitys", "Fitzroya", "Pilgerodendron", "Callitris", "Widdringtonia", "Austrocedrus",
    "Libocedrus", "Calocedrus", "Platycladus", "Quercus", "Fagus", "Castanea", "Castanopsis",
    "Lithocarpus", "Nothofagus", "Betula", "Alnus", "Carpinus", "Ostrya", "Corylus", "Juglans",
    "Carya", "Pterocarya", "Engelhardia", "Acer", "Aesculus", "Liquidambar", "Platanus", "Ulmus",
    "Zelkova", "Celtis", "Fraxinus", "Tilia", "Populus", "Salix", "Sorbus", "Malus", "Pyrus",
    "Prunus", "Crataegus", "Amelanchier", "Eriobotrya", "Photinia", "Rhus", "Pistacia", "Schinus",
    "Magnolia", "Liriodendron", "Michelia", "Drimys", "Laurelia", "Persea", "Ocotea", "Cinnamomum",
    "Laurus", "Umbellularia", "Sassafras", "Lindera", "Acacia", "Vachellia", "Senegalia", "Robinia",
    "Gleditsia", "Cercis", "Bauhinia", "Delonix", "Albizia", "Prosopis", "Parkia", "Dalbergia",
    "Pterocarpus", "Tipuana", "Erythrina", "Sophora", "Cladrastis", "Laburnum", "Maackia",
    "Castanospermum", "Intsia", "Eucalyptus", "Corymbia", "Angophora", "Melaleuca", "Syzygium",
    "Metrosideros", "Leptospermum", "Kunzea", "Syncarpia", "Lophostemon", "Tristaniopsis", "Ficus",
    "Artocarpus", "Morus", "Broussonetia", "Cecropia", "Dipterocarpus", "Shorea", "Hopea",
    "Dryobalanops", "Vatica", "Anisoptera", "Swietenia", "Cedrela", "Khaya", "Entandrophragma",
    "Toona", "Melia", "Azadirachta", "Tectona", "Gmelina", "Cordia", "Tabebuia", "Handroanthus",
    "Jacaranda", "Catalpa", "Spathodea", "Kigelia", "Adansonia", "Ceiba", "Bombax", "Ochroma",
    "Durio", "Theobroma", "Cola", "Sterculia", "Brachychiton", "Firmiana", "Pachira", "Diospyros",
    "Manilkara", "Pouteria", "Palaquium", "Vitellaria", "Sideroxylon", "Olea", "Paulownia",
    "Davidia", "Cornus", "Nyssa", "Stewartia", "Phoenix", "Washingtonia", "Cocos", "Elaeis",
    "Roystonea", "Borassus", "Areca", "Dypsis", "Trachycarpus", "Chamaerops", "Jubaea",
    "Livistona", "Sabal", "Serenoa", "Dracaena", "Cordyline", "Yucca", "Casuarina",
    "Allocasuarina", "Ailanthus", "Koelreuteria", "Sapindus", "Litchi", "Dimocarpus", "Blighia",
    "Cupania", "Hevea", "Aleurites", "Macaranga", "Mallotus", "Hura", "Hippomane", "Mangifera",
    "Anacardium", "Spondias", "Schinopsis", "Astronium", "Cotinus", "Carica", "Vasconcellea",
    "Morinda", "Cinchona", "Genipa", "Terminalia", "Combretum", "Laguncularia", "Conocarpus",
    "Rhizophora", "Avicennia", "Bruguiera", "Sonneratia", "Nypa", "Heritiera", "Xylocarpus",
    "Athrotaxis", "Cunninghamia", "Taiwania", "Glyptostrobus", "Keteleeria", "Cathaya",
    "Nothotsuga", "Hesperocyparis", "Garcinia", "Calophyllum", "Mammea", "Mesua", "Bertholletia",
    "Lecythis", "Couroupita", "Gustavia", "Roseodendron", "Sparattosperma", "Samanea",
    "Enterolobium", "Hymenaea", "Copaifera", "Prioria", "Baillonella", "Tieghemella", "Autranella",
    "Aucoumea", "Canarium", "Bursera", "Commiphora", "Boswellia", "Zanthoxylum", "Phellodendron",
    "Tetradium", "Melicope", "Flindersia", "Chorisia", "Cavanillesia", "Triplaris", "Coccoloba",
    "Guaiacum", "Bulnesia", "Porlieria", "Aspidosperma", "Alstonia", "Dyera",
]

DROP = {
    "Aloe", "Erica", "Ricinus", "Croton", "Rhododendron", "Daphne", "Buxus", "Kalmia",
    "Gardenia", "Euonymus", "Senna", "Cassia", "Camellia", "Thea", "Coffea", "Ilex",
    "Antigonon", "Pandani", "Pandanus", "Clusia", "Tabernaemontana",
}
BIG = {
    "Quercus", "Pinus", "Eucalyptus", "Ficus", "Syzygium", "Diospyros", "Magnolia", "Prunus",
    "Acer", "Podocarpus", "Ocotea", "Lithocarpus", "Melaleuca", "Terminalia", "Dalbergia",
    "Zanthoxylum", "Macaranga", "Cinnamomum", "Garcinia", "Hopea", "Dipterocarpus", "Vachellia",
    "Bauhinia", "Albizia", "Erythrina", "Persea", "Sorbus", "Crataegus", "Castanopsis",
    "Pouteria", "Palaquium", "Sterculia", "Combretum", "Calophyllum", "Bursera", "Commiphora",
    "Coccoloba", "Melicope", "Dypsis",
}
CONIFER = {
    "Pinus", "Picea", "Abies", "Larix", "Cedrus", "Tsuga", "Pseudotsuga", "Cupressus",
    "Juniperus", "Thuja", "Chamaecyparis", "Sequoia", "Sequoiadendron", "Metasequoia",
    "Taxodium", "Cryptomeria", "Araucaria", "Agathis", "Podocarpus", "Taxus", "Ginkgo",
    "Sciadopitys", "Fitzroya", "Callitris", "Widdringtonia", "Austrocedrus", "Libocedrus",
    "Calocedrus", "Platycladus", "Athrotaxis", "Cunninghamia", "Taiwania", "Glyptostrobus",
    "Pseudolarix", "Keteleeria", "Cathaya", "Nothotsuga", "Hesperocyparis", "Pilgerodendron",
}
PALM = {
    "Phoenix", "Washingtonia", "Cocos", "Elaeis", "Roystonea", "Borassus", "Areca", "Dypsis",
    "Trachycarpus", "Chamaerops", "Jubaea", "Livistona", "Sabal", "Serenoa", "Nypa",
}


def get_json(url: str, retries: int = 3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception:
            if i == retries - 1:
                raise
            time.sleep(1.5 * (i + 1))


def find_genus_id(name: str) -> str | None:
    url = "https://api.checklistbank.org/dataset/3LR/nameusage/search?" + urllib.parse.urlencode(
        {"q": name, "rank": "GENUS", "limit": 10, "status": "accepted"}
    )
    data = get_json(url)
    for r in data.get("result", []):
        if r.get("name") == name and r.get("id"):
            return r["id"]
    if data.get("result"):
        return data["result"][0].get("id")
    return None


def fetch_species(genus_id: str, genus: str):
    species = []
    offset = 0
    limit = 100
    while True:
        url = f"https://api.checklistbank.org/dataset/3LR/tree/{genus_id}/children?" + urllib.parse.urlencode(
            {"limit": limit, "offset": offset}
        )
        data = get_json(url)
        rows = data.get("result", [])
        for row in rows:
            if row.get("rank") != "species":
                continue
            if row.get("status") and row.get("status") != "accepted":
                continue
            latin = row.get("name")
            if not latin or " " not in latin or "×" in latin:
                continue
            species.append(latin)
        total = data.get("total", 0)
        offset += limit
        if offset >= total or not rows or len(species) > 800:
            break
    return genus, species


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def build_seeds(all_species: list[dict]) -> list[dict]:
    by = defaultdict(list)
    for s in all_species:
        g = s["genus"]
        if g in DROP:
            continue
        latin = s["latin"]
        parts = latin.split()
        if len(parts) != 2 or not parts[1].islower():
            continue
        by[g].append(latin)

    seeds = []
    seen = set()
    for g, names in sorted(by.items()):
        names = sorted(set(names))
        cap = 120 if g in BIG else 40
        for latin in names[:cap]:
            sid = slugify(latin)
            if sid in seen or len(sid) > 80:
                continue
            seen.add(sid)
            tag = "palm" if g in PALM else ("conifer" if g in CONIFER else "deciduous")
            seeds.append(
                {
                    "id": sid,
                    "name": latin,
                    "aliases": [g.lower()],
                    "tags": [tag, g.lower(), "col"],
                    "summary": f"{latin} — tree species (Catalogue of Life).",
                }
            )
    return seeds


def main() -> None:
    genera = []
    seen = set()
    for g in CORE_GENERA:
        if re.fullmatch(r"[A-Z][a-z]+", g) and g.lower() not in seen:
            seen.add(g.lower())
            genera.append(g)

    genus_ids = {}
    for i, g in enumerate(genera):
        try:
            gid = find_genus_id(g)
            if gid:
                genus_ids[g] = gid
        except Exception as e:
            print("resolve fail", g, e)
        if (i + 1) % 40 == 0:
            print(f"resolved {i + 1}/{len(genera)}")
        time.sleep(0.05)

    all_species = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {
            ex.submit(fetch_species, gid, g): g for g, gid in genus_ids.items()
        }
        for fut in as_completed(futs):
            g, result = fut.result()
            if isinstance(result, Exception):
                print("ERR", g, result)
                continue
            genus, species = g, result
            print(f"{genus}: {len(species)}")
            for latin in species:
                all_species.append({"genus": genus, "latin": latin})

    raw = {
        "source": "Catalogue of Life via ChecklistBank dataset 3LR",
        "guidance": "Woody/tree genera (Wikipedia List of tree genera / GlobalTreeSearch-style families)",
        "genusCount": len(genus_ids),
        "speciesCount": len(all_species),
        "species": all_species,
    }
    (OUT / "col-tree-species.json").write_text(json.dumps(raw, indent=1))
    seeds = build_seeds(all_species)
    (OUT / "tree-seeds-col.json").write_text(json.dumps(seeds, indent=1))
    print(f"Wrote {len(all_species)} raw / {len(seeds)} seed species")


if __name__ == "__main__":
    main()
