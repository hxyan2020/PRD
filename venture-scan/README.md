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

