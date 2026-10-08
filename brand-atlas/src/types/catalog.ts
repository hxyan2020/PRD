export type CategoryKind = "brand" | "nature" | "food";

export interface CatalogCategory {
  id: string;
  label: string;
  blurb: string;
  kind: CategoryKind;
  itemCount: number;
}

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  categoryId: string;
  origin: string | null;
  tags: string[];
  summary: string;
  facts: Record<string, string>;
  coverHue: number;
  /** Local relative path under site base, e.g. marks/cars__toyota.svg */
  mark?: string | null;
  /** Simple Icons slug when a public brand mark exists */
  markIcon?: string | null;
  sort: number;
  status: string;
}

export interface CatalogMeta {
  name: string;
  version: number;
  generatedAt: string;
  lastRefreshAt: string;
  nextRefreshAt: string;
  refreshCadence: string;
  itemCount: number;
  categoryCount: number;
  note: string;
}

export interface Catalog {
  meta: CatalogMeta;
  categories: CatalogCategory[];
  items: CatalogItem[];
}

export interface Guess {
  itemId: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  confidence: number;
  reason: string;
}

export type IdentifyResult =
  | { status: "unclear"; message: string }
  | { status: "guesses"; guesses: Guess[]; message: string };

export type RevealMode = "locked" | "sneak" | "unlocked";
