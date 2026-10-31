import type { ProductMove } from "@/lib/market-intel/sources";
import { resolveFindingSources } from "@/lib/market-intel/article-links";

export type FindingMessageInput = {
  event_title: string;
  event_summary?: string;
  geography: string;
  severity: string;
  products: ProductMove[];
  timestamp: string;
  sources: Array<{ name: string; url: string }>;
  finding_id?: string;
};

function dirLabel(d: ProductMove["direction"]) {
  if (d === "UP") return "price up";
  if (d === "DOWN") return "price down";
  return "volatile / two-way";
}

function impactLabel(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "Critical";
    case "BREACH":
      return "High impact";
    case "WARN":
      return "Elevated";
    default:
      return "Watch";
  }
}

/** Canonical messenger card for Market Intelligence findings. */
export function formatMarketIntelMessage(f: FindingMessageInput): string {
  const productsLine = f.products
    .map((p) => `${p.product} (${p.asset_class}) → ${dirLabel(p.direction)}`)
    .join("; ");
  const links = resolveFindingSources(f.event_title, JSON.stringify(f.sources));
  const sourcesLine = links.map((s) => `${s.name}: ${s.url}`).join(" | ");

  return [
    "📡 MARKET INTELLIGENCE ALERT",
    f.finding_id ? `ID: ${f.finding_id}` : null,
    "",
    `Event: ${f.event_title}`,
    f.event_summary ? `Summary: ${f.event_summary}` : null,
    `Affected countries / geography: ${f.geography}`,
    `Impact: ${impactLabel(f.severity)}`,
    `Affected Vantage products & direction: ${productsLine}`,
    `Timestamp: ${f.timestamp}`,
    `Data sources: ${sourcesLine}`,
  ]
    .filter(Boolean)
    .join("\n");
}
