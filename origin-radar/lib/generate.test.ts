import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateListing } from "./generate";
import { getSourcedBySlug, listSourced, resetDbForTests } from "./db";
import { toShopifyCsv } from "./shopify-export";
import { resolveSourcedPath } from "./sourced-fs";

describe("generate listing pipeline", () => {
  afterEach(() => {
    resetDbForTests();
    delete process.env.ORIGIN_RADAR_DB;
  });

  it("builds a storefront record with specs, terms, tiers, and variants", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "or-db-"));
    process.env.ORIGIN_RADAR_DB = path.join(dir, "test.sqlite");
    const { product, steps } = await generateListing("rack-wardrobe", {
      fetchLive: false,
      downloadImages: false,
    });
    expect(product.title).toMatch(/wardrobe/i);
    expect(product.specifications.length).toBeGreaterThan(3);
    expect(product.terms.payment).toMatch(/Alipay/);
    expect(product.priceTiers[0].priceUsd).toBeGreaterThan(0);
    expect(product.variants.length).toBeGreaterThan(1);
    expect(product.priceZones.length).toBe(3);
    expect(product.logistics.overseasMode).toBeTruthy();
    expect(product.retailPriceUsd).toBeGreaterThan(product.factoryPriceUsd);
    expect(getSourcedBySlug("rack-wardrobe")?.id).toBe(product.id);
    expect(listSourced()).toHaveLength(1);
    expect(steps.some((s) => s.step === "Database" && s.ok)).toBe(true);
    const csv = toShopifyCsv([product]);
    expect(csv).toContain("Handle");
    expect(csv).toContain("rack-wardrobe");
    expect(csv).toContain(String(product.retailPriceUsd));
  });

  it("rejects path traversal for sourced images", () => {
    expect(resolveSourcedPath(["rack-wardrobe", "01.jpg"])).toContain("rack-wardrobe");
    expect(resolveSourcedPath(["..", "etc"])).toBeNull();
    expect(resolveSourcedPath(["rack-wardrobe", "../x"])).toBeNull();
  });

  it("upserts the same signal instead of duplicating", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "or-db-"));
    process.env.ORIGIN_RADAR_DB = path.join(dir, "test.sqlite");
    const first = await generateListing("pdrn-ampoule", { fetchLive: false, downloadImages: false });
    const second = await generateListing("pdrn-ampoule", { fetchLive: false, downloadImages: false });
    expect(second.product.id).toBe(first.product.id);
    expect(listSourced()).toHaveLength(1);
  });
});
