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
- **Storefront prep:** `/storefront` — Generate a listing from a recommendation
- Scoring method: `/methodology`
- Health probe: `/api/health` (Node host only)
- HX monitor registry: `/api/hx` (Node host only)
- HX viewership: `GET/POST /api/hx/viewership` (Node host only)

## Public URL (static, no Vercel claim)

Anonymous Vercel `--temporary` deploys expire (the claim page shows “This deployment has expired.”). OriginRadar’s radar, queue, generate, and storefront also ship as a **static export** that does not depend on that claim flow.

```bash
cd origin-radar
npm run build:static   # writes ./out
```

On the static desk, Generate / Collect / Discard persist in **browser localStorage** (factory pack + remote gallery URLs). SQLite image download still requires a Node host.

For GitHub Pages (project site `https://hxyan2020.github.io/PRD/`), build with `BASE_PATH=/PRD`. Enable Pages in the repo Settings if it is not on yet — the Actions token cannot turn Pages on for this repository.

## Deploy

**DigitalOcean (SQLite Generate + HX probes).** App spec is `.do/app.yaml`. Connect the GitHub repo, or:

```bash
doctl apps create --spec .do/app.yaml
```

The web service uses `origin-radar/Dockerfile`, health-checks `/api/health`, and mounts 1 GiB at `/data` for SQLite.

**HX bots / viewership.** Import `origin-radar/hx-registry.json`. Bots should poll `/api/hx` and `/api/health` every 60s. Page views POST to `/api/hx/viewership`. This agent cannot register the service in your HX console without HX API credentials. The static public URL has no `/api/hx` routes.

Set `ALIBABA_1688_APP_KEY`, `ALIBABA_1688_APP_SECRET`, and `ALIBABA_1688_ACCESS_TOKEN` to pull live 1688 offer data on Generate (Node). Without keys, Generate still writes a complete factory listing pack.

Each card shows a **price zone** (floor / recommended / ceiling) from factory unit + landed cost vs the target market, plus whether the mill does OEM, ships samples overseas, and accepts an overseas consignee.

SQLite needs a persistent disk. Prefer DigitalOcean with a volume over Vercel serverless for Generate.

## Stack

Next.js 15, TypeScript, Tailwind. Scoring is pure functions in `lib/scoring.ts` (Vitest). Catalog: `lib/catalog-data.ts`. Static listing pack: `lib/listing-pack.ts`.
