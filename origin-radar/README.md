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

Set `ALIBABA_1688_APP_KEY`, `ALIBABA_1688_APP_SECRET`, and `ALIBABA_1688_ACCESS_TOKEN` to pull live 1688 offer data on Generate. Without keys, Generate still writes a complete factory listing pack (images downloaded, specs, terms, price tiers, recommended retail zone) to `data/storefront.sqlite`.

Each card shows a **price zone** (floor / recommended / ceiling) from factory unit + landed cost vs the target market, plus whether the mill does OEM, ships samples overseas, and accepts an overseas consignee.

SQLite needs a persistent disk. Prefer a DigitalOcean droplet/app with volume (`docker build` from this folder) over Vercel serverless for Generate. `vercel.json` is included if you only host the radar UI.

## Stack

Next.js 15, TypeScript, Tailwind. Scoring is pure functions in `lib/scoring.ts` (Vitest). Catalog: `lib/catalog-data.ts`.
