import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getProduct } from "./catalog";
import { upsertSourced } from "./db";
import {
  FACTORY_EXTRAS,
  descriptionHtml,
  factoryTerms,
  priceTiers,
  retailTarget,
} from "./factory-packs";
import { fetchLiveOffer } from "./source-1688";
import type { SourcedImage, SourcedProduct } from "./storefront-types";

export type GenerateStep = { step: string; ok: boolean; detail: string };

export interface GenerateResult {
  product: SourcedProduct;
  steps: GenerateStep[];
}

export async function downloadImage(
  url: string,
  dest: string,
): Promise<{ ok: boolean; bytes: number; contentType: string }> {
  const res = await fetch(url, {
    headers: { "user-agent": "OriginRadar/0.1 (storefront sourcing)" },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`image ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return { ok: true, bytes: buf.length, contentType: res.headers.get("content-type") ?? "image/jpeg" };
}

export async function generateListing(
  slug: string,
  opts: { fetchLive?: boolean; downloadImages?: boolean; publicDir?: string } = {},
): Promise<GenerateResult> {
  const { fetchLive = true, downloadImages = true, publicDir = path.join(process.cwd(), "public") } = opts;
  const steps: GenerateStep[] = [];
  const signal = getProduct(slug);
  if (!signal) throw new Error(`Unknown signal ${slug}`);
  const extras = FACTORY_EXTRAS[slug];
  if (!extras) throw new Error(`No factory pack for ${slug}`);

  let live = null;
  if (fetchLive) {
    live = await fetchLiveOffer(signal);
    steps.push({
      step: "1688 API",
      ok: Boolean(live),
      detail: live
        ? live.note
        : "No ALIBABA_1688_* credentials — using factory listing pack (offer id, tiers, specs, terms).",
    });
  } else {
    steps.push({ step: "1688 API", ok: false, detail: "Skipped (offline generate)." });
  }

  const factory = signal.factory[0];
  const { retail, compare } = retailTarget(signal);
  const copy = descriptionHtml(signal, extras);
  const id = randomUUID();
  const handle = signal.slug;
  const imageUrls = [...new Set([...(live?.images ?? []), signal.image, ...extras.gallery])].slice(0, 6);

  const images: SourcedImage[] = [];
  if (downloadImages) {
    let i = 0;
    for (const url of imageUrls) {
      i += 1;
      const ext = url.includes("unsplash") ? "jpg" : "jpg";
      const rel = `/sourced/${signal.slug}/${String(i).padStart(2, "0")}.${ext}`;
      const dest = path.join(publicDir, rel.replace(/^\//, ""));
      try {
        const dl = await downloadImage(url, dest);
        images.push({ path: rel, alt: `${signal.name} ${i}`, sourceUrl: url, position: i });
        steps.push({ step: `Image ${i}`, ok: true, detail: `${dl.bytes} bytes from ${new URL(url).hostname}` });
      } catch (err) {
        images.push({ path: url, alt: `${signal.name} ${i}`, sourceUrl: url, position: i });
        steps.push({
          step: `Image ${i}`,
          ok: false,
          detail: `Kept remote URL (${err instanceof Error ? err.message : "download failed"}).`,
        });
      }
    }
  } else {
    imageUrls.forEach((url, idx) => {
      images.push({ path: url, alt: `${signal.name} ${idx + 1}`, sourceUrl: url, position: idx + 1 });
    });
    steps.push({ step: "Images", ok: true, detail: "Remote URLs only (download skipped)." });
  }

  const product: SourcedProduct = {
    id,
    signalSlug: signal.slug,
    status: "ready",
    sourcePlatform: "1688",
    sourceUrl: live?.url ?? factory.searchUrl,
    sourceOfferId: live?.offerId ?? extras.offerId,
    liveFetch: Boolean(live),
    title: signal.name,
    titleZh: live?.titleZh ?? signal.nameZh,
    handle,
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
    variants: extras.variants,
    optionNames: extras.optionNames,
    images,
    weightGrams: extras.weightGrams,
    seoTitle: `${signal.name} | OriginRadar storefront draft`,
    seoDescription: copy.plain.slice(0, 155),
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = upsertSourced(product);
  steps.push({
    step: "Database",
    ok: true,
    detail: `Saved ${saved.id} for ${saved.signalSlug} (${saved.images.length} images, ${saved.variants.length} SKUs).`,
  });
  return { product: saved, steps };
}
