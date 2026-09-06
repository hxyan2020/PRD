# PRD

This repository now includes **Canon**, a streaming archive of 1,000 historically influential recordings. Each work has a live Spotify link, official cover art, catalog credits, published play counts, and a shortlist note.

```bash
npm install --prefix canon
npm run dev --prefix canon
```

The original risk-workflow Python scripts remain at the repository root.

Canon’s permanent public site is **https://cdn.jsdelivr.net/gh/hxyan2020/PRD@cursor/canon-music-streaming-c956/docs/index.html**. Deploy specs also live in `canon/vercel.json`, `canon/Dockerfile`, and `.do/app.yaml`. HX bots poll `canon/public/hx/health.json`; page views go to HX viewership as slug `canon`.
