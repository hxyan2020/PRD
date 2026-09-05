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

## Tests

```bash
npm test
```
