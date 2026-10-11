# V Exchange Admin (MatchingManagement)

Frontend replica of the V Exchange / BitX broker admin (`MatchingManagement`) for local development and UI extension. Pages from shared screenshots are implemented with matching layout, filters, buttons, and seed data.

## Run locally

```bash
cd v-exchange-admin
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

## Stack

- React + TypeScript + Vite
- Ant Design 5

## Adding pages

When new screenshots arrive, add mock data under `src/mock/data.ts`, create a page under `src/pages/`, and register it in `src/components/PageRegistry.tsx` and `src/config/menu.tsx`.
