import { extrasFromItunes, extrasFromSearch, marketForCountry, searchTracksPath } from "../src/beyond.js";
import {
  ALL_COUNTRIES,
  ALL_GENRES,
  buildOutsideTerm,
  buildSpotifyOutsideTerm,
  hasOutsideSearch,
  itunesSearchUrl,
} from "../src/search.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function filtersOf(req) {
  try {
    const host = req.headers?.host || "127.0.0.1";
    const url = new URL(req.url || "", `http://${host}`);
    return {
      query: String(url.searchParams.get("q") || "").trim(),
      genre: String(url.searchParams.get("genre") || "").trim(),
      era: String(url.searchParams.get("era") || "").trim(),
      country: String(url.searchParams.get("country") || "").trim(),
    };
  } catch {
    return { query: "", genre: "", era: "", country: "" };
  }
}

function hintsOf(filters) {
  return {
    genre: filters.genre && filters.genre !== ALL_GENRES ? filters.genre : "",
    country: filters.country && filters.country !== ALL_COUNTRIES ? filters.country : "",
  };
}

function spotifyCredentials() {
  const id = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  return id && secret ? { id, secret } : null;
}

async function spotifyAccessToken(credentials) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${credentials.id}:${credentials.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) return "";
  return payload.access_token;
}

async function searchSpotify(filters) {
  const credentials = spotifyCredentials();
  if (!credentials) return null;
  const token = await spotifyAccessToken(credentials);
  if (!token) return null;
  const path = searchTracksPath({
    query: buildSpotifyOutsideTerm(filters) || buildOutsideTerm(filters),
    market: marketForCountry(filters.country),
    limit: 12,
  });
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return extrasFromSearch(payload, { prefs: { extraSource: "name", ...hintsOf(filters) } });
}

async function searchItunes(filters) {
  const response = await fetch(itunesSearchUrl(buildOutsideTerm(filters), 25, marketForCountry(filters.country)));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("itunes");
  return extrasFromItunes(payload, { hints: hintsOf(filters) });
}

export function createMusicSearchHandler({ spotify, itunes } = {}) {
  const searchSpotifyTracks = spotify || searchSpotify;
  const searchItunesTracks = itunes || searchItunes;

  return async function handler(req, res) {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "unavailable", tracks: [] });
      return;
    }
    const filters = filtersOf(req);
    if (!hasOutsideSearch(filters)) {
      json(res, 400, { ok: false, error: "short_query", tracks: [] });
      return;
    }
    try {
      const fromSpotify = await searchSpotifyTracks(filters);
      if (Array.isArray(fromSpotify) && fromSpotify.length) {
        json(res, 200, { ok: true, source: "spotify", tracks: fromSpotify });
        return;
      }
      const fromItunes = (await searchItunesTracks(filters)).slice(0, 12);
      json(res, 200, { ok: true, source: "itunes", tracks: fromItunes });
    } catch {
      json(res, 503, { ok: false, error: "unavailable", tracks: [] });
    }
  };
}

export default createMusicSearchHandler();
