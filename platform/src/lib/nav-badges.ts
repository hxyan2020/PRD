/** Client-safe nav unread totals, extras, and bump events. */

export const NAV_BADGE_EVENT = "crmp-nav-badge";
export const NAV_SEEN_KEY = "crmp_nav_seen_v1";
export const NAV_EXTRA_KEY = "crmp_nav_extra_v1";

/** Used when SQLite counts are missing (GitHub Pages export with an empty snapshot). */
export const FALLBACK_NAV_TOTALS: Record<string, number> = {
  "/admin/alerts": 5,
  "/admin/messenger": 6,
  "/admin/market-intel": 3,
  "/admin/interventions": 3,
  "/admin/spine": 8,
  "/admin/audit": 3,
  "/admin/monitor-2": 4,
  "/admin/risk-log": 5,
  "/admin/detectors": 2,
};

export type NavBadgeBump = { href: string; delta?: number };

export function bumpNavBadge(href: string, delta = 1) {
  if (typeof window === "undefined" || !href || delta <= 0) return;
  window.dispatchEvent(new CustomEvent(NAV_BADGE_EVENT, { detail: { href, delta } satisfies NavBadgeBump }));
}

export function readJsonRecord(key: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, number>;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function writeJsonRecord(key: string, value: Record<string, number>) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function mergeNavTotals(server: Record<string, { count?: number } | undefined>): Record<string, number> {
  const out = { ...FALLBACK_NAV_TOTALS };
  for (const [href, snap] of Object.entries(server || {})) {
    const n = Number(snap?.count || 0);
    if (n > (out[href] || 0)) out[href] = n;
  }
  return out;
}
