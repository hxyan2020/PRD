export const COLLECTION_KEY = "canon.collections";

export function normalizeIds(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => String(id || "")).filter(Boolean))];
  }
  if (raw && Array.isArray(raw.ids)) {
    return [...new Set(raw.ids.map((id) => String(id || "")).filter(Boolean))];
  }
  return [];
}

export function toggleCollected(ids, id) {
  const list = Array.isArray(ids) ? ids : [];
  const key = String(id || "");
  if (!key) return list;
  if (list.includes(key)) return list.filter((item) => item !== key);
  return [key, ...list];
}

export function loadCollectedIds(storage) {
  try {
    const store = storage || globalThis.localStorage;
    if (!store?.getItem) return [];
    const raw = store.getItem(COLLECTION_KEY);
    if (!raw) return [];
    return normalizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveCollectedIds(ids, storage) {
  const store = storage || globalThis.localStorage;
  if (!store?.setItem) return;
  store.setItem(COLLECTION_KEY, JSON.stringify({ ids: normalizeIds(ids) }));
}
