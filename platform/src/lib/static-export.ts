/** True when building the GitHub Pages static snapshot. */
export function isStaticExport() {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" || process.env.STATIC_EXPORT === "1";
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
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function readSearchParams<T extends Record<string, string | undefined>>(
  searchParams?: Promise<T>
): Promise<Partial<T>> {
  if (isStaticExport() || !searchParams) return {};
  return searchParams;
}
