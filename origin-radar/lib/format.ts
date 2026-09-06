import type { GapStatus, RegionId, ScoredProduct } from "./types";
import { REGION_LABEL } from "./types";

export function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 20 ? 2 : 0,
  }).format(n);
}

export function cny(n: number): string {
  return `¥${Math.round(n).toLocaleString("en-US")}`;
}

export function compact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n)}%`;
}

export function statusLabel(status: GapStatus, exists: boolean): string {
  if (!exists || status === "whitespace") return "Whitespace";
  if (status === "thin") return "Thin listings";
  if (status === "competitive") return "Exists · competitive";
  return "Saturated";
}

export function regionShort(id: RegionId): string {
  return { na: "NA", sea: "SEA", eu: "EU" }[id];
}

export function regionName(id: RegionId): string {
  return REGION_LABEL[id];
}

export function scoreTone(score: number): string {
  if (score >= 78) return "hot";
  if (score >= 64) return "warm";
  return "cool";
}

export function productHref(slug: string): string {
  return `/products/${slug}`;
}

export function searchHref(product: ScoredProduct): string {
  const source = product.factory.find((f) => f.platform === "1688") ?? product.factory[0];
  return source?.searchUrl ?? "#";
}
