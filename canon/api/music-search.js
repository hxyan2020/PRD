import { extrasFromItunes, extrasFromSearch, searchTracksPath } from "../src/beyond.js";
import { itunesSearchUrl, MIN_NAME_QUERY } from "../src/search.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function queryOf(req) {
  try {
    const host = req.headers?.host || "127.0.0.1";
    const url = new URL(req.url || "", `http://${host}`);
    return String(url.searchParams.get("q") || "").trim();
  } catch {
    return "";
  }
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

async function searchSpotify(query) {
  const credentials = spotifyCredentials();
  if (!credentials) return null;
  const token = await spotifyAccessToken(credentials);
  if (!token) return null;
  const path = searchTracksPath({ query, limit: 12 });
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return extrasFromSearch(payload, { prefs: { extraSource: "name" } });
}

async function searchItunes(query) {
  const response = await fetch(itunesSearchUrl(query, 25));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("itunes");
  return extrasFromItunes(payload);
}

export function createMusicSearchHandler({ spotify, itunes } = {}) {
  const searchSpotifyTracks = spotify || searchSpotify;
  const searchItunesTracks = itunes || searchItunes;

  return async function handler(req, res) {
    if (req.method !== "GET") {
      json(res, 405, { ok: false, error: "unavailable", tracks: [] });
      return;
    }
    const query = queryOf(req);
    if (query.length < MIN_NAME_QUERY) {
      json(res, 400, { ok: false, error: "short_query", tracks: [] });
      return;
    }
    try {
      const fromSpotify = await searchSpotifyTracks(query);
      if (Array.isArray(fromSpotify) && fromSpotify.length) {
        json(res, 200, { ok: true, source: "spotify", tracks: fromSpotify });
        return;
      }
      const fromItunes = (await searchItunesTracks(query)).slice(0, 12);
      json(res, 200, { ok: true, source: "itunes", tracks: fromItunes });
    } catch {
      json(res, 503, { ok: false, error: "unavailable", tracks: [] });
    }
  };
}

export default createMusicSearchHandler();
