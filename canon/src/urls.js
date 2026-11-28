export function basePath() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (env && env.BASE_URL) || "/";
}

export function publicUrl(path = "") {
  const base = basePath();
  const trimmed = String(path || "").replace(/^\//, "");
  if (!trimmed) return base;
  if (trimmed.startsWith("#")) return `${base}${trimmed}`;
  return `${base}${trimmed}`;
}

export function siteUrl(location = globalThis.location) {
  if (!location?.origin) return "/";
  const path = location.pathname || "/";
  if (path.endsWith("/")) return `${location.origin}${path}`;
  if (/\/index\.html$/i.test(path)) {
    return `${location.origin}${path.replace(/index\.html$/i, "")}`;
  }
  return `${location.origin}${path.replace(/[^/]+$/, "")}`;
}

export const CANON_PUBLIC_URL = "https://canon-ivory.vercel.app/";
export const GITHUB_PAGES_URL = "https://hxyan2020.github.io/PRD/";
