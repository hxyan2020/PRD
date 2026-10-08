# Seen — Explore the world's diversity. Collect what you've seen.

Photograph or upload brands and living things. AI identifies them against a living catalogue. Confirm a match to lift greyscale covers and unlock colour entries.

## Categories

Cars · Cigarettes (18+) · Liquor · Wine · Sake · Beer · Coffee · Tea · Clothes · Luxury · Trees · Flowers · Animals & insects · Food

## Develop

```bash
cd brand-atlas
npm install
npm run dev
```

## Weekly refresh

```bash
npm run refresh
```

Scheduled via `.github/workflows/weekly-catalog-refresh.yml` (Mondays 06:00 UTC).

## Build

```bash
npm run build
npm run preview
```

Production base path: `/PRD/brand-atlas/` (GitHub Pages).
