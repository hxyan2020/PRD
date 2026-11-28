import { describe, expect, it } from "vitest";
import {
  categoryDescription,
  categoryName,
} from "@/lib/i18n/category-labels";
import { LOCALES } from "@/lib/i18n/locales";

describe("categoryName", () => {
  it("localizes philosophy category into Chinese", () => {
    expect(categoryName("philosophy-metaphysics", "zh")).toBe("哲学与形而上学");
    expect(categoryName("public-discourse", "zh")).toBe("公共讨论");
    expect(categoryName("thought-experiments", "zh")).toBe("思想实验");
  });

  it("falls back to English when locale missing a string", () => {
    expect(categoryName("philosophy-metaphysics", "en")).toBe(
      "Philosophy & Metaphysics",
    );
  });

  it("localizes descriptions beyond English", () => {
    expect(categoryDescription("philosophy-metaphysics", "zh")).toMatch(
      /祖先模拟|概率/,
    );
    expect(categoryDescription("philosophy-metaphysics", "es")).toMatch(
      /simulaciones|probabilidad/i,
    );
    expect(categoryDescription("philosophy-metaphysics", "es")).not.toMatch(
      /Classic skeptical/i,
    );
  });

  it("has distinct names for every UI locale", () => {
    const en = categoryName("physics-cosmology", "en");
    for (const loc of LOCALES) {
      const name = categoryName("physics-cosmology", loc.code);
      expect(name.length).toBeGreaterThan(2);
      if (loc.code !== "en") expect(name).not.toBe(en);
    }
  });
});
