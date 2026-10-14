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
  if (path.includes("/PRD/crmp-admin")) return true;
  return false;
}

/** Prefix `/api/...` with the Pages basePath when the snapshot is public. */
export function publicApiPath(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return suffix;
  if (!isPublicSnapshot()) return suffix;
  return `${publicBasePath()}${suffix}`;
}

export const PUBLIC_ADMIN_ORIGIN = "https://hxyan2020.github.io/PRD/crmp-admin";
export const PUBLIC_ADMIN_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/`;
export const PUBLIC_EXCHANGE_URL = `${PUBLIC_ADMIN_ORIGIN}/exchange/`;
export const PUBLIC_MESSENGER_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/messenger/`;

export function publicBasePath() {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
  return raw.replace(/\/$/, "");
}

export function publicAdminHref(path = "/admin/") {
  const base = publicBasePath();
  const raw = path.startsWith("/") ? path : `/${path}`;
  const hashIdx = raw.indexOf("#");
  const hash = hashIdx >= 0 ? raw.slice(hashIdx) : "";
  let pathname = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
  if (isStaticExport() && !pathname.endsWith("/")) pathname += "/";
  return `${base}${pathname}${hash}`;
}

/** Pages-safe href under the crypto-exchange mount (`/exchange…`). */
export function publicExchangeHref(path = "/exchange/") {
  const raw = path.startsWith("/") ? path : `/${path}`;
  const suffix = raw.startsWith("/exchange")
    ? raw
    : raw === "/"
      ? "/exchange/"
      : `/exchange${raw}`;
  return publicAdminHref(suffix);
}

export async function readSearchParams<T extends Record<string, string | undefined>>(
  searchParams?: Promise<T>
): Promise<Partial<T>> {
  if (isStaticExport() || !searchParams) return {};
  return searchParams;
}
