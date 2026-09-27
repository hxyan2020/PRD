import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getProducts } from "./catalog";
import { FACTORY_EXTRAS, galleryFor } from "./factory-packs";

describe("product galleries", () => {
  it("gives every catalog SKU at least six unique factory listing photos", () => {
    const products = getProducts();
    expect(products.length).toBeGreaterThan(0);
    const publicDir = path.join(process.cwd(), "public");
    for (const product of products) {
      expect(product.image, product.slug).toMatch(/^\/factory\/[^/]+\/\d{2}\.jpg$/);
      expect(product.image, product.slug).not.toMatch(/unsplash/i);
      const urls = galleryFor(product.slug, product.image);
      const unique = new Set(urls);
      expect(unique.size, product.slug).toBeGreaterThanOrEqual(6);
      expect(FACTORY_EXTRAS[product.slug], product.slug).toBeTruthy();
      for (const url of unique) {
        expect(url, product.slug).toMatch(/^\/factory\//);
        expect(url, product.slug).not.toMatch(/unsplash/i);
        const file = path.join(publicDir, url.replace(/^\//, ""));
        expect(fs.existsSync(file), file).toBe(true);
        expect(fs.statSync(file).size, file).toBeGreaterThan(4000);
      }
    }
  });
});
