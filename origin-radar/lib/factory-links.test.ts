import { describe, expect, it } from "vitest";
import { getProduct, getProducts, relatedProducts } from "./catalog";
import { FACTORY_EXTRAS, galleryFor } from "./factory-packs";
import { factoryOutboundLinks, primaryFactoryHref } from "./factory-links";
import { buildFactoryListing } from "./listing-pack";
import { searchHref } from "./format";

const SIBLINGS = [
  "rolling-garment-rack",
  "steel-pegboard",
  "ice-bath-tub",
  "pdrn-sheet-mask",
] as const;

describe("factory mill + SKU links", () => {
  it("points Open factory listings at 1688 mill+SKU search, not a fake offer page", () => {
    const product = getProduct("rack-wardrobe");
    expect(product).toBeTruthy();
    const links = factoryOutboundLinks(product!);
    const sku = links.find((l) => l.kind === "sku");
    const mill = links.find((l) => l.kind === "mill");
    expect(sku?.href).toContain("s.1688.com/selloffer/offer_search.htm");
    expect(mill?.href).toContain("s.1688.com/company_search.htm");
    expect(decodeURIComponent(sku!.href)).toContain("货架衣柜");
    expect(decodeURIComponent(sku!.href)).toContain("林鑫");
    expect(decodeURIComponent(mill!.href)).toContain("林鑫");
    expect(links.every((l) => !l.href.includes("detail.1688.com/offer/"))).toBe(true);
    expect(searchHref(product!)).toBe(sku!.href);
    expect(primaryFactoryHref(product!)).toBe(sku!.href);
  });

  it("rewrites catalog factory.searchUrl onto the mill SKU query", () => {
    const product = getProduct("rack-wardrobe")!;
    const source = product.factory.find((f) => f.platform === "1688");
    expect(source?.searchUrl).toContain("selloffer");
    expect(decodeURIComponent(source!.searchUrl)).toContain("林鑫");
  });

  it("uses mill name as the listing vendor and mill+SKU as sourceUrl", () => {
    const listing = buildFactoryListing("rack-wardrobe");
    expect(listing.vendor).toBe("Foshan Linxin Storage Co., Ltd.");
    expect(listing.sourceUrl).toContain("selloffer");
    expect(listing.sourceUrl).not.toContain("detail.1688.com");
  });
});

describe("shortlisted sibling SKUs", () => {
  it("sources each sibling as its own catalog product with a mill pack", () => {
    for (const slug of SIBLINGS) {
      const product = getProduct(slug);
      expect(product, slug).toBeTruthy();
      expect(FACTORY_EXTRAS[slug], slug).toBeTruthy();
      const urls = galleryFor(slug, product!.image);
      expect(new Set(urls).size, slug).toBeGreaterThanOrEqual(6);
      const links = factoryOutboundLinks(product!);
      expect(links.find((l) => l.kind === "mill")?.href).toContain("company_search");
      expect(links.find((l) => l.kind === "sku")?.href).toContain("selloffer");
    }
  });

  it("lists home-storage siblings next to the curtain wardrobe", () => {
    const related = relatedProducts("rack-wardrobe").map((p) => p.slug);
    expect(related).toEqual(
      expect.arrayContaining(["rolling-garment-rack", "steel-pegboard", "enamel-pegboard"]),
    );
    expect(related).not.toContain("rack-wardrobe");
  });

  it("splits PDRN mask and ice-bath from their parent categories", () => {
    expect(relatedProducts("pdrn-ampoule").map((p) => p.slug)).toContain("pdrn-sheet-mask");
    expect(relatedProducts("foldable-tpu-bathtub").map((p) => p.slug)).toContain("ice-bath-tub");
  });

  it("keeps every catalog SKU on a named mill", () => {
    for (const product of getProducts()) {
      const extras = FACTORY_EXTRAS[product.slug];
      expect(extras?.vendor, product.slug).toBeTruthy();
      expect(extras?.vendorZh, product.slug).toBeTruthy();
    }
  });
});
