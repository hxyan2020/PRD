# Mille — One Thousand Paintings

A web gallery of the ~1000 most popular paintings in human history, ranked by Wikipedia/Wikidata sitelinks.

**Live URL:** https://hxyan2020.github.io/PRD/mille/

Each painting page includes:

1. High-resolution digital image (Wikimedia Commons)
2. Painting name
3. Painter name
4. Painter birth and death years
5. Place of creation
6. Current collection / display location (with lost/destroyed labeling)
7. Painter’s country
8. Introduction (creation background / artistic context)
9. Genre
10. Painter anecdote / life note
11. 1–9 painter portraits when available

Also included:

- Daily recommendation (`/today`) with fullscreen view, collect, and surprise-me
- Viewed / collected counters (localStorage)
- Preferences + Wikidata discovery to expand beyond the core 1000
- UI translations for major languages with flag language picker
- Mobile hamburger navigation

## Develop

```bash
npm install
npm run dev
```

## Refresh data

```bash
python3 scripts/fetch_paintings.py
python3 scripts/enrich_extracts.py
python3 scripts/supplement_must_include.py
```

Writes `public/data/paintings.json` from Wikidata + Wikipedia.

## Build & deploy

```bash
npm run build
npm run deploy:pages
```

Deploys to GitHub Pages at `/PRD/mille/`.
