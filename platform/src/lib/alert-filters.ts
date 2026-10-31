import type { AlertTrackerPack } from "@/lib/alert-tracker";

export type AlertTimeWindow = "all" | "24h";
export type AlertSeverityFilter = "all" | "high" | "medium" | "low";
export type AlertProductFilter = "all" | "CFD" | "PERPS";
export type AlertSortKey =
  | "newest"
  | "oldest"
  | "severity_desc"
  | "severity_asc"
  | "product"
  | "domain";

export type AlertFilterState = {
  time: AlertTimeWindow;
  unresolvedOnly: boolean;
  severity: AlertSeverityFilter;
  product: AlertProductFilter;
  domain: string; // "all" or domain_code
  sort: AlertSortKey;
  monitorId: string;
};

export const DEFAULT_ALERT_FILTERS: AlertFilterState = {
  time: "all",
  unresolvedOnly: false,
  severity: "all",
  product: "all",
  domain: "all",
  sort: "newest",
  monitorId: "",
};

const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 0,
  BREACH: 1,
  WARN: 2,
  INFO: 3,
};

export function severityBucket(severity: string): "high" | "medium" | "low" {
  const s = severity.toUpperCase();
  if (s === "CRITICAL" || s === "BREACH") return "high";
  if (s === "WARN") return "medium";
  return "low";
}

export function matchesProduct(product: string, filter: AlertProductFilter): boolean {
  if (filter === "all") return true;
  const p = product.toUpperCase();
  if (filter === "CFD") return p.includes("CFD");
  if (filter === "PERPS") return p.includes("CRYPTO") || p.includes("PERP");
  return true;
}

function parseAlertTime(raw: string): number {
  // SQLite datetime('now') → "YYYY-MM-DD HH:MM:SS" (UTC-ish)
  const t = Date.parse(raw.includes("T") ? raw : raw.replace(" ", "T") + "Z");
  return Number.isFinite(t) ? t : 0;
}

export function isUnresolvedAlert(pack: AlertTrackerPack): boolean {
  const status = (pack.alert_status || "").toUpperCase();
  if (status === "CLOSED" || status === "RESOLVED") return false;
  const ticket = (pack.ticket_status || "").toUpperCase();
  if (ticket === "CLOSED" || ticket === "RESOLVED") return false;
  return true;
}

export function filterAndSortAlerts(
  packs: AlertTrackerPack[],
  filters: AlertFilterState
): AlertTrackerPack[] {
  const now = Date.now();
  const cutoff24 = now - 24 * 60 * 60 * 1000;

  let list = packs.filter((p) => {
    if (filters.monitorId && p.monitor_id !== filters.monitorId) return false;
    if (filters.unresolvedOnly && !isUnresolvedAlert(p)) return false;
    if (filters.time === "24h") {
      const ts = parseAlertTime(p.created_at);
      if (!ts || ts < cutoff24) return false;
    }
    if (filters.severity !== "all" && severityBucket(p.severity) !== filters.severity) return false;
    if (!matchesProduct(p.product, filters.product)) return false;
    if (filters.domain !== "all" && p.domain_code !== filters.domain) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return parseAlertTime(a.created_at) - parseAlertTime(b.created_at);
      case "severity_desc":
        return (
          (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
          parseAlertTime(b.created_at) - parseAlertTime(a.created_at)
        );
      case "severity_asc":
        return (
          (SEVERITY_RANK[b.severity] ?? 9) - (SEVERITY_RANK[a.severity] ?? 9) ||
          parseAlertTime(b.created_at) - parseAlertTime(a.created_at)
        );
      case "product":
        return a.product.localeCompare(b.product) || parseAlertTime(b.created_at) - parseAlertTime(a.created_at);
      case "domain":
        return (
          a.domain_code.localeCompare(b.domain_code) ||
          parseAlertTime(b.created_at) - parseAlertTime(a.created_at)
        );
      case "newest":
      default:
        return parseAlertTime(b.created_at) - parseAlertTime(a.created_at);
    }
  });

  return list;
}

export function uniqueDomains(packs: AlertTrackerPack[]): string[] {
  return [...new Set(packs.map((p) => p.domain_code).filter(Boolean))].sort();
}
