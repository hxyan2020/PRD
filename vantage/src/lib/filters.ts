import type { NewsCategory, NewsItem, Sector } from "./types";

export function parseCategory(
  value: string | undefined,
): "all" | NewsCategory {
  if (
    value === "listing" ||
    value === "product" ||
    value === "regulation" ||
    value === "risk_tools"
  ) {
    return value;
  }
  return "all";
}

export function parseSector(value: string | undefined): "all" | Sector {
  if (value === "banks" || value === "brokers" || value === "crypto") {
    return value;
  }
  return "all";
}

export function itemMatchesFilters(
  item: NewsItem,
  category: "all" | NewsCategory,
  sector: "all" | Sector,
  query = "",
): boolean {
  if (category !== "all" && item.category !== category) return false;
  if (sector !== "all" && !item.sectors.includes(sector)) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${item.caption} ${item.captionZh ?? ""} ${item.keyPoints.join(" ")} ${(item.keyPointsZh ?? []).join(" ")} ${item.jurisdictions.join(" ")}`.toLowerCase();
  return hay.includes(needle);
}

export function countNews(
  items: NewsItem[],
  category: "all" | NewsCategory = "all",
  sector: "all" | Sector = "all",
  query = "",
): number {
  return items.filter((item) => itemMatchesFilters(item, category, sector, query)).length;
}
