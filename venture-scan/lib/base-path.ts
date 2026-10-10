/** Prefix for fetch() / <a href> on static hosts that use BASE_PATH (GitHub Pages). */
export function withBase(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function isStaticMode(): boolean {
  return process.env.NEXT_PUBLIC_STATIC === "1" || process.env.STATIC_EXPORT === "1";
}

export const PERMANENT_URL = "https://hxyan2020.github.io/PRD/venture-scan/";
