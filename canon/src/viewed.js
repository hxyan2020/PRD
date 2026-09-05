export const VIEWED_KEY = "canon.viewed";

export function normalizeIds(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => String(id || "")).filter(Boolean))];
  }
  if (raw && Array.isArray(raw.ids)) {
    return [...new Set(raw.ids.map((id) => String(id || "")).filter(Boolean))];
  }
  return [];
}

export function markViewed(ids, id) {
  const list = Array.isArray(ids) ? ids : [];
  const key = String(id || "");
  if (!key || list.includes(key)) return list;
  return [key, ...list];
}

export function loadViewedIds(storage) {
  try {
    const store = storage || globalThis.localStorage;
    if (!store?.getItem) return [];
    const raw = store.getItem(VIEWED_KEY);
    if (!raw) return [];
    return normalizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveViewedIds(ids, storage) {
  const store = storage || globalThis.localStorage;
  if (!store?.setItem) return;
  store.setItem(VIEWED_KEY, JSON.stringify({ ids: normalizeIds(ids) }));
}
