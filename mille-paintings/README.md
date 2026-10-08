# Mille — One Thousand Paintings

A web gallery of the ~1000 most popular paintings in human history, ranked by Wikipedia/Wikidata sitelinks.

**Live URL:** https://hxyan2020.github.io/PRD/mille/  
**Today’s pick:** https://hxyan2020.github.io/PRD/mille/#/today

Each painting page includes:

1. High-resolution digital image (Wikimedia Commons)
2. Painting name
3. Painter name
4. Painter birth and death years
5. Place of creation
6. Current collection / display location (with lost/destroyed labeling)
7. Painter’s country
8. Introduction (creation background / artistic context)
9. Genre
10. Painter anecdote / life note
11. 1–9 painter portraits when available

Also included:

- Daily recommendation (`/today`) with fullscreen view, collect, and surprise-me
- Email/password accounts (`/#/account`) that save collection, browse history, preferences, and discoveries per user
- Preferences + multi-source discovery to expand beyond the core 1000
- UI translations for major languages with flag language picker
- Mobile hamburger navigation

## Accounts

Sign up / sign in from **Account** in the nav. Library data is stored under your account in the browser (PBKDF2-hashed password).

Optional cross-device sync: copy `.env.example` to `.env`, set Supabase URL + anon key, create the `mille_user_library` table from the SQL comment in `src/lib/auth/cloud.ts`, then rebuild.

## Develop

```bash
npm install
npm run dev
```

## Refresh data

```bash
python3 scripts/fetch_paintings.py
python3 scripts/enrich_extracts.py
python3 scripts/supplement_must_include.py
```

Writes `public/data/paintings.json` from Wikidata + Wikipedia.

## Build & deploy

```bash
npm run build
npm run deploy:pages
```

Deploys to GitHub Pages at `/PRD/mille/`.
