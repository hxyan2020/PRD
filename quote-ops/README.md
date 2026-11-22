# QuoteOps — CFD Broker Pricing Squad KB

Interactive RAG knowledge base and skill library for CFD broker pricing / dealing / risk ops (Vantage-class multi-asset CFD).

## Features

1. **RAG Desk** — local retrieval over principles, 86 risk scenarios, LP→PE→MT pipeline, DB map, and RCA skills
2. **Pipeline** — interactive LP → Ingest → PE → Fan-out → MT → Hedge → Observe flow
3. **Risk catalog** — 86 scenarios with H/T/A/M, F/P, detect & prevent filters
4. **Skill library** — checklist playbooks with placeholder SQL and case creation
5. **Data architecture** — systems, key tables, access hosts as `*.placeholder.internal`
6. **Investigation cases** — persisted via PGlite locally / Postgres when `DATABASE_URL` is set

Principle: **Broker loss ≠ client abuse.**

## Develop

```bash
cd quote-ops
npm install
npm run dev
```

Open http://127.0.0.1:3020

## Scripts

- `npm run dev` — Next.js on port 3020 (PGlite, `DATABASE_URL` unset)
- `npm run build` — production build + migrate when `DATABASE_URL` set
- `npm test` — corpus + RAG unit tests
- `npm run typecheck` — TypeScript

## Notes

- Unknown production hosts/ports are placeholders — replace from Vantage inventory; never commit secrets.
- RAG is on-device lexical retrieval over the shipped corpus (no external LLM required for answers).
