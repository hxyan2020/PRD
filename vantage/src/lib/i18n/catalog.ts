import names from "../../../data/i18n-names.json";
import type { Locale } from "./locale";

type Catalog = {
  entities: Record<string, string>;
  toolSummaries: Record<string, string>;
  toolCategories: Record<string, string>;
  toolUse: Record<string, string>;
  catalogMeta: Record<string, string>;
  sources: Record<string, string>;
};

const catalog = names as Catalog;

export function entityName(id: string, fallback: string, locale: Locale): string {
  if (locale !== "zh") return fallback;
  return catalog.entities[id] ?? fallback;
}

export function sourceName(id: string, fallback: string, locale: Locale): string {
  if (locale !== "zh") return fallback;
  return catalog.sources[id] ?? fallback;
}

export function toolSummary(id: string, fallback: string, locale: Locale): string {
  if (locale !== "zh") return fallback;
  return catalog.toolSummaries[id] ?? fallback;
}

export function toolCategory(value: string, locale: Locale): string {
  if (locale !== "zh") return value;
  return catalog.toolCategories[value] ?? value;
}

export function toolUse(value: string, locale: Locale): string {
  if (locale !== "zh") return value;
  return catalog.toolUse[value] ?? value;
}

export function rankingNote(sector: "banks" | "brokers" | "exchanges", fallback: string, locale: Locale): string {
  if (locale !== "zh") return fallback;
  return catalog.catalogMeta[sector] ?? fallback;
}
