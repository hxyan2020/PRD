import { publicUrl } from "./urls.js";

export const VIEWERSHIP_KEY = "canon.hx.viewership";
export const PING_KEY = "canon.hx.bots.ping";
export const HX_SLUG = "canon";
export const HX_NAME = "Canon";
export const HX_COLLECT_URL = "http://188.166.214.47:3520/collect";
const MAX_EVENTS = 400;

export function hxBeaconPath() {
  return publicUrl("api/hx-viewership");
}

export const HX_BEACON_PATH = "/api/hx-viewership";

export const HX_BOTS = [
  { id: "hx-health", name: "HX Health", path: "/hx/health.json", interval: "60s" },
  { id: "hx-bots", name: "HX Bots roster", path: "/hx/bots.json", interval: "5m" },
  { id: "hx-ping", name: "HX Ping", path: "/#hx-ping", interval: "on visit" },
];

function emptyState() {
  return { visits: [], totals: { human: 0, bot: 0, views: 0 } };
}

export function isLikelyBot(ua = "", extras = {}) {
  if (extras.webdriver) return true;
  const s = String(ua || "").toLowerCase();
  if (!s) return false;
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless|wget|curl|python-requests|httpie|uptimerobot|pingdom|statuscake|digitalocean|vercel/.test(
    s,
  );
}

export function hxPathForRoute(page = "home", trackId = "") {
  if (page === "home") return trackId ? `/#t=${trackId}` : "/";
  return `/#${page}`;
}

export function viewershipPayload({ path = "/", host = "", referer = "" } = {}) {
  return {
    slug: HX_SLUG,
    name: HX_NAME,
    path: path || "/",
    host: host || "",
    referer: referer || "",
  };
}

export async function sendHxBeacon(details = {}, fetchImpl, location = globalThis.location) {
  const payload = JSON.stringify(viewershipPayload(details));
  const post = fetchImpl || (typeof fetch === "function" ? fetch : null);
  if (!post) return { ok: false, skipped: true };
  const targets = [hxBeaconPath()];
  const protocol = location?.protocol || "";
  if (!(protocol === "https:" && String(HX_COLLECT_URL).startsWith("http:"))) {
    targets.push(HX_COLLECT_URL);
  }
  for (const url of targets) {
    try {
      const res = await post(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
      if (res?.ok || res?.status === 202) return { ok: true };
    } catch {
      /* try the next target */
    }
  }
  return { ok: false };
}

export function loadViewership(storage) {
  try {
    const store = storage || globalThis.localStorage;
    const raw = store?.getItem?.(VIEWERSHIP_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const visits = Array.isArray(parsed.visits) ? parsed.visits : [];
    const totals = parsed.totals && typeof parsed.totals === "object" ? parsed.totals : emptyState().totals;
    return { visits, totals: { ...emptyState().totals, ...totals } };
  } catch {
    return emptyState();
  }
}

function saveViewership(state, storage) {
  const store = storage || globalThis.localStorage;
  store?.setItem?.(VIEWERSHIP_KEY, JSON.stringify(state));
}

export function recordVisit({ route = "home", origin = "", ua = "", webdriver = false } = {}, storage) {
  const state = loadViewership(storage);
  const bot = isLikelyBot(ua, { webdriver });
  const visit = {
    at: new Date().toISOString(),
    route,
    origin: origin || "",
    kind: bot ? "bot" : "human",
  };
  state.visits = [visit, ...state.visits].slice(0, MAX_EVENTS);
  state.totals.views += 1;
  if (bot) state.totals.bot += 1;
  else state.totals.human += 1;
  saveViewership(state, storage);
  return state;
}

export function loadBotPings(storage) {
  try {
    const store = storage || globalThis.localStorage;
    const raw = store?.getItem?.(PING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordBotPing(id, storage) {
  const store = storage || globalThis.localStorage;
  const pings = loadBotPings(store);
  const next = [{ id, at: new Date().toISOString() }, ...pings].slice(0, 80);
  store?.setItem?.(PING_KEY, JSON.stringify(next));
  return next;
}

export function lastPingFor(id, pings = loadBotPings()) {
  return pings.find((p) => p.id === id) || null;
}

export function clearViewership(storage) {
  const store = storage || globalThis.localStorage;
  store?.removeItem?.(VIEWERSHIP_KEY);
  return emptyState();
}
