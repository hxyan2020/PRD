import { getProduct } from "./catalog";
import {
  FACTORY_EXTRAS,
  descriptionHtml,
  factoryTerms,
  logisticsFor,
  priceTiers,
  retailTarget,
} from "./factory-packs";
import type { SourcedImage, SourcedProduct } from "./storefront-types";

export interface LiveOverlay {
  images?: string[];
  url?: string;
  offerId?: string;
  titleZh?: string;
}

/** Browser-safe 1688-shaped listing. Uses the catalog slug as a stable id. */
export function buildFactoryListing(
  slug: string,
  opts: { live?: LiveOverlay | null; now?: Date } = {},
): SourcedProduct {
  const signal = getProduct(slug);
  if (!signal) throw new Error(`Unknown signal ${slug}`);
  const extras = FACTORY_EXTRAS[slug];
  if (!extras) throw new Error(`No factory pack for ${slug}`);

  const live = opts.live ?? null;
  const now = (opts.now ?? new Date()).toISOString();
  const factory = signal.factory[0];
  const { retail, compare } = retailTarget(signal);
  const copy = descriptionHtml(signal, extras);
  const imageUrls = [...new Set([...(live?.images ?? []), signal.image, ...extras.gallery])].slice(0, 6);
  const images: SourcedImage[] = imageUrls.map((url, idx) => ({
    path: url,
    alt: `${signal.name} ${idx + 1}`,
    sourceUrl: url,
    position: idx + 1,
  }));

  return {
    id: signal.slug,
    signalSlug: signal.slug,
    status: "ready",
    sourcePlatform: "1688",
    sourceUrl: live?.url ?? factory.searchUrl,
    sourceOfferId: live?.offerId ?? extras.offerId,
    liveFetch: Boolean(live),
    title: signal.name,
    titleZh: live?.titleZh ?? signal.nameZh,
    handle: signal.slug,
    vendor: extras.vendor,
    productType: signal.category,
    tags: [...signal.tags, "factory-direct", "1688", extras.vendorZh],
    descriptionHtml: copy.en,
    descriptionPlain: copy.plain,
    descriptionZh: copy.zh,
    specifications: extras.specs,
    terms: factoryTerms(signal, extras),
    priceTiers: priceTiers(factory.unitPriceUsd, factory.unitPriceCny, factory.moq),
    retailPriceUsd: retail,
    compareAtUsd: compare,
    factoryPriceUsd: factory.unitPriceUsd,
    priceZones: signal.priceZones,
    logistics: logisticsFor(signal.slug),
    variants: extras.variants,
    optionNames: extras.optionNames,
    images,
    weightGrams: extras.weightGrams,
    seoTitle: `${signal.name} | OriginRadar storefront draft`,
    seoDescription: copy.plain.slice(0, 155),
    generatedAt: now,
    updatedAt: now,
  };
}
