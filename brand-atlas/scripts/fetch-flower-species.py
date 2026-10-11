#!/usr/bin/env python3
"""Fetch flowering-plant species from Catalogue of Life (ChecklistBank dataset 3LR).

Guidance: major ornamental / wildflower genera (Wikipedia flowering-plant families,
parallel to the tree COL pipeline). Writes scripts/data/col-flower-species.json and
scripts/data/flower-seeds-col.json for merge into generate-catalog.mjs.
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

# Ornamental, wildflower, and iconic flowering genera
CORE_GENERA = [
    # Classics / garden
    "Rosa", "Tulipa", "Lilium", "Iris", "Narcissus", "Hyacinthus", "Muscari", "Crocus",
    "Galanthus", "Leucojum", "Fritillaria", "Allium", "Gladiolus", "Freesia", "Ixia",
    "Sparaxis", "Crocosmia", "Agapanthus", "Amaryllis", "Hippeastrum", "Clivia",
    "Alstroemeria", "Zinnia", "Dahlia", "Cosmos", "Tagetes", "Calendula", "Helianthus",
    "Rudbeckia", "Echinacea", "Coreopsis", "Gaillardia", "Aster", "Symphyotrichum",
    "Callistephus", "Chrysanthemum", "Leucanthemum", "Bellis", "Senecio", "Doronicum",
    "Gerbera", "Gazania", "Osteospermum", "Arctotis", "Dimorphotheca",
    # Roses / peonies / poppies
    "Paeonia", "Papaver", "Meconopsis", "Eschscholzia", "Argemone", "Sanguinaria",
    # Orchids
    "Orchis", "Ophrys", "Phalaenopsis", "Cattleya", "Dendrobium", "Cymbidium", "Vanda",
    "Oncidium", "Miltonia", "Odontoglossum", "Paphiopedilum", "Cypripedium", "Vanilla",
    "Epidendrum", "Brassia", "Zygopetalum", "Masdevallia", "Pleurothallis", "Bulbophyllum",
    "Angraecum", "Aerides", "Rhynchostylis", "Stanhopea", "Catasetum", "Gongora",
    # Lilies / irids / amaryllids more
    "Hemerocallis", "Hosta", "Kniphofia", "Aloe", "Haworthia", "Gasteria", "Tulbaghia",
    "Scilla", "Hyacinthoides", "Ornithogalum", "Triteleia", "Brodiaea", "Dichelostemma",
    # Primroses / gentians
    "Primula", "Cyclamen", "Soldanella", "Dodecatheon", "Gentiana", "Gentianella",
    "Exacum", "Lisianthus", "Eustoma",
    # Violas / pansies
    "Viola", "Hybanthus",
    # Carnations / pinks
    "Dianthus", "Silene", "Lychnis", "Gypsophila", "Saponaria", "Cerastium",
    # Campanulas
    "Campanula", "Lobelia", "Platycodon", "Codonopsis", "Trachelium",
    # Foxgloves / snapdragons / penstemons
    "Digitalis", "Antirrhinum", "Penstemon", "Linaria", "Verbascum", "Scrophularia",
    "Mimulus", "Erythranthe", "Collinsia", "Castilleja",
    # Mints / salvias
    "Salvia", "Lavandula", "Mentha", "Monarda", "Nepeta", "Agastache", "Ocimum",
    "Rosmarinus", "Thymus", "Origanum", "Satureja", "Plectranthus", "Coleus",
    # Hibiscus / mallows
    "Hibiscus", "Alcea", "Malva", "Lavatera", "Abutilon", "Sidalcea", "Callirhoe",
    # Begonias / impatiens
    "Begonia", "Impatiens", "Hydrocera",
    # Fuchsias / evening primrose
    "Fuchsia", "Oenothera", "Clarkia", "Godetia", "Epilobium", "Chamerion",
    # Pea flowers (ornamental)
    "Lathyrus", "Lupinus", "Wisteria", "Clitoria", "Phaseolus", "Sweetpea",
    "Baptisia", "Thermopsis", "Coronilla", "Hedysarum", "Astragalus",
    # Morning glories / vines
    "Ipomoea", "Convolvulus", "Calystegia", "Petunia", "Nicotiana", "Browallia",
    "Datura", "Brugmansia", "Solanum", "Capsicum", "Physalis", "Schizanthus",
    # Geraniums
    "Geranium", "Pelargonium", "Erodium",
    # Hydrangeas / philadelphus
    "Hydrangea", "Philadelphus", "Deutzia", "Kolkwitzia", "Weigela", "Abelia",
    # Rhododendron / azalea / heather
    "Rhododendron", "Kalmia", "Pieris", "Erica", "Calluna", "Daboecia", "Vaccinium",
    "Gaultheria", "Arbutus", "Enkianthus",
    # Camellias / gardenias
    "Camellia", "Gardenia", "Ixora", "Pentas", "Mussaenda", "Bouvardia", "Luculia",
    # Proteas / banksias / waratah
    "Protea", "Leucadendron", "Leucospermum", "Banksia", "Grevillea", "Telopea",
    "Waratah", "Macadamia", "Hakea", "Isopogon", "Dryandra",
    # Magnolias / flowering trees used as flowers
    "Magnolia", "Michelia", "Liriodendron", "Cornus", "Cercis", "Malus", "Prunus",
    "Amelanchier", "Crataegus", "Sorbus", "Chaenomeles", "Forsythia", "Syringa",
    "Jasminum", "Osmanthus", "Ligustrum", "Chionanthus",
    # Passionflower / bougainvillea
    "Passiflora", "Bougainvillea", "Thunbergia", "Mandevilla", "Allamanda",
    "Plumeria", "Adenium", "Nerium", "Catharanthus", "Vinca", "Apocynum",
    # Water / wetland
    "Nymphaea", "Nuphar", "Nelumbo", "Victoria", "Iris", "Caltha", "Trollius",
    "Ranunculus", "Anemone", "Hepatica", "Pulsatilla", "Clematis", "Aquilegia",
    "Delphinium", "Aconitum", "Helleborus", "Eranthis", "Nigella",
    # Succulent blooms
    "Echeveria", "Sedum", "Sempervivum", "Crassula", "Kalanchoe", "Aeonium",
    "Opuntia", "Mammillaria", "Echinopsis", "Rebutia", "Schlumbergera", "Epiphyllum",
    "Disocactus", "Rhipsalis", "Agave", "Yucca", "Hesperaloe", "Beschorneria",
    # Tropical gingers / heliconias / birds of paradise
    "Heliconia", "Strelitzia", "Musa", "Zingiber", "Alpinia", "Curcuma", "Hedychium",
    "Etlingera", "Costus", "Canna", "Maranta", "Calathea", "Stromanthe",
    # Bromeliads
    "Bromelia", "Aechmea", "Guzmania", "Vriesea", "Tillandsia", "Neoregelia",
    "Ananas", "Billbergia", "Cryptanthus",
    # Daisies / composites more
    "Centaurea", "Cirsium", "Carduus", "Echinops", "Artemisia", "Achillea", "Tanacetum",
    "Anthemis", "Matricaria", "Tripleurospermum", "Inula", "Pulicaria", "Solidago",
    "Erigeron", "Conyza", "Baccharis", "Eupatorium", "Ageratum", "Liatris", "Vernonia",
    "Cichorium", "Taraxacum", "Hieracium", "Pilosella", "Lactuca", "Sonchus",
    # Umbels / carrots family ornamentals
    "Daucus", "Ammi", "Anthriscus", "Myrrhis", "Astrantia", "Eryngium", "Heracleum",
    "Angelica", "Ferula", "Foeniculum", "Anethum", "Coriandrum", "Petroselinum",
    # Mustards / wallflowers
    "Erysimum", "Matthiola", "Lobularia", "Iberis", "Aubrieta", "Arabis", "Brassica",
    "Lunaria", "Hesperis", "Cheiranthus",
    # Poppy relatives / fumitories
    "Dicentra", "Lamprocapnos", "Corydalis", "Fumaria",
    # Lilacs already; add more shrubs with showy flowers
    "Buddleja", "Ceanothus", "Hibbertia", "Hypericum", "Cistus", "Halimium",
    "Helianthemum", "Fremontodendron", "Carpenteria", "Philadelphus",
    # Tropical icons
    "Hibiscus", "Spathodea", "Tabebuia", "Jacaranda", "Delonix", "Cassia", "Senna",
    "Bauhinia", "Poinciana", "Lagerstroemia", "Tibouchina", "Melastoma", "Miconia",
    "Clerodendrum", "Holmskioldia", "Petrea", "Duranta", "Lantana", "Verbena",
    "Glandularia", "Phlox", "Polemonium", "Ipomopsis", "Gilia",
    # Bluebells / forget-me-nots
    "Myosotis", "Brunnera", "Anchusa", "Echium", "Borago", "Symphytum", "Pulmonaria",
    "Mertensia", "Lithodora", "Heliotropium",
    # Pea-family ornamentals more
    "Cytisus", "Genista", "Spartium", "Ulex", "Laburnum", "Caragana", "Indigofera",
    # Protea relatives already; add waratah synonym handled
    "Embothrium", "Stenocarpus", "Lambertia",
    # Australian natives
    "Acacia", "Chamelaucium", "Verticordia", "Darwinia", "Kunzea", "Callistemon",
    "Melaleuca", "Leptospermum", "Thryptomene", "Calytrix", "Homoranthus",
    # South African bulbs / flowers
    "Watsonia", "Babiana", "Tritonia", "Lachenalia", "Veltheimia", "Eucomis",
    "Nerine", "Cyrtanthus", "Brunsvigia", "Haemanthus", "Scadoxus", "Clivia",
    # Asian icons
    "Nelumbo", "Chrysanthemum", "Camellia", "Paeonia", "Wisteria", "Prunus",
    "Kerria", "Exochorda", "Spiraea", "Physocarpus", "Neillia", "Stephanandra",
]

DROP = {
    # Mostly trees / woody without showy flower focus already covered elsewhere,
    # keep flowering shrubs; drop ultra-huge weedy/cryptic groups if needed later.
}
BIG = {
    "Rosa", "Rhododendron", "Begonia", "Salvia", "Dendrobium", "Bulbophyllum",
    "Masdevallia", "Pleurothallis", "Epidendrum", "Oncidium", "Cattleya", "Iris",
    "Allium", "Primula", "Campanula", "Geranium", "Pelargonium", "Impatiens",
    "Fuchsia", "Petunia", "Solanum", "Ipomoea", "Passiflora", "Hibiscus",
    "Dahlia", "Aster", "Senecio", "Eupatorium", "Solidago", "Erigeron",
    "Aquilegia", "Delphinium", "Clematis", "Anemone", "Ranunculus", "Papaver",
    "Dianthus", "Silene", "Viola", "Penstemon", "Digitalis", "Lobelia",
    "Magnolia", "Prunus", "Malus", "Crataegus", "Sorbus", "Acacia", "Banksia",
    "Grevillea", "Melaleuca", "Callistemon", "Leptospermum", "Tillandsia",
    "Aechmea", "Opuntia", "Mammillaria", "Echinopsis", "Sedum", "Kalanchoe",
    "Heliconia", "Alpinia", "Curcuma", "Calathea", "Canna", "Zingiber",
    "Phalaenopsis", "Cymbidium", "Paphiopedilum", "Vanda", "Angraecum",
    "Lilium", "Tulipa", "Narcissus", "Gladiolus", "Hemerocallis", "Hosta",
    "Lavandula", "Mentha", "Thymus", "Origanum", "Coleus", "Plectranthus",
    "Camellia", "Gardenia", "Ixora", "Lantana", "Verbena", "Phlox",
    "Bougainvillea", "Plumeria", "Nerium", "Catharanthus", "Nymphaea",
    "Astragalus", "Lupinus", "Lathyrus", "Cassia", "Senna", "Bauhinia",
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
        cap = 100 if g in BIG else 35
        for latin in names[:cap]:
            sid = slugify(latin)
            if sid in seen or len(sid) > 80:
                continue
            seen.add(sid)
            seeds.append(
                {
                    "id": sid,
                    "name": latin,
                    "aliases": [g.lower()],
                    "tags": ["flower", g.lower(), "col"],
                    "summary": f"{latin} — flowering plant species (Catalogue of Life).",
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

    print(f"Genera to fetch: {len(genera)}")
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

    print(f"Resolved {len(genus_ids)}/{len(genera)}")
    all_species = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(fetch_species, gid, g): g for g, gid in genus_ids.items()}
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
        "guidance": "Major ornamental/wildflower genera (parallel to tree COL expansion)",
        "genusCount": len(genus_ids),
        "speciesCount": len(all_species),
        "species": all_species,
    }
    (OUT / "col-flower-species.json").write_text(json.dumps(raw, indent=1))
    seeds = build_seeds(all_species)
    (OUT / "flower-seeds-col.json").write_text(json.dumps(seeds, indent=1))
    print(f"Wrote {len(all_species)} raw / {len(seeds)} seed species")


if __name__ == "__main__":
    main()
