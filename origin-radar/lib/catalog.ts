import { products } from "./catalog-data";
import { toScoredProduct } from "./scoring";
import type { RegionId, ScoredProduct } from "./types";

export { CATALOG_AS_OF } from "./catalog-data";

let cache: ScoredProduct[] | null = null;

export function getProducts(): ScoredProduct[] {
  if (!cache) {
    cache = products.map(toScoredProduct).sort((a, b) => b.score.total - a.score.total);
  }
  return cache;
}

export function getProduct(slug: string): ScoredProduct | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function categories(): string[] {
  return [...new Set(getProducts().map((p) => p.category))].sort();
}

export type SortKey = "score" | "gap" | "margin" | "social" | "search";

export function filterProducts(opts: {
  query?: string;
  region?: RegionId | "all";
  gap?: "all" | "whitespace" | "exists";
  category?: string;
  sort?: SortKey;
}): ScoredProduct[] {
  const { query = "", region = "all", gap = "all", category = "all", sort = "score" } = opts;
  const q = query.trim().toLowerCase();
  let list = getProducts().filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (q) {
      const hay = `${p.name} ${p.nameZh} ${p.category} ${p.tags.join(" ")} ${p.summary}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (region !== "all") {
      const m = p.markets.find((x) => x.region === region);
      if (!m) return false;
      if (gap === "whitespace" && m.exists && m.status !== "whitespace") return false;
      if (gap === "exists" && (!m.exists || m.status === "whitespace")) return false;
    } else if (gap === "whitespace") {
      if (p.whitespaceRegions.length === 0) return false;
    } else if (gap === "exists") {
      if (p.whitespaceRegions.length === p.markets.length) return false;
    }
    return true;
  });

  list = [...list].sort((a, b) => {
    if (sort === "gap") return b.score.marketGap - a.score.marketGap;
    if (sort === "social") return b.score.socialHeat - a.score.socialHeat;
    if (sort === "search") return b.score.searchDemand - a.score.searchDemand;
    if (sort === "margin") return (b.maxMarginPct ?? -1) - (a.maxMarginPct ?? -1);
    return b.score.total - a.score.total;
  });
  return list;
}

export function stats() {
  const all = getProducts();
  const whitespace = all.filter((p) => p.whitespaceRegions.length > 0).length;
  const margins = all.flatMap((p) => p.markets.map((m) => m.marginPct).filter((n): n is number => n != null));
  const avgMargin = margins.length ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : 0;
  const suppliers = all.reduce((n, p) => n + (p.factory[0]?.supplierCount ?? 0), 0);
  return {
    products: all.length,
    whitespace,
    avgMargin,
    suppliers,
    hot: all.filter((p) => p.score.total >= 70).length,
  };
}

export function socialFeed() {
  return getProducts()
    .flatMap((p) =>
      p.social.flatMap((s) =>
        s.samplePosts.map((post) => ({
          ...post,
          platform: s.platform,
          hashtags: s.hashtags,
          productSlug: p.slug,
          productName: p.name,
          trend: s.trend,
        })),
      ),
    )
    .sort((a, b) => b.time.localeCompare(a.time));
}
