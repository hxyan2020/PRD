export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date) + " UTC";
}

export function formatRange(start: string, end: string): string {
  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

export function categoryLabel(category: string): string {
  switch (category) {
    case "listing":
      return "New listing / instrument";
    case "product":
      return "Product / feature";
    case "regulation":
      return "Regulation";
    case "risk_tools":
      return "Risk tools";
    default:
      return category;
  }
}

export function sectorLabel(sector: string): string {
  switch (sector) {
    case "banks":
      return "Banks";
    case "brokers":
      return "Brokers";
    case "crypto":
      return "Crypto exchanges";
    default:
      return sector;
  }
}
