# OriginRadar

Factory-direct dropshipping intelligence: recently popular items from **1688**, Pinduoduo, and Alibaba, scored against **Google search heat**, **TikTok / Xiaohongshu** chatter, and whether the SKU already exists in **North America, Southeast Asia, and Europe**.

If a product is missing in a region it is flagged as **whitespace**. If it exists, OriginRadar shows the **price gap (margin %)**, listing count, and supplier depth.

## Run

```bash
cd origin-radar
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Radar feed: `/`
- Daily review queue (Generate / Collect / Discard): `/queue`
- Keyword heatmap: `/heatmap`
- Social desk: `/social`
- Regional gap matrix: `/markets`
- **Storefront prep:** `/storefront` — Generate a listing from a recommendation; SQLite + Shopify CSV
- Scoring method: `/methodology`
- Health probe: `/api/health`
- HX monitor registry: `/api/hx`
- HX viewership: `GET/POST /api/hx/viewership`

## Deploy

**Vercel (radar UI).** In the Vercel project set Root Directory to `origin-radar`. SQLite is ephemeral on serverless — Generate / queue / storefront persist only for the life of an instance. Set `ORIGIN_RADAR_DB=/tmp/storefront.sqlite`. Claim a temporary deploy with `npx vercel deploy --temporary --yes` from `origin-radar/`.

**DigitalOcean (storefront + Generate).** App spec is `.do/app.yaml`. Connect the GitHub repo, or:

```bash
doctl apps create --spec .do/app.yaml
```

The web service uses `origin-radar/Dockerfile`, health-checks `/api/health`, and mounts 1 GiB at `/data` for SQLite.

**HX bots / viewership.** Import `origin-radar/hx-registry.json`. Bots should poll `/api/hx` (monitor list + public origin) and `/api/health` every 60s. Page views POST to `/api/hx/viewership`. This agent cannot register the service in your HX console without HX API credentials.

Set `ALIBABA_1688_APP_KEY`, `ALIBABA_1688_APP_SECRET`, and `ALIBABA_1688_ACCESS_TOKEN` to pull live 1688 offer data on Generate. Without keys, Generate still writes a complete factory listing pack (images downloaded, specs, terms, price tiers, recommended retail zone) to `data/storefront.sqlite`.

Each card shows a **price zone** (floor / recommended / ceiling) from factory unit + landed cost vs the target market, plus whether the mill does OEM, ships samples overseas, and accepts an overseas consignee.

SQLite needs a persistent disk. Prefer a DigitalOcean droplet/app with volume (`docker build` from this folder) over Vercel serverless for Generate. `vercel.json` is included if you only host the radar UI.

## Stack

Next.js 15, TypeScript, Tailwind. Scoring is pure functions in `lib/scoring.ts` (Vitest). Catalog: `lib/catalog-data.ts`.
