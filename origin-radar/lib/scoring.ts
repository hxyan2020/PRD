import type {
  GapStatus,
  ProductInput,
  RegionId,
  RegionalMarket,
  ScoreBreakdown,
  ScoredProduct,
} from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function factoryTrendScore(product: ProductInput): number {
  const primary =
    product.factory.find((f) => f.platform === "1688") ?? product.factory[0];
  if (!primary) return 0;
  const volume = clamp((Math.log10(primary.orders30d + 1) / 5) * 70);
  const velocity = clamp(50 + primary.velocityWoW);
  const listingDepth = clamp(Math.log10(primary.listingCount + 1) * 22);
  return clamp(volume * 0.45 + velocity * 0.35 + listingDepth * 0.2);
}

export function socialHeatScore(product: ProductInput): number {
  const weights: Record<string, number> = {
    tiktok: 0.38,
    xiaohongshu: 0.32,
    instagram: 0.12,
    youtube: 0.1,
    x: 0.08,
  };
  let total = 0;
  let weightSum = 0;
  for (const signal of product.social) {
    const w = weights[signal.platform] ?? 0.1;
    const mention = clamp(Math.log10(signal.mentions7d + 1) * 28);
    const views = clamp(Math.log10(signal.views7d + 1) * 16);
    const trendBoost =
      signal.trend === "rising" ? 12 : signal.trend === "peak" ? 4 : -8;
    total += w * clamp(mention * 0.45 + views * 0.35 + signal.engagementRate * 8 + trendBoost);
    weightSum += w;
  }
  return weightSum === 0 ? 0 : clamp(total / weightSum);
}

export function searchDemandScore(product: ProductInput): number {
  const heat = product.search;
  const spark =
    heat.sparkline.length >= 2
      ? heat.sparkline[heat.sparkline.length - 1] - heat.sparkline[0]
      : 0;
  const countries = Object.values(heat.byCountry);
  const regionalAvg = avg(countries);
  const rising = clamp(50 + heat.risingPct / 8);
  return clamp(heat.globalIndex * 0.35 + regionalAvg * 0.35 + rising * 0.15 + clamp(50 + spark) * 0.15);
}

export function gapStatusScore(market: RegionalMarket): number {
  if (!market.exists || market.status === "whitespace") return 100;
  const margin = market.marginPct ?? 0;
  if (market.status === "thin") return clamp(72 + margin * 0.22);
  if (market.status === "competitive") return clamp(margin * 0.95);
  return clamp(margin * 0.42);
}

export function marketGapScore(product: ProductInput): number {
  if (product.markets.length === 0) return 0;
  const scores = product.markets.map(gapStatusScore);
  const whitespaceBonus = product.markets.some((m) => !m.exists || m.status === "whitespace")
    ? 8
    : 0;
  return clamp(avg(scores) + whitespaceBonus);
}

export function supplyEaseScore(product: ProductInput): number {
  const primary =
    product.factory.find((f) => f.platform === "1688") ?? product.factory[0];
  if (!primary) return 0;
  const suppliers = clamp(Math.log10(primary.supplierCount + 1) * 34);
  const verified = clamp((primary.verifiedFactories / Math.max(primary.supplierCount, 1)) * 100);
  const moq = primary.moq <= 2 ? 100 : primary.moq <= 10 ? 78 : primary.moq <= 50 ? 55 : 30;
  return clamp(suppliers * 0.45 + verified * 0.2 + moq * 0.35);
}

export function scoreProduct(product: ProductInput): ScoreBreakdown {
  const factoryTrend = factoryTrendScore(product);
  const socialHeat = socialHeatScore(product);
  const searchDemand = searchDemandScore(product);
  const marketGap = marketGapScore(product);
  const supplyEase = supplyEaseScore(product);
  const total = clamp(
    factoryTrend * 0.2 +
      socialHeat * 0.2 +
      searchDemand * 0.18 +
      marketGap * 0.28 +
      supplyEase * 0.14,
  );
  return {
    factoryTrend: round1(factoryTrend),
    socialHeat: round1(socialHeat),
    searchDemand: round1(searchDemand),
    marketGap: round1(marketGap),
    supplyEase: round1(supplyEase),
    total: round1(total),
  };
}

export function bestRegion(product: ProductInput): RegionId {
  const ranked = [...product.markets].sort((a, b) => {
    const gapDelta = gapStatusScore(b) - gapStatusScore(a);
    if (Math.abs(gapDelta) > 4) return gapDelta;
    return (b.marginPct ?? 70) - (a.marginPct ?? 70);
  });
  return ranked[0]?.region ?? "na";
}

export function whitespaceRegions(product: ProductInput): RegionId[] {
  return product.markets
    .filter((m) => !m.exists || m.status === "whitespace")
    .map((m) => m.region);
}

export function maxMargin(product: ProductInput): number | null {
  const margins = product.markets
    .map((m) => m.marginPct)
    .filter((n): n is number => n != null);
  return margins.length ? Math.max(...margins) : null;
}

export function toScoredProduct(product: ProductInput): ScoredProduct {
  return {
    ...product,
    score: scoreProduct(product),
    bestRegion: bestRegion(product),
    whitespaceRegions: whitespaceRegions(product),
    maxMarginPct: maxMargin(product),
  };
}

export function statusRank(status: GapStatus): number {
  return { whitespace: 0, thin: 1, competitive: 2, saturated: 3 }[status];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export { clamp, avg };
