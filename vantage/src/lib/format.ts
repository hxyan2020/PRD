import type { Locale } from "./i18n/locale";
import { translate } from "./i18n/messages";

export function formatDateTime(
  iso: string | null | undefined,
  locale: Locale = "en",
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
      timeZone: "UTC",
      year: "numeric",
      month: locale === "zh" ? "numeric" : "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date) + " UTC"
  );
}

export function formatRange(start: string, end: string, locale: Locale = "en"): string {
  return `${formatDateTime(start, locale)} → ${formatDateTime(end, locale)}`;
}

export function categoryLabel(category: string, locale: Locale = "en"): string {
  switch (category) {
    case "listing":
      return translate(locale, "categoryListing");
    case "product":
      return translate(locale, "categoryProduct");
    case "regulation":
      return translate(locale, "categoryRegulation");
    case "risk_tools":
      return translate(locale, "categoryRisk");
    default:
      return category;
  }
}

export function sectorLabel(sector: string, locale: Locale = "en"): string {
  switch (sector) {
    case "banks":
      return translate(locale, "sectorBanks");
    case "brokers":
      return translate(locale, "sectorBrokers");
    case "crypto":
      return translate(locale, "sectorCrypto");
    default:
      return sector;
  }
}

export function sourceKindLabel(kind: string, locale: Locale = "en"): string {
  switch (kind) {
    case "regulator":
      return translate(locale, "kindRegulator");
    case "official_entity":
      return translate(locale, "kindOfficial");
    case "industry_news":
      return translate(locale, "kindIndustry");
    case "vendor":
      return translate(locale, "kindVendor");
    case "aggregator":
      return translate(locale, "kindAggregator");
    default:
      return kind.replace("_", " ");
  }
}

export function healthLabel(status: string, locale: Locale = "en"): string {
  if (status === "healthy") return translate(locale, "healthy");
  if (status === "degraded") return translate(locale, "degraded");
  if (status === "down") return translate(locale, "down");
  return status;
}

export function windowLabel(kind: string, fallback: string, locale: Locale = "en"): string {
  if (kind === "weekend") return translate(locale, "windowWeekend");
  if (kind === "daily") return translate(locale, "windowDaily");
  return fallback;
}
