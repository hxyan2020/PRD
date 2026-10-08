/** Brand logo + health helpers for Market Intelligence sources. */

export type SourceHealth = "HEALTHY" | "DEGRADED" | "DOWN" | "DISABLED" | "UNKNOWN";

/** Explicit logo host overrides when the source URL host is not the brand domain. */
const LOGO_HOST: Record<string, string> = {
  reuters_markets: "reuters.com",
  bloomberg_fx: "bloomberg.com",
  fed_press: "federalreserve.gov",
  ecb_press: "ecb.europa.eu",
  boe_news: "bankofengland.co.uk",
  pboc_en: "pbc.gov.cn",
  opec_press: "opec.org",
  eia_petroleum: "eia.gov",
  cftc_cot: "cftc.gov",
  binance_ann: "binance.com",
  coinbase_blog: "coinbase.com",
  coindesk: "coindesk.com",
  x_fxhedge: "x.com",
  x_crypto: "x.com",
  kitco_gold: "kitco.com",
  cmegroup_alerts: "cmegroup.com",
  geopol_wire: "reuters.com",
};

const BRAND_TINT: Record<string, string> = {
  reuters_markets: "bg-orange-100 text-orange-900 border-orange-200",
  bloomberg_fx: "bg-slate-900 text-white border-slate-700",
  fed_press: "bg-blue-100 text-blue-900 border-blue-200",
  ecb_press: "bg-indigo-100 text-indigo-900 border-indigo-200",
  boe_news: "bg-rose-100 text-rose-900 border-rose-200",
  pboc_en: "bg-red-100 text-red-900 border-red-200",
  opec_press: "bg-emerald-100 text-emerald-900 border-emerald-200",
  eia_petroleum: "bg-sky-100 text-sky-900 border-sky-200",
  cftc_cot: "bg-blue-100 text-blue-950 border-blue-200",
  binance_ann: "bg-amber-100 text-amber-950 border-amber-200",
  coinbase_blog: "bg-blue-100 text-blue-800 border-blue-200",
  coindesk: "bg-zinc-900 text-white border-zinc-700",
  x_fxhedge: "bg-zinc-900 text-white border-zinc-700",
  x_crypto: "bg-zinc-900 text-white border-zinc-700",
  kitco_gold: "bg-yellow-100 text-yellow-950 border-yellow-300",
  cmegroup_alerts: "bg-sky-100 text-sky-950 border-sky-200",
  geopol_wire: "bg-orange-100 text-orange-900 border-orange-200",
};

/** Prototype demo health so the Sources table is not uniformly green. */
export const DEMO_SOURCE_HEALTH: Record<string, { status: SourceHealth; detail: string }> = {
  pboc_en: { status: "DEGRADED", detail: "Intermittent TLS / slow response from CN edge" },
  x_fxhedge: { status: "DEGRADED", detail: "Rate-limited social scrape; partial sample" },
  x_crypto: { status: "DEGRADED", detail: "Rate-limited social scrape; partial sample" },
  opec_press: { status: "DOWN", detail: "Last 3 HEAD checks timed out (>2.5s)" },
  geopol_wire: { status: "HEALTHY", detail: "Aggregated wire OK" },
};

export function logoHostForSource(sourceKey: string, url: string | null | undefined): string {
  if (LOGO_HOST[sourceKey]) return LOGO_HOST[sourceKey];
  if (!url) return "example.com";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "example.com";
  }
}

export function faviconUrlForSource(sourceKey: string, url: string | null | undefined): string {
  const host = logoHostForSource(sourceKey, url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

export function brandTint(sourceKey: string): string {
  return BRAND_TINT[sourceKey] || "bg-slate-100 text-slate-800 border-slate-200";
}

export function brandInitials(name: string): string {
  const parts = name.replace(/[—–|/]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function parseSqliteTime(raw: string | null | undefined): number {
  if (!raw) return 0;
  const t = Date.parse(raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`);
  return Number.isFinite(t) ? t : 0;
}

export function resolveSourceHealth(input: {
  enabled: number;
  last_scraped_at: string | null;
  health_status?: string | null;
  source_key?: string;
}): { status: SourceHealth; detail: string } {
  if (!input.enabled) {
    return { status: "DISABLED", detail: "Source disabled in catalog" };
  }
  const stored = (input.health_status || "").toUpperCase() as SourceHealth;
  if (stored && ["HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"].includes(stored)) {
    return { status: stored, detail: "" };
  }
  if (input.source_key && DEMO_SOURCE_HEALTH[input.source_key]) {
    return DEMO_SOURCE_HEALTH[input.source_key];
  }
  const ts = parseSqliteTime(input.last_scraped_at);
  if (!ts) return { status: "UNKNOWN", detail: "Never scraped" };
  const ageMin = (Date.now() - ts) / 60000;
  if (ageMin <= 30) return { status: "HEALTHY", detail: "Fresh within 30m" };
  if (ageMin <= 180) return { status: "DEGRADED", detail: "Stale scrape (>30m)" };
  return { status: "DOWN", detail: "No successful scrape in 3h" };
}
