import type { PriceZone, ProductInput, RegionalMarket } from "./types";
import { REGION_LABEL } from "./types";

/** Minimum gross margin after landed cost (ads/returns still come out of this). */
const MIN_GROSS = 0.38;

export function charmPrice(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n < 15) return Math.round(n * 2) / 2;
  if (n < 40) return Math.round(n);
  const step = n < 220 ? 5 : 10;
  return Math.round(n / step) * step;
}

function marketAnchor(market: RegionalMarket): number {
  const whitespace = !market.exists || market.status === "whitespace";
  if (whitespace) return market.projectedRetailUsd;
  return market.avgRetailUsd || market.projectedRetailUsd;
}

export function priceZoneForMarket(factoryUsd: number, market: RegionalMarket): PriceZone {
  const landed = market.landedCostUsd;
  const floorRaw = landed / (1 - MIN_GROSS);
  const whitespace = !market.exists || market.status === "whitespace";
  const anchor = marketAnchor(market);

  let ceilingRaw: number;
  if (whitespace) ceilingRaw = market.projectedRetailUsd * 1.2;
  else if (market.status === "thin") ceilingRaw = anchor * 1.18;
  else if (market.status === "competitive") ceilingRaw = anchor * 1.05;
  else ceilingRaw = anchor * 0.98;

  let recommendedRaw: number;
  if (whitespace) recommendedRaw = market.projectedRetailUsd;
  else if (market.status === "thin") recommendedRaw = anchor * 1.06;
  else if (market.status === "competitive") recommendedRaw = anchor * 0.93;
  else recommendedRaw = Math.min(market.lowRetailUsd || anchor, anchor) * 0.9;

  const tight = floorRaw > ceilingRaw;
  const floorUsd = charmPrice(floorRaw);
  const ceilingUsd = charmPrice(Math.max(ceilingRaw, floorRaw * 0.98));
  let recommendedUsd = charmPrice(recommendedRaw);
  if (tight) {
    recommendedUsd = charmPrice(Math.max(anchor, landed * 1.45));
  } else {
    recommendedUsd = Math.min(Math.max(recommendedUsd, floorUsd), ceilingUsd);
  }

  const grossMarginPct =
    recommendedUsd > 0 ? Math.round(((recommendedUsd - landed) / recommendedUsd) * 1000) / 10 : 0;

  const regionName = REGION_LABEL[market.region];
  let rationale: string;
  if (tight) {
    rationale = `${regionName} retail already sits near landed cost ($${landed}). The zone is squeezed — compete on kit/bundle, not list price.`;
  } else if (whitespace) {
    rationale = `${regionName} is whitespace. Landed $${landed} from a $${factoryUsd} factory unit supports DTC $${recommendedUsd} (floor $${floorUsd}, ceiling $${ceilingUsd}) off category comps.`;
  } else if (market.status === "thin") {
    rationale = `${regionName} listings are thin. Sit at a light premium to the $${anchor} average; few sellers to undercut you.`;
  } else if (market.status === "competitive") {
    rationale = `${regionName} is competitive. Shade the $${anchor} average without dropping through the $${floorUsd} floor (factory $${factoryUsd} + landed $${landed}).`;
  } else {
    rationale = `${regionName} is saturated. Stay close to the low end ($${market.lowRetailUsd || anchor}) or skip this region.`;
  }

  return {
    region: market.region,
    factoryUsd,
    landedUsd: landed,
    floorUsd,
    recommendedUsd,
    ceilingUsd,
    grossMarginPct,
    tight,
    rationale,
  };
}

export function priceZonesFor(product: ProductInput): PriceZone[] {
  const factoryUsd = product.factory[0]?.unitPriceUsd ?? 0;
  return product.markets.map((m) => priceZoneForMarket(factoryUsd, m));
}

export function zoneForRegion(zones: PriceZone[], region: string): PriceZone | undefined {
  return zones.find((z) => z.region === region) ?? zones[0];
}
