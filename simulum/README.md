# Are We Simulated?

Worldwide catalogue of unique evidence people have posted that our universe is simulated.

## What it does

1. **Landing counter** — shows how many unique evidence claims are indexed, and counting
2. **Worldwide scan** — pulls multilingual Wikipedia search hits (and curated seeds) as candidates
3. **Deduplicate / merge** — compares each candidate to the existing catalogue; merges matches, inserts only new claims
4. **Multi-category** — one evidence item can appear in several categories

## Develop

```bash
cd simulum
npm install
npm run dev
```

Open http://127.0.0.1:3020

Local runs use in-memory PGlite (`DATABASE_URL` is unset). Production Cursor apps get Postgres via `cursor-app.json`.

## Scripts

- `npm run dev` — Next.js on port 3020
- `npm run build` — production build + migrate when `DATABASE_URL` is set
- `npm test` — fingerprint + catalogue merge tests
- `npm run scan` — CLI worldwide scan
- `npm run typecheck` — TypeScript

## Scan API

`POST /api/scan` with header `x-scan-secret: $SCAN_SECRET` when the secret is configured. Without a secret, the published app refuses public write triggers.

Daily scan: Vercel Cron hits `GET /api/cron/daily-scan` at `0 23 * * *` UTC (07:00 Asia/Singapore). Authorize with `CRON_SECRET` or `SCAN_SECRET`. Results appear on `/scan-log`.

## Deploy (Vercel)

Live production: **https://simulum.vercel.app**  
(also aliased as `https://simulum-hxyan2015-1529s-projects.vercel.app`)

```bash
cd simulum
npx vercel login
npx vercel deploy --prod --yes --project simulum --create-if-missing

# Or non-interactive:
export VERCEL_TOKEN=…   # never commit this
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN" --project simulum --create-if-missing
```

Set `SCAN_SECRET` / `CRON_SECRET` in the Vercel project so daily cron (`0 23 * * *` UTC) can call `/api/cron/daily-scan`.
