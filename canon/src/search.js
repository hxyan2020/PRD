const STOP = new Set(["the", "a", "an", "and", "of", "for", "to", "in", "on"]);

export function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTokens(query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const tokens = normalized.split(" ").filter((token) => token && !STOP.has(token));
  return tokens.length ? tokens : normalized.split(" ").filter(Boolean);
}

export function trackSearchBlob(track = {}) {
  return normalizeSearchText(
    [
      track.name,
      track.spotifyTitle,
      track.composer,
      track.singer,
      track.band,
      track.writer,
      track.musicCompany,
      track.genre,
      track.releaseCountry,
      String(track.year || ""),
    ].join(" "),
  );
}

export function trackMatchesQuery(track, query) {
  const needle = normalizeSearchText(query);
  if (!needle) return true;
  const blob = trackSearchBlob(track);
  if (blob.includes(needle)) return true;
  const tokens = searchTokens(query);
  return tokens.length > 0 && tokens.every((token) => blob.includes(token));
}

export const MUSIC_SEARCH_PATH = "/api/music-search";
export const MIN_NAME_QUERY = 2;

export function itunesSearchUrl(query, limit = 12) {
  const params = new URLSearchParams({
    term: String(query || "").trim(),
    entity: "song",
    limit: String(limit),
  });
  return `https://itunes.apple.com/search?${params}`;
}
