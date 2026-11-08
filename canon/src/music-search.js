import { extrasFromItunes } from "./beyond.js";
import { itunesSearchUrl, MIN_NAME_QUERY, MUSIC_SEARCH_PATH } from "./search.js";

export async function searchMusicByName(query, { fetchFn = fetch } = {}) {
  const q = String(query || "").trim();
  if (q.length < MIN_NAME_QUERY) return { ok: false, error: "short_query", tracks: [] };

  try {
    const response = await fetchFn(`${MUSIC_SEARCH_PATH}?q=${encodeURIComponent(q)}`);
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.tracks)) {
        return { ok: true, source: data.source || "api", tracks: data.tracks };
      }
    }
  } catch {
    /* GitHack and local builds can fall back to a public catalog search. */
  }

  try {
    const response = await fetchFn(itunesSearchUrl(q, 12));
    const payload = await response.json();
    return { ok: true, source: "itunes", tracks: extrasFromItunes(payload) };
  } catch {
    return { ok: false, error: "unavailable", tracks: [] };
  }
}
