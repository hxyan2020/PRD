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
export const PUBLIC_MESSENGER_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/messenger/`;

export function publicBasePath() {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
  return raw.replace(/\/$/, "");
}

export function publicAdminHref(path = "/admin/") {
  const base = publicBasePath();
  let suffix = path.startsWith("/") ? path : `/${path}`;
  if (isStaticExport() && !suffix.endsWith("/")) suffix += "/";
  return `${base}${suffix}`;
}

export async function readSearchParams<T extends Record<string, string | undefined>>(
  searchParams?: Promise<T>
): Promise<Partial<T>> {
  if (isStaticExport() || !searchParams) return {};
  return searchParams;
}
