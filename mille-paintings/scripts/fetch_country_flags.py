#!/usr/bin/env python3
"""Download modern + historical painter-country flags into public/flags/."""

from __future__ import annotations

import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "flags"
UA = "MillePaintings/1.0 (educational gallery; flag assets)"

# code -> either ISO alpha-2 for flagcdn, or Commons filename for historical
FLAGCDN = {
    "fr": "fr",
    "es": "es",
    "it": "it",
    "nl": "nl",
    "us": "us",
    "gb": "gb",
    "de": "de",
    "ru": "ru",
    "no": "no",
    "se": "se",
    "dk": "dk",
    "be": "be",
    "ch": "ch",
    "at": "at",
    "pl": "pl",
    "ua": "ua",
    "fi": "fi",
    "cn": "cn",
    "tr": "tr",
    "va": "va",
}

# Historical / regional flags from Wikimedia Commons (rendered to PNG via FilePath).
COMMONS = {
    "florence": "Flag of Florence.svg",
    "venice": "Flag of the Republic of Venice.svg",
    "dutch-republic": "Statenvlag.svg",
    "hre": "Banner of the Holy Roman Emperor with haloes (1400-1806).svg",
    "milan": "Flag of the Duchy of Milan.svg",
    "spanish-netherlands": "Flag of the Low Countries.svg",
    "burgundy": "Cross of Burgundy.svg",
    "papal-states": "Flag of the Papal States (1808-1870).svg",
    "castile": "Royal Banner of the Crown of Castile.svg",
    "aragon": "Flag of the Crown of Aragon.svg",
    "russian-empire": "Flag of the Russian Empire (black-yellow-white).svg",
    "habsburg": "Flag of the Habsburg Monarchy.svg",
    "prussia": "Flag of Prussia (1892-1918).svg",
    "ottoman": "Flag of the Ottoman Empire (1844–1922).svg",
    "qing": "Flag of China (1889–1912).svg",
    "pisa": "Flag of the Republic of Pisa.svg",
    "geneva": "Flag of the Canton of Geneva.svg",
    "krakow": "Flag of Kraków.svg",
    "bavaria": "Flag of Bavaria (lozengy).svg",
    "lorraine": "Flag of Lorraine.svg",
    "wurttemberg": "Flagge Königreich Württemberg.svg",
    "brabant": "Flag of Brabant.svg",
    "austria-hungary": "Flag of Austria-Hungary (1869-1918).svg",
    "german-empire": "Flag of the German Empire.svg",
    "two-sicilies": "Flag of the Kingdom of the Two Sicilies (1816).svg",
    "soviet": "Flag of the Soviet Union.svg",
    "ukraine-ssr": "Flag of the Ukrainian Soviet Socialist Republic (1949–1991).svg",
    "correggio": "Flag of Italy.svg",
    "kingdom-italy": "Flag of Italy (1861-1946).svg",
    "kingdom-france": "Royal Standard of the King of France.svg",
    "grand-duchy-finland": "Flag of Finland (state).svg",
    "tang": "Flag of China.svg",
    "yuan": "Flag of the Yuan Dynasty.svg",
}


def fetch(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            data = r.read()
        if len(data) < 200:
            print("too small", dest.name, len(data))
            return False
        dest.write_bytes(data)
        print("ok", dest.name, len(data))
        return True
    except Exception as e:
        print("fail", dest.name, e)
        return False


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for code, iso in FLAGCDN.items():
        dest = OUT / f"{code}.png"
        if dest.exists() and dest.stat().st_size > 200:
            print("skip", dest.name)
            continue
        url = f"https://flagcdn.com/w80/{iso}.png"
        fetch(url, dest)

    for code, filename in COMMONS.items():
        dest = OUT / f"{code}.png"
        if dest.exists() and dest.stat().st_size > 200:
            print("skip", dest.name)
            continue
        from urllib.parse import quote

        url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename)}?width=120"
        if not fetch(url, dest):
            # retry alternate names later manually if needed
            pass


if __name__ == "__main__":
    main()
