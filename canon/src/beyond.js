export const EXTRA_KEY = "canon.extra.tracks";
export const EXTRA_PREFIX = "ext-";

const MARKET_BY_COUNTRY = {
  japan: "JP",
  brazil: "BR",
  brasil: "BR",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  england: "GB",
  "united states": "US",
  usa: "US",
  us: "US",
  america: "US",
  france: "FR",
  germany: "DE",
  india: "IN",
  china: "CN",
  "south korea": "KR",
  korea: "KR",
  mexico: "MX",
  spain: "ES",
  italy: "IT",
  canada: "CA",
  australia: "AU",
  nigeria: "NG",
  jamaica: "JM",
  ireland: "IE",
  sweden: "SE",
  russia: "RU",
  argentina: "AR",
  colombia: "CO",
  egypt: "EG",
  "south africa": "ZA",
  indonesia: "ID",
  turkey: "TR",
  poland: "PL",
  portugal: "PT",
  netherlands: "NL",
  belgium: "BE",
  greece: "GR",
  cuba: "CU",
  ghana: "GH",
  senegal: "SN",
  mali: "ML",
};

const MOOD_QUERY = {
  joyful: "happy upbeat",
  melancholy: "sad melancholy",
  calm: "calm acoustic",
  romantic: "love romantic",
  defiant: "rock protest",
  nostalgic: "oldies classic",
  spiritual: "gospel hymn",
  dance: "dance disco",
  night: "night jazz",
  summer: "summer reggae",
};

export function extraId(spotifyId) {
  const id = String(spotifyId || "").trim();
  return id ? `${EXTRA_PREFIX}${id}` : "";
}

export function isExtraId(id) {
  return String(id || "").startsWith(EXTRA_PREFIX);
}

function normalizeCountry(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function marketForCountry(country) {
  return MARKET_BY_COUNTRY[normalizeCountry(country)] || "";
}

export function moodQueryTerms(mood) {
  const raw = String(mood || "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase();
  return MOOD_QUERY[key] || raw;
}

export function buildBeyondQuery(prefs = {}) {
  const mood = String(prefs.mood || "").trim();
  const country = String(prefs.country || "").trim();
  const genre = String(prefs.genre || "").trim();
  const bits = [];
  if (genre) {
    const compact = genre.replace(/\s+/g, " ").trim();
    if (compact && !compact.includes(" ") && compact.length < 24) bits.push(`genre:${compact}`);
    else bits.push(compact);
  }
  const moodTerms = moodQueryTerms(mood);
  if (moodTerms) bits.push(moodTerms);
  if (country && !marketForCountry(country)) bits.push(country);
  if (!bits.length) bits.push("year:1960-2026");
  return bits.join(" ");
}

export function searchTracksPath({ query, market = "", offset = 0, limit = 20 } = {}) {
  const params = new URLSearchParams({
    q: query || "year:1960-2026",
    type: "track",
    limit: String(limit),
    offset: String(offset),
  });
  if (market) params.set("market", market);
  return `/search?${params}`;
}

export function mapSpotifyTrack(item, prefs = {}) {
  const artists = (item.artists || []).map((artist) => artist.name).filter(Boolean);
  const yearRaw = String(item.album?.release_date || "").slice(0, 4);
  const images = item.album?.images || [];
  const cover = images[1]?.url || images[0]?.url || "";
  const spotifyId = String(item.id || "").trim();
  return {
    id: extraId(spotifyId),
    extra: true,
    rank: 0,
    name: String(item.name || "Untitled"),
    composer: "—",
    singer: artists.join(", ") || "—",
    band: "—",
    writer: "—",
    musicCompany: item.album?.name || "—",
    year: yearRaw ? Number(yearRaw) : 0,
    releaseCountry: String(prefs.country || "").trim() || "—",
    genre: String(prefs.genre || "").trim() || "Spotify",
    genres: [String(prefs.genre || "").trim()].filter(Boolean),
    spotifyId,
    spotifyUrl: item.external_urls?.spotify || (spotifyId ? `https://open.spotify.com/track/${spotifyId}` : ""),
    spotifyEmbedUrl: spotifyId ? `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator` : "",
    coverUrl: cover,
    spotifyTitle: String(item.name || ""),
    streams: 0,
    popularity: Number(item.popularity || 0),
    whyShortlisted: "",
    wikipediaUrl: "",
  };
}

export function catalogSpotifyIds(tracks = []) {
  return new Set((tracks || []).map((track) => track.spotifyId).filter(Boolean));
}

export function extrasFromSearch(payload, { prefs = {}, catalogIds = new Set(), alreadyIds = new Set() } = {}) {
  const items = payload?.tracks?.items || [];
  const out = [];
  const seen = new Set(alreadyIds);
  for (const item of items) {
    const spotifyId = String(item?.id || "").trim();
    if (!spotifyId || catalogIds.has(spotifyId) || seen.has(spotifyId)) continue;
    seen.add(spotifyId);
    out.push(mapSpotifyTrack(item, prefs));
  }
  return out;
}

export function loadExtraTracks(storage) {
  try {
    const store = storage || globalThis.localStorage;
    const raw = store?.getItem?.(EXTRA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [id, track] of Object.entries(parsed)) {
      if (track && typeof track === "object" && track.spotifyId) out[id] = track;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveExtraTracks(map, storage) {
  const store = storage || globalThis.localStorage;
  if (!store?.setItem) return;
  store.setItem(EXTRA_KEY, JSON.stringify(map || {}));
}

export function mergeExtraTracks(current, list) {
  const next = { ...(current || {}) };
  for (const track of list || []) {
    if (track?.id && track.spotifyId) next[track.id] = track;
  }
  return next;
}
