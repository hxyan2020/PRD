# V Exchange Admin (MatchingManagement)

React + Ant Design replica of the **MatchingManagement** broker admin shown in your reference screenshots. Pages use static mock data from those screens; additional menu routes show **Under Development** until more screenshots are provided.

## Run locally

```bash
cd v-exchange-admin
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

## Implemented pages (from screenshots)

- Overview, Contract List, Coin Introduce, KLine Manage, Trade Amount Factor Config, Admin Adl (一键平仓)
- Market Source (17 rows), Index Price, Fair Price, Index Market Link (empty), Funding Rate
- Position List (empty table + filters)

## Adding more screens

1. Add mock rows in `src/mock/data.ts` if needed.
2. Create or extend a page under `src/pages/`.
3. Wire the page in `src/pages/registry.tsx`.
