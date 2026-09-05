# Canon

A streaming archive of **1,000 pieces of music** chosen for lasting influence across human history — not a single decade, language, chart, or industry.

Every entry has:

- a live Spotify track URL and in-app player
- official album artwork from Spotify
- composer, singer, band, writer, music company, year, country, and genre
- published Spotify play counts where the industry reports them
- a short note on why the work belongs in the canon
- a daily AI recommendation from mood, country, and genre (change those anytime; blank fields fall back to the most streamed titles)
- **Collect** to save a recording into your collection (stored in this browser)
- **Surprise me** to hear a different work immediately, without waiting for tomorrow’s rotation

## Run

```bash
cd canon
npm install
npm run catalog   # rebuild public/catalog.json from Wikidata + Spotify + kworb
npm run dev
```

Open `http://localhost:5173`.

## Ranking

Works are drawn from Wikidata items that already carry a Spotify track ID, ordered by the number of Wikipedia language editions (a proxy for worldwide cultural memory). Each ID is verified with Spotify’s public oEmbed endpoint before it enters the archive. Play counts are joined from [kworb.net](https://kworb.net/spotify/songs.html) artist and all-time stream tables.

## Tests

```bash
npm test
```
