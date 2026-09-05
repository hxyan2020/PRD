export const TOKEN_KEY = "canon.spotify.tokens";
export const CLIENT_ID_KEY = "canon.spotify.clientId";
export const VERIFIER_KEY = "canon.spotify.code_verifier";
export const STATE_KEY = "canon.spotify.state";
export const PENDING_ADD_KEY = "canon.spotify.pendingAdd";
export const PLAYLIST_ID_KEY = "canon.spotify.playlistId";
export const PLAYLIST_NAME = "Canon";
export const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

export function randomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += chars[byte % chars.length];
  return out;
}

export function base64UrlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function codeChallengeFromVerifier(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

export function redirectUri(location = globalThis.location) {
  if (!location) return "";
  return `${location.origin}/`;
}

export function getClientId(storage, envId = "") {
  const fromEnv = String(envId || "").trim();
  if (fromEnv) return fromEnv;
  try {
    const store = storage || globalThis.localStorage;
    return String(store?.getItem?.(CLIENT_ID_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveClientId(id, storage) {
  const store = storage || globalThis.localStorage;
  store?.setItem?.(CLIENT_ID_KEY, String(id || "").trim());
}

export function spotifyTrackUri(spotifyId) {
  const id = String(spotifyId || "").trim();
  return id ? `spotify:track:${id}` : "";
}

export function parseCallbackParams(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return {
    code: params.get("code") || "",
    state: params.get("state") || "",
    error: params.get("error") || "",
  };
}

export function tokenIsFresh(tokens, now = Date.now()) {
  if (!tokens?.access_token) return false;
  const expiresAt = Number(tokens.expires_at || 0);
  return expiresAt > now + 30_000;
}

export function parseTokenResponse(payload, now = Date.now()) {
  if (!payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Spotify did not return an access token");
  }
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token || "",
    token_type: payload.token_type || "Bearer",
    expires_at: now + Number(payload.expires_in || 3600) * 1000,
  };
}

export function loadTokens(storage) {
  try {
    const store = storage || globalThis.localStorage;
    const raw = store?.getItem?.(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens, storage) {
  const store = storage || globalThis.localStorage;
  store?.setItem?.(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearSpotifySession(storage) {
  const store = storage || globalThis.localStorage;
  store?.removeItem?.(TOKEN_KEY);
  store?.removeItem?.(PLAYLIST_ID_KEY);
  store?.removeItem?.(PENDING_ADD_KEY);
}

export function setPendingAdd(spotifyId, storage) {
  const store = storage || globalThis.sessionStorage || globalThis.localStorage;
  const id = String(spotifyId || "").trim();
  if (id) store?.setItem?.(PENDING_ADD_KEY, id);
  else store?.removeItem?.(PENDING_ADD_KEY);
}

export function takePendingAdd(storage) {
  const store = storage || globalThis.sessionStorage || globalThis.localStorage;
  const id = String(store?.getItem?.(PENDING_ADD_KEY) || "").trim();
  store?.removeItem?.(PENDING_ADD_KEY);
  return id;
}

export function buildAuthorizeUrl({ clientId, redirect, challenge, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirect,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    show_dialog: "true",
  });
  return `${AUTH_URL}?${params}`;
}

export async function beginSpotifyLogin({
  storage,
  session,
  envClientId,
  location,
} = {}) {
  const clientId = getClientId(storage, envClientId);
  if (!clientId) throw new Error("Add a Spotify client ID before connecting.");
  const verifier = randomString(64);
  const state = randomString(24);
  const store = session || globalThis.sessionStorage;
  store.setItem(VERIFIER_KEY, verifier);
  store.setItem(STATE_KEY, state);
  const challenge = await codeChallengeFromVerifier(verifier);
  const url = buildAuthorizeUrl({
    clientId,
    redirect: redirectUri(location),
    challenge,
    state,
  });
  if (location) location.href = url;
  return url;
}

export async function exchangeCodeForTokens({
  code,
  clientId,
  redirect,
  verifier,
  fetchFn = fetch,
}) {
  const body = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect,
      code_verifier: verifier,
    }),
  });
  const payload = await body.json();
  if (!body.ok) {
    throw new Error(payload.error_description || payload.error || "Spotify token exchange failed");
  }
  return parseTokenResponse(payload);
}

export async function refreshAccessToken({ refreshToken, clientId, fetchFn = fetch }) {
  const body = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const payload = await body.json();
  if (!body.ok) {
    throw new Error(payload.error_description || payload.error || "Spotify token refresh failed");
  }
  return parseTokenResponse({ ...payload, refresh_token: payload.refresh_token || refreshToken });
}

export async function completeSpotifyLogin({
  search,
  storage,
  session,
  envClientId,
  location,
  fetchFn = fetch,
} = {}) {
  const callback = parseCallbackParams(search);
  if (!callback.code && !callback.error) return { handled: false };
  if (callback.error) return { handled: true, error: callback.error };
  const store = session || globalThis.sessionStorage;
  const expected = store.getItem(STATE_KEY);
  if (!callback.state || callback.state !== expected) {
    return { handled: true, error: "Spotify login state did not match. Try connecting again." };
  }
  const clientId = getClientId(storage, envClientId);
  const verifier = store.getItem(VERIFIER_KEY);
  if (!clientId || !verifier) {
    return { handled: true, error: "Missing Spotify login details. Try connecting again." };
  }
  const tokens = await exchangeCodeForTokens({
    code: callback.code,
    clientId,
    redirect: redirectUri(location),
    verifier,
    fetchFn,
  });
  saveTokens(tokens, storage);
  store.removeItem(VERIFIER_KEY);
  store.removeItem(STATE_KEY);
  return { handled: true, tokens };
}

export async function getAccessToken({
  storage,
  envClientId,
  fetchFn = fetch,
} = {}) {
  const tokens = loadTokens(storage);
  if (tokenIsFresh(tokens)) return tokens.access_token;
  if (!tokens?.refresh_token) return "";
  const clientId = getClientId(storage, envClientId);
  const next = await refreshAccessToken({
    refreshToken: tokens.refresh_token,
    clientId,
    fetchFn,
  });
  saveTokens(next, storage);
  return next.access_token;
}

async function spotifyRequest(path, { method = "GET", body, token, fetchFn = fetch } = {}) {
  const response = await fetchFn(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.error_description || `Spotify request failed (${response.status})`);
  }
  return payload;
}

export async function fetchSpotifyProfile(options) {
  const token = await getAccessToken(options);
  if (!token) return null;
  return spotifyRequest("/me", { token, fetchFn: options.fetchFn });
}

export async function trackSavedOnSpotify(spotifyId, options) {
  const token = await getAccessToken(options);
  if (!token || !spotifyId) return false;
  const result = await spotifyRequest(`/me/tracks/contains?ids=${encodeURIComponent(spotifyId)}`, {
    token,
    fetchFn: options.fetchFn,
  });
  return Boolean(result?.[0]);
}

async function ensureCanonPlaylist(options) {
  const token = await getAccessToken(options);
  const store = options.storage || globalThis.localStorage;
  const existing = store.getItem(PLAYLIST_ID_KEY);
  if (existing) {
    try {
      await spotifyRequest(`/playlists/${existing}`, { token, fetchFn: options.fetchFn });
      return existing;
    } catch {
      store.removeItem(PLAYLIST_ID_KEY);
    }
  }

  let url = "/me/playlists?limit=50";
  while (url) {
    const page = await spotifyRequest(url.replace(API_URL, ""), { token, fetchFn: options.fetchFn });
    const match = (page.items || []).find((item) => item.name === PLAYLIST_NAME);
    if (match) {
      store.setItem(PLAYLIST_ID_KEY, match.id);
      return match.id;
    }
    url = page.next ? page.next.replace(API_URL, "") : "";
  }

  const profile = await spotifyRequest("/me", { token, fetchFn: options.fetchFn });
  const created = await spotifyRequest(`/users/${profile.id}/playlists`, {
    method: "POST",
    token,
    fetchFn: options.fetchFn,
    body: {
      name: PLAYLIST_NAME,
      public: false,
      description: "Your Canon album — recordings saved from the Canon listening archive.",
    },
  });
  store.setItem(PLAYLIST_ID_KEY, created.id);
  return created.id;
}

export async function addTrackToSpotifyAlbum(spotifyId, options = {}) {
  const id = String(spotifyId || "").trim();
  if (!id) throw new Error("This recording has no Spotify track id.");
  const token = await getAccessToken(options);
  if (!token) throw new Error("Connect Spotify first so Canon can add music to your account.");
  await spotifyRequest(`/me/tracks?ids=${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    fetchFn: options.fetchFn,
  });
  const playlistId = await ensureCanonPlaylist(options);
  await spotifyRequest(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    token,
    fetchFn: options.fetchFn,
    body: { uris: [spotifyTrackUri(id)], position: 0 },
  });
  return { playlistId, uri: spotifyTrackUri(id) };
}
