# Ludus Atlas

A catalog website of toys and games from civilizations across human history.

## Features

- **1000+ catalog entries** spanning board games, mancala families, dolls, tops, outdoor folk play, musical toys, and more
- **Variations, not duplicates** — culturally equivalent forms (e.g. Oware / Bao / Congkak) nest under one fundamental game
- Each entry includes name, origin, rough creation year, 1–9 images, description, step-by-step how-to-play, multi-platform purchase links, requirements, and ideal participants

## Develop

```bash
npm install
npm run data    # regenerate public/data/collection.json
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Permanent public link

**https://hxyan2020.github.io/PRD/ludus-atlas/**

Use that full path. The repo root `https://hxyan2020.github.io/PRD/` hosts **MatchingManagement** (a different product). Opening `/PRD/` or `/PRD/overview` is not Ludus Atlas.

Publish an update to GitHub Pages (writes only the `ludus-atlas/` folder on `gh-pages`, leaving sibling apps intact):

```bash
npm run deploy:pages:keep-data   # keep current collection.json
# or
npm run deploy:pages             # regenerate data then deploy
```

## Build

```bash
npm run build
npm run preview
```
