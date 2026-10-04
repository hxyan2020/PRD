# Vantage Market Intelligence

Daily desk website covering the world’s **top 50 banks**, **top 50 brokers**, and **top 50 crypto exchanges**.

Each scan watches:

1. New trading assets / instruments
2. New product or feature releases
3. Regulatory discussion and rule changes (US, Europe, UK, Singapore, Japan, Hong Kong, China, and other major jurisdictions)
4. Major risk detection, monitoring, and management tools (internal and external)

Every story shows a caption, key-point bullets, original sources, publish time, and a note on what the item can do to a multi-asset broker such as Vantage (product shelf, pricing, margin, onboarding, compliance). Thin alerts stay marked as background.

Each category lists the most impactful, relevant stories first. The daily briefing opens with a TLDR: three stories for each of banks, brokers, and crypto across listings, features, regulation, and risk tools. Click a line to open that news card.

## Daily window

- Ordinary days: last **24 hours**
- **Monday report**: since last Friday’s scan (or Friday 00:00 UTC if that scan is missing)

## Guest browse and collection

Visitors can read the desk as a guest. Collect, or opening Collection, prompts a login. After sign-in the pending story is saved and this browser stays signed in.

Desk account: `hxyan` / `VantageDesk26`

## Run it

```bash
cd vantage
npm install
npm run scan
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Permanent public site: [https://hxyan2020.github.io/PRD/desk/](https://hxyan2020.github.io/PRD/desk/)

Also: [https://hxyan2020.github.io/PRD/](https://hxyan2020.github.io/PRD/)

GitHub Pages serves the `gh-pages` branch at the `/PRD` project path. Nested routes (`/desk/`, `/regulation/`, …) load CSS/JS from `/PRD/_next/`.

Use the EN / 中文 control to switch the whole desk. Chrome, catalogs, story copy, and the Vantage impact note switch together.

- `/desk/` or `?` daily briefing
- `?category=listing` listings
- `?category=product` features
- `?view=regulation` regulatory slice
- `?view=risk-tools` tool catalog plus related news
- `?view=collection` saved stories (sign-in required)
- `?view=entities` monitored banks, brokers, exchanges
- `?view=sources` every feed, last sourced time, and health

`npm test` covers scan-window, ranking, collection, and classification rules.

## Automation

`.github/workflows/vantage-daily-scan.yml` runs `npm run scan` at 06:00 UTC and commits `data/latest.json` on the desk branch.

`.github/workflows/vantage-pages.yml` publishes `vantage/out` to `gh-pages` and keeps `trading-risk-ninja`.

## Ranking sources

See `data/catalog-meta.json`. Banks follow S&P Global Market Intelligence (April 2026). Exchanges follow CoinGecko trust-score rank (retrieved 16 Sep 2026). Brokers are compiled from 2025–2026 reported client assets and global platform scale.
