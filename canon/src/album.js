export const ALBUM_KEY = "canon.album";

export function normalizeAlbumIds(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => String(id || "")).filter(Boolean))];
  }
  if (raw && typeof raw === "object" && Array.isArray(raw.ids)) {
    return [...new Set(raw.ids.map((id) => String(id || "")).filter(Boolean))];
  }
  return [];
}

export function parseAlbum(raw) {
  const ids = normalizeAlbumIds(raw);
  const addedAt = {};
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw) && raw.addedAt && typeof raw.addedAt === "object"
      ? raw.addedAt
      : {};
  for (const id of ids) {
    const value = source[id];
    if (typeof value === "string" && value.trim()) addedAt[id] = value;
  }
  return { ids, addedAt };
}

export function addToAlbum(album, id, now = new Date()) {
  const current = parseAlbum(album);
  const key = String(id || "");
  if (!key) return current;
  if (current.ids.includes(key)) return current;
  return {
    ids: [key, ...current.ids],
    addedAt: { ...current.addedAt, [key]: new Date(now).toISOString() },
  };
}

export function removeFromAlbum(album, id) {
  const current = parseAlbum(album);
  const key = String(id || "");
  if (!key || !current.ids.includes(key)) return current;
  const addedAt = { ...current.addedAt };
  delete addedAt[key];
  return { ids: current.ids.filter((item) => item !== key), addedAt };
}

export function loadAlbum(storage) {
  try {
    const store = storage || globalThis.localStorage;
    if (!store?.getItem) return parseAlbum(null);
    const raw = store.getItem(ALBUM_KEY);
    if (!raw) return parseAlbum(null);
    return parseAlbum(JSON.parse(raw));
  } catch {
    return parseAlbum(null);
  }
}

export function saveAlbum(album, storage) {
  const store = storage || globalThis.localStorage;
  if (!store?.setItem) return;
  store.setItem(ALBUM_KEY, JSON.stringify(parseAlbum(album)));
}

export function archiveTotal(catalogCount, albumIds = [], catalogIds = new Set()) {
  const base = Number(catalogCount) || 0;
  let extra = 0;
  for (const id of albumIds || []) {
    if (!catalogIds.has(id)) extra += 1;
  }
  return base + extra;
}
