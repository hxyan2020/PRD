/** Prefix for fetch() / <a href> on static hosts that use BASE_PATH (GitHub Pages). */
export function withBase(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
