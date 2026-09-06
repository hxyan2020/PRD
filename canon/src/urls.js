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

export function siteUrl(location = globalThis.location, base = basePath()) {
  const origin = location?.origin || "";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  if (!origin) return normalized;
  if (normalized === "/") return `${origin}/`;
  return `${origin}${normalized}`;
}

export const GITHUB_PAGES_URL = "https://hxyan2020.github.io/PRD/";
