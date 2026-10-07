# Mille — One Thousand Paintings

A web gallery of the ~1000 most popular paintings in human history, ranked by Wikipedia/Wikidata sitelinks.

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

## Develop

```bash
npm install
npm run dev
```

## Refresh data

```bash
python3 scripts/fetch_paintings.py
```

Writes `public/data/paintings.json` from Wikidata + Wikipedia.

## Build

```bash
npm run build
npm run preview
```
