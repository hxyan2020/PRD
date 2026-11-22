# QuoteOps — CFD Broker Pricing Squad KB

Interactive RAG knowledge base + editable skill/knowledge CMS for CFD broker pricing / dealing / risk ops.

## Features

1. **RAG Desk** — retrieval over the live knowledge corpus
2. **Knowledge tree** — dynamic hierarchy of folders and pages
3. **Admin CMS** (admins only) — create / edit / delete / append / search / sort
4. **Rich content** — Markdown headings, lists, tables; image / video / file upload
5. **AI insert suggest** — recommends parent folder with before/after neighbors
6. **Lark / Feishu import** — paste doc URL (+ body for private docs) → knowledge node
7. **Agent Markdown** — expand + one-click copy on every knowledge page
8. **Bilingual publish** — fill missing ZH/EN on publish (mirror + review flag)
9. **Audit** — created/updated timestamps, operator, full revision log
10. **Pipeline / 86 risks / skills / data map** — seeded and editable as KB nodes
11. **Mobile-friendly** nav and reading prose

Principle: **Broker loss ≠ client abuse.**

## Develop

```bash
cd quote-ops
npm install
npm run dev
```

Open http://127.0.0.1:3020

**Access (temporary):** open collaboration is ON by default — anyone may query and edit knowledge (`QUOTEOPS_OPEN_ACCESS=1`). Set `QUOTEOPS_OPEN_ACCESS=0` to restore admin-gated writes (team `admin` role and/or `QUOTEOPS_ADMIN_EMAILS`).

## Deploy

**Cursor hosting (permanent URL):** use Publish from the agent chat / dashboard after confirming the proposal (`quote-ops` slug). Postgres is declared in `cursor-app.json`.

**Vercel (`*.vercel.app`):**

```bash
cd quote-ops
npx vercel --prod
```

Set project env: `DATABASE_URL` (Postgres), optional `QUOTEOPS_ADMIN_EMAILS`, optional `QUOTEOPS_OPEN_ACCESS=0` to lock writes. `vercel.json` targets region `sin1`. Without `DATABASE_URL`, the app falls back to ephemeral PGlite (not suitable for multi-instance prod).

## Scripts

- `npm run dev` — port 3020 (PGlite)
- `npm run build` — production build + migrate when `DATABASE_URL` set
- `npm test` / `npm run typecheck`
