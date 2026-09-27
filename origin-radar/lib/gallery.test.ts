import { describe, expect, it } from "vitest";
import { getProducts } from "./catalog";
import { FACTORY_EXTRAS, galleryFor } from "./factory-packs";

describe("product galleries", () => {
  it("gives every catalog SKU at least six unique photos", () => {
    const products = getProducts();
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      const urls = galleryFor(product.slug, product.image);
      const unique = new Set(urls);
      expect(unique.size, product.slug).toBeGreaterThanOrEqual(6);
      expect(FACTORY_EXTRAS[product.slug], product.slug).toBeTruthy();
    }
  });
});
