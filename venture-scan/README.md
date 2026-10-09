# VentureScan

Worldwide startup ideas and fundraising ledger.

Scans curated startup + fundraising signals into SQLite and shows each entry with:

1. Idea name  
2. Full description (what it does, how it makes money)  
3. Team location (country)  
4. Team size  
5. Industry  
6. Sector  
7. Whether fundraising is secured  
8. Official website  
9. Official social accounts (X, Instagram, Xiaohongshu, etc.)  
10. Suggested go-forward play (localize, new age group, partner founders, franchise, …)

## Match chatbot

Visit `/match` to chat through skills, major, current business, interested domains, and preferred markets. The profile is saved in the browser and scored against every idea via `POST /api/match`.

## Daily recommendation

Visit `/today` for the most-matched idea of the day. Each pick lists matched dimensions, gaps, and a concrete action to close every gap (`POST /api/daily`).

## Auth + collection

Register / log in with email and password (`/register`, `/login`). Collect ideas and their matching analysis into `/collection` via `POST /api/collection`.

## Languages

UI chrome is available in 18 major languages via the header language picker (national flag icons). Choice is saved in localStorage; Arabic uses RTL.

## Mobile

Sticky header with hamburger menu under `md`, full-width CTAs, larger tap targets, safe-area padding, and a single-column match/chat layout on small screens.

## Permanent URL

**https://hxyan2020.github.io/PRD/venture-scan/**

```bash
cd venture-scan
npm run deploy:pages
```

See `PUBLIC_URL.md`. Static export embeds the catalog; matching / auth / collections run in-browser on the public site.

## Run locally

```bash
cd venture-scan
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run scan
```

## Stack

- Next.js 15 + React 19  
- SQLite via `node:sqlite`  
- Tailwind CSS  

