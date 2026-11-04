import { primaryArtist } from "./format.js";

export const LRCLIB_GET = "https://lrclib.net/api/get";
export const LRCLIB_SEARCH = "https://lrclib.net/api/search";
export const LYRICS_OVH_BASE = "https://api.lyrics.ovh/v1";

const memoryCache = new Map();

export function lyricsArtist(track) {
  if (!track || typeof track !== "object") return "";
  const primary = primaryArtist(track);
  if (primary && primary !== "Unknown artist") return primary;
  return String(track.artist || "").trim();
}

export function lyricsTitle(track) {
  return String(track?.name || track?.spotifyTitle || "").trim();
}

export function lyricsAlbum(track) {
  if (!track?.extra) return "";
  const raw = String(track.musicCompany || "").trim();
  if (!raw || raw === "—" || raw === "Not listed") return "";
  return raw;
}

export function lyricsCacheKey(artist, title) {
  return `${normalizeName(artist)}|||${normalizeName(title)}`;
}

export function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function lrclibGetUrl({ artistName, trackName, albumName = "" } = {}) {
  const params = new URLSearchParams();
  if (trackName) params.set("track_name", trackName);
  if (artistName) params.set("artist_name", artistName);
  if (albumName) params.set("album_name", albumName);
  return `${LRCLIB_GET}?${params}`;
}

export function lrclibSearchUrl({ artistName, trackName } = {}) {
  const params = new URLSearchParams();
  if (trackName) params.set("track_name", trackName);
  if (artistName) params.set("artist_name", artistName);
  return `${LRCLIB_SEARCH}?${params}`;
}

export function lyricsOvhUrl(artistName, trackName) {
  const artist = encodeURIComponent(String(artistName || "").trim());
  const title = encodeURIComponent(String(trackName || "").trim());
  return `${LYRICS_OVH_BASE}/${artist}/${title}`;
}

export function stripSyncedLines(text) {
  return String(text || "")
    .replace(/^\[(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d+)?\]\s*/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanLyricsText(text) {
  return stripSyncedLines(text)
    .replace(/^paroles de la chanson\b.+$/im, "")
    .replace(/\*{3,}.*$/gs, "")
    .trim();
}

export function parseLyricsPayload(payload, source) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.instrumental) {
    return { status: "instrumental", text: "", source };
  }
  const text = cleanLyricsText(payload.plainLyrics || payload.syncedLyrics || payload.lyrics || "");
  if (!text) return null;
  return { status: "ok", text, source };
}

export function pickSearchHit(hits, trackName, artistName) {
  if (!Array.isArray(hits) || !hits.length) return null;
  const wantTrack = normalizeName(trackName);
  const wantArtist = normalizeName(artistName);
  const ranked = hits
    .map((hit) => {
      const t = normalizeName(hit?.trackName || hit?.name);
      const a = normalizeName(hit?.artistName || hit?.artist);
      let score = 0;
      if (t && t === wantTrack) score += 5;
      else if (t && wantTrack && (t.includes(wantTrack) || wantTrack.includes(t))) score += 2;
      if (wantArtist && a === wantArtist) score += 4;
      else if (wantArtist && a && (a.includes(wantArtist) || wantArtist.includes(a))) score += 1;
      if (hit?.plainLyrics || hit?.syncedLyrics || hit?.lyrics) score += 2;
      if (hit?.instrumental) score += 1;
      return { hit, score };
    })
    .sort((x, y) => y.score - x.score);
  return ranked[0]?.score > 0 ? ranked[0].hit : hits[0];
}

async function readJson(response) {
  if (!response || !response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function tryFetch(url, fetchFn) {
  try {
    return await fetchFn(url);
  } catch {
    return null;
  }
}

export async function fetchLyrics(track, { fetchFn = fetch, cache = memoryCache } = {}) {
  const trackName = lyricsTitle(track);
  const artistName = lyricsArtist(track);
  if (!trackName) return { status: "missing", text: "", source: "" };

  const key = lyricsCacheKey(artistName, trackName);
  if (cache?.has?.(key)) return cache.get(key);

  const albumName = lyricsAlbum(track);
  let result = parseLyricsPayload(
    await readJson(await tryFetch(lrclibGetUrl({ artistName, trackName, albumName }), fetchFn)),
    "lrclib"
  );

  if (!result) {
    const searchHits = await readJson(await tryFetch(lrclibSearchUrl({ artistName, trackName }), fetchFn));
    result = parseLyricsPayload(pickSearchHit(searchHits, trackName, artistName), "lrclib");
  }

  if (!result && artistName) {
    result = parseLyricsPayload(await readJson(await tryFetch(lyricsOvhUrl(artistName, trackName), fetchFn)), "ovh");
  }

  const out = result || { status: "missing", text: "", source: "" };
  cache?.set?.(key, out);
  return out;
}

export function clearLyricsCache(cache = memoryCache) {
  cache?.clear?.();
}
