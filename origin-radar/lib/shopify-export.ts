import type { SourcedProduct } from "./storefront-types";

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

export function toShopifyCsv(products: SourcedProduct[]): string {
  const header = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name",
    "Option2 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Qty",
    "Variant Price",
    "Variant Compare At Price",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "SEO Title",
    "SEO Description",
    "Status",
  ];
  const rows: string[][] = [header];
  for (const p of products) {
    const max = Math.max(p.variants.length, p.images.length, 1);
    for (let i = 0; i < max; i++) {
      const v = p.variants[i];
      const img = p.images[i];
      const opt = v ? Object.entries(v.options) : [];
      rows.push([
        p.handle,
        i === 0 ? p.title : "",
        i === 0 ? p.descriptionHtml : "",
        i === 0 ? p.vendor : "",
        i === 0 ? p.productType : "",
        i === 0 ? p.productType : "",
        i === 0 ? p.tags.join(", ") : "",
        i === 0 ? "FALSE" : "",
        i === 0 ? (p.optionNames[0] ?? "") : "",
        opt[0]?.[1] ?? "",
        i === 0 ? (p.optionNames[1] ?? "") : "",
        opt[1]?.[1] ?? "",
        v?.sku ?? "",
        i === 0 ? String(p.weightGrams) : "",
        v ? String(v.stock) : "",
        v ? String(p.retailPriceUsd) : "",
        i === 0 ? String(p.compareAtUsd) : "",
        img?.sourceUrl || img?.path || "",
        img ? String(img.position) : "",
        img?.alt ?? "",
        i === 0 ? p.seoTitle : "",
        i === 0 ? p.seoDescription : "",
        i === 0 ? "draft" : "",
      ]);
    }
  }
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

export function toStorefrontJson(products: SourcedProduct[]) {
  return {
    generatedAt: new Date().toISOString(),
    count: products.length,
    products: products.map((p) => ({
      handle: p.handle,
      title: p.title,
      vendor: p.vendor,
      factoryPriceUsd: p.factoryPriceUsd,
      retailPriceUsd: p.retailPriceUsd,
      source: { platform: p.sourcePlatform, offerId: p.sourceOfferId, url: p.sourceUrl, live: p.liveFetch },
      specifications: p.specifications,
      terms: p.terms,
      priceTiers: p.priceTiers,
      variants: p.variants,
      images: p.images,
      descriptionHtml: p.descriptionHtml,
    })),
  };
}
