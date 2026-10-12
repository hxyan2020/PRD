import type { ProductMove } from "@/lib/market-intel/sources";

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

/** Canonical messenger card for Market Intelligence findings. */
export function formatMarketIntelMessage(f: FindingMessageInput): string {
  const productsLine = f.products
    .map((p) => `${p.product} (${p.asset_class}) → ${dirLabel(p.direction)}`)
    .join("; ");
  const sourcesLine = f.sources.map((s) => `${s.name}: ${s.url}`).join(" | ");

  return [
    "📡 MARKET INTELLIGENCE ALERT",
    f.finding_id ? `ID: ${f.finding_id}` : null,
    "",
    `(i) What event: ${f.event_title}`,
    f.event_summary ? `    Summary: ${f.event_summary}` : null,
    `(ii) Affected countries / geography: ${f.geography}`,
    `(iii) Severity: ${f.severity}`,
    `(iv) Affected Vantage products & direction: ${productsLine}`,
    `(v) Timestamp: ${f.timestamp}`,
    `(vi) Data sources with link: ${sourcesLine}`,
  ]
    .filter(Boolean)
    .join("\n");
}
