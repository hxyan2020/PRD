import fs from "node:fs/promises";
import path from "node:path";
import { getProduct } from "./catalog";
import { upsertSourced } from "./db";
import { buildFactoryListing } from "./listing-pack";
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

  let product = buildFactoryListing(slug, {
    live: live
      ? { images: live.images, url: live.url, offerId: live.offerId, titleZh: live.titleZh }
      : null,
  });

  if (downloadImages) {
    const images: SourcedImage[] = [];
    const imageUrls = product.images.map((im) => im.sourceUrl);
    let i = 0;
    for (const url of imageUrls) {
      i += 1;
      const rel = `/sourced/${signal.slug}/${String(i).padStart(2, "0")}.jpg`;
      const dest = path.join(publicDir, rel.replace(/^\//, ""));
      try {
        const dl = await downloadImage(url, dest);
        images.push({ path: rel, alt: `${signal.name} ${i}`, sourceUrl: url, position: images.length + 1 });
        steps.push({ step: `Image ${i}`, ok: true, detail: `${dl.bytes} bytes from ${new URL(url).hostname}` });
      } catch (err) {
        steps.push({
          step: `Image ${i}`,
          ok: false,
          detail: `Skipped (${err instanceof Error ? err.message : "download failed"}).`,
        });
      }
    }
    if (images.length === 0) {
      throw new Error("No gallery images could be downloaded");
    }
    product = { ...product, images };
  } else {
    steps.push({ step: "Images", ok: true, detail: "Remote URLs only (download skipped)." });
  }

  const saved = upsertSourced(product);
  steps.push({
    step: "Database",
    ok: true,
    detail: `Saved ${saved.id} for ${saved.signalSlug} (${saved.images.length} images, ${saved.variants.length} SKUs).`,
  });
  return { product: saved, steps };
}
