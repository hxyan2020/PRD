# Ludus Atlas Admin

Authenticated backend for editing catalog games (text, photos, YouTube tutorials), locale overlays, and publishing to GitHub Pages with all supported languages rebuilt.

## Start

```bash
cd atlas
npm run admin
# → http://localhost:8787
```

Credentials are loaded from `admin-server/.credentials.json` (gitignored) or:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## Publish

The **Publish all languages** button:

1. Saves current `collection.json` / `tutorials.json`
2. Regenerates `content-i18n.json` from locale packs
3. Commits data changes on the current git branch
4. Deploys Pages with `SKIP_DATA_REGEN=1` so generator scripts do not overwrite admin edits
