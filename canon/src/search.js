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
export const ALL_GENRES = "All genres";
export const ALL_ERAS = "All eras";
export const ALL_COUNTRIES = "All countries";

export function hasOutsideSearch({ query = "", genre = "", era = "", country = "" } = {}) {
  if (String(query || "").trim().length >= MIN_NAME_QUERY) return true;
  if (genre && genre !== ALL_GENRES) return true;
  if (era && era !== ALL_ERAS) return true;
  if (country && country !== ALL_COUNTRIES) return true;
  return false;
}

export function eraYearHint(era) {
  const raw = String(era || "").trim();
  if (!raw || raw === ALL_ERAS) return "";
  const decade = raw.match(/^(\d{4})s$/);
  if (decade) return decade[1];
  const start = raw.match(/^(\d{4})/);
  return start ? start[1] : "";
}

export function buildOutsideTerm({ query = "", genre = "", era = "", country = "" } = {}) {
  const bits = [];
  const q = String(query || "").trim();
  if (q) bits.push(q);
  if (genre && genre !== ALL_GENRES) bits.push(genre);
  const year = eraYearHint(era);
  if (year) bits.push(year);
  if (!bits.length && country && country !== ALL_COUNTRIES) bits.push(country);
  return bits.join(" ").trim();
}

export function buildSpotifyOutsideTerm(filters = {}) {
  const bits = [];
  const q = String(filters.query || "").trim();
  if (q) bits.push(q);
  const genre = String(filters.genre || "").trim();
  if (genre && genre !== ALL_GENRES) {
    const compact = genre.replace(/\s+/g, " ").trim();
    if (compact && !compact.includes(" ") && compact.length < 24) bits.push(`genre:${compact}`);
    else bits.push(compact);
  }
  const year = eraYearHint(filters.era);
  if (year) {
    const start = Number(year);
    bits.push(Number.isFinite(start) ? `year:${start}-${start + 9}` : year);
  }
  if (!bits.length && filters.country && filters.country !== ALL_COUNTRIES) bits.push(String(filters.country).trim());
  return bits.join(" ").trim();
}

export function extraMatchesEra(track, era, decadeOf) {
  if (!era || era === ALL_ERAS) return true;
  if (typeof decadeOf !== "function") return true;
  return decadeOf(track?.year) === era;
}

export function sortTracks(list, sort) {
  return [...(list || [])].sort((a, b) => {
    if (sort === "streams") return (b.streams || b.popularity || 0) - (a.streams || a.popularity || 0);
    if (sort === "year-asc") return (a.year || 9999) - (b.year || 9999);
    if (sort === "year-desc") return (b.year || 0) - (a.year || 0);
    if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
    return (a.rank || 0) - (b.rank || 0) || String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function itunesSearchUrl(query, limit = 12, market = "") {
  const params = new URLSearchParams({
    term: String(query || "song").trim() || "song",
    entity: "song",
    limit: String(limit),
  });
  if (market) params.set("country", String(market).toUpperCase());
  return `https://itunes.apple.com/search?${params}`;
}
