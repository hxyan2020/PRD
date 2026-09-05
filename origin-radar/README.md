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
- Keyword heatmap: `/heatmap`
- Social desk: `/social`
- Regional gap matrix: `/markets`
- Scoring method: `/methodology`

## Stack

Next.js 15, TypeScript, Tailwind. Scoring is pure functions in `lib/scoring.ts` (Vitest). Catalog: `lib/catalog-data.ts`.
