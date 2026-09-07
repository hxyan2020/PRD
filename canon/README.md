# Canon

A streaming archive of **1,000 pieces of music** chosen for lasting influence across human history — not a single decade, language, chart, or industry.

Every entry has:

- a live Spotify track URL and in-app player
- official album artwork from Spotify
- composer, singer, band, writer, music company, year, country, and genre
- published Spotify play counts where the industry reports them
- a short note on why the work belongs in the canon
- a daily recommendation on the homepage **For you**, with the album cover up front (blank **Preferences** fall back to the most streamed titles)
- **Preferences** in the menu (`#prefs`) to set mood, country, and genre
- **Collect** to save a recording into your collection (stored in this browser), with the date you collected it
- **Surprise me** to hear a different work immediately, without waiting for tomorrow’s rotation
- header counts for the 1,000-song archive, unique titles viewed, and unique titles collected
- a dated log of every daily recommendation and Surprise me pick
- **Play on Spotify** — clicking it opens the recording on Spotify. If an operator has set `VITE_SPOTIFY_CLIENT_ID`, the same click can also authorize your account and save the track to Liked Songs and a private Canon playlist. There is no client-ID form and no Spotify card on the homepage
- UI in eight widely spoken languages (English, 中文, हिन्दी, Español, Français, العربية, বাংলা, Português). Language lives in the top menu (on phones, next to the hamburger)
- A top **menu**: For you (home), Preferences, The 1,000 (`#archive` — the 1,000-work catalog), Collections, Recommendation log, and My profile (`#profile`). Phones use a hamburger icon. About and Terms of use sit in the footer
- **My profile** — optional local sign-in, sign-out, and password reset in this browser (no Canon account server; listening does not require an account)
- Anonymous page views go to HX viewership (`slug: canon`). Telegram **HX Bots Dashboard** polls `/hx/health.json` (not in-app tabs)

## Run

```bash
cd canon
npm install
npm run catalog   # rebuild public/catalog.json from Wikidata + Spotify + kworb
npm run dev
```

Open `http://localhost:5173`.

## Spotify authorization

Canon uses Spotify’s Authorization Code + PKCE flow. It never stores a client secret in the browser, and visitors never paste a client ID.

Operators set `VITE_SPOTIFY_CLIENT_ID` in `canon/.env` (and add redirect URIs in the [Spotify dashboard](https://developer.spotify.com/dashboard): `http://localhost:5173/` plus the production origin with a trailing slash). Rebuild so the client ID is baked in.

Visitors click **Play on Spotify**. That opens the track on Spotify. If `VITE_SPOTIFY_CLIENT_ID` is set, Canon can also ask Spotify for access and save the track to Liked Songs and to a private playlist named **Canon**. Official artist albums cannot be modified.

In Spotify’s development mode, only users you add to the app can sign in until the app is in extended quota.

## Ranking

Works are drawn from Wikidata items that already carry a Spotify track ID, ordered by the number of Wikipedia language editions (a proxy for worldwide cultural memory). Each ID is verified with Spotify’s public oEmbed endpoint before it enters the archive. Play counts are joined from [kworb.net](https://kworb.net/spotify/songs.html) artist and all-time stream tables.

## Public URL

Permanent public site (GitHack serves the committed `docs/` build as real HTML; it does not expire):

**https://raw.githack.com/hxyan2020/PRD/cursor/canon-music-streaming-c956/docs/index.html**

The built files live in `docs/`. jsDelivr cannot host this app because it sends HTML as `text/plain`. After merge, the same path on branch `main` also works. Add that URL (and `https://hxyan2020.github.io/PRD/` if you later enable GitHub Pages) to your Spotify redirect URIs.

GitHub Pages (`https://hxyan2020.github.io/PRD/`) is configured in `.github/workflows/pages.yml`. Turn it on once under repo **Settings → Pages → Source: GitHub Actions**.

Optional Vercel production needs a Vercel login:

```bash
cd canon
npx vercel --prod --yes
```

Do not use `vercel deploy --temporary` — those claim links expire in about an hour.

## DigitalOcean

App Platform spec: [`.do/app.yaml`](../.do/app.yaml) (Docker image from `canon/Dockerfile`, health check `/hx/health.json`).

```bash
doctl apps create --spec .do/app.yaml
```

On the HX droplet (`188.166.214.47`), serve the nginx image or the Vite `dist` folder as `canon` (same pattern as Cocktale at `/var/www/cocktale`). `nginx.conf` proxies `/api/hx-viewership` to the HX collector so HTTPS does not mix content.

## HX bots monitoring and HX viewership

Canon does not ship HX dashboards in the website chrome. Monitoring is the same Telegram + collector stack used by Cocktale, Quant Buffet, and the other droplet apps.

- **HX Bots Dashboard** (Telegram) polls [`/hx/health.json`](public/hx/health.json) and [`/hx/bots.json`](public/hx/bots.json). Live GitHack health: `https://raw.githack.com/hxyan2020/PRD/cursor/canon-music-streaming-c956/docs/hx/health.json`.
- **HX viewership** records anonymous `{ slug: "canon", name: "Canon", path, host, referer }` beacons. The app posts to `/api/hx-viewership`, which forwards to `http://188.166.214.47:3520/collect`. Detail: `http://188.166.214.47:3520/r/uiuehmwkYW7BIUAUiVo-fWbKOHL8BvWq/site/canon`.
- Register / refresh the collector with `node scripts/register-hx.mjs` (defaults to the GitHack origin). Canon is an external/GitHack host, so droplet nginx will not see it unless you also rsync `docs/` to `/var/www/canon` like Cocktale.

## Tests

```bash
npm test
```
