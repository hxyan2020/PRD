import {
  DEFAULT_BASE_PATH,
  isPlatformBasePath,
  ORIGINAL_CRMP_BASE_PATH,
  PUBLIC_ADMIN_ORIGIN as SITE_ORIGIN,
  PUBLIC_ADMIN_URL as SITE_ADMIN_URL,
  PUBLIC_MESSENGER_URL as SITE_MESSENGER_URL,
  PUBLIC_CS_DESK_URL as SITE_CS_DESK_URL,
  PUBLIC_CS_DASHBOARD_URL as SITE_CS_DASHBOARD_URL,
  PUBLIC_CS_LOG_URL as SITE_CS_LOG_URL,
  PUBLIC_CS_PORTAL_URL as SITE_CS_PORTAL_URL,
} from "@/lib/platform-site";

/** True when building the GitHub Pages static snapshot. */
export function isStaticExport() {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" || process.env.STATIC_EXPORT === "1";
}

/**
 * True on the public GitHub Pages host even if an older snapshot missed
 * `NEXT_PUBLIC_STATIC_EXPORT` in the client bundle. Live mutations still
 * belong on localhost:3000.
 */
export function isPublicSnapshot() {
  if (isStaticExport()) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const path = window.location.pathname;
  if (host.endsWith("github.io")) return true;
  if (isPlatformBasePath(path)) return true;
  return false;
}

/** Prefix `/api/...` with the Pages basePath when the snapshot is public. */
export function publicApiPath(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return suffix;
  if (!isPublicSnapshot()) return suffix;
  return `${publicBasePath()}${suffix}`;
}

export const PUBLIC_ADMIN_ORIGIN = SITE_ORIGIN;
export const PUBLIC_ADMIN_URL = SITE_ADMIN_URL;
export const PUBLIC_MESSENGER_URL = SITE_MESSENGER_URL;
export const PUBLIC_CS_DESK_URL = SITE_CS_DESK_URL;
export const PUBLIC_CS_DASHBOARD_URL = SITE_CS_DASHBOARD_URL;
export const PUBLIC_CS_LOG_URL = SITE_CS_LOG_URL;
export const PUBLIC_CS_PORTAL_URL = SITE_CS_PORTAL_URL;

export function publicBasePath() {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
  if (raw) return raw.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.includes(DEFAULT_BASE_PATH)) return DEFAULT_BASE_PATH;
    if (path.includes(ORIGINAL_CRMP_BASE_PATH)) return ORIGINAL_CRMP_BASE_PATH;
  }
  return DEFAULT_BASE_PATH;
}

export function publicAdminHref(path = "/admin/") {
  const base = publicBasePath();
  let suffix = path.startsWith("/") ? path : `/${path}`;
  const hashIdx = suffix.indexOf("#");
  const hash = hashIdx >= 0 ? suffix.slice(hashIdx) : "";
  let pathname = hashIdx >= 0 ? suffix.slice(0, hashIdx) : suffix;
  if (isStaticExport() && !pathname.endsWith("/")) pathname += "/";
  return `${base}${pathname}${hash}`;
}

export async function readSearchParams<T extends Record<string, string | undefined>>(
  searchParams?: Promise<T>
): Promise<Partial<T>> {
  if (isStaticExport() || !searchParams) return {};
  return searchParams;
}
