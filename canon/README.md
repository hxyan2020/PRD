# Canon

A streaming archive of **1,000 pieces of music** chosen for lasting influence across human history — not a single decade, language, chart, or industry.

Every entry has:

- a live Spotify track URL and in-app player
- official album artwork from Spotify
- composer, singer, band, writer, music company, year, country, and genre
- published Spotify play counts where the industry reports them
- a short note on why the work belongs in the canon
- a daily AI recommendation from mood, country, and genre (change those anytime; blank fields fall back to the most streamed titles)
- **Collect** to save a recording into your collection (stored in this browser), with the date you collected it
- **Surprise me** to hear a different work immediately, without waiting for tomorrow’s rotation
- header counts for the 1,000-song archive, unique titles viewed, and unique titles collected
- a dated log of every daily recommendation and Surprise me pick
- **Add to Spotify** after you authorize your Spotify account (saves to Liked Songs and a private Canon playlist album)
- UI in eight widely spoken languages (English, 中文, हिन्दी, Español, Français, العربية, বাংলা, Português). The switcher changes menus and buttons only — song titles and catalog notes stay as published.
- **Stream more** from mood, country, and genre beyond the 1,000-work canon (requires Spotify login; titles not in the archive play in the same player)
- **About** and **Terms of use** (`#about`, `#terms`) describing how the archive is chosen, what is stored in this browser, and how Spotify is used
- **HX bots** (`#hx-monitor`) and **HX viewership** (`#hx-viewership`): health JSON for HX bots monitoring, plus anonymous page views to the HX collector (`slug: canon`)

## Run

```bash
cd canon
npm install
npm run catalog   # rebuild public/catalog.json from Wikidata + Spotify + kworb
npm run dev
```

Open `http://localhost:5173`.

## Spotify authorization

Canon uses Spotify’s Authorization Code + PKCE flow. It never stores a client secret in the browser.

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
2. Add the redirect URI `http://localhost:5173/` (and your production origin with a trailing slash).
3. Paste the **Client ID** into Canon’s Connect Spotify form, or set `VITE_SPOTIFY_CLIENT_ID` in `canon/.env`.
4. Click **Connect Spotify** and approve access.
5. **Add to Spotify** on any recording saves it to Liked Songs and to a private playlist named **Canon** (your album of this archive). Official artist albums cannot be modified.

In Spotify’s development mode, only users you add to the app can sign in until the app is in extended quota.

## Ranking

Works are drawn from Wikidata items that already carry a Spotify track ID, ordered by the number of Wikipedia language editions (a proxy for worldwide cultural memory). Each ID is verified with Spotify’s public oEmbed endpoint before it enters the archive. Play counts are joined from [kworb.net](https://kworb.net/spotify/songs.html) artist and all-time stream tables.

## Public URL (Vercel)

From `canon/`:

```bash
npx vercel deploy --yes
# or, without a Vercel login:
npx vercel deploy --temporary --yes
```

`vercel.json` builds the Vite app and leaves `/hx/` and `/api/hx-viewership` out of the SPA fallback. Add the production origin (with a trailing slash) to your Spotify redirect URIs.

## DigitalOcean

App Platform spec: [`.do/app.yaml`](../.do/app.yaml) (Docker image from `canon/Dockerfile`, health check `/hx/health.json`).

```bash
doctl apps create --spec .do/app.yaml
```

On the HX droplet (`188.166.214.47`), serve the nginx image or the Vite `dist` folder as `canon` (same pattern as Cocktale at `/var/www/cocktale`). `nginx.conf` proxies `/api/hx-viewership` to the HX collector so HTTPS does not mix content.

## HX bots monitoring and HX viewership

- Bots poll [`/hx/health.json`](public/hx/health.json) and [`/hx/bots.json`](public/hx/bots.json).
- The app posts `{ slug: "canon", name: "Canon", path, host, referer }` to `/api/hx-viewership`, which forwards to HX viewership at `http://188.166.214.47:3520/collect`.
- Register a live host with `node scripts/register-hx.mjs https://your-canon-host`.

## Tests

```bash
npm test
```
