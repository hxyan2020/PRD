# LP Scanner

Vantage CFD liquidity-provider scanner: product ranking, LP research, editable knowledge base and repository. English + 简体中文.

## Develop

```bash
cd lp-scanner
npm install
npm run dev
```

Open http://127.0.0.1:3010

## Deploy (Vercel)

```bash
cd lp-scanner
# Permanent production URL (requires `vercel login` or VERCEL_TOKEN):
npx vercel@latest deploy --prod --yes

# Anonymous preview (temporary *.tmp.now; claim from the printed claim URL):
npx vercel@latest deploy --temporary --yes
```

`vercel.json` lives in this folder. Local `.vercel/` is gitignored (claim tokens / project link).

## Scripts

- `npm run dev` — local Next.js (PGlite, no `DATABASE_URL`)
- `npm run build` — production build + migrate when `DATABASE_URL` is set
- `npm test` — ranking unit tests
- `npm run typecheck` — TypeScript

## Features

1. Home — scan by product (e.g. XAUUSD) or LP name; sortable rankings; add new LPs
2. Knowledge Base — research profiles per LP; editable
3. Repository — Vantage-used vs candidate LPs; editable
4. Hover AI — select text → Ask AI chat
