import { getCurrentUser, getLocalAuthProof, getSessionEmail, normalizeEmail } from "./auth.js";
import { loadAlbum, saveAlbum } from "./album.js";
import { loadExtraTracks, saveExtraTracks } from "./beyond.js";
import { loadCollection, saveCollection } from "./collections.js";
import { loadRecommendLog, saveRecommendLog } from "./recommendLog.js";
import { loadViewedIds, saveViewedIds } from "./viewed.js";
import { normalizePersonalPayload } from "./personalApi.js";

export const PERSONAL_BY_USER_KEY = "canon.personal.byUser";
export const PERSONAL_API_PATH = "/api/personal";

function storeOf(storage) {
  return storage || globalThis.localStorage;
}

export function emptyPersonalRecords() {
  return normalizePersonalPayload(null);
}

export function emptyCollection() {
  return emptyPersonalRecords().collection;
}

export function emptyRecommendLog() {
  return emptyPersonalRecords().recommendLog;
}

export function emptyAlbum() {
  return emptyPersonalRecords().album;
}

export function readActivePersonal(storage) {
  return {
    collection: loadCollection(storage),
    recommendLog: loadRecommendLog(storage),
    album: loadAlbum(storage),
    viewedIds: loadViewedIds(storage),
    extras: loadExtraTracks(storage),
  };
}

export function writeActivePersonal(records, storage) {
  const next = records || emptyPersonalRecords();
  saveCollection(next.collection, storage);
  saveRecommendLog(next.recommendLog, storage);
  saveAlbum(next.album, storage);
  saveViewedIds(next.viewedIds || [], storage);
  saveExtraTracks(next.extras || {}, storage);
  return next;
}

/** Wipe only the active browser keys used by the live UI. */
export function clearActivePersonal(storage) {
  return writeActivePersonal(emptyPersonalRecords(), storage);
}

function parseStashMap(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function loadUserPersonal(email, storage) {
  const key = normalizeEmail(email);
  if (!key) return emptyPersonalRecords();
  const store = storeOf(storage);
  const map = parseStashMap(store?.getItem?.(PERSONAL_BY_USER_KEY));
  return normalizePersonalPayload(map[key]);
}

export function saveUserPersonal(email, records, storage) {
  const key = normalizeEmail(email);
  if (!key) return emptyPersonalRecords();
  const store = storeOf(storage);
  if (!store?.setItem) return normalizePersonalPayload(records);
  const map = parseStashMap(store.getItem(PERSONAL_BY_USER_KEY));
  const next = normalizePersonalPayload(records);
  map[key] = next;
  store.setItem(PERSONAL_BY_USER_KEY, JSON.stringify(map));
  return next;
}

function uniqueIds(...lists) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const id of list || []) {
      const key = String(id || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

/** Prefer the richer side when reuniting local, stashed, and remote copies. */
export function mergePersonalRecords(...parts) {
  const collections = [];
  const albums = [];
  const logs = [];
  const viewed = [];
  const extras = {};

  for (const part of parts) {
    const next = normalizePersonalPayload(part);
    collections.push(next.collection);
    albums.push(next.album);
    logs.push(next.recommendLog);
    viewed.push(next.viewedIds);
    Object.assign(extras, next.extras);
  }

  const collectionIds = uniqueIds(...collections.map((item) => item.ids));
  const collectedAt = {};
  for (const collection of collections) {
    Object.assign(collectedAt, collection.collectedAt || {});
  }

  const albumIds = uniqueIds(...albums.map((item) => item.ids));
  const addedAt = {};
  for (const album of albums) {
    Object.assign(addedAt, album.addedAt || {});
  }

  const entries = [];
  const seenEntry = new Set();
  for (const log of logs) {
    for (const entry of log.entries || []) {
      const id = String(entry?.id || "");
      if (!id || seenEntry.has(id)) continue;
      seenEntry.add(id);
      entries.push(entry);
    }
  }

  return {
    collection: { ids: collectionIds, collectedAt },
    recommendLog: { entries },
    album: { ids: albumIds, addedAt },
    viewedIds: uniqueIds(...viewed),
    extras,
  };
}

/**
 * Signed-out browsers show a blank personal slate without destroying the
 * per-user stash that sign-in restores.
 */
export function loadPersonalRecords(storage) {
  if (getCurrentUser(storage)) return null;
  return emptyPersonalRecords();
}

/** Park the active personal slate under the signed-out account, then blank the live keys. */
export function parkPersonalOnSignOut(email, storage) {
  const active = readActivePersonal(storage);
  const key = normalizeEmail(email) || getSessionEmail(storage);
  if (key) {
    saveUserPersonal(key, mergePersonalRecords(loadUserPersonal(key, storage), active), storage);
  }
  return clearActivePersonal(storage);
}

/** Restore the account's Canon album / collects into the live browser keys. */
export function restorePersonalOnSignIn(email, storage) {
  const key = normalizeEmail(email) || getSessionEmail(storage);
  const active = readActivePersonal(storage);
  const stashed = key ? loadUserPersonal(key, storage) : emptyPersonalRecords();
  const merged = mergePersonalRecords(stashed, active);
  writeActivePersonal(merged, storage);
  if (key) saveUserPersonal(key, merged, storage);
  return merged;
}

/** Keep the signed-in account stash aligned after each personal write. */
export function persistSignedInPersonal(email, patch, storage) {
  const key = normalizeEmail(email) || getSessionEmail(storage);
  const active = writeActivePersonal(
    {
      ...readActivePersonal(storage),
      ...patch,
    },
    storage,
  );
  if (key) {
    saveUserPersonal(key, active, storage);
    void pushRemotePersonal(key, getLocalAuthProof(key, storage), active);
  }
  return active;
}

export async function pullRemotePersonal(email, proof, fetchFn = fetch) {
  const normalized = normalizeEmail(email);
  const auth = proof || getLocalAuthProof(normalized);
  if (!normalized || !auth?.hash || !auth?.salt) return null;
  try {
    const response = await fetchFn(PERSONAL_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get",
        email: normalized,
        hash: auth.hash,
        salt: auth.salt,
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.ok) return null;
    return normalizePersonalPayload(payload.personal);
  } catch {
    return null;
  }
}

export async function pushRemotePersonal(email, proof, records, fetchFn = fetch) {
  const normalized = normalizeEmail(email);
  const auth = proof || getLocalAuthProof(normalized);
  if (!normalized || !auth?.hash || !auth?.salt) return false;
  try {
    const response = await fetchFn(PERSONAL_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "put",
        email: normalized,
        hash: auth.hash,
        salt: auth.salt,
        personal: normalizePersonalPayload(records),
      }),
    });
    if (!response.ok) return false;
    const payload = await response.json();
    return Boolean(payload?.ok);
  } catch {
    return false;
  }
}

export async function syncPersonalForUser(email, storage, fetchFn = fetch) {
  const key = normalizeEmail(email) || getSessionEmail(storage);
  if (!key) return readActivePersonal(storage);
  const local = restorePersonalOnSignIn(key, storage);
  const remote = await pullRemotePersonal(key, getLocalAuthProof(key, storage), fetchFn);
  if (!remote) {
    void pushRemotePersonal(key, getLocalAuthProof(key, storage), local, fetchFn);
    return local;
  }
  const merged = mergePersonalRecords(local, remote);
  writeActivePersonal(merged, storage);
  saveUserPersonal(key, merged, storage);
  void pushRemotePersonal(key, getLocalAuthProof(key, storage), merged, fetchFn);
  return merged;
}
