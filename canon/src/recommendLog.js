export const RECOMMEND_LOG_KEY = "canon.recommend.log";
const MAX_ENTRIES = 500;

export function parseRecommendLog(raw) {
  const source = Array.isArray(raw) ? raw : raw?.entries;
  if (!Array.isArray(source)) return { entries: [] };
  const entries = [];
  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const trackId = String(item.trackId || "");
    if (!trackId) continue;
    entries.push({
      id: String(item.id || `${item.at || ""}-${trackId}`),
      at: String(item.at || ""),
      trackId,
      name: String(item.name || "Unknown recording"),
      artist: String(item.artist || ""),
      coverUrl: String(item.coverUrl || ""),
      mode: item.mode === "surprise" ? "surprise" : "daily",
      kind: String(item.kind || item.mode || "daily"),
      mood: String(item.mood || ""),
      country: String(item.country || ""),
      genre: String(item.genre || ""),
    });
  }
  return { entries };
}

export function formatLoggedAt(iso) {
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

export function appendRecommendation(log, input = {}, now = new Date()) {
  const current = parseRecommendLog(log);
  const trackId = String(input.trackId || "");
  if (!trackId) return current;

  const at = new Date(now).toISOString();
  const mood = String(input.mood || "").trim();
  const country = String(input.country || "").trim();
  const genre = String(input.genre || "").trim();
  const mode = input.mode === "surprise" ? "surprise" : "daily";
  const entry = {
    id: `${at}-${trackId}-${mode}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    trackId,
    name: String(input.name || "Unknown recording"),
    artist: String(input.artist || ""),
    coverUrl: String(input.coverUrl || ""),
    mode,
    kind: String(input.kind || mode),
    mood,
    country,
    genre,
  };

  if (mode === "daily") {
    const dateKey = at.slice(0, 10);
    const duplicate = current.entries.some(
      (item) =>
        item.mode === "daily" &&
        String(item.at).slice(0, 10) === dateKey &&
        item.trackId === trackId &&
        item.mood === mood &&
        item.country === country &&
        item.genre === genre
    );
    if (duplicate) return log && Array.isArray(log.entries) ? log : current;
  }

  return { entries: [entry, ...current.entries].slice(0, MAX_ENTRIES) };
}

export function loadRecommendLog(storage) {
  try {
    const store = storage || globalThis.localStorage;
    if (!store?.getItem) return parseRecommendLog(null);
    const raw = store.getItem(RECOMMEND_LOG_KEY);
    if (!raw) return parseRecommendLog(null);
    return parseRecommendLog(JSON.parse(raw));
  } catch {
    return parseRecommendLog(null);
  }
}

export function saveRecommendLog(log, storage) {
  const store = storage || globalThis.localStorage;
  if (!store?.setItem) return;
  store.setItem(RECOMMEND_LOG_KEY, JSON.stringify(parseRecommendLog(log)));
}
