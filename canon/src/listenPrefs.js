export const LISTEN_PREFS_KEY = "canon.daily.prefs";
export const EMPTY_LISTEN_PREFS = { mood: "", country: "", genre: "" };

export function loadListenPrefs(storage) {
  try {
    const store = storage || globalThis.localStorage;
    const raw = store?.getItem?.(LISTEN_PREFS_KEY);
    if (!raw) return { ...EMPTY_LISTEN_PREFS };
    const parsed = JSON.parse(raw);
    return {
      mood: String(parsed.mood || ""),
      country: String(parsed.country || ""),
      genre: String(parsed.genre || ""),
    };
  } catch {
    return { ...EMPTY_LISTEN_PREFS };
  }
}

export function saveListenPrefs(prefs, storage) {
  const next = {
    mood: String(prefs?.mood || ""),
    country: String(prefs?.country || ""),
    genre: String(prefs?.genre || ""),
  };
  const store = storage || globalThis.localStorage;
  store?.setItem?.(LISTEN_PREFS_KEY, JSON.stringify(next));
  return next;
}
