# Vantage Market Intelligence

Daily desk website covering the world’s **top 50 banks**, **top 50 brokers**, and **top 50 crypto exchanges**.

Each scan watches:

1. New trading assets / instruments
2. New product or feature releases
3. Regulatory discussion and rule changes (US, Europe, UK, Singapore, Japan, Hong Kong, China, and other major jurisdictions), with sector and asset impact
4. Major risk detection, monitoring, and management tools (internal and external)

## Daily window

- Ordinary days: last **24 hours**
- **Monday report**: since last Friday’s scan (or Friday 00:00 UTC if that scan is missing)

Every story shows a caption, key-point bullets, original source links, and publish time.

## Run it

```bash
cd vantage
npm install
npm run scan
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Public site: [https://cdn.jsdelivr.net/gh/hxyan2020/PRD@gh-pages/](https://cdn.jsdelivr.net/gh/hxyan2020/PRD@gh-pages/)

- `/` daily briefing
- `/entities` monitored banks, brokers, exchanges
- `/regulation` regulatory slice plus impact notes
- `/risk-tools` tool catalog plus related news
- `/sources` every feed, last sourced time, and health

`npm test` covers scan-window and classification rules.

## Automation

`.github/workflows/vantage-daily-scan.yml` runs `npm run scan` at 06:00 UTC and commits `data/latest.json`.

## Ranking sources

See `data/catalog-meta.json`. Banks follow S&P Global Market Intelligence (April 2026). Exchanges follow CoinGecko trust-score rank (retrieved 16 Sep 2026). Brokers are compiled from 2025–2026 reported client assets and global platform scale.
