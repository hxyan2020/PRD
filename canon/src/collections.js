export const COLLECTION_KEY = "canon.collections";

export function normalizeIds(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => String(id || "")).filter(Boolean))];
  }
  if (raw && typeof raw === "object" && Array.isArray(raw.ids)) {
    return [...new Set(raw.ids.map((id) => String(id || "")).filter(Boolean))];
  }
  return [];
}

export function parseCollection(raw) {
  const ids = normalizeIds(raw);
  const collectedAt = {};
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw) && raw.collectedAt && typeof raw.collectedAt === "object"
      ? raw.collectedAt
      : {};
  for (const id of ids) {
    const value = source[id];
    if (typeof value === "string" && value.trim()) collectedAt[id] = value;
  }
  return { ids, collectedAt };
}

export function toggleCollected(collection, id, now = new Date()) {
  const current = parseCollection(collection);
  const key = String(id || "");
  if (!key) return current;
  if (current.ids.includes(key)) {
    const nextAt = { ...current.collectedAt };
    delete nextAt[key];
    return { ids: current.ids.filter((item) => item !== key), collectedAt: nextAt };
  }
  return {
    ids: [key, ...current.ids],
    collectedAt: { ...current.collectedAt, [key]: new Date(now).toISOString() },
  };
}

export function formatCollectedAt(iso) {
  if (!iso) return "Date not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function loadCollection(storage) {
  try {
    const store = storage || globalThis.localStorage;
    if (!store?.getItem) return parseCollection(null);
    const raw = store.getItem(COLLECTION_KEY);
    if (!raw) return parseCollection(null);
    return parseCollection(JSON.parse(raw));
  } catch {
    return parseCollection(null);
  }
}

export function loadCollectedIds(storage) {
  return loadCollection(storage).ids;
}

export function saveCollection(collection, storage) {
  const store = storage || globalThis.localStorage;
  if (!store?.setItem) return;
  const parsed = parseCollection(collection);
  store.setItem(COLLECTION_KEY, JSON.stringify(parsed));
}

export function saveCollectedIds(ids, storage) {
  const existing = loadCollection(storage);
  const nextIds = normalizeIds(ids);
  const collectedAt = {};
  for (const id of nextIds) {
    if (existing.collectedAt[id]) collectedAt[id] = existing.collectedAt[id];
  }
  saveCollection({ ids: nextIds, collectedAt }, storage);
}
